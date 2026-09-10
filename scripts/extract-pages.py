#!/usr/bin/env python3
"""Extract per-page section copy from the live pages' markup.

The DATA block (see extract-content.mjs) holds the shared, repeated content --
services, FAQs, reviews. The per-page prose (hero headline, statement, section
headings, city SEO copy) lives only in the markup, so we pull it here with the
stdlib HTML parser and merge the two into one seed file.

Usage: python3 scripts/extract-pages.py <clean-html-dir> <content.json> <out.json>
"""
import html as _html
import json, re, sys
from html.parser import HTMLParser
from pathlib import Path

VOID = {'br', 'img', 'input', 'meta', 'link', 'source', 'path', 'svg', 'hr'}

class Node:
    __slots__ = ('tag', 'attrs', 'kids', 'parent')
    def __init__(self, tag, attrs=None, parent=None):
        self.tag, self.attrs, self.kids, self.parent = tag, attrs or {}, [], parent
    @property
    def cls(self): return self.attrs.get('class', '').split()
    def text(self):
        out = []
        for k in self.kids:
            out.append(k if isinstance(k, str) else k.text())
        return re.sub(r'\s+', ' ', ''.join(out)).strip()
    def find_all(self, tag=None, cls=None):
        hits = []
        for k in self.kids:
            if isinstance(k, str): continue
            if (tag is None or k.tag == tag) and (cls is None or cls in k.cls):
                hits.append(k)
            hits.extend(k.find_all(tag, cls))
        return hits
    def first(self, tag=None, cls=None):
        h = self.find_all(tag, cls)
        return h[0] if h else None

class Tree(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('root'); self.cur = self.root
    def handle_starttag(self, tag, attrs):
        n = Node(tag, dict(attrs), self.cur)
        self.cur.kids.append(n)
        if tag not in VOID: self.cur = n
    def handle_endtag(self, tag):
        n = self.cur
        while n is not self.root and n.tag != tag: n = n.parent
        if n is not self.root: self.cur = n.parent
    def handle_data(self, data):
        if data.strip(): self.cur.kids.append(data)

def parse(html):
    # drop <script>/<style> so their contents never leak into extracted text
    html = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', '', html, flags=re.S | re.I)
    t = Tree(); t.feed(html); return t.root

def ctas_of(sec):
    """Buttons inside a section, with the class that decides their styling.
    The live pages carry more CTAs than the DATA block hints at, so they are
    read straight from the markup."""
    out = []
    for a in sec.find_all('a'):
        c = a.cls
        if not any(x.startswith('btn-') for x in c):
            continue
        out.append({'label': a.text(), 'href': a.attrs.get('href', ''),
                    'variant': ' '.join(c)})
    return out


def bg_alt_of(sec):
    b = sec.first(cls='bg-img') or sec
    img = b.first('img')
    return img.attrs.get('alt') if img else None


def bg_of(sec):
    """CTA bands set their image either as an inline background-image on
    .bg-img (landing pages) or as a real <img> (inner pages)."""
    b = sec.first(cls='bg-img')
    if b:
        m = re.search(r'url\(["\']?([^"\')]+)', b.attrs.get('style', ''))
        if m: return m.group(1)
        img = b.first('img')
        if img and img.attrs.get('src'): return img.attrs['src']
    img = sec.first('img')
    return img.attrs.get('src') if img else None


def faq_items(sec):
    out = []
    for it in sec.find_all(cls='faq-item'):
        q, a = it.first(cls='faq-q'), it.first(cls='faq-a')
        if q and a: out.append({'q': q.text(), 'a': a.text()})
    return out


def faq_groups(sec):
    """The FAQs page splits its questions into titled groups: an <h3> followed
    by a <div> of .faq-item. Returns [] when the section is a flat list."""
    wrap = sec.first(cls='faq-wrap') or sec
    groups, current = [], None
    def walk(node):
        nonlocal current
        for k in node.kids:
            if isinstance(k, str): continue
            if k.tag == 'h3':
                current = {'title': k.text(), 'faqs': []}
                groups.append(current)
                continue
            if 'faq-item' in k.cls and current is not None:
                q, a = k.first(cls='faq-q'), k.first(cls='faq-a')
                if q and a: current['faqs'].append({'q': q.text(), 'a': a.text()})
                continue
            walk(k)
    walk(wrap)
    return [g for g in groups if g['faqs']]


def ba_items(sec):
    """Before/after cards. Two <img> per slider: after first, then before."""
    out = []
    for card in sec.find_all(cls='gallery-card'):
        sl = card.first(cls='ba-slider')
        if not sl: continue
        imgs = [i.attrs.get('src') for i in card.find_all('img') if i.attrs.get('src')]
        cap = card.first('figcaption')
        if len(imgs) < 2 or not cap: continue
        desc = cap.first('p').text() if cap.first('p') else ''
        out.append({'title': cap.first('h4').text() if cap.first('h4') else '',
                    'desc': desc.replace('Drag to compare. ', ''),
                    'after': imgs[0], 'before': imgs[1]})
    return out


def video_items(sec):
    out = []
    for card in sec.find_all(cls='gallery-card'):
        v = card.first(cls='gallery-video')
        if not v: continue
        vid = v.first('video')
        cap = card.first('figcaption')
        if not vid or not cap: continue
        out.append({'title': cap.first('h4').text() if cap.first('h4') else '',
                    'desc': cap.first('p').text() if cap.first('p') else '',
                    'video': vid.attrs.get('src')})
    return out


def photo_items(sec):
    out = []
    for card in sec.find_all(cls='photo-card'):
        img = card.first('img')
        cap = card.first(cls='photo-caption')
        if img and img.attrs.get('src'):
            out.append({'src': img.attrs['src'], 'alt': img.attrs.get('alt'),
                        'caption': cap.text() if cap else ''})
    return out


def breakdown_cards(sec):
    return [{'title': c.first('h3').text() if c.first('h3') else '',
             'body': c.first('p').text() if c.first('p') else ''}
            for c in sec.find_all(cls='breakdown-card')]


def form_title_of(sec):
    """The form heading carries an emphasised tail rendered in gold italic
    (`Get Your <em>Free Quote</em>`), so capture both parts."""
    el = sec.first(cls='form-title')
    if not el: return {}
    em = el.first('em')
    return {'formHeading': el.text(),
            'formHeadingEmphasis': em.text() if em else None}


def style_of(node):
    """Raw inline style attribute, kept verbatim. Several sections and headings
    in the original carry styles that no CSS rule reproduces (for instance the
    FAQ h2, which sits inside .reveal so `.faq-wrap > h2` never matches it)."""
    st = (node.attrs.get('style') or '').strip() if node is not None else ''
    return st or None


def head_of(sec):
    """eyebrow / heading / subheading from a .section-head block, plus the
    modifier class the original puts on it (.wide, .gallery)."""
    sh = sec.first(cls='section-head')
    if not sh: return {}
    out = {}
    mod = [c for c in sh.cls if c != 'section-head']
    if mod: out['headVariant'] = mod[0]
    if (e := sh.first(cls='eyebrow')): out['eyebrow'] = e.text()
    if (h := sh.first('h2')): out['heading'] = h.text()
    if (p := sh.first('p')): out['subheading'] = p.text()
    return {k: v for k, v in out.items() if v}

HERO_LINES = {}

def extract(html, js_band_images=()):
    root = parse(html)
    bands = list(js_band_images)
    raw_h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.S)
    hero_lines = []
    if raw_h1:
        for part in re.split(r'<br\s*/?>', raw_h1.group(1)):
            t = re.sub(r'<[^>]+>', '', part)
            t = _html.unescape(re.sub(r'\s+', ' ', t)).strip()
            if t: hero_lines.append(t)
    page = {'sections': []}
    add = page['sections'].append

    for sec in root.find_all('section'):
        c = sec.cls
        ctas = ctas_of(sec)
        if 'hero-section' in c:
            HERO_LINES[id(sec)] = hero_lines
            h1 = sec.first('h1')
            copy = sec.first(cls='hero-copy')
            add({'_type': 'heroSection',
                 'headingLines': HERO_LINES.get(id(sec)) or ([h1.text()] if h1 else []),
                 'intro': (copy.first('p').text() if copy and copy.first('p') else None),
                 **form_title_of(sec),
                 'consentText': (l.text() if (l := sec.first(cls='q-consent')) else None)})
        elif 'service-hero' in c:
            inner = sec.first(cls='service-hero-inner')
            add({'_type': 'innerHero', 'ctas': ctas, 'bgImage': bg_of(sec),
                 'bgAlt': bg_alt_of(sec),
                 'centered': 'text-align:center' in (inner.attrs.get('style', '') if inner else ''),
                 'eyebrow': (e.text() if (e := sec.first(cls='eyebrow')) else None),
                 'heading': (h.text() if (h := sec.first('h1')) else None),
                 'intro': (p.text() if (p := sec.first(cls='intro')) else None)})
        elif 'statement' in c:
            h2 = sec.first('h2')
            add({'_type': 'statementSection', 'text': h2.text() if h2 else None,
                 'emphasis': (em.text() if h2 and (em := h2.first('em')) else None)})
        elif 'services-section' in c:
            add({'_type': 'servicesSection', **head_of(sec), 'ctas': ctas})
        elif 'cta-band' in c:
            ov = sec.first(cls='overlay')
            m = re.search(r'rgba\([^)]*,\s*([\d.]+)\)', ov.attrs.get('style', '')) if ov else None
            band_bg = bg_of(sec) or (bands.pop(0) if bands else None)
            # landing band 2 uses a bare <img class="bg-img">; inner pages nest
            # the img inside a div.bg-img; parallax bands use a CSS background
            direct = sec.first(cls='cta-band2-img') is not None
            add({'_type': 'ctaBand', 'ctas': ctas, 'bgImage': band_bg,
                 'parallax': 'parallax' in c, 'directImage': direct,
                 'heading': (h.text() if (h := sec.first('h2')) else None),
                 'overlayOpacity': float(m.group(1)) if m else None})
        elif 'gallery-section' in c:
            add({'_type': 'proofSection', **head_of(sec), 'ctas': ctas,
                 'sectionStyle': style_of(sec),
                 'category': sec.attrs.get('data-category'),
                 'projects': ba_items(sec), 'videos': video_items(sec)})
        elif 'faq-section' in c:
            add({'_type': 'faqSection', 'ctas': ctas, 'faqs': faq_items(sec),
                 'groups': faq_groups(sec),
                 'sectionStyle': style_of(sec),
                 'headingStyle': style_of(sec.first('h2')),
                 'heading': (h.text() if (h := sec.first('h2')) else None)})
        elif 'about-section' in c:
            h2 = sec.first('h2')
            add({'_type': 'aboutSection', 'ctas': ctas,
                 'heading': (h2.text() if h2 else None),
                 'headingEmphasis': (em.text() if h2 and (em := h2.first('em')) else None),
                 'intro': (p.text() if (p := sec.first('p')) else None),
                 'bullets': [li.text() for li in sec.find_all('li')]})
        elif 'area-section' in c:
            add({'_type': 'areaSection', **head_of(sec), 'ctas': ctas})
        elif 'reviews-section' in c:
            add({'_type': 'reviewsSection', **head_of(sec), 'ctas': ctas})
        elif 'quote-section' in c:
            add({'_type': 'quoteSection',
                 'sectionStyle': style_of(sec),
                 'eyebrow': (e.text() if (e := sec.first(cls='eyebrow')) else None),
                 'heading': (h.text() if (h := sec.first('h2')) else None),
                 'subheading': (p.text() if (p := sec.first('p')) else None),
                 **form_title_of(sec),
                 'consentText': (l.text() if (l := sec.first(cls='q-consent')) else None)})
        elif 'breakdown-section' in c:
            add({'_type': 'breakdownSection', **head_of(sec),
                 'cards': breakdown_cards(sec)})
        elif 'filter-bar-section' in c:
            add({'_type': 'filterBar',
                 'filters': [{'label': b.text(), 'value': b.attrs.get('data-filter')}
                             for b in sec.find_all(cls='filter-btn')]})
        elif 'photo-section' in c:
            add({'_type': 'photoSection', **head_of(sec),
                 'category': sec.attrs.get('data-category'),
                 'photos': photo_items(sec)})
        elif 'map-section' in c:
            add({'_type': 'mapSection', **head_of(sec),
                 'mapQuery': (lambda f: re.search(r'[?&]q=([^&]+)', f.attrs.get('src', '')).group(1)
                              if f is not None and re.search(r'[?&]q=([^&]+)', f.attrs.get('src', '')) else None)(sec.first('iframe'))})
        elif 'city-info-section' in c:
            blocks = []
            for el in sec.find_all():
                if el.tag in ('h2', 'h3') and el.text(): blocks.append({'style': el.tag, 'text': el.text()})
                elif el.tag == 'p' and el.text(): blocks.append({'style': 'normal', 'text': el.text()})
            if blocks:
                first_h = next((b for b in blocks if b['style'] != 'normal'), None)
                add({'_type': 'proseSection',
                     'eyebrow': (e.text() if (e := sec.first(cls='eyebrow')) else None),
                     'heading': first_h['text'] if first_h else None,
                     'body': [b for b in blocks if b is not first_h]})

    # any long-form copy sections the class check above missed
    return page

def main(clean_dir, content_path, out_path):
    data = json.loads(Path(content_path).read_text())
    merged = {}
    for f in sorted(Path(clean_dir).glob('*.html')):
        slug = f.stem
        page = extract(f.read_text(), data.get(slug, {}).get('ctaBandImages', []))
        base = data.get(slug, {})
        # Landing pages render their gallery and FAQ from the inline DATA block
        # rather than markup, so fall back to it when markup yielded nothing.
        for sec in page['sections']:
            if sec['_type'] == 'faqSection' and not sec.get('faqs'):
                sec['faqs'] = base.get('faqs', [])
            if sec['_type'] == 'proofSection' and not sec.get('projects') and not sec.get('videos'):
                sec['projects'] = [{'title': g['title'], 'desc': g['desc'],
                                    'before': g['before'], 'after': g['after']}
                                   for g in base.get('galleryItems', [])]
                sec['videos'] = [{'title': v['title'], 'desc': v['desc'], 'video': v['video']}
                                 for v in base.get('videoItems', [])]
        merged[slug] = {**base, **page}
        n = len(page['sections'])
        print(f'{slug:32s} {n:2d} sections  ' +
              ','.join(s["_type"].replace("Section", "") for s in page['sections']))
    Path(out_path).write_text(json.dumps(merged, indent=2))
    print(f'\nwrote {out_path}')

if __name__ == '__main__':
    main(*sys.argv[1:4])
