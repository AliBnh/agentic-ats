import re
import io
from typing import Optional
from fpdf import FPDF

class ATSFriendlyPDF(FPDF):
    def header(self):
        pass # Single-column ATS format avoids header traps

    def footer(self):
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


def _render_resume(pdf: ATSFriendlyPDF, content: str):
    """Renders a Harvard/McKinsey ATS single-column executive resume."""
    pdf.set_margins(14, 13, 14)
    pdf.add_page()

    lines = content.splitlines()
    in_header_block = True

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
            pdf.set_font("Helvetica", "B", 18)
            pdf.set_text_color(15, 23, 42) # dark slate
            pdf.cell(182, 8, name, align="C")
            pdf.ln(8.5)
            i += 1

        # Header 2: Section Heading (## Section)
        elif line_str.startswith("## "):
            in_header_block = False
            sec_title = sanitize_pdf_text(line_str[3:].strip())
            
            # Prevent orphan heading near page end
            if pdf.get_y() > 255:
                pdf.add_page()
            else:
                pdf.ln(3.5)

            pdf.set_font("Helvetica", "B", 10.5)
            pdf.set_text_color(30, 58, 138) # Refined deep navy accent
            pdf.cell(182, 5.5, sec_title.upper(), align="L")
            pdf.ln(5.5)
            
            # Subtle accent divider rule across full width
            curr_y = pdf.get_y()
            pdf.set_draw_color(203, 213, 225) # slate-300
            pdf.set_line_width(0.35)
            pdf.line(14, curr_y, 196, curr_y)
            pdf.ln(2.5)
            i += 1

        # Header 3: Role & Company or Project (### Title - Company)
        elif line_str.startswith("### "):
            in_header_block = False
            raw_title = line_str[4:].strip()
            clean_title = sanitize_pdf_text(re.sub(r'[*_#]', '', raw_title))
            
            if pdf.get_y() > 260:
                pdf.add_page()
            else:
                pdf.ln(1.5)

            pdf.set_font("Helvetica", "B", 9.5)
            pdf.set_text_color(15, 23, 42) # dark slate
            pdf.cell(182, 5, clean_title, align="L")
            pdf.ln(5)
            i += 1

        # Bullet point (- Bullet, * Bullet, • Bullet)
        elif line_str.startswith(("- ", "* ", "• ")):
            in_header_block = False
            bullet_text = re.sub(r'^[-*•\s]+', '', line_str)
            clean_text = sanitize_pdf_text(re.sub(r'[*_]', '', bullet_text))
            
            # Print solid round bullet dot (chr(149))
            y_start = pdf.get_y()
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(71, 85, 105) # slate-600
            pdf.set_xy(14, y_start)
            pdf.cell(5, 4.3, chr(149))
            
            # Print bullet content indented
            pdf.set_xy(19, y_start)
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(30, 41, 59) # slate-800
            pdf.set_left_margin(19)
            pdf.multi_cell(177, 4.3, clean_text)
            pdf.set_left_margin(14)
            pdf.ln(1)
            i += 1

        # Markdown horizontal rule (---)
        elif line_str.startswith("---"):
            pdf.ln(1)
            curr_y = pdf.get_y()
            pdf.set_draw_color(226, 232, 240)
            pdf.set_line_width(0.25)
            pdf.line(14, curr_y, 196, curr_y)
            pdf.ln(2.5)
            i += 1

        # Header Subtitle / Contact Information
        elif in_header_block:
            clean_str = sanitize_pdf_text(re.sub(r'[*_]', '', line_str))
            if "@" in clean_str or "phone" in clean_str.lower() or "+212" in clean_str or "linkedin" in clean_str or "github" in clean_str:
                # Contact info line
                pdf.set_font("Helvetica", "", 8.5)
                pdf.set_text_color(71, 85, 105) # slate-600
                pdf.cell(182, 4.5, clean_str, align="C")
                pdf.ln(4.5)
                pdf.ln(1.5)
                # Bottom divider of header
                curr_y = pdf.get_y()
                pdf.set_draw_color(226, 232, 240)
                pdf.line(14, curr_y, 196, curr_y)
                pdf.ln(2.5)
            else:
                # Subtitle (Professional Headline)
                pdf.set_font("Helvetica", "B", 10.5)
                pdf.set_text_color(30, 58, 138) # Navy accent
                pdf.cell(182, 5, clean_str, align="C")
                pdf.ln(5)
            i += 1

        # Regular paragraph or Dates line
        else:
            clean_str = sanitize_pdf_text(re.sub(r'[*_]', '', line_str))
            # Check if dates/location line (italic in markdown e.g. *06/2025 - Présent*)
            is_dates = bool(re.search(r'\d{2}/\d{4}|\d{4}', clean_str) and len(clean_str) < 65)
            
            if is_dates:
                pdf.set_font("Helvetica", "I", 8.5)
                pdf.set_text_color(100, 116, 139) # slate-500
                pdf.cell(182, 4.2, clean_str, align="L")
                pdf.ln(4.2)
            else:
                pdf.set_font("Helvetica", "", 9)
                pdf.set_text_color(51, 65, 85) # slate-700
                pdf.multi_cell(182, 4.3, clean_str)
                pdf.ln(1.5)
            i += 1


def generate_ats_pdf(markdown_content: str) -> bytes:
    """
    Generates an executive-standard ATS PDF:
    - Auto-detects Cover Letter vs ATS Resume
    - Applies Harvard/McKinsey ATS single-column formatting
    - Strict Latin-1 accent preservation & 0 question marks
    """
    pdf = ATSFriendlyPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=14)

    if _is_cover_letter(markdown_content):
        _render_cover_letter(pdf, markdown_content)
    else:
        _render_resume(pdf, markdown_content)

    return pdf.output()
