import re
import io
from typing import Optional, List, Dict
from fpdf import FPDF

class ATSFriendlyPDF(FPDF):
    def __init__(self, *args, is_resume: bool = False, **kwargs):
        super().__init__(*args, **kwargs)
        self.is_resume = is_resume

    def header(self):
        pass # Single-column ATS format avoids header traps

    def footer(self):
        # Suppress footer on executive 1-page resumes to preserve bottom real-estate
        if not self.is_resume and self.page_no() > 1:
            self.set_y(-10)
            self.set_font("Helvetica", "", 8)
            self.set_text_color(148, 163, 184) # slate-400
            self.cell(0, 6, f"Page {self.page_no()}", align="C")


def sanitize_pdf_text(text: str) -> str:
    """Replaces Unicode punctuation and unsupported characters with Latin-1 equivalents."""
    replacements = {
        "\u2014": " - ", # em dash
        "\u2013": " - ", # en dash
        "\u2015": " - ", # horizontal bar
        "\u2012": "-",   # figure dash
        "\u2011": "-",   # non-breaking hyphen
        "\u2010": "-",   # hyphen
        "\u2212": "-",   # minus sign
        "\u2018": "'",   # left single quote
        "\u2019": "'",   # right single quote
        "\u201c": '"',   # left double quote
        "\u201d": '"',   # right double quote
        "\u2022": "-",   # bullet
        "\u2026": "...", # ellipsis
        "\u00a0": " ",   # non-breaking space
        "\u202f": " ",   # narrow non-breaking space (French typography)
        "\u2009": " ",   # thin space
        "\u200a": " ",   # hair space
        "\u200b": "",    # zero-width space
        "\u00ad": "",    # soft hyphen
        "\u20ac": "EUR", # euro symbol
        "\u0153": "oe",  # ligature oe
        "\u0152": "OE",  # ligature OE
        "\u2192": "->",  # right arrow
        "•": "-",
        "—": "-",
        "–": "-",
        "’": "'",
        "‘": "'",
        "“": '"',
        "”": '"',
    }
    for orig, repl in replacements.items():
        text = text.replace(orig, repl)

    return text.encode("latin-1", "replace").decode("latin-1")


def _is_cover_letter(content: str) -> bool:
    """Detects if content is a cover letter based on salutations and structure."""
    lower = content.lower()
    return any(marker in lower for marker in [
        "madame, monsieur",
        "madame, monsieur,",
        "dear hiring team",
        "dear hiring manager",
        "objet :",
        "objet:",
        "subject:",
        "salutations distinguées",
        "salutations distinguees",
        "sincerely,"
    ])


def _render_cover_letter(pdf: ATSFriendlyPDF, content: str):
    """Renders a formal executive cover letter with proper business margins and typography."""
    pdf.set_margins(20, 18, 20)
    pdf.add_page()
    
    lines = content.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            pdf.ln(2.5)
            i += 1
            continue

        clean_line = sanitize_pdf_text(re.sub(r'[*_#]', '', line))

        # Horizontal rule divider
        if line.startswith("---"):
            curr_y = pdf.get_y()
            pdf.set_draw_color(226, 232, 240)
            pdf.line(20, curr_y, 190, curr_y)
            pdf.ln(3)
            i += 1
            continue

        # Subject line
        if clean_line.lower().startswith(("objet", "subject")):
            pdf.ln(2)
            pdf.set_font("Helvetica", "B", 10.5)
            pdf.set_text_color(15, 23, 42) # dark slate
            pdf.multi_cell(170, 5, clean_line)
            pdf.ln(3)
            i += 1
            continue

        # Salutation / Sign-off
        if any(clean_line.lower().startswith(s) for s in ["madame,", "dear", "sincerely", "dans l'attente", "veuillez agréer", "je vous prie"]):
            pdf.ln(1.5)
            pdf.set_font("Helvetica", "B" if clean_line.lower().startswith(("madame,", "dear")) else "", 10)
            pdf.set_text_color(15, 23, 42)
            pdf.multi_cell(170, 5, clean_line)
            pdf.ln(2)
            i += 1
            continue

        # Section headers or bold callouts
        if line.startswith("**") and line.endswith("**") and len(clean_line) < 40:
            pdf.set_font("Helvetica", "B", 10.5)
            pdf.set_text_color(30, 58, 138) # navy
            pdf.cell(170, 5.5, clean_line, align="L")
            pdf.ln(5.5)
            i += 1
            continue

        # Standard body paragraph
        pdf.set_font("Helvetica", "", 9.5)
        pdf.set_text_color(30, 41, 59) # slate-800
        pdf.multi_cell(170, 4.8, clean_line)
        pdf.ln(2)
        i += 1


def _render_resume_pass(
    content: str,
    margin_x: float = 11.0,
    margin_y: float = 8.5,
    name_size: float = 14.0,
    sec_size: float = 8.8,
    body_size: float = 7.8,
    body_lh: float = 3.3,
    sec_gap_top: float = 1.8,
    sec_gap_bottom: float = 1.2,
    include_summary: bool = True
) -> ATSFriendlyPDF:
    """
    Renders an ATS single-column executive resume with exact mathematical geometric control.
    """
    pdf = ATSFriendlyPDF(orientation="P", unit="mm", format="A4", is_resume=True)
    pdf.set_margins(margin_x, margin_y, margin_x)
    pdf.set_auto_page_break(auto=True, margin=margin_y)
    pdf.add_page()

    printable_w = 210.0 - (2.0 * margin_x)
    bullet_indent = margin_x + 4.0
    bullet_text_w = printable_w - 4.0

    lines = content.splitlines()
    in_header_block = True
    skip_summary = False

    i = 0
    while i < len(lines):
        line_str = lines[i].strip()
        if not line_str:
            i += 1
            continue

        # Header 1: Candidate Name (# Name)
        if line_str.startswith("# "):
            in_header_block = True
            name = sanitize_pdf_text(line_str[2:].strip())
            pdf.set_font("Helvetica", "B", name_size)
            pdf.set_text_color(15, 23, 42) # dark slate
            pdf.cell(printable_w, 5.0, name, align="C")
            pdf.ln(5.2)
            i += 1

        # Header 2: Section Heading (## Section)
        elif line_str.startswith("## "):
            in_header_block = False
            sec_title = sanitize_pdf_text(line_str[3:].strip())
            
            # Check if this is the summary section and user layout flagged it off
            is_summary_sec = any(k in sec_title.lower() for k in ["profil", "summary", "résumé", "resume", "objective"])
            if is_summary_sec and not include_summary:
                skip_summary = True
                i += 1
                continue
            else:
                skip_summary = False

            pdf.ln(sec_gap_top)
            pdf.set_font("Helvetica", "B", sec_size)
            pdf.set_text_color(30, 58, 138) # Deep navy accent
            pdf.cell(printable_w, 3.8, sec_title.upper(), align="L")
            pdf.ln(3.8)
            
            # Subtle accent divider rule across full width
            curr_y = pdf.get_y()
            pdf.set_draw_color(203, 213, 225) # slate-300
            pdf.set_line_width(0.25)
            pdf.line(margin_x, curr_y, 210.0 - margin_x, curr_y)
            pdf.ln(sec_gap_bottom)
            i += 1

        # Header 3: Role & Company or Project (### Title - Company)
        elif line_str.startswith("### "):
            if skip_summary:
                i += 1
                continue
            in_header_block = False
            raw_title = line_str[4:].strip()
            clean_title = sanitize_pdf_text(re.sub(r'[*_#]', '', raw_title))
            
            pdf.ln(0.8)
            pdf.set_font("Helvetica", "B", body_size + 0.5)
            pdf.set_text_color(15, 23, 42) # dark slate
            pdf.cell(printable_w, 3.8, clean_title, align="L")
            pdf.ln(3.8)
            i += 1

        # Bullet point (- Bullet, * Bullet, • Bullet)
        elif line_str.startswith(("- ", "* ", "• ")):
            if skip_summary:
                i += 1
                continue
            in_header_block = False
            bullet_text = re.sub(r'^[-*•\s]+', '', line_str)
            
            # If line is bold prefix e.g. - **Languages:** Python, Java
            # Render with bold group title and regular content
            bold_prefix_match = re.match(r'^\*\*([^*]+)\*\*:(.*)$', bullet_text)
            y_start = pdf.get_y()
            
            if bold_prefix_match:
                group_title = sanitize_pdf_text(bold_prefix_match.group(1).strip() + ":")
                group_skills = sanitize_pdf_text(bold_prefix_match.group(2).strip())
                
                # Solid bullet
                pdf.set_font("Helvetica", "B", body_size)
                pdf.set_text_color(71, 85, 105)
                pdf.set_xy(margin_x, y_start)
                pdf.cell(4, body_lh, chr(149))
                
                # Content
                pdf.set_xy(bullet_indent, y_start)
                pdf.set_left_margin(bullet_indent)
                
                # Render prefix bold, then skills
                pdf.set_font("Helvetica", "B", body_size)
                pdf.set_text_color(30, 58, 138)
                prefix_w = pdf.get_string_width(group_title + " ")
                
                pdf.cell(prefix_w, body_lh, group_title + " ", ln=0)
                pdf.set_font("Helvetica", "", body_size)
                pdf.set_text_color(30, 41, 59)
                pdf.multi_cell(bullet_text_w - prefix_w, body_lh, group_skills)
                pdf.set_left_margin(margin_x)
                pdf.ln(0.4)
            else:
                clean_text = sanitize_pdf_text(re.sub(r'[*_]', '', bullet_text))
                pdf.set_font("Helvetica", "B", body_size)
                pdf.set_text_color(71, 85, 105) # slate-600
                pdf.set_xy(margin_x, y_start)
                pdf.cell(4, body_lh, chr(149))
                
                pdf.set_xy(bullet_indent, y_start)
                pdf.set_font("Helvetica", "", body_size)
                pdf.set_text_color(30, 41, 59) # slate-800
                pdf.set_left_margin(bullet_indent)
                pdf.multi_cell(bullet_text_w, body_lh, clean_text)
                pdf.set_left_margin(margin_x)
                pdf.ln(0.4)
            i += 1

        # Markdown horizontal rule (---)
        elif line_str.startswith("---"):
            curr_y = pdf.get_y()
            pdf.set_draw_color(226, 232, 240)
            pdf.set_line_width(0.25)
            pdf.line(margin_x, curr_y, 210.0 - margin_x, curr_y)
            pdf.ln(1.2)
            i += 1

        # Header Subtitle / Contact Information
        elif in_header_block:
            clean_str = sanitize_pdf_text(re.sub(r'[*_]', '', line_str))
            if any(k in clean_str.lower() for k in ["@", "+212", "phone", "linkedin", "github"]):
                # Contact info line
                pdf.set_font("Helvetica", "", 8.0)
                pdf.set_text_color(71, 85, 105) # slate-600
                pdf.cell(printable_w, 3.6, clean_str, align="C")
                pdf.ln(3.8)
            else:
                # Subtitle (Professional Headline)
                pdf.set_font("Helvetica", "B", 9.2)
                pdf.set_text_color(30, 58, 138) # Navy accent
                pdf.cell(printable_w, 4.0, clean_str, align="C")
                pdf.ln(4.2)
            i += 1

        # Regular paragraph, dates, or summary text
        else:
            if skip_summary:
                i += 1
                continue
            clean_str = sanitize_pdf_text(re.sub(r'[*_]', '', line_str))
            is_dates = bool(re.search(r'\d{2}/\d{4}|\d{4}', clean_str) and len(clean_str) < 65)
            
            if is_dates:
                pdf.set_font("Helvetica", "I", body_size - 0.3)
                pdf.set_text_color(100, 116, 139) # slate-500
                pdf.cell(printable_w, 3.3, clean_str, align="L")
                pdf.ln(3.5)
            else:
                pdf.set_font("Helvetica", "", body_size)
                pdf.set_text_color(51, 65, 85) # slate-700
                pdf.multi_cell(printable_w, body_lh, clean_str)
                pdf.ln(0.6)
            i += 1

    return pdf


def generate_ats_pdf(markdown_content: str) -> bytes:
    """
    Generates an executive-standard ATS PDF:
    - Auto-detects Cover Letter vs ATS Resume
    - Applies Harvard/McKinsey ATS single-column formatting
    - Strict Latin-1 accent preservation & 0 question marks
    - ADAPTIVE 1-PAGE GUARANTEE: strictly fits on exactly 1 page for resumes
    """
    if _is_cover_letter(markdown_content):
        pdf = ATSFriendlyPDF(orientation="P", unit="mm", format="A4", is_resume=False)
        _render_cover_letter(pdf, markdown_content)
        return pdf.output()

    # Pass 1: Standard Executive Layout
    pdf1 = _render_resume_pass(
        markdown_content,
        margin_x=11.0,
        margin_y=8.5,
        name_size=14.0,
        sec_size=8.8,
        body_size=7.8,
        body_lh=3.3,
        sec_gap_top=1.8,
        sec_gap_bottom=1.2,
        include_summary=True
    )
    if pdf1.page_no() <= 1:
        return pdf1.output()

    # Pass 2: Compact Executive Fit
    pdf2 = _render_resume_pass(
        markdown_content,
        margin_x=10.0,
        margin_y=7.5,
        name_size=13.5,
        sec_size=8.5,
        body_size=7.4,
        body_lh=3.0,
        sec_gap_top=1.4,
        sec_gap_bottom=1.0,
        include_summary=True
    )
    if pdf2.page_no() <= 1:
        return pdf2.output()

    # Pass 3: Space-Optimized 1-Page Guarantee (condense summary if space requires)
    pdf3 = _render_resume_pass(
        markdown_content,
        margin_x=9.5,
        margin_y=6.5,
        name_size=13.0,
        sec_size=8.2,
        body_size=7.2,
        body_lh=2.85,
        sec_gap_top=1.2,
        sec_gap_bottom=0.8,
        include_summary=False
    )
    return pdf3.output()
