import { createClient } from '@supabase/supabase-js'

// single function multiplexer for Hobby plan limit
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false }, db: { schema: 'public' } }
)

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function validateToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString())
    return Date.now() < payload.expires ? payload : null
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  // safety: env required when hitting DB
  const needDb = req.url?.includes('/transport') || req.url?.includes('/comments')
  if (needDb && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)) {
    return res.status(500).json({ success: false, error: 'Server configuration error' })
  }

  const url = new URL(req.url, 'http://localhost')
  const pathname = url.pathname.replace(/^\/api\/?/, '') // e.g. 'transport'

  try {
    switch (pathname) {
      case 'transport':
        return await handleTransport(req, res, url)
      case 'map-config':
        return await handleMapConfig(req, res)
      case 'comments':
        return await handleComments(req, res)
      default:
        return res.status(404).json({ success: false, error: 'Not found' })
    }
  } catch (e) {
    console.error('Router error:', e)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

// transport handlers (GET, POST) using public.transport_infos
async function handleTransport(req, res, url) {
  if (req.method === 'GET') {
    const pageId = url.searchParams.get('pageId')
    if (!pageId) return res.status(200).json({ success: true, data: [] })
    const { data, error } = await supabase
      .from('transport_infos')
      .select('id, page_id, title, description, display_order, updated_at')
      .eq('page_id', pageId)
      .order('display_order', { ascending: true })
    if (error) throw error
    return res.status(200).json({ success: true, data: data || [] })
  }

  if (req.method === 'POST') {
    const authHeader = req.headers.authorization || ''
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: '인증 토큰이 필요합니다' })
    }
    const token = authHeader.substring(7)
    const user = validateToken(token)
    if (!user) return res.status(401).json({ success: false, error: '유효하지 않은 토큰입니다' })

    const { pageId, items } = req.body || {}
    if (!pageId || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'pageId와 items가 필요합니다' })
    }
    const { error: delError } = await supabase.from('transport_infos').delete().eq('page_id', pageId)
    if (delError) throw delError
    if (items.length > 0) {
      const now = new Date().toISOString()
      const rows = items.map((it, idx) => ({
        page_id: pageId,
        title: String(it.title ?? ''),
        description: String(it.description ?? ''),
        display_order: Number(it.display_order ?? idx + 1),
        updated_at: now,
      }))
      const { error: insError } = await supabase.from('transport_infos').insert(rows)
      if (insError) throw insError
    }
    return res.status(200).json({ success: true, message: '저장되었습니다' })
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

// map-config (GET)
async function handleMapConfig(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' })
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || ''
  const tmapApiKey = process.env.TMAP_API_KEY || ''
  const naverClientId = process.env.NAVER_CLIENT_ID || ''
  return res.json({ success: true, data: { googleMapsApiKey, tmapApiKey, naverClientId } })
}

// comments (POST with action)
async function handleComments(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' })
  const { action } = req.body || {}
  if (action === 'getByPageId') return handleGetComments(req, res)
  if (action === 'insert') return handleInsertComment(req, res)
  if (action === 'delete') return handleDeleteComment(req, res)
  return res.status(400).json({ success: false, error: 'Invalid action' })
}

async function handleGetComments(req, res) {
  const { pageId, page = 1, itemsPerPage = 5 } = req.body || {}
  if (!pageId) return res.status(400).json({ success: false, error: 'pageId is required' })
  const { count, error: countError } = await supabase
    .from('comments_framer')
    .select('id', { count: 'exact', head: true })
    .eq('page_id', pageId)
  if (countError) throw countError
  const p = Math.max(parseInt(page, 10) || 1, 1)
  const size = Math.max(parseInt(itemsPerPage, 10) || 5, 1)
  const from = (p - 1) * size
  const to = from + size - 1
  const { data, error } = await supabase
    .from('comments_framer')
    .select('*')
    .eq('page_id', pageId)
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) throw error
  return res.json({ success: true, data: data || [], count: count || 0 })
}

async function handleInsertComment(req, res) {
  const { name, password, comment, page_id } = req.body || {}
  if (!name || !password || !comment || !page_id) {
    return res.status(400).json({ success: false, error: 'name, password, comment, page_id are required' })
  }
  const { data, error } = await supabase
    .from('comments_framer')
    .insert({ page_id, name, comment, password })
    .select()
  if (error) throw error
  return res.json({ success: true, data: data && data[0] })
}

async function handleDeleteComment(req, res) {
  const { id, password, page_id } = req.body || {}
  if (!id || !password || !page_id) {
    return res.status(400).json({ success: false, error: 'id, password, page_id are required' })
  }
  const { data: rows, error: fetchError } = await supabase
    .from('comments_framer')
    .select('id, page_id, password')
    .eq('id', id)
    .eq('page_id', page_id)
    .limit(1)
  if (fetchError) throw fetchError
  if (!rows || rows.length === 0) return res.status(404).json({ success: false, error: '댓글을 찾을 수 없습니다' })
  const row = rows[0]
  if (row.password !== password) return res.status(403).json({ success: false, error: '비밀번호가 일치하지 않습니다' })
  const { error: delError } = await supabase.from('comments_framer').delete().eq('id', id).eq('page_id', page_id)
  if (delError) throw delError
  return res.json({ success: true })
}


