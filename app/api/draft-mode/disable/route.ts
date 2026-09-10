import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';

/** Leaves Draft Mode and returns to the given path (defaults to the home page). */
export async function GET(request: Request) {
  (await draftMode()).disable();
  const to = new URL(request.url).searchParams.get('redirect') ?? '/';
  return NextResponse.redirect(new URL(to, request.url));
}
