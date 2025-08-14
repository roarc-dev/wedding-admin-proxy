import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') return await handleGet(req, res)
    if (req.method === 'POST') return await handleSave(req, res)
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  } catch (error) {
    console.error('Transport API Error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

async function handleGet(req, res) {
  const { pageId } = req.query
  if (!pageId) return res.status(400).json({ success: false, error: 'pageId is required' })

  try {
    const { data, error } = await supabase
      .from('transport_infos')
      .select('id, title, description, display_order')
      .eq('page_id', pageId)
      .order('display_order', { ascending: true })

    if (error && error.code !== 'PGRST116') throw error
    return res.json({ success: true, data: data || [] })
  } catch (error) {
    if (error && (error.code === '42P01' || String(error.message || '').includes('transport_infos'))) {
      // 테이블이 없으면 기본값으로 응답
      return res.json({ success: true, data: [] })
    }
    console.error('Transport GET error:', error)
    return res.status(500).json({ success: false, error: '교통안내 조회 중 오류가 발생했습니다', message: error?.message })
  }
}

async function handleSave(req, res) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '인증 토큰이 필요합니다' })
  }
  const token = authHeader.substring(7)
  const validated = validateToken(token)
  if (!validated) return res.status(401).json({ success: false, error: '유효하지 않은 토큰입니다' })

  const body = req.body || {}
  const items = Array.isArray(body.items) ? body.items : []

  try {
    // 사용자에게 할당된 page_id 조회
    const { data: adminUser, error: adminErr } = await supabase
      .from('admin_users')
      .select('id, page_id')
      .eq('id', validated.userId)
      .single()

    if (adminErr) throw adminErr
    const pageId = adminUser?.page_id
    if (!pageId) return res.status(400).json({ success: false, error: '이 사용자에게 page_id가 부여되지 않았습니다' })

    // 기존 항목 제거 후 새 항목 일괄 삽입
    const { error: delErr } = await supabase
      .from('transport_infos')
      .delete()
      .eq('page_id', pageId)

    if (delErr) throw delErr

    if (items.length > 0) {
      const rows = items.map((it, idx) => ({
        page_id: pageId,
        title: String(it.title || ''),
        description: String(it.description || ''),
        display_order: Number(it.display_order ?? idx + 1),
        updated_at: new Date().toISOString(),
      }))

      const { data: insData, error: insErr } = await supabase
        .from('transport_infos')
        .insert(rows)
        .select('id, title, description, display_order')

      if (insErr) throw insErr
      return res.json({ success: true, data: insData })
    }

    return res.json({ success: true, data: [] })
  } catch (error) {
    console.error('Transport SAVE error:', error)
    if (error && (error.code === '42P01' || String(error.message || '').includes('transport_infos'))) {
      return res.status(400).json({
        success: false,
        error: '교통안내 저장 중 오류가 발생했습니다',
        message: 'transport_infos 테이블이 없습니다. 제공된 SQL을 적용해 주세요.',
        code: error.code || '42P01',
        requiresMigration: true
      })
    }
    return res.status(500).json({ success: false, error: '교통안내 저장 중 오류가 발생했습니다', message: error?.message, code: error?.code })
  }
}

function validateToken(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    if (Date.now() > decoded.expires) return null
    if (!decoded.userId || !decoded.username) return null
    return decoded
  } catch (e) {
    return null
  }
}

// SQL (Supabase에 적용)
// create table if not exists public.transport_infos (
//   id uuid primary key default gen_random_uuid(),
//   page_id text not null,
//   title text not null,
//   description text not null,
//   display_order integer not null default 1,
//   updated_at timestamptz default now()
// );
// create index if not exists transport_infos_page_order_idx on public.transport_infos(page_id, display_order);


