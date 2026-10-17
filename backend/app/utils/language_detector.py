import re
from typing import Tuple

FRENCH_KEYWORDS = {
    "expérience", "formation", "compétences", "profil", "langues",
    "ingénieur", "développeur", "développement", "gestion", "projet",
    "stage", "alternance", "baccalauréat", "diplôme", "télétravail",
    "société", "conception", "réalisation", "missions", "autonome"
}

ENGLISH_KEYWORDS = {
    "experience", "education", "skills", "summary", "languages",
    "engineer", "developer", "development", "management", "project",
    "internship", "bachelor", "master", "remote", "company",
    "design", "implementation", "responsibilities", "self-starter"
}

def detect_language(text: str) -> Tuple[str, float]:
    """
    Detects whether a resume is written in French ('fr') or English ('en').
    Returns tuple of (language_code, confidence_score).
    """
    lower_text = text.lower()
    words = re.findall(r'\b[a-zàâçéèêëîïôûùüÿñæœ]+\b', lower_text)
    if not words:
        return "en", 1.0

    word_set = set(words)
    fr_hits = len(word_set.intersection(FRENCH_KEYWORDS))
    en_hits = len(word_set.intersection(ENGLISH_KEYWORDS))

    # Also check specific accents common in French
    fr_accents_count = len(re.findall(r'[éèêàùçîô]', lower_text))
    if fr_accents_count > 5:
        fr_hits += 3

    if fr_hits > en_hits:
        confidence = min(0.99, max(0.60, fr_hits / (fr_hits + en_hits + 1e-5)))
        return "fr", round(confidence, 2)
    else:
        confidence = min(0.99, max(0.60, en_hits / (fr_hits + en_hits + 1e-5)))
        return "en", round(confidence, 2)
