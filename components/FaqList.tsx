'use client';
import { Fragment, useState } from 'react';
import { Plus } from './icons';

/** Keeps the original accordion markup and class names rather than swapping to
 *  <details>, so the ported CSS applies unchanged. */
type Faq = { _id: string; question: string; answer: string };

export default function FaqList({ faqs, groups }: {
  faqs: Faq[]; groups?: { _key: string; title: string; faqs: Faq[] }[];
}) {
  const [open, setOpen] = useState<string | null>(null);

  // Grouped: the original puts each <h3> and its list as siblings directly
  // under the reveal, with no wrapper around the set.
  if (groups?.length) {
    return (
      <>
        {groups.map((g, gi) => (
          <Fragment key={g._key}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19,
              margin: gi === 0 ? '0 0 4px' : '40px 0 4px' }}>{g.title}</h3>
            <div>
              {g.faqs.map(f => <Item key={f._id} f={f} id={f._id} open={open} setOpen={setOpen} />)}
            </div>
          </Fragment>
        ))}
      </>
    );
  }

  return (
    <div id="faqList">
      {faqs.map(f => <Item key={f._id} f={f} id={f._id} open={open} setOpen={setOpen} />)}
    </div>
  );
}

function Item({ f, id, open, setOpen }: {
  f: Faq; id: string; open: string | null; setOpen: (v: string | null) => void;
}) {
  const isOpen = open === id;
  return (
    <div className="faq-item">
      <button className={`faq-q${isOpen ? ' open' : ''}`} aria-expanded={isOpen}
        aria-controls={`faq-a-${id}`} onClick={() => setOpen(isOpen ? null : id)}>
        {f.question}<Plus />
      </button>
      <div className={`faq-a${isOpen ? ' open' : ''}`} id={`faq-a-${id}`} role="region">
        <p>{f.answer}</p>
      </div>
    </div>
  );
}
