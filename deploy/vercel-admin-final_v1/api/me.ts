import type { IncomingMessage, ServerResponse } from "node:http"

import { parseCookies, verifySession } from "./_utils/cookies.js"

type VercelReq = IncomingMessage & { query?: Record<string, string | string[]> }
type VercelRes = ServerResponse & {
  status: (code: number) => VercelRes
  json: (body: unknown) => void
}

function withHelpers(res: ServerResponse): VercelRes {
  const r = res as VercelRes
  r.status = (code) => {
    r.statusCode = code
    return r
  }
  r.json = (body) => {
    r.setHeader("Content-Type", "application/json; charset=utf-8")
    r.end(JSON.stringify(body))
  }
  return r
}

export default function handler(req: VercelReq, res: ServerResponse) {
  const r = withHelpers(res)
  const secret = process.env.AUTH_COOKIE_SECRET

  if (!secret) {
    r.status(500).json({ error: "AUTH_COOKIE_SECRET is not set" })
    return
  }

  const cookies = parseCookies(req.headers.cookie)
  const session = verifySession(cookies.my_session, secret)
  if (!session) {
    r.status(401).json({ authenticated: false })
    return
  }

  r.status(200).json({
    authenticated: true,
    user: {
      id: session.sub,
      name: session.name ?? null,
      email: session.email ?? null,
    },
  })
}


