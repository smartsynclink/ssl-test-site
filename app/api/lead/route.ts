/**
 * Quote form → GoHighLevel.
 *
 * Blueprint: the lead lands in the client's sub-account, in the pipeline at stage
 * "New Lead". GHL's own automations (instant reply SMS + email, notifications)
 * then fire from that contact -- they are configured in GHL, not here.
 *
 * Steps: upsert the contact → add tags, attach a note with the request and the
 * consent record, create the opportunity in the pipeline stage.
 *
 * Needs (server-only, never NEXT_PUBLIC_): GHL_PRIVATE_INTEGRATION_TOKEN,
 * GHL_LOCATION_ID, GHL_PIPELINE_ID, GHL_PIPELINE_STAGE_ID. Until they are set the
 * route answers 503 and the form tells the visitor to call instead.
 */
import { leadNote, splitName, toE164, validateLead } from '@/lib/lead';

// Defaults from GHL's Private Integration token guide. Their endpoint reference also
// shows api.gohighlevel.com with Version v3; override here if the test lead proves otherwise.
const API_BASE = process.env.GHL_API_BASE || 'https://services.leadconnectorhq.com';
const API_VERSION = process.env.GHL_API_VERSION || '2021-07-28';

async function ghl<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GHL_PRIVATE_INTEGRATION_TOKEN}`,
      Version: API_VERSION, 'Content-Type': 'application/json', Accept: 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`GHL ${path} → ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res.json() as Promise<T>;
}

export async function POST(request: Request) {
  let raw: Record<string, unknown>;
  try { raw = await request.json(); } catch { return Response.json({ error: 'invalid_json' }, { status: 400 }); }

  // honeypot: real visitors never fill the hidden "company" field. Answer as if it
  // worked so bots learn nothing, and send nothing to the CRM.
  if (typeof raw.company === 'string' && raw.company.trim()) return Response.json({ ok: true });

  const { lead, errors } = validateLead(raw);
  if (errors.length) return Response.json({ error: 'invalid', fields: errors }, { status: 400 });

  const { GHL_PRIVATE_INTEGRATION_TOKEN, GHL_LOCATION_ID, GHL_PIPELINE_ID, GHL_PIPELINE_STAGE_ID } = process.env;
  if (!GHL_PRIVATE_INTEGRATION_TOKEN || !GHL_LOCATION_ID || !GHL_PIPELINE_ID || !GHL_PIPELINE_STAGE_ID) {
    console.error('[lead] GoHighLevel is not configured; lead not delivered:', lead.email);
    return Response.json({ error: 'not_configured' }, { status: 503 });
  }

  const { firstName, lastName } = splitName(lead.name);
  let contactId: string;
  try {
    // no tags here: on upsert GHL replaces all of a returning contact's tags
    const upsert = await ghl<{ contact: { id: string } }>('/contacts/upsert', {
      locationId: GHL_LOCATION_ID, firstName, lastName, name: lead.name,
      email: lead.email, phone: toE164(lead.phone), source: 'Website quote form',
    });
    contactId = upsert.contact.id;
  } catch (err) {
    console.error('[lead] contact upsert failed:', err);
    return Response.json({ error: 'crm_unavailable' }, { status: 502 });
  }

  // The contact exists from here on, so the visitor gets a success message either way;
  // anything below that fails is logged for follow-up rather than shown to them.
  const note = leadNote(lead, {
    submittedAt: new Date().toISOString(),
    ip: request.headers.get('x-forwarded-for')?.split(',')[0].trim(),
    userAgent: request.headers.get('user-agent') ?? undefined,
  });
  const results = await Promise.allSettled([
    ghl(`/contacts/${contactId}/tags`, { tags: ['website lead', lead.service] }),
    ghl(`/contacts/${contactId}/notes`, { body: note }),
    ghl('/opportunities/', {
      locationId: GHL_LOCATION_ID, pipelineId: GHL_PIPELINE_ID, pipelineStageId: GHL_PIPELINE_STAGE_ID,
      contactId, name: `${lead.name} — ${lead.service}`, status: 'open',
    }),
  ]);
  const failed = results.flatMap((r, i) => r.status === 'rejected' ? [`${['tags', 'note', 'opportunity'][i]}: ${r.reason}`] : []);
  if (failed.length) console.error(`[lead] contact ${contactId} created, but:`, failed);

  return Response.json({ ok: true });
}
