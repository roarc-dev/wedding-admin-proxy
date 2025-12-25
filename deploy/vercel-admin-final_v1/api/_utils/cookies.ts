import crypto from "node:crypto"

type CookieOptions = {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: "Lax" | "Strict" | "None"
  path?: string
  maxAgeSeconds?: number
}

export function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {}
  const result: Record<string, string> = {}

  for (const part of header.split(";")) {
    const [rawKey, ...rawValueParts] = part.trim().split("=")
    if (!rawKey) continue
    const rawValue = rawValueParts.join("=")
    result[rawKey] = decodeURIComponent(rawValue ?? "")
  }

  return result
}

export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  const encodedValue = encodeURIComponent(value)
  const parts: string[] = [`${name}=${encodedValue}`]

  parts.push(`Path=${options.path ?? "/"}`)

  if (options.httpOnly ?? true) parts.push("HttpOnly")
  if (options.secure ?? true) parts.push("Secure")
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`)
  if (typeof options.maxAgeSeconds === "number") parts.push(`Max-Age=${options.maxAgeSeconds}`)

  return parts.join("; ")
}

function base64UrlEncode(input: string | Buffer): string {
  const buffer = typeof input === "string" ? Buffer.from(input, "utf8") : input
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/")
  const padLength = (4 - (padded.length % 4)) % 4
  const base64 = padded + "=".repeat(padLength)
  return Buffer.from(base64, "base64").toString("utf8")
}

export type SessionPayload = {
  sub: string
  name?: string
  email?: string
  iat: number
  exp: number
}

export function signSession(payload: SessionPayload, secret: string): string {
  const body = base64UrlEncode(JSON.stringify(payload))
  const sig = base64UrlEncode(crypto.createHmac("sha256", secret).update(body).digest())
  return `${body}.${sig}`
}

export function verifySession(token: string | undefined, secret: string): SessionPayload | null {
  if (!token) return null
  const [body, sig] = token.split(".")
  if (!body || !sig) return null

  const expectedSig = base64UrlEncode(crypto.createHmac("sha256", secret).update(body).digest())
  const sigOk =
    expectedSig.length === sig.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig))

  if (!sigOk) return null

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload
    if (!payload?.sub || typeof payload.iat !== "number" || typeof payload.exp !== "number") return null
    if (Date.now() / 1000 > payload.exp) return null
    return payload
  } catch {
    return null
  }
}


