import type { APIRoute } from 'astro'
import { feed } from '../../lib/data'

/** The feed the landing site reads. Built once at build time; no network is involved. */
export const GET: APIRoute = () =>
  new Response(`${JSON.stringify(feed, null, 2)}\n`, {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
