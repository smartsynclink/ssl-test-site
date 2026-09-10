/** The original already defers this with loading="lazy", so there is nothing to
 *  gain from a click-to-load facade -- it would only add a step for the viewer. */
export default function MapEmbed({ query, label }: { query: string; label: string }) {
  return (
    <iframe
      src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
      loading="lazy" referrerPolicy="no-referrer-when-downgrade"
      title={`Map of ${label}'s service area in Greater Austin`} />
  );
}
