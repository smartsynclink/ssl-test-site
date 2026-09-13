'use client';
import { useState } from 'react';
import { Plus } from './icons';

type Faq = { _id: string; question: string; answer: string };

export default function FaqList({ faqs, groups }: {
  faqs: Faq[]; groups?: { _key: string; title: string; faqs: Faq[] }[];
}) {
  const [open, setOpen] = useState<string | null>(null);
  const list = (items: Faq[]) => (
    <div className="faq-list">
      {items.map(f => <Item key={f._id} f={f} open={open === f._id}
        toggle={() => setOpen(open === f._id ? null : f._id)} />)}
    </div>
  );

  if (groups?.length) {
    return <>{groups.map(g => (
      <div className="faq-group" key={g._key}><h3>{g.title}</h3>{list(g.faqs)}</div>
    ))}</>;
  }
  return list(faqs);
}

function Item({ f, open, toggle }: { f: Faq; open: boolean; toggle: () => void }) {
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-q" aria-expanded={open} aria-controls={`faq-a-${f._id}`} onClick={toggle}>
        {f.question}<span className="faq-icon"><Plus /></span>
      </button>
      <div className="faq-a" id={`faq-a-${f._id}`} role="region">
        <div><p>{f.answer}</p></div>
      </div>
    </div>
  );
}
