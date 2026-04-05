#!/usr/bin/env python3
"""
Build knowledge graph from two sources:
1) Auto-scraped timeline sources
2) User-maintained manual sources

Outputs:
- data/knowledge_sources.auto.json
- data/knowledge_graph.auto.json
- embedded KNOWLEDGE_GRAPH block in index.html
"""

from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

SOURCE_URL = "https://velikov-mihail.github.io/ai-econ-wiki/visualizations/source-timeline/"
SOURCE_HOST = "velikov-mihail.github.io"
REPO_ROOT = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(REPO_ROOT, "data")
INDEX_PATH = os.path.join(REPO_ROOT, "index.html")

MANUAL_SOURCES_PATH = os.path.join(DATA_DIR, "knowledge_sources.manual.json")
AUTO_SOURCES_PATH = os.path.join(DATA_DIR, "knowledge_sources.auto.json")
GRAPH_PATH = os.path.join(DATA_DIR, "knowledge_graph.auto.json")

START_MARKER = "// KNOWLEDGE_GRAPH_AUTO_START"
END_MARKER = "// KNOWLEDGE_GRAPH_AUTO_END"

MONTHS = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
}

TAG_RULES = [
    ("agents", ["agent", "agents", "autonomous"]),
    ("economics", ["econom", "econ"]),
    ("finance", ["financ"]),
    ("workflow", ["workflow", "pipeline"]),
    ("prompting", ["prompt"]),
    ("academia", ["academ", "faculty", "researcher"]),
    ("coding-agents", ["claude code", "cursor", "vibe coding"]),
    ("interfaces", ["interface"]),
    ("adoption", ["adoption", "skeptic", "wake up"]),
    ("skills", ["skill", "mcp", "setup"]),
]


def normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:80] or "note"


def parse_date(date_text: str, fallback_year: int | None) -> str | None:
    cleaned = normalize_ws(date_text).replace(",", "")
    parts = cleaned.split(" ")
    if not parts:
        return None

    month = MONTHS.get(parts[0].lower())
    if month is None:
        match = re.search(r"\b(19|20)\d{2}\b", cleaned)
        if match:
            return f"{int(match.group(0)):04d}-01-01"
        return None

    if len(parts) >= 2 and re.fullmatch(r"\d{4}", parts[1]):
        year = int(parts[1])
        return f"{year:04d}-{month:02d}-01"

    day = 1
    if len(parts) >= 2 and re.fullmatch(r"\d{1,2}", parts[1]):
        day = int(parts[1])
    if fallback_year is None:
        return None
    return f"{fallback_year:04d}-{month:02d}-{day:02d}"


def infer_tags(title: str, author: str) -> list[str]:
    hay = f"{title} {author}".lower()
    tags = []
    for tag, needles in TAG_RULES:
        if any(needle in hay for needle in needles):
            tags.append(tag)
    return tags[:4] or ["research"]


def infer_type(title: str) -> str:
    lowered = title.lower()
    if "part " in lowered or "series" in lowered:
        return "series"
    if any(word in lowered for word in ("guide", "setup", "starter", "install", "how to")):
        return "guide"
    if any(word in lowered for word in ("thread", "x post", "dispatch")):
        return "thread"
    if any(word in lowered for word in ("tool", "skills", "mcp")):
        return "tool"
    if any(word in lowered for word in ("paper", "research", "economics", "finance")):
        return "paper"
    return "thread"


class TimelineParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.current_year: int | None = None
        self.in_h2 = False
        self.in_h3 = False
        self.in_li = False
        self.in_a = False
        self.heading_buf: list[str] = []
        self.li_buf: list[str] = []
        self.a_buf: list[str] = []
        self.li_href: str | None = None
        self.items: list[dict] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)
        if tag == "h2":
            self.in_h2 = True
            self.heading_buf = []
        elif tag == "h3":
            self.in_h3 = True
            self.heading_buf = []
        elif tag == "li":
            self.in_li = True
            self.li_buf = []
            self.a_buf = []
            self.li_href = None
        elif tag == "a" and self.in_li:
            self.in_a = True
            href = attrs_dict.get("href") or ""
            if "/summaries/" in href and self.li_href is None:
                self.li_href = urljoin(SOURCE_URL, href)
                self.a_buf = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "h2" and self.in_h2:
            self.in_h2 = False
            match = re.search(r"\b(19|20)\d{2}\b", "".join(self.heading_buf))
            if match:
                self.current_year = int(match.group(0))
        elif tag == "h3" and self.in_h3:
            self.in_h3 = False
        elif tag == "a" and self.in_a:
            self.in_a = False
        elif tag == "li" and self.in_li:
            self.in_li = False
            self._process_item()

    def handle_data(self, data: str) -> None:
        if self.in_h2 or self.in_h3:
            self.heading_buf.append(data)
        if self.in_li:
            self.li_buf.append(data)
        if self.in_a and self.li_href is not None:
            self.a_buf.append(data)

    def _process_item(self) -> None:
        if not self.li_href:
            return
        title = normalize_ws("".join(self.a_buf))
        if not title:
            return

        text = normalize_ws(" ".join(self.li_buf))
        parts = [p.strip() for p in text.split("—") if p.strip()]
        if len(parts) < 2:
            return

        date_text = parts[0]
        iso_date = parse_date(date_text, self.current_year)
        if not iso_date:
            return

        author = parts[-1] if len(parts) >= 3 else "Unknown"
        self.items.append(
            {
                "id": slugify(title),
                "title": title,
                "author": normalize_ws(author),
                "date": iso_date,
                "type": infer_type(title),
                "tags": infer_tags(title, author),
                "summary": f"Auto-synced source from the AI econ timeline by {normalize_ws(author)}.",
                "url": self.li_href,
                "origin": "auto",
                "relates_to": [],
            }
        )


def fetch_timeline_items() -> list[dict]:
    req = Request(SOURCE_URL, headers={"User-Agent": "KnowledgeMapUpdater/1.0"})
    with urlopen(req, timeout=60) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    parser = TimelineParser()
    parser.feed(html)
    if len(parser.items) < 20:
        raise RuntimeError(f"Parsed source count is suspiciously low: {len(parser.items)}")
    return parser.items


def ensure_paths() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(MANUAL_SOURCES_PATH):
        with open(MANUAL_SOURCES_PATH, "w", encoding="utf-8") as f:
            json.dump([], f, ensure_ascii=False, indent=2)


def load_json_array(path: str) -> list[dict]:
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise RuntimeError(f"{path} must contain a JSON array.")
    return data


def normalize_entry(raw: dict, origin: str) -> dict | None:
    title = normalize_ws(raw.get("title", ""))
    url = normalize_ws(raw.get("url", ""))
    date = normalize_ws(raw.get("date", ""))
    if not title or not url or not date:
        return None

    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc:
        raise RuntimeError(f"Invalid URL (must be https): {url}")

    entry_id = normalize_ws(raw.get("id", "")) or slugify(title)
    author = normalize_ws(raw.get("author", "Unknown")) or "Unknown"
    summary = normalize_ws(raw.get("summary", "")) or f"Source by {author}."
    entry_type = normalize_ws(raw.get("type", "")) or infer_type(title)
    tags_raw = raw.get("tags", [])
    tags = [normalize_ws(t) for t in tags_raw if normalize_ws(str(t))]
    if not tags:
        tags = infer_tags(title, author)

    relates = raw.get("relates_to", [])
    relates_to = [normalize_ws(str(x)) for x in relates if normalize_ws(str(x))]

    return {
        "id": entry_id,
        "title": title,
        "author": author,
        "date": date,
        "type": entry_type,
        "tags": tags[:6],
        "summary": summary,
        "url": url,
        "origin": origin,
        "relates_to": relates_to,
    }


def merge_sources(auto_entries: list[dict], manual_entries: list[dict]) -> list[dict]:
    by_url: dict[str, dict] = {}
    by_id: dict[str, dict] = {}

    for entry in auto_entries:
        by_url[entry["url"]] = entry
        by_id[entry["id"]] = entry

    for manual in manual_entries:
        # Manual entry should override same URL or same ID.
        prior = by_url.get(manual["url"]) or by_id.get(manual["id"])
        if prior:
            old_id = prior.get("id")
            old_url = prior.get("url")
            if old_id in by_id:
                del by_id[old_id]
            if old_url in by_url:
                del by_url[old_url]
            merged = dict(prior)
            merged.update(manual)
            merged["origin"] = "manual"
            by_url[merged["url"]] = merged
            by_id[merged["id"]] = merged
        else:
            by_url[manual["url"]] = manual
            by_id[manual["id"]] = manual

    merged = list(by_id.values())
    merged.sort(key=lambda x: (x["date"], x["title"].lower()))

    # Ensure unique IDs after merge.
    seen: set[str] = set()
    for entry in merged:
        base = slugify(entry["id"])
        candidate = base
        i = 2
        while candidate in seen:
            candidate = f"{base}-{i}"
            i += 1
        entry["id"] = candidate
        seen.add(candidate)
    return merged


def build_links(notes: list[dict]) -> list[dict]:
    edges: list[tuple[str, str, str]] = []
    seen: set[tuple[str, str]] = set()
    max_edges = max(80, len(notes) * 3)

    def add_edge(src: str, dst: str, rel: str) -> None:
        if src == dst:
            return
        key = (src, dst)
        if key in seen:
            return
        if len(edges) >= max_edges:
            return
        seen.add(key)
        edges.append((src, dst, rel))

    # Timeline
    sorted_notes = sorted(notes, key=lambda n: (n["date"], n["title"].lower()))
    for i in range(1, len(sorted_notes)):
        add_edge(sorted_notes[i - 1]["id"], sorted_notes[i]["id"], "timeline")

    # Author chains
    by_author: dict[str, list[dict]] = defaultdict(list)
    for note in sorted_notes:
        by_author[note["author"].lower()].append(note)
    for group in by_author.values():
        for i in range(1, len(group)):
            add_edge(group[i - 1]["id"], group[i]["id"], "same-author")

    # Tag chains
    by_tag: dict[str, list[dict]] = defaultdict(list)
    for note in sorted_notes:
        for tag in note["tags"]:
            by_tag[tag].append(note)
    for group in by_tag.values():
        for i in range(1, len(group)):
            add_edge(group[i - 1]["id"], group[i]["id"], "shared-tag")

    # Explicit relates_to links.
    ids = {n["id"] for n in notes}
    for note in notes:
        for target in note.get("relates_to", []):
            if target in ids:
                add_edge(note["id"], target, "manual-related")

    return [{"source": s, "target": t, "relation": r} for s, t, r in edges]


def validate_notes(notes: list[dict]) -> None:
    for note in notes:
        parsed = urlparse(note["url"])
        if note["origin"] == "auto" and parsed.netloc != SOURCE_HOST:
            raise RuntimeError(f"Unexpected auto-source domain: {note['url']}")
        lowered_title = note["title"].lower()
        if "</script" in lowered_title or "<script" in lowered_title:
            raise RuntimeError(f"Suspicious title content rejected: {note['title']}")


def build_graph(notes: list[dict], auto_count: int, manual_count: int) -> dict:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    links = build_links(notes)
    return {
        "meta": {
            "source_url": SOURCE_URL,
            "generated_at": now,
            "total_sources": len(notes),
            "auto_sources": auto_count,
            "manual_sources": manual_count,
            "mode": "manual_plus_auto_merge",
        },
        "notes": notes,
        "links": links,
    }


def render_graph_js(graph: dict) -> str:
    graph_json = json.dumps(graph, ensure_ascii=False, indent=2)
    graph_json = re.sub(r"</script", r"<\\/script", graph_json, flags=re.IGNORECASE)
    graph_json = graph_json.replace("<!--", "<\\!--")
    graph_json = graph_json.replace("-->", "--\\>")
    graph_json = graph_json.replace("\u2028", "\\u2028")
    graph_json = graph_json.replace("\u2029", "\\u2029")
    return f"{START_MARKER}\nconst KNOWLEDGE_GRAPH = {graph_json};\n{END_MARKER}"


def replace_graph_block(index_html: str, block: str) -> str:
    pattern = rf"{re.escape(START_MARKER)}[\s\S]*?{re.escape(END_MARKER)}"
    if not re.search(pattern, index_html):
        raise RuntimeError("Could not find knowledge graph markers in index.html.")
    return re.sub(pattern, block, index_html, count=1)


def write_json(path: str, data: object) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main() -> None:
    ensure_paths()

    auto_raw = fetch_timeline_items()
    manual_raw = load_json_array(MANUAL_SOURCES_PATH)

    auto_entries = [normalize_entry(item, "auto") for item in auto_raw]
    auto_entries = [item for item in auto_entries if item is not None]
    manual_entries = [normalize_entry(item, "manual") for item in manual_raw]
    manual_entries = [item for item in manual_entries if item is not None]

    merged_notes = merge_sources(auto_entries, manual_entries)
    validate_notes(merged_notes)
    graph = build_graph(merged_notes, auto_count=len(auto_entries), manual_count=len(manual_entries))

    write_json(AUTO_SOURCES_PATH, auto_entries)
    write_json(GRAPH_PATH, graph)

    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        current_html = f.read()
    next_html = replace_graph_block(current_html, render_graph_js(graph))
    if next_html != current_html:
        with open(INDEX_PATH, "w", encoding="utf-8") as f:
            f.write(next_html)
        print("Updated embedded KNOWLEDGE_GRAPH block in index.html")
    else:
        print("No index.html changes detected.")

    print(f"Wrote {AUTO_SOURCES_PATH}")
    print(f"Wrote {GRAPH_PATH}")
    print(
        f"Sources merged: total={len(merged_notes)} auto={len(auto_entries)} manual={len(manual_entries)} links={len(graph['links'])}"
    )


if __name__ == "__main__":
    main()
