import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  // CORS & no-cache
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { action } = req.body || {}

    switch (action) {
      case 'getByPageId':
        return await handleGetByPageId(req, res)
      case 'insert':
        return await handleInsert(req, res)
      case 'delete':
        return await handleDelete(req, res)
      default:
        return res.status(400).json({ success: false, error: 'Invalid action' })
    }
  } catch (error) {
    console.error('Comments API Error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

async function handleGetByPageId(req, res) {
  const { pageId, page = 1, itemsPerPage = 5 } = req.body || {}
  if (!pageId) {
    return res.status(400).json({ success: false, error: 'pageId is required' })
  }

  try {
    // total count (가벼운 컬럼으로 카운트)
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
  } catch (error) {
    console.error('Get comments error:', error)
    // 테이블이 없는 경우(42P01)는 빈 목록으로 응답
    if (error && (error.code === '42P01' || error.message?.includes('relation "comments" does not exist'))) {
      return res.json({ success: true, data: [], count: 0 })
    }
    return res.status(500).json({ 
      success: false, 
      error: '댓글 조회 중 오류가 발생했습니다',
      message: error?.message,
      code: error?.code,
      details: error?.details
    })
  }
}

async function handleInsert(req, res) {
  const { name, password, comment, page_id } = req.body || {}
  if (!name || !password || !comment || !page_id) {
    return res.status(400).json({ success: false, error: 'name, password, comment, page_id are required' })
  }

  try {
    // comments_framer 스키마에 맞춰 평문 패스워드 저장
    const { data, error } = await supabase
      .from('comments_framer')
      .insert({
        page_id,
        name,
        comment,
        password,
      })
      .select()

    if (error) throw error

    return res.json({ success: true, data: data && data[0] })
  } catch (error) {
    console.error('Insert comment error:', error)
    return res.status(500).json({ 
      success: false, 
      error: '댓글 등록 중 오류가 발생했습니다',
      message: error?.message,
      code: error?.code,
      details: error?.details
    })
  }
}

async function handleDelete(req, res) {
  const { id, password, page_id } = req.body || {}
  if (!id || !password || !page_id) {
    return res.status(400).json({ success: false, error: 'id, password, page_id are required' })
  }

  try {
    // 기존 댓글 조회 (평문 비밀번호)
    const { data: rows, error: fetchError } = await supabase
      .from('comments_framer')
      .select('id, page_id, password')
      .eq('id', id)
      .eq('page_id', page_id)
      .limit(1)

    if (fetchError) throw fetchError
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: '댓글을 찾을 수 없습니다' })
    }

    const row = rows[0]
    if (row.password !== password) {
      return res.status(403).json({ success: false, error: '비밀번호가 일치하지 않습니다' })
    }

    const { error: deleteError } = await supabase
      .from('comments_framer')
      .delete()
      .eq('id', id)
      .eq('page_id', page_id)

    if (deleteError) throw deleteError

    return res.json({ success: true })
  } catch (error) {
    console.error('Delete comment error:', error)
    return res.status(500).json({ 
      success: false, 
      error: '댓글 삭제 중 오류가 발생했습니다',
      message: error?.message,
      code: error?.code,
      details: error?.details
    })
  }
}

// 필요한 테이블 스키마 (참고용)
// CREATE TABLE IF NOT EXISTS public.comments (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   page_id text NOT NULL,
//   name text NOT NULL,
//   comment text NOT NULL,
//   password_salt text,
//   password_hash text,
//   created_at timestamptz NOT NULL DEFAULT now()
// );
// CREATE INDEX IF NOT EXISTS comments_page_id_idx ON public.comments(page_id);

