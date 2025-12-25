import type { IncomingMessage, ServerResponse } from "node:http"
import crypto from "node:crypto"

import { parseCookies, verifySession } from "../_utils/cookies.js"
import { supaGet, supaPatch, supaPost } from "../_utils/supa_rest.js"

type VercelReq = IncomingMessage

type RedeemRow = {
  code: string
  page_id: string | null
  expires_at: string | null
  used_at: string | null
}

type AdminUserRow = {
  id: string
  username: string
  role: string | null
  page_id: string | null
  wedding_date: string | null
}

type RedeemBody = {
  code?: string
  wedding_date?: string
  last_groom_name_kr?: string
  groom_name_kr?: string
  last_groom_name_en?: string
  groom_name_en?: string
  last_bride_name_kr?: string
  bride_name_kr?: string
  last_bride_name_en?: string
  bride_name_en?: string
}

type PageSettingsRow = {
  page_id: string
}

function json(res: ServerResponse, code: number, body: unknown) {
  res.statusCode = code
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.end(JSON.stringify(body))
}

async function readJson(req: VercelReq): Promise<unknown> {
  const chunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(String(c))))
    req.on("end", () => resolve())
    req.on("error", reject)
  })
  const raw = Buffer.concat(chunks).toString("utf8").trim()
  if (!raw) return {}
  return JSON.parse(raw) as unknown
}

function mintProxyToken(user: AdminUserRow): string {
  const tokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role ?? "user",
    page_id: user.page_id,
    wedding_date: user.wedding_date,
    expires: Date.now() + 24 * 60 * 60 * 1000,
  }
  return Buffer.from(JSON.stringify(tokenPayload)).toString("base64")
}

function randomPassword(): string {
  return crypto.randomBytes(24).toString("hex")
}

function normText(v: unknown): string {
  return typeof v === "string" ? v.trim() : ""
}

export default async function handler(req: VercelReq, res: ServerResponse) {
  try {
    if (req.method && req.method !== "POST") {
      json(res, 405, { error: "Method Not Allowed" })
      return
    }

    const cookieSecret = process.env.AUTH_COOKIE_SECRET
    if (!cookieSecret) {
      json(res, 500, { error: "AUTH_COOKIE_SECRET is not set" })
      return
    }

    const cookies = parseCookies(req.headers.cookie)
    const session = verifySession(cookies.my_session, cookieSecret)
    if (!session?.sub) {
      json(res, 401, { authenticated: false })
      return
    }

    const raw = session.sub
    const naverId = raw.startsWith("naver:") ? raw.slice("naver:".length) : raw

    const body = (await readJson(req)) as RedeemBody
    const code = normText(body.code)
    if (!code) {
      json(res, 400, { error: "code is required" })
      return
    }

    const wedding_date = normText(body.wedding_date)
    const last_groom_name_kr = normText(body.last_groom_name_kr)
    const groom_name_kr = normText(body.groom_name_kr)
    const last_groom_name_en = normText(body.last_groom_name_en)
    const groom_name_en = normText(body.groom_name_en)
    const last_bride_name_kr = normText(body.last_bride_name_kr)
    const bride_name_kr = normText(body.bride_name_kr)
    const last_bride_name_en = normText(body.last_bride_name_en)
    const bride_name_en = normText(body.bride_name_en)

    // 1) 코드 조회
    const rows = await supaGet<RedeemRow[]>(
      `/rest/v1/naver_redeem_codes?code=eq.${encodeURIComponent(code)}&select=code,page_id,expires_at,used_at`,
    )
    const row = rows[0]
    if (!row) {
      json(res, 400, { error: "유효하지 않은 코드입니다." })
      return
    }
    if (!row.page_id) {
      json(res, 400, { error: "아직 활성화되지 않은 코드입니다. 잠시 후 다시 시도해주세요." })
      return
    }
    if (row.used_at) {
      json(res, 400, { error: "이미 사용된 코드입니다." })
      return
    }
    if (row.expires_at && Date.now() > new Date(row.expires_at).getTime()) {
      json(res, 400, { error: "만료된 코드입니다." })
      return
    }

    // 2) 코드 사용 처리(경쟁 조건 방지: used_at is null 조건)
    const nowIso = new Date().toISOString()
    await supaPatch(
      `/rest/v1/naver_redeem_codes?code=eq.${encodeURIComponent(code)}&used_at=is.null`,
      { used_at: nowIso, used_by_naver_id: naverId },
      "return=minimal",
    )

    // 3) naver_admin_accounts에 page_id 매핑
    await supaPatch(
      `/rest/v1/naver_admin_accounts?naver_id=eq.${encodeURIComponent(naverId)}`,
      {
        page_id: row.page_id,
        code_redeemed_at: nowIso,
        updated_at: nowIso,
        profile_submitted_at: nowIso,
        wedding_date: wedding_date || null,
        last_groom_name_kr: last_groom_name_kr || null,
        groom_name_kr: groom_name_kr || null,
        last_groom_name_en: last_groom_name_en || null,
        groom_name_en: groom_name_en || null,
        last_bride_name_kr: last_bride_name_kr || null,
        bride_name_kr: bride_name_kr || null,
        last_bride_name_en: last_bride_name_en || null,
        bride_name_en: bride_name_en || null,
      },
      "return=minimal",
    )

    // 3-1) page_settings 생성/업데이트 (코드 입력 단계에서 받은 정보로 초기화)
    const existingPageSettings = await supaGet<PageSettingsRow[]>(
      `/rest/v1/page_settings?page_id=eq.${encodeURIComponent(row.page_id)}&select=page_id`,
    )
    const pageSettingsPayload = {
      page_id: row.page_id,
      wedding_date: wedding_date || null,
      groom_name_kr: groom_name_kr || null,
      last_groom_name_kr: last_groom_name_kr || null,
      groom_name_en: groom_name_en || null,
      last_groom_name_en: last_groom_name_en || null,
      bride_name_kr: bride_name_kr || null,
      last_bride_name_kr: last_bride_name_kr || null,
      bride_name_en: bride_name_en || null,
      last_bride_name_en: last_bride_name_en || null,
      // 레거시 컬럼(있으면 UI에 쓰임)
      groom_name: `${last_groom_name_kr}${groom_name_kr}`.trim(),
      bride_name: `${last_bride_name_kr}${bride_name_kr}`.trim(),
      updated_at: nowIso,
    }

    if (existingPageSettings.length === 0) {
      await supaPost(`/rest/v1/page_settings`, pageSettingsPayload, "return=minimal")
    } else {
      await supaPatch(
        `/rest/v1/page_settings?page_id=eq.${encodeURIComponent(row.page_id)}`,
        pageSettingsPayload,
        "return=minimal",
      )
    }

    // 4) admin_users 생성/갱신 (기존 프록시 API들이 userId→admin_users 조회를 하기 때문)
    const username = `naver:${naverId}`
    const existing = await supaGet<AdminUserRow[]>(
      `/rest/v1/admin_users?naver_id=eq.${encodeURIComponent(naverId)}&select=id,username,role,page_id,wedding_date`,
    )

    let adminUser: AdminUserRow | undefined = existing[0]
    if (!adminUser?.id) {
      const created = await supaPost<AdminUserRow[]>(
        `/rest/v1/admin_users`,
        {
          username,
          password: randomPassword(),
          naver_id: naverId,
          page_id: row.page_id,
          wedding_date: wedding_date || null,
          groom_name_en: groom_name_en || null,
          bride_name_en: bride_name_en || null,
          approval_status: "approved",
          is_active: true,
          role: "user",
          updated_at: nowIso,
        },
        "return=representation",
      )
      adminUser = created[0]
    } else {
      const updated = await supaPatch<AdminUserRow[]>(
        `/rest/v1/admin_users?naver_id=eq.${encodeURIComponent(naverId)}`,
        {
          page_id: row.page_id,
          wedding_date: wedding_date || null,
          groom_name_en: groom_name_en || null,
          bride_name_en: bride_name_en || null,
          updated_at: nowIso,
          last_login: nowIso,
        },
        "return=representation",
      )
      adminUser = updated[0] ?? adminUser
    }

    if (!adminUser?.id) {
      json(res, 500, { error: "Failed to provision admin user" })
      return
    }

    json(res, 200, {
      ok: true,
      state: "ready" as const,
      page_id: row.page_id,
      proxy_token: mintProxyToken({
        id: adminUser.id,
        username: adminUser.username ?? username,
        role: adminUser.role ?? "user",
        page_id: row.page_id,
        wedding_date: adminUser.wedding_date ?? null,
      }),
      user: {
        id: adminUser.id,
        username: adminUser.username ?? username,
        page_id: row.page_id,
        wedding_date: adminUser.wedding_date ?? null,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    json(res, 500, { error: "Server error", message })
  }
}


