import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 공개 조회는 인증 건너뛰기
  const isPublicRequest = req.method === 'GET'

  let validatedUser = null

  if (!isPublicRequest) {
    // 관리자 기능은 토큰 검증 필요
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: '인증 토큰이 필요합니다' 
      })
    }

    const token = authHeader.substring(7)
    validatedUser = validateToken(token)
    
    if (!validatedUser) {
      return res.status(401).json({ 
        success: false, 
        error: '유효하지 않은 토큰입니다' 
      })
    }
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetCalendar(req, res)
      
      case 'POST':
        return await handleCreateCalendarEvent(req, res)
      
      case 'DELETE':
        return await handleDeleteCalendarEvent(req, res)
      
      default:
        return res.status(405).json({ 
          success: false, 
          error: 'Method not allowed' 
        })
    }
  } catch (error) {
    console.error('Calendar API Error:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}

async function handleGetCalendar(req, res) {
  const { pageId } = req.query

  if (!pageId) {
    return res.status(400).json({
      success: false,
      error: 'pageId is required'
    })
  }

  try {
    const { data, error } = await supabase
      .from('wedding_calendar')
      .select('*')
      .eq('page_id', pageId)
      .order('date', { ascending: true })

    if (error) throw error

    return res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Get calendar error:', error)
    return res.status(500).json({
      success: false,
      error: '캘린더 조회 중 오류가 발생했습니다'
    })
  }
}

async function handleCreateCalendarEvent(req, res) {
  const { pageId, date, title } = req.body

  if (!pageId || !date) {
    return res.status(400).json({
      success: false,
      error: 'pageId and date are required'
    })
  }

  try {
    const { data, error } = await supabase
      .from('wedding_calendar')
      .insert({
        page_id: pageId,
        date,
        title: title || 'Event',
      })
      .select()
      .single()

    if (error) throw error

    return res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Create calendar event error:', error)
    return res.status(500).json({
      success: false,
      error: '캘린더 이벤트 생성 중 오류가 발생했습니다'
    })
  }
}

async function handleDeleteCalendarEvent(req, res) {
  const { eventId } = req.body

  if (!eventId) {
    return res.status(400).json({
      success: false,
      error: 'eventId is required'
    })
  }

  try {
    const { error } = await supabase
      .from('wedding_calendar')
      .delete()
      .eq('id', eventId)

    if (error) throw error

    return res.json({
      success: true,
      message: '캘린더 이벤트가 삭제되었습니다'
    })
  } catch (error) {
    console.error('Delete calendar event error:', error)
    return res.status(500).json({
      success: false,
      error: '캘린더 이벤트 삭제 중 오류가 발생했습니다'
    })
  }
}

function validateToken(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    
    // 토큰 만료 확인
    if (Date.now() > decoded.expires) {
      return null
    }
    
    // 추가 검증 로직 (필요시)
    if (!decoded.userId || !decoded.username) {
      return null
    }
    
    return decoded
  } catch (error) {
    console.error('Token validation error:', error)
    return null
  }
} 