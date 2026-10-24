import base64
import io
import logging
import re
from typing import Any, Dict, Tuple

from app.agents.resume_text_parser import parse_resume_to_ast
from app.config import settings
from app.core.llm import invoke_json_with_images
from app.prompts import resume_vision_parser_prompt

logger = logging.getLogger(__name__)

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    import pypdf
except ImportError:
    pypdf = None


def _clean_text(text: str) -> str:
    replacements = {
        "\ufb00": "ff", "\ufb01": "fi", "\ufb02": "fl", "\ufb03": "ffi",
        "\ufb04": "ffl", "\ufb05": "ft", "\ufb06": "st",
        "\u2013": "-", "\u2014": "-", "\u2018": "'", "\u2019": "'",
        "\u201c": '"', "\u201d": '"',
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]
    return "\n".join(lines).strip()


def _read_pdf_text(file_bytes: bytes) -> Tuple[str, int]:
    if pdfplumber:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            return _clean_text("\n\n".join(page.extract_text() or "" for page in pdf.pages)), len(pdf.pages)

    if pypdf:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        return _clean_text("\n\n".join(page.extract_text() or "" for page in reader.pages)), len(reader.pages)

    raise RuntimeError("Install pdfplumber or pypdf to read PDF files.")


def extract_text_from_pdf(file_bytes: bytes) -> Tuple[str, Dict[str, Any]]:
    """Extract preview text and lightweight metadata for the upload screen."""
    text, page_count = _read_pdf_text(file_bytes)
    anomalies = []
    if len(text) < 100:
        anomalies.append("Extracted text is unusually short; this may be an image-only PDF.")
    if not re.search(r"[\w.-]+@[\w.-]+\.\w+", text):
        anomalies.append("No standard email address detected.")

    return text, {
        "page_count": page_count,
        "char_count": len(text),
        "anomalies": anomalies,
        "confidence_score": max(0.6, round(0.98 - len(anomalies) * 0.1, 2)),
        "has_email": bool(re.search(r"[\w.-]+@[\w.-]+\.\w+", text)),
        "has_phone": bool(re.search(r"\+?\d[\d\s().-]{7,}", text)),
    }


def _page_images(file_bytes: bytes) -> list[str]:
    if not pdfplumber:
        raise RuntimeError("pdfplumber is required to render PDF pages.")

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        images = []
        for page in pdf.pages:
            rendered = page.to_image(resolution=144).original
            buffer = io.BytesIO()
            rendered.save(buffer, format="PNG", optimize=True)
            encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
            images.append(f"data:image/png;base64,{encoded}")
    return images


def parse_pdf_to_ast(file_bytes: bytes, language: str = "en"):
    """Render every page and parse the complete resume with the vision model."""
    images = _page_images(file_bytes)
    if not images:
        raise RuntimeError("The PDF contains no renderable pages.")

    data = invoke_json_with_images(
        resume_vision_parser_prompt(language, len(images)),
        images,
        model_name=settings.PARSER_MODEL_NAME,
    )
    return parse_resume_to_ast("", language, parsed_data=data, allow_fallback=False)


__all__ = ["extract_text_from_pdf", "parse_pdf_to_ast", "parse_resume_to_ast"]
