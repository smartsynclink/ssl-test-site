#!/usr/bin/env python3
"""Merge the per-page-type stylesheets from the live site into one app/site.css.

The original site ships a slightly different stylesheet per page type. They are
identical except for a handful of rules, which split into two themes:
  landing = home + the 14 city pages (dark quote section)
  inner   = services / projects / faqs / contact (light quote section)
Conflicting rules are detected per (media-query, selector) coordinate -- NOT by
selector name, since a selector can agree inside a media query while differing at
top level -- and emitted twice, scoped under .pt-landing / .pt-inner.

Usage: python3 scripts/build-css.py <dir-with-clean-html>
"""
import re, sys, os

def blocks(c):
    out, buf, depth = [], '', 0
    for ch in c:
        buf += ch
        if ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0: out.append(buf.strip()); buf = ''
    return out

def norm(x):
    return re.sub(r'\s+', ' ', re.sub(r'/\*.*?\*/', '', x, flags=re.S)).strip()

def coords(c):
    """-> {(media, selector): final body}  (last declaration wins, as in CSS)"""
    d = {}
    for b in blocks(c):
        head = norm(b.split('{')[0])
        if head.startswith('@media') or head.startswith('@supports'):
            for ib in blocks(b[b.find('{') + 1:b.rfind('}')]):
                d[(head, norm(ib.split('{')[0]))] = norm(ib[ib.find('{'):])
        else:
            d[('', head)] = norm(b[b.find('{'):])
    return d

def scope(block, cls):
    head, rest = block.split('{', 1)
    sels = [s.strip() for s in norm(head).split(',')]
    return ', '.join(f'{cls} {s}' for s in sels) + ' {' + rest

def render_all(css, cls, conflicting):
    """Emit every rule of a sheet, scoping conflicting coordinates under cls.
    No dedup -- a sheet may declare the same selector twice (e.g. a reset rule
    and a later typographic rule); both must survive in order."""
    parts = []
    for b in blocks(css):
        head = norm(b.split('{')[0])
        if head.startswith('@media') or head.startswith('@supports'):
            kept = [scope(ib, cls) if (head, norm(ib.split('{')[0])) in conflicting else ib
                    for ib in blocks(b[b.find('{') + 1:b.rfind('}')])]
            parts.append(head + ' {\n' + '\n'.join('  ' + k for k in kept) + '\n}')
        elif head.startswith('@'):
            parts.append(b)
        else:
            parts.append(scope(b, cls) if ('', head) in conflicting else b)
    return '\n'.join(parts)


def render_delta(css, cls, conflicting, base_coords, claimed):
    """Emit only what this sheet adds over the base: conflicting coordinates
    (scoped) plus coordinates the base does not have. Coordinates already taken
    by an earlier sheet are skipped, so all occurrences of a coordinate come
    from exactly one sheet and keep their original order."""
    own = {k for k in coords(css) if k not in base_coords and k not in claimed}
    mine = {k for k in conflicting if k not in claimed and k in coords(css)}
    parts = []
    def want(media, b):
        key = (media, norm(b.split('{')[0]))
        if key in mine: return scope(b, cls)
        if key in own: return b
        return None
    for b in blocks(css):
        head = norm(b.split('{')[0])
        if head.startswith('@media') or head.startswith('@supports'):
            kept = [x for x in (want(head, ib)
                    for ib in blocks(b[b.find('{') + 1:b.rfind('}')])) if x]
            if kept:
                parts.append(head + ' {\n' + '\n'.join('  ' + k for k in kept) + '\n}')
        elif not head.startswith('@'):
            x = want('', b)
            if x: parts.append(x)
    claimed |= own | mine
    return '\n'.join(parts)


def main(clean_dir):
    def css(f):
        return re.findall(r'<style[^>]*>(.*?)</style>',
                          open(os.path.join(clean_dir, f)).read(), re.S)[0]
    landing_src, inner_srcs = 'austin.html', [
        'air-duct--hvac-services.html', 'contact.html', 'projects.html',
        'additional-services.html', 'faqs.html']
    landing = coords(css(landing_src))
    conflicting = set()
    for f in inner_srcs:
        for k, v in coords(css(f)).items():
            if k in landing and landing[k] != v:
                conflicting.add(k)
    print(f'{len(conflicting)} conflicting coordinates:')
    for m, s in sorted(conflicting): print(f'   {m + " " if m else ""}{s}')

    claimed = set()
    out = [render_all(css(landing_src), '.pt-landing', conflicting)]
    base_coords = set(landing)
    out.append('\n/* ===== inner pages (services / projects / faqs / contact) ===== */')
    for f in inner_srcs:
        r = render_delta(css(f), '.pt-inner', conflicting, base_coords, claimed)
        if r.strip(): out.append(f'/* --- {f} --- */\n{r}')
    r = render_delta(css('home.html'), '.pt-landing', conflicting, base_coords, claimed)
    if r.strip(): out.append(f'/* --- home.html --- */\n{r}')

    header = ('/* Ported from the live Lumen site. Two page themes exist in the original\n'
              '   CSS: landing (home + city pages) and inner (services/projects/faqs/contact).\n'
              '   Rules that differ between them are scoped .pt-landing / .pt-inner; the rest\n'
              '   is shared verbatim. Regenerate: python3 scripts/build-css.py <clean-html-dir>\n'
              '   Verify:                        python3 scripts/verify-css.py <clean-html-dir> */\n\n')
    path = os.path.join(os.path.dirname(__file__), '..', 'app', 'site.css')
    open(path, 'w').write(header + '\n'.join(out) + '\n')
    print(f'\nwrote app/site.css ({os.path.getsize(path)} bytes)')

if __name__ == '__main__':
    main(sys.argv[1])
