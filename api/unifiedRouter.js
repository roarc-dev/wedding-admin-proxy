// api/[...route].js — one-file router that merges auth, users, images, rsvp, calendar, contacts, page-settings, map-config
// Drop this into Vercel/Next.js API routes. Replace your existing multiple files.
// Minimal deps: @supabase/supabase-js, jsonwebtoken

import jwt from "jsonwebtoken"
import { createClient } from "@supabase/supabase-js"

// --------------------
// Config & Utilities
// --------------------
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-prod"
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

function supa() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "wedding-admin" } },
  })
}

function withCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

function send(res, status, body) {
  res.status(status).json(body)
}

async function readBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return {}
  try {
    const chunks = []
    for await (const c of req) chunks.push(c)
    const raw = Buffer.concat(chunks).toString("utf8")
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function bearer(req) {
  const h = req.headers["authorization"] || ""
  return h.startsWith("Bearer ") ? h.slice(7) : null
}

function requireAuth(req) {
  const token = bearer(req)
  if (!token) throw Object.assign(new Error("Unauthorized"), { status: 401 })
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (e) {
    throw Object.assign(new Error("Invalid token"), { status: 401 })
  }
}

function signToken(payload, opts = {}) {
  return jwt.sign(payload, JWT_SECRET, { algorithm: "HS256", expiresIn: "45m", ...opts })
}

// --------------------
// Tiny Router
// --------------------
function parseRoute(req) {
  // Next.js catch-all: req.query.route is an array like ["images", "order"]
  const segs = Array.isArray(req.query.route) ? req.query.route : []
  const [resource = "ping", actionOrId] = segs
  return { resource, actionOrId }
}

// --------------------
// Handlers by resource
// --------------------
const handlers = {
  async ping(req, res) {
    return send(res, 200, { ok: true, time: new Date().toISOString() })
  },

  // -------- AUTH --------
  async auth(req, res, { actionOrId }) {
    const s = supa()
    const body = await readBody(req)

    if (req.method === "POST" && actionOrId === "login") {
      const { username, password } = body
      if (!username || !password) return send(res, 400, { success: false, error: "username/password required" })
      const { data: user, error } = await s
        .from("admin_users")
        .select("id, username, password_hash, role, page_id, approval_status")
        .eq("username", username)
        .single()
      if (error || !user) return send(res, 401, { success: false, error: "Invalid credentials" })
      // You should replace with proper hashing check (bcrypt.compare)
      const isValid = password === user.password_hash || password === user.password // legacy support if any
      if (!isValid) return send(res, 401, { success: false, error: "Invalid credentials" })
      if (user.approval_status && user.approval_status !== "approved") return send(res, 403, { success: false, error: "Pending approval" })
      const token = signToken({ uid: user.id, role: user.role, pageId: user.page_id })
      return send(res, 200, { success: true, token, user: { id: user.id, username: user.username, role: user.role, page_id: user.page_id } })
    }

    if (req.method === "POST" && actionOrId === "register") {
      const { username, password, page_id } = body
      if (!username || !password) return send(res, 400, { success: false, error: "username/password required" })
      const { data, error } = await s.from("admin_users").insert({ username, password_hash: password, page_id, approval_status: "pending" }).select("id").single()
      if (error) return send(res, 400, { success: false, error: error.message })
      return send(res, 201, { success: true, id: data.id })
    }

    if (req.method === "GET" && actionOrId === "me") {
      const claims = requireAuth(req)
      return send(res, 200, { success: true, user: claims })
    }

    return send(res, 404, { success: false, error: "Unknown auth action" })
  },

  // -------- USERS (admin) --------
  async users(req, res, { actionOrId }) {
    const claims = requireAuth(req)
    if (claims.role !== "admin") return send(res, 403, { success: false, error: "Forbidden" })
    const s = supa()
    if (req.method === "GET") {
      const { data, error } = await s.from("admin_users").select("id, username, role, approval_status, page_id, created_at").order("created_at", { ascending: false })
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true, data })
    }
    if (req.method === "PUT" && actionOrId) {
      const body = await readBody(req)
      const { role, approval_status } = body
      const { error } = await s.from("admin_users").update({ role, approval_status }).eq("id", actionOrId)
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true })
    }
    return send(res, 405, { success: false, error: "Method not allowed" })
  },

  // -------- IMAGES --------
  async images(req, res, { actionOrId }) {
    const s = supa()
    const q = req.query

    if (req.method === "GET") {
      // /api/images/getAllPages → counts grouped by page_id
      if (actionOrId === "getAllPages") {
        const { data, error } = await s
          .from("images")
          .select("page_id, count:id")
          .group("page_id")
        if (error) return send(res, 500, { success: false, error: error.message })
        return send(res, 200, { success: true, data })
      }
      // /api/images/byPage?pageId=xxx&limit=50&offset=0
      if (actionOrId === "byPage") {
        const { pageId, limit = 50, offset = 0 } = q
        if (!pageId) return send(res, 400, { success: false, error: "pageId required" })
        const { data, error } = await s
          .from("images")
          .select("id,page_id,public_url,display_order,created_at")
          .eq("page_id", pageId)
          .order("display_order", { ascending: true })
          .range(Number(offset), Number(offset) + Number(limit) - 1)
        if (error) return send(res, 500, { success: false, error: error.message })
        return send(res, 200, { success: true, data })
      }
      return send(res, 404, { success: false, error: "Unknown images action" })
    }

    // mutate → auth
    const claims = requireAuth(req)
    const body = await readBody(req)

    if (req.method === "POST") {
      // upload by public_url (assuming presigned handled client-side)
      const { page_id, public_url, display_order = 9999 } = body
      if (!page_id || !public_url) return send(res, 400, { success: false, error: "page_id/public_url required" })
      const { data, error } = await s.from("images").insert({ page_id, public_url, display_order }).select("id").single()
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 201, { success: true, id: data.id })
    }

    if (req.method === "PUT" && actionOrId === "order") {
      const { updates } = body // [{id, display_order}]
      if (!Array.isArray(updates)) return send(res, 400, { success: false, error: "updates[] required" })
      const { error } = await s.from("images").upsert(updates.map(u => ({ id: u.id, display_order: u.display_order })))
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true })
    }

    if (req.method === "DELETE" && actionOrId) {
      const { error } = await s.from("images").delete().eq("id", actionOrId)
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true })
    }

    return send(res, 405, { success: false, error: "Method not allowed" })
  },

  // -------- RSVP --------
  async rsvp(req, res, { actionOrId }) {
    const s = supa()

    if (req.method === "GET") {
      const { pageId, onlyAttending } = req.query
      if (!pageId) return send(res, 400, { success: false, error: "pageId required" })
      let q = s.from("rsvp_responses").select("id,page_id,name,relation_type,guest_count,message,created_at").eq("page_id", pageId)
      if (String(onlyAttending) === "true") q = q.eq("relation_type", "참석")
      const { data, error } = await q.order("created_at", { ascending: false })
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true, data })
    }

    if (req.method === "POST") {
      const body = await readBody(req)
      const { page_id, name, relation_type, guest_count = 1, message = "" } = body
      if (!page_id || !name || !relation_type) return send(res, 400, { success: false, error: "page_id/name/relation_type required" })
      const { error } = await s.from("rsvp_responses").insert({ page_id, name, relation_type, guest_count, message })
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 201, { success: true })
    }

    return send(res, 405, { success: false, error: "Method not allowed" })
  },

  // -------- CALENDAR --------
  async calendar(req, res) {
    const s = supa()
    if (req.method === "GET") {
      const { pageId, from, to, limit = 50, offset = 0 } = req.query
      if (!pageId) return send(res, 400, { success: false, error: "pageId required" })
      let q = s.from("calendar_events").select("id,page_id,date,title,created_at").eq("page_id", pageId)
      if (from) q = q.gte("date", from)
      if (to) q = q.lte("date", to)
      const { data, error } = await q.order("date", { ascending: true }).range(Number(offset), Number(offset) + Number(limit) - 1)
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true, data })
    }
    const claims = requireAuth(req)
    const body = await readBody(req)
    if (req.method === "POST") {
      const { page_id, date, title } = body
      if (!page_id || !date || !title) return send(res, 400, { success: false, error: "page_id/date/title required" })
      const { error } = await s.from("calendar_events").insert({ page_id, date, title })
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 201, { success: true })
    }
    if (req.method === "PUT") {
      const { id, date, title } = body
      if (!id) return send(res, 400, { success: false, error: "id required" })
      const { error } = await s.from("calendar_events").update({ date, title }).eq("id", id)
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true })
    }
    if (req.method === "DELETE") {
      const { id } = body
      if (!id) return send(res, 400, { success: false, error: "id required" })
      const { error } = await s.from("calendar_events").delete().eq("id", id)
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true })
    }
    return send(res, 405, { success: false, error: "Method not allowed" })
  },

  // -------- CONTACTS --------
  async contacts(req, res) {
    const s = supa()
    if (req.method === "GET") {
      const { pageId, limit = 100, offset = 0 } = req.query
      if (!pageId) return send(res, 400, { success: false, error: "pageId required" })
      const { data, error } = await s
        .from("wedding_contacts")
        .select("id,page_id,name,phone,relation,created_at")
        .eq("page_id", pageId)
        .order("created_at", { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1)
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true, data })
    }
    if (req.method === "POST") {
      const claims = requireAuth(req)
      const body = await readBody(req)
      const { page_id, name, phone, relation } = body
      if (!page_id || !name) return send(res, 400, { success: false, error: "page_id/name required" })
      const { error } = await s.from("wedding_contacts").insert({ page_id, name, phone, relation })
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 201, { success: true })
    }
    return send(res, 405, { success: false, error: "Method not allowed" })
  },

  // -------- PAGE SETTINGS --------
  async "page-settings"(req, res) {
    const s = supa()
    if (req.method === "GET") {
      const { pageId } = req.query
      if (!pageId) return send(res, 400, { success: false, error: "pageId required" })
      const { data, error } = await s
        .from("page_settings")
        .select("id,page_id,wedding_date,wedding_time,groom_name,bride_name,venue_name,venue_address,highlight_shape,highlight_color,highlight_text_color,updated_at")
        .eq("page_id", pageId)
        .single()
      if (error) return send(res, 404, { success: false, error: error.message })
      return send(res, 200, { success: true, data })
    }
    if (req.method === "PUT") {
      const claims = requireAuth(req)
      const body = await readBody(req)
      const { page_id, ...fields } = body
      if (!page_id) return send(res, 400, { success: false, error: "page_id required" })
      const { error } = await s.from("page_settings").upsert({ page_id, ...fields })
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true })
    }
    return send(res, 405, { success: false, error: "Method not allowed" })
  },

  // -------- MAP CONFIG (expose carefully) --------
  async "map-config"(req, res) {
    if (req.method !== "GET") return send(res, 405, { success: false, error: "Method not allowed" })
    // Ideally use domain-restricted public keys; or issue short-lived signed tokens from server.
    return send(res, 200, {
      success: true,
      googleMapsKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || null,
      naverMapsKey: process.env.NEXT_PUBLIC_NAVER_MAPS_KEY || null,
      tmapKey: process.env.NEXT_PUBLIC_TMAP_API_KEY || null,
    })
  },
}

// --------------------
// Entry
// --------------------
export default async function handler(req, res) {
  withCors(res)
  if (req.method === "OPTIONS") return res.status(200).end()

  try {
    const { resource, actionOrId } = parseRoute(req)
    const fn = handlers[resource] || handlers.ping
    return await fn(req, res, { actionOrId })
  } catch (e) {
    const status = e.status || 500
    return send(res, status, { success: false, error: e.message || "Internal error" })
  }
}

/*
ROUTING SUMMARY
GET  /api/ping
POST /api/auth/login {username,password}
POST /api/auth/register {username,password,page_id}
GET  /api/auth/me   (Bearer token)

GET  /api/users           (admin)
PUT  /api/users/:id       (admin)

GET  /api/images/getAllPages
GET  /api/images/byPage?pageId=xxx&limit=50&offset=0
POST /api/images            {page_id, public_url, display_order?} (auth)
PUT  /api/images/order      {updates:[{id,display_order}]}      (auth)
DELETE /api/images/:id      (auth)

GET  /api/rsvp?pageId=xxx&onlyAttending=true
POST /api/rsvp {page_id,name,relation_type,guest_count?,message?}

GET  /api/calendar?pageId=xxx&from=YYYY-MM-DD&to=YYYY-MM-DD&limit=50&offset=0
POST /api/calendar {page_id,date,title}        (auth)
PUT  /api/calendar  {id,date?,title?}          (auth)
DELETE /api/calendar {id}                      (auth)

GET  /api/contacts?pageId=xxx&limit=100&offset=0
POST /api/contacts {page_id,name,phone?,relation?} (auth)

GET  /api/page-settings?pageId=xxx
PUT  /api/page-settings {page_id, ...fields}       (auth)

GET  /api/map-config
*/
