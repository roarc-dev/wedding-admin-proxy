import type { IncomingMessage, ServerResponse } from "node:http"
import crypto from "node:crypto"

import { serializeCookie } from "../_utils/cookies.js"

type VercelReq = IncomingMessage & { query?: Record<string, string | string[]> }

function randomState(): string {
  return crypto.randomBytes(16).toString("hex")
}

export default function handler(req: VercelReq, res: ServerResponse) {
  const clientId = process.env.NAVER_CLIENT_ID
  const baseUrl = process.env.AUTH_BASE_URL

  if (!clientId || !baseUrl) {
    res.statusCode = 500
    res.setHeader("Content-Type", "application/json; charset=utf-8")
    res.end(JSON.stringify({ error: "Missing NAVER_CLIENT_ID or AUTH_BASE_URL" }))
    return
  }

  const state = randomState()
  const redirectUri = new URL("/api/auth/callback/naver", baseUrl).toString()

  const authorizeUrl = new URL("https://nid.naver.com/oauth2.0/authorize")
  authorizeUrl.searchParams.set("response_type", "code")
  authorizeUrl.searchParams.set("client_id", clientId)
  authorizeUrl.searchParams.set("redirect_uri", redirectUri)
  authorizeUrl.searchParams.set("state", state)

  res.setHeader(
    "Set-Cookie",
    serializeCookie("naver_oauth_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      maxAgeSeconds: 10 * 60,
    }),
  )

  res.statusCode = 302
  res.setHeader("Location", authorizeUrl.toString())
  res.end()
}


