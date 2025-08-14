import { createClient } from '@supabase/supabase-js'

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
    global: { headers: { 'x-client-info': 'wedding-admin-proxy/transport' } },
  }
)

function validateToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString())
    return Date.now() < payload.expires ? payload : null
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Env check
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ success: false, error: 'Server configuration error' })
  }

  try {
    if (req.method === 'GET') {
      const { pageId } = req.query
      if (!pageId) {
        // 페이지 지정 없으면 빈 배열
        return res.status(200).json({ success: true, data: [] })
      }

      const { data, error } = await supabase
        .from('transport_infos')
        .select('id, page_id, title, description, display_order, created_at, updated_at')
        .eq('page_id', pageId)
        .order('display_order', { ascending: true })

      if (error) throw error
      return res.status(200).json({ success: true, data: data || [] })
    }

    if (req.method === 'POST') {
      // auth
      const authHeader = req.headers.authorization || ''
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: '인증 토큰이 필요합니다' })
      }
      const token = authHeader.substring(7)
      const user = validateToken(token)
      if (!user) {
        return res.status(401).json({ success: false, error: '유효하지 않은 토큰입니다' })
      }

      const { pageId, items } = req.body || {}
      if (!pageId || !Array.isArray(items)) {
        return res.status(400).json({ success: false, error: 'pageId와 items가 필요합니다' })
      }

      // 트랜잭션 대용: 삭제 후 일괄 삽입
      const { error: delError } = await supabase
        .from('transport_infos')
        .delete()
        .eq('page_id', pageId)
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
        const { error: insError } = await supabase
          .from('transport_infos')
          .insert(rows)
        if (insError) throw insError
      }

      return res.status(200).json({ success: true, message: '저장되었습니다' })
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' })
  } catch (e) {
    console.error('Transport API Error:', e)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}


