import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  // 디버깅: 요청 정보 로그
  console.log('Contacts API - Method:', req.method)
  console.log('Contacts API - URL:', req.url)
  console.log('Contacts API - Query:', req.query)
  console.log('Contacts API - Headers:', req.headers)

  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // GET 요청은 인증 없이 허용 (public read access)
  if (req.method !== 'GET') {
    // POST, PUT, DELETE는 인증 필요
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header')
      return res.status(401).json({ 
        success: false, 
        error: '인증 토큰이 필요합니다' 
      })
    }

    const token = authHeader.substring(7)
    const validatedUser = validateToken(token)
    
    if (!validatedUser) {
      console.log('Token validation failed')
      return res.status(401).json({ 
        success: false, 
        error: '유효하지 않은 토큰입니다' 
      })
    }
  }

  // 환경 변수 확인
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase environment variables')
    return res.status(500).json({
      success: false,
      error: 'Server configuration error'
    })
  }

  console.log('Supabase URL exists:', !!process.env.SUPABASE_URL)
  console.log('Supabase Service Key exists:', !!process.env.SUPABASE_SERVICE_KEY)

  try {
    switch (req.method) {
      case 'GET':
        console.log('Handling GET request')
        return await handleGetContacts(req, res)
      
      case 'POST':
        console.log('Handling POST request')
        return await handleCreateContact(req, res)
      
      case 'PUT':
        console.log('Handling PUT request')
        return await handleUpdateContact(req, res)
      
      case 'DELETE':
        console.log('Handling DELETE request')
        return await handleDeleteContact(req, res)
      
      default:
        console.log('Method not allowed:', req.method)
        return res.status(405).json({ 
          success: false, 
          error: 'Method not allowed' 
        })
    }
  } catch (error) {
    console.error('Contacts API Error:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}

async function handleGetContacts(req, res) {
  const { pageId } = req.query
  
  console.log('handleGetContacts - pageId:', pageId)

  try {
    let query = supabase
      .from('wedding_contacts')
      .select('*')
      .order('created_at', { ascending: false })

    // 특정 페이지 필터링
    if (pageId) {
      console.log('Filtering by pageId:', pageId)
      query = query.eq('page_id', pageId)
    }

    console.log('Executing Supabase query...')
    const { data, error } = await query

    if (error) {
      console.error('Supabase query error:', error)
      throw error
    }

    console.log('Query successful, data length:', data?.length || 0)
    console.log('Query result:', data)

    return res.json({ 
      success: true, 
      data: data || [] 
    })

  } catch (error) {
    console.error('Get contacts error:', error)
    return res.status(500).json({ 
      success: false, 
      error: '연락처 조회 중 오류가 발생했습니다' 
    })
  }
}

async function handleCreateContact(req, res) {
  const contactData = req.body

  // 필수 필드 검증
  if (!contactData.page_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'page_id는 필수입니다' 
    })
  }

  try {
    // 생성 시간 추가
    const dataToInsert = {
      ...contactData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('wedding_contacts')
      .insert([dataToInsert])
      .select()

    if (error) throw error

    return res.status(201).json({ 
      success: true, 
      data: data[0],
      message: '연락처가 생성되었습니다' 
    })

  } catch (error) {
    console.error('Create contact error:', error)
    return res.status(500).json({ 
      success: false, 
      error: '연락처 생성 중 오류가 발생했습니다' 
    })
  }
}

async function handleUpdateContact(req, res) {
  const { id, ...updateData } = req.body

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Contact ID가 필요합니다' 
    })
  }

  try {
    // 업데이트 시간 추가
    const dataToUpdate = {
      ...updateData,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('wedding_contacts')
      .update(dataToUpdate)
      .eq('id', id)
      .select()

    if (error) throw error

    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: '연락처를 찾을 수 없습니다' 
      })
    }

    return res.json({ 
      success: true, 
      data: data[0],
      message: '연락처가 업데이트되었습니다' 
    })

  } catch (error) {
    console.error('Update contact error:', error)
    return res.status(500).json({ 
      success: false, 
      error: '연락처 업데이트 중 오류가 발생했습니다' 
    })
  }
}

async function handleDeleteContact(req, res) {
  const { id } = req.body

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Contact ID가 필요합니다' 
    })
  }

  try {
    const { error } = await supabase
      .from('wedding_contacts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return res.json({ 
      success: true, 
      message: '연락처가 삭제되었습니다' 
    })

  } catch (error) {
    console.error('Delete contact error:', error)
    return res.status(500).json({ 
      success: false, 
      error: '연락처 삭제 중 오류가 발생했습니다' 
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
    
    // 추가 검증 로직
    if (!decoded.userId || !decoded.username) {
      return null
    }
    
    return decoded
  } catch (error) {
    console.error('Token validation error:', error)
    return null
  }
}