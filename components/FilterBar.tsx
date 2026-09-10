'use client';
import { useEffect, useState } from 'react';

/** Projects-page filter. Sections tag themselves with data-category; the bar
 *  shows or hides them, matching the original behaviour. */
export default function FilterBar({ filters }: { filters: { label: string; value: string }[] }) {
  const [active, setActive] = useState(filters[0]?.value ?? 'all');

  useEffect(() => {
    for (const el of document.querySelectorAll<HTMLElement>('[data-category]')) {
      el.hidden = active !== 'all' && el.dataset.category !== active;
    }
  }, [active]);

  return (
    <section className="filter-bar-section">
      <div className="container">
        <div className="filter-bar" role="tablist" aria-label="Filter projects">
          {filters.map(f => (
            <button type="button" key={f.value} role="tab" aria-selected={active === f.value}
              className={`filter-btn${active === f.value ? ' active' : ''}`}
              onClick={() => setActive(f.value)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
