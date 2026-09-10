#!/usr/bin/env python3
"""Full-fidelity audit of a local page against the original markup.

Checks four things the class/SVG comparison does not:
  structure  ordered (depth, tag.class) skeleton
  text       visible text blocks in order
  links      anchor href + label pairs
  media      img alt text

Inner pages on the live site are static markup so this is exact; landing pages
render part of their content from script, so those regions are reported as
"original-only" and are expected.

Usage: python3 scripts/audit.py <clean-dir> <slug> [base-url]
"""
import html as H, re, sys, urllib.request
from pathlib import Path

SKIP = re.compile(r'<(script|style|svg)\b[^>]*>.*?</\1>', re.S)
TAGS = r'(section|div|h1|h2|h3|h4|p|ul|li|form|figure|figcaption|button|a|img|video|iframe|span|select|option|label|footer|header|nav|aside|em|strong)'

def clean(h, scope=True):
    b = h[h.find('<body'):]
    b = SKIP.sub('', b)
    # React emits <!-- --> between adjacent expressions, which splits text nodes
    b = re.sub(r'<!--.*?-->', '', b, flags=re.S)
    if scope:
        # compare page content only: the original renders its nav, drawer and
        # footer link lists from script, so those regions are not comparable
        i, j = b.find('<section'), b.rfind('</section>')
        if i >= 0 and j > i: b = b[i:j + 10]
    return b

def norm(t):
    return re.sub(r'\s+', ' ', H.unescape(t)).strip()

def texts(h):
    out = []
    # join adjacent text nodes so `Call Now: {phone}` compares as one string
    body = re.sub(r'<(?!/?(p|h[1-4]|li|div|section|figcaption|label|option)\b)[^>]+>', '', clean(h))
    for chunk in re.split(r'<[^>]+>', body):
        t = norm(chunk)
        if len(t) > 1: out.append(t)
    return out

def links(h):
    out = []
    for m in re.finditer(r'<a\b([^>]*)>(.*?)</a>', clean(h), re.S):
        attrs, inner = m.groups()
        href = re.search(r'href="([^"]*)"', attrs)
        out.append((norm(re.sub(r'<[^>]+>', '', inner))[:40],
                    (href.group(1) if href else '').replace('https://lumenhomeservices.com', '') or '/'))
    return out

def alts(h):
    return [norm(a) for a in re.findall(r'<img[^>]*\salt="([^"]*)"', clean(h))]

def skeleton(h):
    out, depth = [], 0
    for m in re.finditer(rf'<(/?){TAGS}([^>]*)>', clean(h)):
        close, tag, attrs = m.groups()
        if close: depth = max(0, depth - 1); continue
        cls = re.search(r'class="([^"]*)"', attrs)
        out.append((depth, tag + ('.' + cls.group(1).split()[0] if cls else '')))
        if tag not in ('img', 'input', 'br'): depth += 1
    return out

def report(name, o, m, limit=10):
    from collections import Counter
    co, cm = Counter(o), Counter(m)
    only_o = [(k, n) for k, n in (co - cm).items()]
    only_m = [(k, n) for k, n in (cm - co).items()]
    status = 'OK' if not only_o and not only_m else 'DIFF'
    print(f'  [{status}] {name}: original {len(o)}, mine {len(m)}')
    for k, n in only_o[:limit]: print(f'      original only (x{n}): {str(k)[:100]}')
    for k, n in only_m[:limit]: print(f'      mine only     (x{n}): {str(k)[:100]}')
    return not only_o and not only_m

def main(clean_dir, slug, base='http://localhost:3000'):
    orig = Path(clean_dir, f'{slug}.html').read_text()
    mine = urllib.request.urlopen(f'{base}/{"" if slug == "home" else slug}').read().decode()
    print(f'\n{"="*72}\n{slug}\n{"="*72}')
    ok = True
    ok &= report('text', texts(orig), texts(mine))
    ok &= report('links', links(orig), links(mine))
    ok &= report('img alt', alts(orig), alts(mine))
    ok &= report('structure', skeleton(orig), skeleton(mine))
    return ok

if __name__ == '__main__':
    sys.exit(0 if main(*sys.argv[1:4]) else 1)
