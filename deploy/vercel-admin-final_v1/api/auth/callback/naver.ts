import type { IncomingMessage, ServerResponse } from "node:http"

import { parseCookies, serializeCookie, signSession } from "../../_utils/cookies.js"

type VercelReq = IncomingMessage & { query?: Record<string, string | string[]> }

type NaverTokenResponse = {
  access_token: string
  refresh_token?: string
  token_type?: string
  expires_in?: string
  error?: string
  error_description?: string
}

type NaverProfileResponse = {
  resultcode: string
  message: string
  response?: {
    id: string
    nickname?: string
    name?: string
    email?: string
  }
}

function getQuery(req: VercelReq): URLSearchParams {
  const host = req.headers.host ?? "localhost"
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? "https"
  const url = new URL(req.url ?? "/", `${proto}://${host}`)
  return url.searchParams
}

function json(res: ServerResponse, code: number, body: unknown) {
  res.statusCode = code
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.end(JSON.stringify(body))
}

export default async function handler(req: VercelReq, res: ServerResponse) {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET
  const baseUrl = process.env.AUTH_BASE_URL
  const cookieSecret = process.env.AUTH_COOKIE_SECRET

  if (!clientId || !clientSecret || !baseUrl || !cookieSecret) {
    json(res, 500, {
      error: "Missing env",
      missing: {
        NAVER_CLIENT_ID: !clientId,
        NAVER_CLIENT_SECRET: !clientSecret,
        AUTH_BASE_URL: !baseUrl,
        AUTH_COOKIE_SECRET: !cookieSecret,
      },
    })
    return
  }

  const query = getQuery(req)
  const code = query.get("code")
  const state = query.get("state")

  if (!code || !state) {
    json(res, 400, { error: "Missing code/state" })
    return
  }

  const cookies = parseCookies(req.headers.cookie)
  if (!cookies.naver_oauth_state || cookies.naver_oauth_state !== state) {
    json(res, 400, { error: "Invalid state" })
    return
  }

  const redirectUri = new URL("/api/auth/callback/naver", baseUrl).toString()

  const tokenUrl = new URL("https://nid.naver.com/oauth2.0/token")
  tokenUrl.searchParams.set("grant_type", "authorization_code")
  tokenUrl.searchParams.set("client_id", clientId)
  tokenUrl.searchParams.set("client_secret", clientSecret)
  tokenUrl.searchParams.set("code", code)
  tokenUrl.searchParams.set("state", state)
  tokenUrl.searchParams.set("redirect_uri", redirectUri)

  const tokenRes = await fetch(tokenUrl.toString(), { method: "GET" })
  const tokenJson = (await tokenRes.json()) as NaverTokenResponse

  if (!tokenRes.ok || !tokenJson.access_token) {
    json(res, 401, { error: "Failed to get access token", detail: tokenJson })
    return
  }

  const profileRes = await fetch("https://openapi.naver.com/v1/nid/me", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  })
  const profileJson = (await profileRes.json()) as NaverProfileResponse

  const profile = profileJson.response
  if (!profileRes.ok || !profile?.id) {
    json(res, 401, { error: "Failed to get profile", detail: profileJson })
    return
  }

  // TODO(구매 검증): 여기서 `profile.id`(네이버 고유 id) 또는 `profile.email`을 기준으로
  // "구매 완료" 여부를 DB/API로 확인하고, 미구매면 403 처리해야 합니다.

  const now = Math.floor(Date.now() / 1000)
  const token = signSession(
    {
      sub: `naver:${profile.id}`,
      name: profile.name ?? profile.nickname,
      email: profile.email,
      iat: now,
      exp: now + 60 * 60 * 24 * 7,
    },
    cookieSecret,
  )

  res.setHeader("Set-Cookie", [
    serializeCookie("naver_oauth_state", "", {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      maxAgeSeconds: 0,
    }),
    serializeCookie("my_session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      maxAgeSeconds: 60 * 60 * 24 * 7,
    }),
  ])

  res.statusCode = 302
  res.setHeader("Location", new URL("/", baseUrl).toString())
  res.end()
}


