"""Document parser — extracts text from PDFs, DOCX, etc.

Uses Docling (97.9% accuracy on complex tables) as primary parser,
with a plain-text fallback for simple files.
"""

import os
from pathlib import Path

from app.core.config import settings


async def parse_document(file_path: str) -> dict:
    """Parse a document and return structured content.

    Returns:
        dict with keys: text, pages, metadata
    """
    ext = Path(file_path).suffix.lower()

    if ext == ".pdf":
        return await _parse_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return await _parse_docx(file_path)
    elif ext in (".txt", ".md", ".csv"):
        return await _parse_text(file_path)
    else:
        return await _parse_text(file_path)


async def _parse_pdf(file_path: str) -> dict:
    """Parse PDF using Docling for high-accuracy extraction."""
    try:
        from docling.document_converter import DocumentConverter

        converter = DocumentConverter()
        result = converter.convert(file_path)
        text = result.document.export_to_markdown()

        return {
            "text": text,
            "pages": len(result.document.pages) if hasattr(result.document, "pages") else 1,
            "metadata": {"parser": "docling", "format": "pdf"},
        }
    except ImportError:
        # Fallback to PyPDF2 if Docling not available
        return await _parse_pdf_fallback(file_path)
    except Exception as e:
        return await _parse_pdf_fallback(file_path)


async def _parse_pdf_fallback(file_path: str) -> dict:
    """Fallback PDF parser using PyPDF2."""
    try:
        from pypdf import PdfReader

        reader = PdfReader(file_path)
        pages_text = []
        for page in reader.pages:
            text = page.extract_text() or ""
            pages_text.append(text)

        return {
            "text": "\n\n".join(pages_text),
            "pages": len(pages_text),
            "metadata": {"parser": "pypdf", "format": "pdf"},
        }
    except Exception:
        return {"text": "", "pages": 0, "metadata": {"parser": "none", "error": "failed"}}


async def _parse_docx(file_path: str) -> dict:
    """Parse DOCX files."""
    try:
        from docx import Document

        doc = Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return {
            "text": "\n\n".join(paragraphs),
            "pages": max(1, len(paragraphs) // 30),
            "metadata": {"parser": "python-docx", "format": "docx"},
        }
    except Exception:
        return {"text": "", "pages": 0, "metadata": {"parser": "none", "error": "failed"}}


async def _parse_text(file_path: str) -> dict:
    """Parse plain text files."""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()
    return {
        "text": text,
        "pages": 1,
        "metadata": {"parser": "plaintext", "format": Path(file_path).suffix},
    }
