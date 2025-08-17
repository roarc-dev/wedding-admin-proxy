// Catch-all unified API router
// Replaces multiple API files with a single function to avoid Vercel function count limits
// Supports: auth, users, images, rsvp, calendar, contacts, page-settings, invite, comments, transport, map-config

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

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate")
}

function send(res, status, body, opts = {}) {
  if (opts.noStore) noStore(res)
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

function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (e) {
    return null
  }
}

function parseBase64Token(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"))
    if (Date.now() > decoded.expires) return null
    if (!decoded.userId || !decoded.username) return null
    // Map legacy fields → unified claims
    return {
      uid: decoded.userId,
      role: decoded.role || decoded.userRole || "user",
      pageId: decoded.pageId || decoded.page_id || null,
    }
  } catch (e) {
    return null
  }
}

function requireAuthFlexible(req) {
  const token = bearer(req)
  if (!token) throw Object.assign(new Error("Unauthorized"), { status: 401 })
  const jwtClaims = verifyJwt(token)
  if (jwtClaims) return jwtClaims
  const legacy = parseBase64Token(token)
  if (legacy) return legacy
  throw Object.assign(new Error("Invalid token"), { status: 401 })
}

function parseRoute(req) {
  try {
    const url = new URL(req.url, "http://localhost")
    const segs = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean)
    const [resource = "ping", actionOrId] = segs
    return { resource, actionOrId }
  } catch (e) {
    return { resource: "ping" }
  }
}

function effectiveAction(req, actionOrId) {
  const q = req.query || {}
  const body = req.body || {}
  return actionOrId || q.action || body.action || null
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
    const act = effectiveAction(req, actionOrId)

    if (req.method === "POST" && act === "login") {
      const { username, password } = body
      if (!username || !password) return send(res, 400, { success: false, error: "username/password required" })
      const { data: user, error } = await s
        .from("admin_users")
        .select("id, username, password_hash, role, page_id, approval_status")
        .eq("username", username)
        .single()
      if (error || !user) return send(res, 401, { success: false, error: "Invalid credentials" })
      const isValid = password === user.password_hash || password === user.password // legacy support
      if (!isValid) return send(res, 401, { success: false, error: "Invalid credentials" })
      if (user.approval_status && user.approval_status !== "approved") return send(res, 403, { success: false, error: "Pending approval" })
      const token = jwt.sign({ uid: user.id, role: user.role, pageId: user.page_id }, JWT_SECRET, { algorithm: "HS256", expiresIn: "45m" })
      return send(res, 200, { success: true, token, user: { id: user.id, username: user.username, role: user.role, page_id: user.page_id } })
    }

    if (req.method === "POST" && (act === "register" || act === "signup")) {
      const { username, password, page_id } = body
      if (!username || !password) return send(res, 400, { success: false, error: "username/password required" })
      const { data, error } = await s.from("admin_users").insert({ username, password_hash: password, page_id, approval_status: "pending" }).select("id").single()
      if (error) return send(res, 400, { success: false, error: error.message })
      return send(res, 201, { success: true, id: data.id })
    }

    if (req.method === "GET" && (act === "me" || !act)) {
      const claims = requireAuthFlexible(req)
      return send(res, 200, { success: true, user: claims })
    }

    return send(res, 404, { success: false, error: "Unknown auth action" })
  },

  // -------- USERS (admin) --------
  async users(req, res) {
    const claims = requireAuthFlexible(req)
    if (claims.role !== "admin") return send(res, 403, { success: false, error: "Forbidden" })
    const s = supa()
    if (req.method === "GET") {
      const { data, error } = await s.from("admin_users").select("id, username, role, approval_status, page_id, created_at").order("created_at", { ascending: false })
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true, data })
    }
    if (req.method === "PUT") {
      const body = await readBody(req)
      const { id, role, approval_status } = body
      if (!id) return send(res, 400, { success: false, error: "id required" })
      const { error } = await s.from("admin_users").update({ role, approval_status }).eq("id", id)
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true })
    }
    return send(res, 405, { success: false, error: "Method not allowed" })
  },

  // -------- IMAGES --------
  async images(req, res, { actionOrId }) {
    const s = supa()
    const q = req.query
    const act = effectiveAction(req, actionOrId)

    try {
      if (req.method === "GET") {
        noStore(res)
        if (act === "getAllPages") {
          const { data, error } = await s.from("images").select("page_id")
          if (error) return send(res, 500, { success: false, error: error.message })
          const uniquePages = [...new Set((data || []).map(r => r.page_id))]
          const pagesWithCount = await Promise.all(uniquePages.map(async pageId => {
            const { data: images } = await s.from("images").select("id").eq("page_id", pageId)
            return { page_id: pageId, image_count: images?.length || 0 }
          }))
          return send(res, 200, { success: true, data: pagesWithCount })
        }
        if ((act === "getByPageId" || act === "byPage") && q.pageId) {
          const { data, error } = await s
            .from("images")
            .select("*")
            .eq("page_id", q.pageId)
            .order("display_order", { ascending: true })
          if (error) return send(res, 500, { success: false, error: error.message })
          const versionTs = Date.now()
          const versioned = (data || []).map(row => {
            const url = row.public_url || ""
            if (!url) return row
            const sep = url.includes("?") ? "&" : "?"
            return { ...row, public_url: `${url}${sep}v=${versionTs}` }
          })
          return send(res, 200, { success: true, data: versioned }, { noStore: true })
        }
        return send(res, 400, { success: false, error: "Invalid query parameters" })
      }

      // Mutations require auth
      const claims = requireAuthFlexible(req)
      const body = await readBody(req)

      if (req.method === "POST") {
        if (act === "getPresignedUrl") {
          const { fileName, pageId } = body
          if (!fileName || !pageId) return send(res, 400, { success: false, error: "fileName/pageId required" })
          const timestamp = Date.now()
          const randomStr = Math.random().toString(36).substring(2)
          const ext = (fileName.split(".").pop() || "jpg").toLowerCase()
          const uniqueFileName = `${pageId}/${timestamp}_${randomStr}.${ext}`
          const { data, error } = await s.storage.from("images").createSignedUploadUrl(uniqueFileName, 60)
          if (error) return send(res, 500, { success: false, error: error.message })
          return send(res, 200, { success: true, signedUrl: data.signedUrl, path: uniqueFileName, originalName: fileName })
        }
        if (act === "saveMeta") {
          const { pageId, fileName, displayOrder, storagePath, fileSize } = body
          if (!pageId || !fileName || !storagePath) return send(res, 400, { success: false, error: "missing params" })
          const { data: pub } = s.storage.from("images").getPublicUrl(storagePath)
          const { data, error } = await s.from("images").insert({
            page_id: pageId,
            filename: storagePath,
            original_name: fileName,
            file_size: fileSize || 0,
            mime_type: "image/jpeg",
            public_url: pub.publicUrl,
            display_order: displayOrder,
          }).select().single()
          if (error) return send(res, 500, { success: false, error: error.message })
          return send(res, 200, { success: true, data })
        }
        if (act === "upload") {
          const { pageId, fileData, originalName, fileSize, displayOrder } = body
          const matches = (fileData || "").match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
          if (!matches || matches.length !== 3) return send(res, 400, { success: false, error: "Invalid file data format" })
          const mimeType = matches[1]
          const base64Data = matches[2]
          const buffer = Buffer.from(base64Data, "base64")
          const fileName = `${pageId}/${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`
          const { error: uploadError } = await s.storage.from("images").upload(fileName, buffer, { contentType: mimeType, cacheControl: "3600" })
          if (uploadError) return send(res, 500, { success: false, error: uploadError.message })
          const { data: pub } = s.storage.from("images").getPublicUrl(fileName)
          const { error } = await s.from("images").insert({ page_id: pageId, filename: fileName, original_name: originalName, file_size: fileSize, mime_type: mimeType, public_url: pub.publicUrl, display_order: displayOrder })
          if (error) return send(res, 500, { success: false, error: error.message })
          return send(res, 201, { success: true })
        }
        // Fallback simple insert
        const { page_id, public_url, display_order = 9999 } = body
        if (!page_id || !public_url) return send(res, 400, { success: false, error: "page_id/public_url required" })
        const { data, error } = await s.from("images").insert({ page_id, public_url, display_order }).select("id").single()
        if (error) return send(res, 500, { success: false, error: error.message })
        return send(res, 201, { success: true, id: data.id })
      }

      if (req.method === "PUT") {
        if (act === "order" || act === "updateAllOrders") {
          const body = await readBody(req)
          const { updates, pageId, imageOrders } = body
          if (Array.isArray(updates)) {
            const { error } = await s.from("images").upsert(updates.map(u => ({ id: u.id, display_order: u.display_order })))
            if (error) return send(res, 500, { success: false, error: error.message })
            return send(res, 200, { success: true })
          }
          if (Array.isArray(imageOrders) && pageId) {
            const results = await Promise.all(imageOrders.map(async ({ id, order }) => {
              const { error } = await s.from("images").update({ display_order: order }).eq("id", id).eq("page_id", pageId)
              return { id, error }
            }))
            const errors = results.filter(r => r.error)
            if (errors.length) return send(res, 500, { success: false, error: `${errors.length} updates failed` })
            return send(res, 200, { success: true })
          }
          return send(res, 400, { success: false, error: "updates[] or imageOrders[] required" })
        }
        return send(res, 405, { success: false, error: "Method not allowed" })
      }

      if (req.method === "DELETE") {
        const body = await readBody(req)
        const { imageId, fileName, storageOnly } = body
        if (!fileName && !actionOrId) return send(res, 400, { success: false, error: "fileName or id required" })
        if (fileName) {
          await s.storage.from("images").remove([fileName])
          if (!storageOnly && imageId) await s.from("images").delete().eq("id", imageId)
          return send(res, 200, { success: true })
        }
        const { error } = await s.from("images").delete().eq("id", actionOrId)
        if (error) return send(res, 500, { success: false, error: error.message })
        return send(res, 200, { success: true })
      }

      return send(res, 405, { success: false, error: "Method not allowed" })
    } catch (e) {
      return send(res, e.status || 500, { success: false, error: e.message || "Internal error" })
    }
  },

  // -------- RSVP --------
  async rsvp(req, res) {
    const s = supa()
    if (req.method === "GET") {
      noStore(res)
      const { pageId, onlyAttending } = req.query
      if (!pageId) return send(res, 400, { success: false, error: "pageId required" })
      let q = s.from("rsvp_responses").select("id,page_id,name,relation_type,guest_count,message,created_at").eq("page_id", pageId)
      if (String(onlyAttending) === "true") q = q.eq("relation_type", "참석")
      const { data, error } = await q.order("created_at", { ascending: false })
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true, data }, { noStore: true })
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
      noStore(res)
      const { pageId, from, to, limit = 50, offset = 0 } = req.query
      if (!pageId) return send(res, 400, { success: false, error: "pageId required" })
      let q = s.from("calendar_events").select("id,page_id,date,title,created_at").eq("page_id", pageId)
      if (from) q = q.gte("date", from)
      if (to) q = q.lte("date", to)
      const { data, error } = await q.order("date", { ascending: true }).range(Number(offset), Number(offset) + Number(limit) - 1)
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true, data }, { noStore: true })
    }
    const claims = requireAuthFlexible(req)
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
      noStore(res)
      const { pageId, limit = 100, offset = 0 } = req.query
      if (!pageId) return send(res, 400, { success: false, error: "pageId required" })
      const { data, error } = await s
        .from("wedding_contacts")
        .select("id,page_id,name,phone,relation,created_at")
        .eq("page_id", pageId)
        .order("created_at", { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1)
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true, data }, { noStore: true })
    }
    if (req.method === "POST") {
      const claims = requireAuthFlexible(req)
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
      noStore(res)
      const { pageId } = req.query
      if (!pageId) return send(res, 400, { success: false, error: "pageId required" })
      const { data, error } = await s
        .from("page_settings")
        .select("*")
        .eq("page_id", pageId)
        .single()
      if (error && error.code !== "PGRST116") return send(res, 404, { success: false, error: error.message })
      const settings = data || null
      // Derive public image URL + cache buster
      if (settings) {
        const direct = settings.photo_section_image_url || null
        const fromPath = settings.photo_section_image_path
          ? `${SUPABASE_URL}/storage/v1/object/public/images/${settings.photo_section_image_path}`
          : null
        const base = direct || fromPath
        if (base) {
          const sep = base.includes("?") ? "&" : "?"
          const cacheKey = settings.updated_at ? new Date(settings.updated_at).getTime() : Date.now()
          settings.photo_section_image_public_url = `${base}${sep}v=${cacheKey}`
        }
      }
      return send(res, 200, { success: true, data: settings }, { noStore: true })
    }
    if (req.method === "PUT" || req.method === "POST") {
      const claims = requireAuthFlexible(req)
      const body = await readBody(req)
      const pageId = claims.pageId || body.page_id
      if (!pageId) return send(res, 400, { success: false, error: "page_id not assigned for this user" })
      const allowedKeys = [
        "wedding_date", "wedding_time",
        "groom_name", "bride_name",
        "venue_name", "venue_address",
        "highlight_shape", "highlight_color", "highlight_text_color",
        // photo section
        "photo_section_image_url", "photo_section_image_path", "photo_section_locale",
        "overlay_text_color", "overlay_text_position"
      ]
      const sanitized = Object.fromEntries(Object.entries(body || {}).filter(([k]) => allowedKeys.includes(k)))
      const payload = { page_id: pageId, ...sanitized, updated_at: new Date().toISOString() }
      const { data, error } = await s.from("page_settings").upsert(payload, { onConflict: "page_id" }).select().single()
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true, data })
    }
    return send(res, 405, { success: false, error: "Method not allowed" })
  },

  // -------- INVITE (invite_cards) --------
  async invite(req, res) {
    const s = supa()
    if (req.method === "GET") {
      noStore(res)
      const { pageId } = req.query
      if (!pageId) return send(res, 400, { success: false, error: "pageId is required" })
      const { data, error } = await s.from("invite_cards").select("*").eq("page_id", pageId).single()
      if (error && error.code !== "PGRST116") return send(res, 500, { success: false, error: error.message })
      const defaults = {
        page_id: pageId,
        invitation_text: '저희 두 사람이 하나 되는 약속의 시간에\n마음을 담아 소중한 분들을 모십니다.\n\n귀한 걸음으로 축복해 주시면 감사하겠습니다.',
        groom_father_name: '', groom_mother_name: '', groom_name: '',
        bride_father_name: '', bride_mother_name: '', bride_name: '',
        show_groom_father_chrysanthemum: false,
        show_groom_mother_chrysanthemum: false,
        show_bride_father_chrysanthemum: false,
        show_bride_mother_chrysanthemum: false,
        son_label: '아들', daughter_label: '딸',
      }
      return send(res, 200, { success: true, data: data || defaults }, { noStore: true })
    }
    if (req.method === "POST") {
      const claims = requireAuthFlexible(req)
      const s = supa()
      const body = await readBody(req)
      const pageId = claims.pageId
      if (!pageId) return send(res, 400, { success: false, error: 'page_id not assigned' })
      const allowedKeys = [
        'invitation_text',
        'groom_father_name', 'groom_mother_name', 'groom_name',
        'bride_father_name', 'bride_mother_name', 'bride_name',
        'show_groom_father_chrysanthemum', 'show_groom_mother_chrysanthemum',
        'show_bride_father_chrysanthemum', 'show_bride_mother_chrysanthemum',
        'son_label', 'daughter_label',
      ]
      const sanitized = Object.fromEntries(Object.entries(body.invite || body || {}).filter(([k]) => allowedKeys.includes(k)))
      const { data, error } = await s.from('invite_cards').upsert({ page_id: pageId, ...sanitized, updated_at: new Date().toISOString() }, { onConflict: 'page_id' }).select().single()
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true, data })
    }
    return send(res, 405, { success: false, error: "Method not allowed" })
  },

  // -------- COMMENTS (comments_framer) --------
  async comments(req, res) {
    const s = supa()
    if (req.method === "GET") {
      noStore(res)
      const { pageId, limit = 50, offset = 0 } = req.query
      if (!pageId) return send(res, 400, { success: false, error: "pageId required" })
      const { data, error } = await s
        .from('comments_framer')
        .select('id,page_id,author,password,content,created_at')
        .eq('page_id', pageId)
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1)
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true, data }, { noStore: true })
    }
    if (req.method === "POST") {
      const body = await readBody(req)
      const { page_id, author, password, content } = body
      if (!page_id || !author || !password || !content) return send(res, 400, { success: false, error: 'missing fields' })
      const { error } = await s.from('comments_framer').insert({ page_id, author, password, content })
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 201, { success: true })
    }
    return send(res, 405, { success: false, error: "Method not allowed" })
  },

  // -------- TRANSPORT (transport_infos) --------
  async transport(req, res) {
    const s = supa()
    if (req.method === "GET") {
      noStore(res)
      const { pageId } = req.query
      if (!pageId) return send(res, 400, { success: false, error: 'pageId required' })
      const { data, error } = await s
        .from('transport_infos')
        .select('id,page_id,label,detail,display_order,created_at')
        .eq('page_id', pageId)
        .order('display_order', { ascending: true })
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true, data }, { noStore: true })
    }
    if (req.method === "PUT" || req.method === "POST") {
      const claims = requireAuthFlexible(req)
      const pageId = claims.pageId
      if (!pageId) return send(res, 400, { success: false, error: 'page_id not assigned' })
      const body = await readBody(req)
      const { items } = body // [{id?,label,detail,display_order}]
      if (!Array.isArray(items)) return send(res, 400, { success: false, error: 'items[] required' })
      // Upsert by id or create
      const upserts = items.map(it => ({ id: it.id, page_id: pageId, label: it.label, detail: it.detail, display_order: it.display_order }))
      const { error } = await s.from('transport_infos').upsert(upserts)
      if (error) return send(res, 500, { success: false, error: error.message })
      return send(res, 200, { success: true })
    }
    return send(res, 405, { success: false, error: "Method not allowed" })
  },

  // -------- MAP CONFIG --------
  async "map-config"(req, res) {
    if (req.method !== "GET") return send(res, 405, { success: false, error: "Method not allowed" })
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
PUT  /api/users           {id,role?,approval_status?} (admin)

GET  /api/images/getAllPages
GET  /api/images/byPage?pageId=xxx
GET  /api/images?action=getByPageId&pageId=xxx
POST /api/images            {page_id, public_url, display_order?} (auth)
POST /api/images?action=getPresignedUrl {fileName,pageId}
POST /api/images?action=saveMeta {pageId,fileName,storagePath,displayOrder?,fileSize?}
POST /api/images?action=upload {pageId,fileData,originalName,fileSize?,displayOrder?}
PUT  /api/images/order      {updates:[{id,display_order}]}
PUT  /api/images/updateAllOrders {pageId,imageOrders:[{id,order}]}
DELETE /api/images          {imageId?,fileName?,storageOnly?}

GET  /api/rsvp?pageId=xxx&onlyAttending=true
POST /api/rsvp {page_id,name,relation_type,guest_count?,message?}

GET  /api/calendar?pageId=xxx&from=YYYY-MM-DD&to=YYYY-MM-DD&limit=50&offset=0
POST /api/calendar {page_id,date,title}        (auth)
PUT  /api/calendar  {id,date?,title?}          (auth)
DELETE /api/calendar {id}                      (auth)

GET  /api/contacts?pageId=xxx&limit=100&offset=0
POST /api/contacts {page_id,name,phone?,relation?} (auth)

GET  /api/page-settings?pageId=xxx
PUT  /api/page-settings {...fields}       (auth; page_id from claims)

GET  /api/invite?pageId=xxx
POST /api/invite {invite:{...}}

GET  /api/comments?pageId=xxx&limit=50&offset=0
POST /api/comments {page_id,author,password,content}

GET  /api/transport?pageId=xxx
PUT  /api/transport {items:[{id?,label,detail,display_order}]}

GET  /api/map-config
*/


