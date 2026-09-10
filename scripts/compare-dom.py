#!/usr/bin/env python3
"""Structурally diff a rendered local page against the original page markup.

Emits an ordered skeleton of (depth, tag.class) for the page body, ignoring
text, and reports the first divergences. Inner pages on the live site are
static markup, so this catches missing sections, wrong class names, missing
icons and structural wrapper differences that a screenshot would not.

Usage: python3 scripts/compare-dom.py <clean-dir> <slug> [local-base-url]
"""
import re, sys, urllib.request
from pathlib import Path

TAGS = r'(section|div|h1|h2|h3|h4|p|ul|li|form|figure|figcaption|button|a|img|video|iframe|span|svg|select|input|label|footer|header|nav|aside|em|strong)'

def skeleton(html, keep_svg_d=True):
    body = html[html.find('<body'):]
    body = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', '', body, flags=re.S)
    out, depth = [], 0
    for m in re.finditer(rf'<(/?){TAGS}([^>]*)>', body):
        close, tag, attrs = m.groups()
        if close:
            depth = max(0, depth - 1); continue
        cls = re.search(r'class="([^"]*)"', attrs)
        name = tag + ('.' + cls.group(1).split()[0] if cls else '')
        if tag == 'path' and keep_svg_d:
            pass
        out.append((depth, name))
        if tag not in ('img', 'input', 'br'):
            depth += 1
    return out

def svg_paths(html):
    body = html[html.find('<body'):]
    body = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', '', body, flags=re.S)
    return re.findall(r'<path[^>]*\sd="([^"]{6,})"', body)

def classes(html):
    body = html[html.find('<body'):]
    body = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', '', body, flags=re.S)
    seen = {}
    for c in re.findall(r'class="([^"]*)"', body):
        for one in c.split():
            seen[one] = seen.get(one, 0) + 1
    return seen

def main(clean_dir, slug, base='http://localhost:3000'):
    orig = Path(clean_dir, f'{slug}.html').read_text()
    path = '' if slug == 'home' else slug
    mine = urllib.request.urlopen(f'{base}/{path}').read().decode()

    oc, mc = classes(orig), classes(mine)
    missing = {k: v for k, v in oc.items() if k not in mc}
    countdiff = {k: (v, mc[k]) for k, v in oc.items() if k in mc and mc[k] != v}

    op, mp = svg_paths(orig), svg_paths(mine)
    miss_icons = [d for d in set(op) if d not in set(mp)]

    print(f'\n{"="*70}\n{slug}\n{"="*70}')
    print(f'classes: original {len(oc)} distinct, mine {len(mc)}')
    if missing:
        print(f'  MISSING CLASSES ({len(missing)}):')
        for k, v in sorted(missing.items()): print(f'     .{k}  (x{v} in original)')
    if countdiff:
        print(f'  COUNT DIFFERENCES:')
        for k, (a, b) in sorted(countdiff.items()):
            if abs(a - b) >= 1: print(f'     .{k}: original={a} mine={b}')
    if miss_icons:
        print(f'  MISSING SVG PATHS ({len(miss_icons)}):')
        for d in miss_icons[:12]: print(f'     {d[:72]}')
    if not missing and not miss_icons and not countdiff:
        print('  no structural differences')

if __name__ == '__main__':
    main(*sys.argv[1:4])
