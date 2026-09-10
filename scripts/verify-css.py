#!/usr/bin/env python3
"""Verify app/site.css reproduces every source page's CSS exactly.

For each original page we compute its (media, selector) -> body map, then compute
what the merged sheet yields for that page's theme (.pt-landing or .pt-inner) and
assert the two agree. Fails loudly on any drift.

Usage: python3 scripts/verify-css.py <dir-with-clean-html>
"""
import re, sys, os

LANDING = {'home.html', 'austin.html'}  # + all city pages share austin's sheet

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

def flatten(c, theme=None):
    """-> {(media, selector): body}. If theme given, keep only rules for that
    theme (unscoped, or scoped to it) and strip the scoping prefix."""
    d = {}
    def take(media, b):
        head = norm(b.split('{')[0])
        body = norm(b[b.find('{'):])
        if theme:
            sels = [s.strip() for s in head.split(',')]
            other = '.pt-inner' if theme == '.pt-landing' else '.pt-landing'
            if any(s.startswith(other + ' ') for s in sels): return
            sels = [s[len(theme) + 1:] if s.startswith(theme + ' ') else s for s in sels]
            head = ', '.join(sels)
        d[(media, head)] = body
    for b in blocks(c):
        head = norm(b.split('{')[0])
        if head.startswith('@media') or head.startswith('@supports'):
            for ib in blocks(b[b.find('{') + 1:b.rfind('}')]): take(head, ib)
        else:
            take('', b)
    return d

def main(clean_dir):
    merged = open(os.path.join(os.path.dirname(__file__), '..', 'app', 'site.css')).read()
    failures = 0
    for f in sorted(os.listdir(clean_dir)):
        if not f.endswith('.html'): continue
        src = re.findall(r'<style[^>]*>(.*?)</style>',
                         open(os.path.join(clean_dir, f)).read(), re.S)[0]
        theme = '.pt-landing' if f in LANDING or 'city' in f else '.pt-inner'
        # city pages all share austin's stylesheet; detect by comparing to austin
        if f not in ('home.html',):
            austin = re.findall(r'<style[^>]*>(.*?)</style>',
                                open(os.path.join(clean_dir, 'austin.html')).read(), re.S)[0]
            theme = '.pt-landing' if norm(src) == norm(austin) else '.pt-inner'
        if f == 'home.html': theme = '.pt-landing'
        want, got = flatten(src), flatten(merged, theme)
        missing = {k: v for k, v in want.items() if k not in got}
        differ = {k: (v, got[k]) for k, v in want.items() if k in got and got[k] != v}
        status = 'OK ' if not missing and not differ else 'FAIL'
        if missing or differ: failures += 1
        print(f'{status} {f:34s} theme={theme:12s} rules={len(want):3d} '
              f'missing={len(missing)} differ={len(differ)}')
        for k, v in list(missing.items())[:3]: print(f'      MISSING {k}')
        for k, (a, b) in list(differ.items())[:3]:
            print(f'      DIFFER  {k}\n        src: {a[:110]}\n        out: {b[:110]}')
    print(f'\n{"ALL PAGES REPRODUCED EXACTLY" if not failures else f"{failures} PAGE(S) DRIFTED"}')
    return 1 if failures else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
