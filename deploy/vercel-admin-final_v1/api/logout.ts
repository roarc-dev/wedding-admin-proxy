import type { IncomingMessage, ServerResponse } from "node:http"

import { serializeCookie } from "./_utils/cookies.js"

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

  if (req.method && req.method !== "POST") {
    r.status(405).json({ error: "Method Not Allowed" })
    return
  }

  r.setHeader(
    "Set-Cookie",
    serializeCookie("my_session", "", {
      maxAgeSeconds: 0,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    }),
  )
  r.status(200).json({ ok: true })
}


