/** Blueprint rule: when the client hasn't supplied something, the site says so
 *  instead of guessing. Rendered visibly so it can't slip through QA. */
export default function Needed({ what, block }: { what: string; block?: boolean }) {
  const Tag = block ? 'div' : 'span';
  return <Tag className={`needed${block ? ' block' : ''}`}>[CONTENT NEEDED] {what}</Tag>;
}
