const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

module.exports = async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { action, ...data } = req.body

    switch (action) {
      case 'insert':
        return await handleInsert(req, res, data)
      case 'getByPageId':
        return await handleGetByPageId(req, res, data)
      case 'delete':
        return await handleDelete(req, res, data)
      default:
        return res.status(400).json({ success: false, error: 'Invalid action' })
    }
  } catch (error) {
    console.error('Comments API error:', error)
    return res.status(500).json({ 
      success: false, 
      error: '서버 오류가 발생했습니다',
      details: error.message 
    })
  }
}

async function handleInsert(req, res, data) {
  const { name, password, comment, page_id } = data

  if (!name || !password || !comment || !page_id) {
    return res.status(400).json({ 
      success: false, 
      error: '필수 필드가 누락되었습니다' 
    })
  }

  try {
    const { data: result, error } = await supabase
      .from('comments_framer')
      .insert({
        name,
        password,
        comment,
        page_id,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Insert error:', error)
      return res.status(500).json({ 
        success: false, 
        error: '댓글 등록 중 오류가 발생했습니다' 
      })
    }

    return res.json({ 
      success: true, 
      message: '댓글이 등록되었습니다',
      data: result[0]
    })
  } catch (error) {
    console.error('Insert exception:', error)
    return res.status(500).json({ 
      success: false, 
      error: '댓글 등록 중 오류가 발생했습니다' 
    })
  }
}

async function handleGetByPageId(req, res, data) {
  const { pageId, page = 1, itemsPerPage = 5 } = data

  if (!pageId) {
    return res.status(400).json({ 
      success: false, 
      error: '페이지 ID가 필요합니다' 
    })
  }

  try {
    // 전체 개수 조회
    const { count, error: countError } = await supabase
      .from('comments_framer')
      .select('*', { count: 'exact', head: true })
      .eq('page_id', pageId)

    if (countError) {
      console.error('Count error:', countError)
      return res.status(500).json({ 
        success: false, 
        error: '댓글 개수 조회 중 오류가 발생했습니다' 
      })
    }

    // 페이지네이션된 댓글 조회
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    const { data: comments, error } = await supabase
      .from('comments_framer')
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Select error:', error)
      return res.status(500).json({ 
        success: false, 
        error: '댓글 조회 중 오류가 발생했습니다' 
      })
    }

    return res.json({ 
      success: true, 
      data: comments || [],
      count: count || 0,
      page,
      itemsPerPage
    })
  } catch (error) {
    console.error('GetByPageId exception:', error)
    return res.status(500).json({ 
      success: false, 
      error: '댓글 조회 중 오류가 발생했습니다' 
    })
  }
}

async function handleDelete(req, res, data) {
  const { id, password, page_id } = data

  if (!id || !password || !page_id) {
    return res.status(400).json({ 
      success: false, 
      error: '필수 필드가 누락되었습니다' 
    })
  }

  try {
    // 비밀번호 확인
    const { data: comment, error: selectError } = await supabase
      .from('comments_framer')
      .select('*')
      .eq('id', id)
      .eq('page_id', page_id)
      .single()

    if (selectError || !comment) {
      return res.status(404).json({ 
        success: false, 
        error: '댓글을 찾을 수 없습니다' 
      })
    }

    if (comment.password !== password) {
      return res.status(403).json({ 
        success: false, 
        error: '비밀번호가 일치하지 않습니다' 
      })
    }

    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from('comments_framer')
      .delete()
      .eq('id', id)
      .eq('page_id', page_id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return res.status(500).json({ 
        success: false, 
        error: '댓글 삭제 중 오류가 발생했습니다' 
      })
    }

    return res.json({ 
      success: true, 
      message: '댓글이 삭제되었습니다' 
    })
  } catch (error) {
    console.error('Delete exception:', error)
    return res.status(500).json({ 
      success: false, 
      error: '댓글 삭제 중 오류가 발생했습니다' 
    })
  }
}
