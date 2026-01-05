/**
 * Redeem 코드 관리 API
 * 
 * - 코드 일괄 생성 (page_id 난수 생성 포함)
 * - 코드 조회 및 검색
 * - 코드 사용 현황 추적
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 토큰 검증
function validateToken(token) {
  if (!token) return null
  try {
    const data = JSON.parse(Buffer.from(token, 'base64').toString())
    return Date.now() < data.expires ? data : null
  } catch {
    return null
  }
}

// 난수 page_id 생성
function generateRandomPageId(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Redeem 코드 생성
function generateRedeemCode(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 중복 체크 및 재시도
async function generateUniqueCodePair(maxRetries = 10, codeLength, pageIdLength) {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateRedeemCode(codeLength)
    const pageId = generateRandomPageId(pageIdLength)

    // 코드 중복 체크
    const { data: existingCode } = await supabase
      .from('naver_redeem_codes')
      .select('code')
      .eq('code', code)
      .single()

    if (existingCode) continue

    // page_id 중복 체크
    const { data: existingPageId } = await supabase
      .from('naver_redeem_codes')
      .select('page_id')
      .eq('page_id', pageId)
      .single()

    if (existingPageId) continue

    return { code, page_id: pageId }
  }

  throw new Error('고유한 코드 생성에 실패했습니다. 다시 시도해주세요.')
}

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 인증 확인
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '인증이 필요합니다.',
    })
  }

  const token = authHeader.substring(7)
  const validatedUser = validateToken(token)

  if (!validatedUser) {
    return res.status(401).json({
      success: false,
      error: '유효하지 않은 토큰입니다.',
    })
  }

  // 관리자 권한 확인
  if (validatedUser.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '관리자 권한이 필요합니다.',
    })
  }

  try {
    if (req.method === 'POST') {
      return await handleCreateCodes(req, res)
    } else if (req.method === 'GET') {
      return await handleGetCodes(req, res)
    } else if (req.method === 'PUT') {
      return await handleUpdateCode(req, res)
    } else if (req.method === 'DELETE') {
      return await handleDeleteCode(req, res)
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method Not Allowed',
      })
    }
  } catch (error) {
    console.error('Redeem codes API error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || '서버 오류가 발생했습니다.',
    })
  }
}

// 코드 일괄 생성
async function handleCreateCodes(req, res) {
  const { count, codeLength, pageIdLength, expiresAt } = req.body || {}

  if (!count || count < 1 || count > 50000) {
    return res.status(400).json({
      success: false,
      error: '생성 개수는 1개 이상 50,000개 이하여야 합니다.',
    })
  }

  const codes = []
  const batchSize = 100 // 한 번에 100개씩 삽입

  try {
    for (let i = 0; i < count; i += batchSize) {
      const batch = []
      const currentBatchSize = Math.min(batchSize, count - i)

      for (let j = 0; j < currentBatchSize; j++) {
        const pair = await generateUniqueCodePair(10, codeLength, pageIdLength)
        batch.push({
          code: pair.code,
          page_id: pair.page_id, // 활성화된 상태로 생성
          expires_at: expiresAt || null,
          created_at: new Date().toISOString(),
        })
      }

      const { error: insertError } = await supabase
        .from('naver_redeem_codes')
        .insert(batch)

      if (insertError) {
        console.error('Batch insert error:', insertError)
        throw new Error(`코드 생성 중 오류: ${insertError.message}`)
      }

      codes.push(...batch)
    }

    return res.status(200).json({
      success: true,
      data: codes,
      message: `${count}개의 코드가 성공적으로 생성되었습니다.`,
    })
  } catch (error) {
    console.error('Create codes error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || '코드 생성 중 오류가 발생했습니다.',
    })
  }
}

// 코드 조회 및 검색
async function handleGetCodes(req, res) {
  const { search, used, page = 1, limit = 50 } = req.query || {}

  try {
    let query = supabase.from('naver_redeem_codes').select('*', { count: 'exact' })

    // 검색어 필터
    if (search) {
      query = query.or(`code.ilike.%${search}%,page_id.ilike.%${search}%`)
    }

    // 사용 여부 필터
    if (used === 'true') {
      query = query.not('used_at', 'is', null)
    } else if (used === 'false') {
      query = query.is('used_at', null)
    }

    // 정렬 및 페이지네이션
    query = query.order('created_at', { ascending: false })
    const pageNum = parseInt(page) || 1
    const limitNum = Math.min(parseInt(limit) || 50, 1000)
    const offset = (pageNum - 1) * limitNum

    query = query.range(offset, offset + limitNum - 1)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    // 통계 계산
    const { count: totalCount } = await supabase
      .from('naver_redeem_codes')
      .select('*', { count: 'exact', head: true })

    const { count: unusedCount } = await supabase
      .from('naver_redeem_codes')
      .select('*', { count: 'exact', head: true })
      .is('used_at', null)

    const { count: usedCount } = await supabase
      .from('naver_redeem_codes')
      .select('*', { count: 'exact', head: true })
      .not('used_at', 'is', null)

    return res.status(200).json({
      success: true,
      data: data || [],
      total: totalCount || 0,
      unused: unusedCount || 0,
      used: usedCount || 0,
    })
  } catch (error) {
    console.error('Get codes error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || '코드 조회 중 오류가 발생했습니다.',
    })
  }
}

// 코드 업데이트 (만료일 설정)
async function handleUpdateCode(req, res) {
  const { code, expiresAt } = req.body || {}

  if (!code) {
    return res.status(400).json({
      success: false,
      error: '코드가 필요합니다.',
    })
  }

  try {
    const updateData = {}
    if (expiresAt !== undefined) {
      updateData.expires_at = expiresAt || null
    }

    const { error: updateError } = await supabase
      .from('naver_redeem_codes')
      .update(updateData)
      .eq('code', code)

    if (updateError) {
      throw updateError
    }

    return res.status(200).json({
      success: true,
      message: '코드가 성공적으로 업데이트되었습니다.',
    })
  } catch (error) {
    console.error('Update code error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || '코드 업데이트 중 오류가 발생했습니다.',
    })
  }
}

// 코드 삭제
async function handleDeleteCode(req, res) {
  const { code } = req.body || {}

  if (!code) {
    return res.status(400).json({
      success: false,
      error: '코드가 필요합니다.',
    })
  }

  try {
    // 사용된 코드는 삭제 불가
    const { data: existingCode, error: fetchError } = await supabase
      .from('naver_redeem_codes')
      .select('used_at')
      .eq('code', code)
      .single()

    if (fetchError) {
      throw fetchError
    }

    if (!existingCode) {
      return res.status(404).json({
        success: false,
        error: '코드를 찾을 수 없습니다.',
      })
    }

    if (existingCode.used_at) {
      return res.status(400).json({
        success: false,
        error: '이미 사용된 코드는 삭제할 수 없습니다.',
      })
    }

    const { error: deleteError } = await supabase
      .from('naver_redeem_codes')
      .delete()
      .eq('code', code)

    if (deleteError) {
      throw deleteError
    }

    return res.status(200).json({
      success: true,
      message: '코드가 성공적으로 삭제되었습니다.',
    })
  } catch (error) {
    console.error('Delete code error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || '코드 삭제 중 오류가 발생했습니다.',
    })
  }
}

