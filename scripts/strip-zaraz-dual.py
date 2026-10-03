#!/usr/bin/env python3
"""Remove baked-in Cloudflare Zaraz dual inject; keep clique_whatsapp tracker."""
from __future__ import annotations

import re
import sys
from pathlib import Path


def strip_html(html: str) -> str:
    html, _ = re.subn(
        r'<script[^>]*src="/cdn-cgi/zaraz/s\.js[^"]*"[^>]*>\s*</script>',
        "",
        html,
        flags=re.I,
    )
    html, _ = re.subn(
        r'<script[^>]*data-cfasync="false"[^>]*>[\s\S]*?zaraz is loaded twice[\s\S]*?</script>',
        "",
        html,
        flags=re.I,
    )
    html = html.replace(
        "<!-- O snippet do Cloudflare Zaraz permanece no HTML ativo para n\u00e3o quebrar a mensura\u00e7\u00e3o configurada no painel. -->",
        "",
    )
    html = re.sub(r"\n{3,}", "\n\n", html)
    return html


def main() -> int:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "public/index.html")
    raw = path.read_text(encoding="utf-8", errors="replace")
    fixed = strip_html(raw)
    if "clique_whatsapp" not in fixed:
        print("ERROR: clique_whatsapp tracker missing after strip", file=sys.stderr)
        return 2
    if "zaraz is loaded twice" in fixed:
        print("ERROR: dual inject still present", file=sys.stderr)
        return 3
    path.write_text(fixed, encoding="utf-8")
    print(f"OK wrote {path} ({len(raw)} -> {len(fixed)} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
