import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  // CORS 설정 (기존과 동일)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Prefer')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    // 디버깅: 요청 내용 로그
    console.log('Request body:', JSON.stringify(req.body, null, 2))
    
    const { action, pageId, showOnlyAttending, ...rsvpData } = req.body

    // action에 따라 분기 처리
    if (action === 'getByPageId') {
      console.log('getByPageId action detected, pageId:', pageId)
      
      if (!pageId) {
        console.log('Error: pageId is missing')
        return res.status(400).json({ success: false, error: '페이지 ID가 필요합니다' })
      }

      let query = supabase.from('rsvp_responses').select('*').eq('page_id', pageId)

      if (showOnlyAttending) {
        query = query.eq('relation_type', '참석')
      }
      
      console.log('Executing query for pageId:', pageId)
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase query error:', error)
        throw error
      }

      console.log('Query successful, data length:', data?.length || 0)
      return res.status(200).json({ success: true, data })

    } else {
      // 기존 RSVP 데이터 저장 로직
      console.log('RSVP data save action')
      const {
        guest_name,
        guest_type,
        relation_type,
        meal_time,
        guest_count,
        phone_number,
        consent_personal_info
      } = rsvpData

      if (!guest_name || !guest_type || !relation_type || !meal_time || !phone_number || !req.body.page_id) {
        return res.status(400).json({
          success: false,
          error: '필수 필드가 누락되었습니다'
        })
      }

      if (!consent_personal_info) {
        return res.status(400).json({
          success: false,
          error: '개인정보 수집 및 이용에 동의해주세요'
        })
      }

      const { data, error } = await supabase
        .from('rsvp_responses')
        .insert({ ...rsvpData, page_id: req.body.page_id, created_at: new Date().toISOString() })
        .select()

      if (error) {
        console.error('Supabase insert error:', error)
        throw error
      }

      return res.status(201).json({
        success: true,
        message: 'RSVP가 성공적으로 제출되었습니다',
        data: data[0]
      })
    }
  } catch (error) {
    console.error('RSVP API Error:', error)
    return res.status(500).json({
      success: false,
      error: 'RSVP 처리 중 오류가 발생했습니다'
    })
  }
} 