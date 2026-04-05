#!/usr/bin/env python3
"""
Add one manual knowledge source entry and optionally rebuild the graph.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from urllib.parse import urlparse

REPO_ROOT = os.path.dirname(os.path.dirname(__file__))
MANUAL_PATH = os.path.join(REPO_ROOT, "data", "knowledge_sources.manual.json")


def normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")[:80] or "note"


def load_manual() -> list[dict]:
    os.makedirs(os.path.dirname(MANUAL_PATH), exist_ok=True)
    if not os.path.exists(MANUAL_PATH):
        return []
    with open(MANUAL_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise RuntimeError("knowledge_sources.manual.json must be a JSON array.")
    return data


def save_manual(entries: list[dict]) -> None:
    with open(MANUAL_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Add a manual knowledge source entry.")
    parser.add_argument("--url", required=True, help="Source URL (https://...)")
    parser.add_argument("--title", required=True, help="Display title")
    parser.add_argument("--author", default="Unknown", help="Author name")
    parser.add_argument("--date", required=True, help="ISO date (YYYY-MM-DD)")
    parser.add_argument("--type", default="thread", help="Type: thread/paper/guide/tool/idea/series")
    parser.add_argument("--tags", default="research", help="Comma-separated tags")
    parser.add_argument("--summary", default="", help="Short summary")
    parser.add_argument("--id", default="", help="Optional explicit id")
    parser.add_argument("--relates-to", default="", help="Comma-separated ids to connect manually")
    parser.add_argument("--no-rebuild", action="store_true", help="Do not run update_knowledge_graph.py after adding")
    return parser.parse_args()


def validate_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc:
        raise RuntimeError("URL must be an https URL.")


def main() -> None:
    args = parse_args()
    url = normalize_ws(args.url)
    title = normalize_ws(args.title)
    author = normalize_ws(args.author) or "Unknown"
    date = normalize_ws(args.date)
    summary = normalize_ws(args.summary) or f"Manual source by {author}."
    entry_type = normalize_ws(args.type) or "thread"
    tags = [normalize_ws(t) for t in args.tags.split(",") if normalize_ws(t)]
    relates_to = [normalize_ws(x) for x in args.relates_to.split(",") if normalize_ws(x)]
    entry_id = normalize_ws(args.id) or slugify(title)

    validate_url(url)
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        raise RuntimeError("Date must be ISO format: YYYY-MM-DD")

    entries = load_manual()

    new_entry = {
        "id": entry_id,
        "title": title,
        "author": author,
        "date": date,
        "type": entry_type,
        "tags": tags or ["research"],
        "summary": summary,
        "url": url,
        "origin": "manual",
        "relates_to": relates_to,
    }

    replaced = False
    for i, existing in enumerate(entries):
        if existing.get("url") == url or existing.get("id") == entry_id:
            entries[i] = new_entry
            replaced = True
            break
    if not replaced:
        entries.append(new_entry)

    entries.sort(key=lambda x: (x.get("date", ""), x.get("title", "").lower()))
    save_manual(entries)
    print(f"{'Updated' if replaced else 'Added'} manual source: {title}")
    print(f"Manual source file: {MANUAL_PATH}")

    if not args.no_rebuild:
        script = os.path.join(REPO_ROOT, "scripts", "update_knowledge_graph.py")
        print("Rebuilding knowledge graph...")
        subprocess.check_call([sys.executable, script], cwd=REPO_ROOT)


if __name__ == "__main__":
    main()
