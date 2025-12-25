import type { IncomingMessage, ServerResponse } from "node:http"

import { parseCookies, verifySession } from "../_utils/cookies.js"
import { supaGet, supaPost, supaPatch } from "../_utils/supa_rest.js"

type VercelReq = IncomingMessage

type NaverAccountRow = {
  id: string
  naver_id: string
  page_id: string | null
}

type AdminUserRow = {
  id: string
  username: string
  role: string | null
  page_id: string | null
  wedding_date: string | null
}

function json(res: ServerResponse, code: number, body: unknown) {
  res.statusCode = code
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.end(JSON.stringify(body))
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

export default async function handler(req: VercelReq, res: ServerResponse) {
  try {
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

    // 1) naver_admin_accounts upsert (최초 로그인 시 생성)
    const accounts = await supaGet<NaverAccountRow[]>(
      `/rest/v1/naver_admin_accounts?naver_id=eq.${encodeURIComponent(naverId)}&select=id,naver_id,page_id`,
    )
    const account =
      accounts[0] ??
      (await supaPost<NaverAccountRow[]>(
        `/rest/v1/naver_admin_accounts`,
        { naver_id: naverId, last_login_at: new Date().toISOString() },
        "return=representation",
      ))[0]

    if (!account) {
      json(res, 500, { error: "Failed to create naver_admin_accounts row" })
      return
    }

    // last_login_at 업데이트(있으면)
    await supaPatch(
      `/rest/v1/naver_admin_accounts?naver_id=eq.${encodeURIComponent(naverId)}`,
      { last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      "return=minimal",
    )

    // 2) code 입력 전이면 needs_code
    if (!account.page_id) {
      json(res, 200, { authenticated: true, state: "needs_code" as const })
      return
    }

    // 3) 기존 admin_users에 naver_id가 연결되어 있는지 확인
    const adminUsers = await supaGet<AdminUserRow[]>(
      `/rest/v1/admin_users?naver_id=eq.${encodeURIComponent(naverId)}&select=id,username,role,page_id,wedding_date`,
    )
    const adminUser = adminUsers[0]

    if (!adminUser?.id || !adminUser.page_id) {
      // page_id는 매핑되어 있는데 admin_users가 없다면, 코드 재입력을 유도(운영상 케이스)
      json(res, 200, { authenticated: true, state: "needs_code" as const })
      return
    }

    json(res, 200, {
      authenticated: true,
      state: "ready" as const,
      page_id: adminUser.page_id,
      proxy_token: mintProxyToken(adminUser),
      user: {
        id: adminUser.id,
        username: adminUser.username,
        page_id: adminUser.page_id,
        wedding_date: adminUser.wedding_date ?? null,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    json(res, 500, { error: "Server error", message })
  }
}


