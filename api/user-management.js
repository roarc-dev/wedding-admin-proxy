const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 보안 토큰 생성 함수
function generateSecureToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    name: user.name,
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24시간
    signature: Buffer.from(`${user.id}-${Date.now()}-${Math.random()}`).toString('base64')
  }
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

// JWT 토큰 검증 함수
function validateToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString())
    return Date.now() < payload.expires ? payload : null
  } catch {
    return null
  }
}

// 인증이 필요한 요청인지 확인
function requiresAuth(method, action) {
  // 회원가입과 로그인은 인증 불필요
  if (method === 'POST' && (action === 'register' || action === 'signup' || action === 'login' || action === 'test')) {
    return false
  }
  return true
}

// 인증 확인 미들웨어
function checkAuth(req, res) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: { status: 401, message: '인증이 필요합니다' } }
  }

  const token = authHeader.substring(7)
  const tokenData = validateToken(token)
  if (!tokenData) {
    return { error: { status: 401, message: '유효하지 않은 토큰입니다' } }
  }

  return { tokenData }
}

module.exports = async function handler(req, res) {
  try {
    // CORS 헤더 설정
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
    res.setHeader('Cache-Control', 'no-store')

    if (req.method === "OPTIONS") {
      return res.status(200).end()
    }

    console.log('User Management API - Method:', req.method, 'Body:', req.body)

    // POST 요청 처리
    if (req.method === "POST") {
      return await handlePostRequest(req, res)
    }

    // GET 요청 처리 (사용자 목록 조회)
    if (req.method === "GET") {
      return await handleGetRequest(req, res)
    }

    // PUT 요청 처리 (사용자 정보 수정)
    if (req.method === "PUT") {
      return await handlePutRequest(req, res)
    }

    // DELETE 요청 처리 (사용자 삭제)
    if (req.method === "DELETE") {
      return await handleDeleteRequest(req, res)
    }

    return res.status(405).json({ success: false, error: "Method Not Allowed" })

  } catch (error) {
    console.error('User Management API Error:', error)
    return res.status(500).json({
      success: false,
      error: '서버 처리 중 오류가 발생했습니다',
      details: error.message
    })
  }
}

// POST 요청 처리 (action 기반 라우팅)
async function handlePostRequest(req, res) {
  let body = req.body

  // req.body가 없는 경우 요청을 파싱 (auth.js 호환성)
  if (!req.body) {
    let rawBody = ''
    req.on('data', chunk => {
      rawBody += chunk.toString()
    })
    await new Promise(resolve => {
      req.on('end', () => {
        try {
          body = JSON.parse(rawBody)
        } catch (e) {
          body = {}
        }
        resolve()
      })
    })
  }

  const { action } = body || {}

  switch (action) {
    case 'test':
      return handleTest(req, res, body)
    case 'register':
    case 'signup':
      return handleRegister(req, res, body)
    case 'login':
      return handleLogin(req, res, body)
    case 'createUser':
      return handleCreateUser(req, res, body)
    case 'approveUser':
      return handleApproveUser(req, res, body)
    default:
      // action이 없는 경우 기본 사용자 생성 (users.js 호환성)
      if (!action) {
        return handleCreateUser(req, res, body)
      }
      return res.status(400).json({ success: false, error: "Invalid action" })
  }
}

// GET 요청 처리 (사용자 목록 조회)
async function handleGetRequest(req, res) {
  const authResult = checkAuth(req, res)
  if (authResult.error) {
    return res.status(authResult.error.status).json({
      success: false,
      error: authResult.error.message
    })
  }

  const { data: users, error } = await supabase
    .from('admin_users')
    .select('id, username, name, is_active, created_at, last_login, updated_at, role, approval_status, page_id')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('사용자 목록 조회 오류:', error)
    return res.status(500).json({
      success: false,
      error: '사용자 목록을 불러오는데 실패했습니다'
    })
  }

  return res.status(200).json({
    success: true,
    data: users
  })
}

// PUT 요청 처리 (사용자 정보 수정)
async function handlePutRequest(req, res) {
  const authResult = checkAuth(req, res)
  if (authResult.error) {
    return res.status(authResult.error.status).json({
      success: false,
      error: authResult.error.message
    })
  }

  const { id, username: newUsername, name: newName, is_active, newPassword, page_id: newPageId } = req.body

  if (!id) {
    return res.status(400).json({
      success: false,
      error: '사용자 ID가 필요합니다'
    })
  }

  const updateData = {}
  if (newUsername) updateData.username = newUsername
  if (newName) updateData.name = newName
  if (typeof is_active === 'boolean') updateData.is_active = is_active
  if (newPageId !== undefined) updateData.page_id = newPageId
  if (newPassword) {
    updateData.password = await bcrypt.hash(newPassword, 10)
  }
  updateData.updated_at = new Date().toISOString()

  const { data: updatedUser, error } = await supabase
    .from('admin_users')
    .update(updateData)
    .eq('id', id)
    .select('id, username, name, is_active, updated_at, page_id, approval_status')
    .single()

  if (error) {
    console.error('사용자 수정 오류:', error)
    return res.status(500).json({
      success: false,
      error: '사용자 정보 수정 중 오류가 발생했습니다'
    })
  }

  return res.status(200).json({
    success: true,
    data: updatedUser,
    message: '사용자 정보가 성공적으로 수정되었습니다'
  })
}

// DELETE 요청 처리 (사용자 삭제)
async function handleDeleteRequest(req, res) {
  const authResult = checkAuth(req, res)
  if (authResult.error) {
    return res.status(authResult.error.status).json({
      success: false,
      error: authResult.error.message
    })
  }

  const { id } = req.body

  if (!id) {
    return res.status(400).json({
      success: false,
      error: '사용자 ID가 필요합니다'
    })
  }

  if (id === authResult.tokenData.userId) {
    return res.status(400).json({
      success: false,
      error: '자기 자신은 삭제할 수 없습니다'
    })
  }

  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('사용자 삭제 오류:', error)
    return res.status(500).json({
      success: false,
      error: '사용자 삭제 중 오류가 발생했습니다'
    })
  }

  return res.status(200).json({
    success: true,
    message: '사용자가 성공적으로 삭제되었습니다'
  })
}

// 테스트 액션
async function handleTest(req, res, body) {
  const { username, name } = body
  return res.status(200).json({
    success: true,
    message: 'Test successful!',
    data: { action: 'test', username, name }
  })
}

// 회원가입/등록 처리
async function handleRegister(req, res, body) {
  const { username, password, name, page_id, groomName, brideName } = body

  console.log('=== REGISTER REQUEST ===')
  console.log('Received data:', { username, name, groomName, brideName })

  if (!username || !password || !name || !groomName || !brideName) {
    return res.status(400).json({
      success: false,
      error: '사용자명, 비밀번호, 이름, 신랑 성함, 신부 성함을 모두 입력하세요'
    })
  }

  try {
    // 중복 사용자명 체크
    const { data: existingUser, error: checkError } = await supabase
      .from('admin_users')
      .select('username')
      .eq('username', username)
      .maybeSingle()

    if (checkError) {
      console.error('User check error:', checkError)
      return res.status(500).json({
        success: false,
        error: '사용자명 중복 확인 중 오류가 발생했습니다'
      })
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '이미 존재하는 사용자명입니다'
      })
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 10)

    // page_id가 없으면 UUID 생성
    const userPageId = page_id || crypto.randomUUID()

    const { data: newUser, error } = await supabase
      .from('admin_users')
      .insert([{
        username,
        password: passwordHash,
        name,
        is_active: false, // 승인 대기 상태
        role: 'admin',
        approval_status: 'pending',
        page_id: userPageId
      }])
      .select('id, username, name, is_active, role, approval_status, page_id')
      .single()

    if (error) {
      console.error('Register error:', error)
      return res.status(500).json({
        success: false,
        error: '회원가입 중 오류가 발생했습니다'
      })
    }

    // 사용자 생성 성공 후 invite_cards에 이름 정보 저장
    try {
      console.log('Starting invite_cards creation for page_id:', userPageId)
      console.log('Names to save - groomName:', groomName, 'brideName:', brideName)

      // invite_cards 테이블에 기본 데이터 생성
      const { data: inviteData, error: inviteError } = await supabase
        .from('invite_cards')
        .insert({
          page_id: userPageId,
          groom_name: groomName,
          bride_name: brideName,
          invitation_text: `${groomName} ♥ ${brideName}의 결혼을 축하드립니다.`,
          show_invitation_text: true
        })
        .select()
        .single()

      if (inviteError) {
        console.error('Invite cards insert error:', inviteError)
        console.error('Error code:', inviteError.code)
        console.error('Error message:', inviteError.message)
        console.error('Error details:', inviteError.details)

        // 중복 키 오류인 경우 업데이트 시도
        if (inviteError.code === '23505') {
          console.log('Duplicate key detected, trying update...')
          const { data: updateData, error: updateError } = await supabase
            .from('invite_cards')
            .update({
              groom_name: groomName,
              bride_name: brideName,
              invitation_text: `${groomName} ♥ ${brideName}의 결혼을 축하드립니다.`,
              updated_at: new Date().toISOString()
            })
            .eq('page_id', userPageId)
            .select()
            .single()

          if (updateError) {
            console.error('Update also failed:', updateError)
          } else {
            console.log('Update successful:', updateData)
          }
        }
      } else {
        console.log('Invite cards insert successful!')
        console.log('Result data:', inviteData)
        console.log('Final saved names - groom_name:', inviteData?.groom_name, 'bride_name:', inviteData?.bride_name)
      }
    } catch (inviteException) {
      console.error('Invite cards creation exception:', inviteException)
      console.error('Exception stack:', inviteException.stack)
    }

    return res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.',
      data: newUser
    })

  } catch (error) {
    console.error('Register exception:', error)
    return res.status(500).json({
      success: false,
      error: '회원가입 처리 중 오류가 발생했습니다'
    })
  }
}

// 로그인 처리
async function handleLogin(req, res, body) {
  const { username, password } = body

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: '아이디와 비밀번호를 입력하세요'
    })
  }

  try {
    // 사용자 조회
    const { data: user, error: fetchError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single()

    if (fetchError || !user) {
      return res.status(401).json({
        success: false,
        error: '아이디 또는 비밀번호가 잘못되었습니다'
      })
    }

    // 승인 상태 확인
    if (user.approval_status === 'pending') {
      return res.status(401).json({
        success: false,
        error: '계정이 아직 승인되지 않았습니다. 관리자에게 문의하세요.'
      })
    }

    if (user.approval_status === 'rejected') {
      return res.status(401).json({
        success: false,
        error: '계정이 거부되었습니다. 관리자에게 문의하세요.'
      })
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: '비활성화된 계정입니다.'
      })
    }

    // 비밀번호 검증
    let isValidPassword = false

    if (user.password) {
      // 해시된 비밀번호인지 평문인지 확인
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        // 이미 해시된 비밀번호
        isValidPassword = await bcrypt.compare(password, user.password)
      } else {
        // 평문 비밀번호 (기존 데이터)
        isValidPassword = password === user.password

        // 로그인 성공 시 해시로 업데이트
        if (isValidPassword) {
          const hashedPassword = await bcrypt.hash(password, 10)
          await supabase
            .from('admin_users')
            .update({ password: hashedPassword })
            .eq('id', user.id)
        }
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: '아이디 또는 비밀번호가 잘못되었습니다'
      })
    }

    // 로그인 시간 업데이트
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // 세션 토큰 생성
    const sessionToken = generateSecureToken({
      id: user.id,
      username: user.username,
      name: user.name
    })

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        page_id: user.page_id
      },
      token: sessionToken
    })

  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다'
    })
  }
}

// 새 사용자 생성 (관리자용)
async function handleCreateUser(req, res, body) {
  const authResult = checkAuth(req, res)
  if (authResult.error) {
    return res.status(authResult.error.status).json({
      success: false,
      error: authResult.error.message
    })
  }

  const { username, password, name, page_id } = body

  if (!username || !password || !name) {
    return res.status(400).json({
      success: false,
      error: '사용자명, 비밀번호, 이름을 모두 입력하세요'
    })
  }

  try {
    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 10)

    const { data: newUser, error } = await supabase
      .from('admin_users')
      .insert([{
        username,
        password: passwordHash,
        name,
        is_active: true,
        role: 'admin',
        approval_status: 'approved',
        page_id: page_id || null
      }])
      .select('id, username, name, is_active, created_at, role, approval_status, page_id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          error: '이미 존재하는 사용자명입니다'
        })
      }
      throw error
    }

    return res.status(201).json({
      success: true,
      data: newUser,
      message: '사용자가 성공적으로 추가되었습니다'
    })

  } catch (error) {
    console.error('Create user error:', error)
    return res.status(500).json({
      success: false,
      error: '사용자 생성 중 오류가 발생했습니다'
    })
  }
}

// 사용자 승인/거부 (관리자용)
async function handleApproveUser(req, res, body) {
  const authResult = checkAuth(req, res)
  if (authResult.error) {
    return res.status(authResult.error.status).json({
      success: false,
      error: authResult.error.message
    })
  }

  const { userId, status, pageId } = body

  if (!userId || !status) {
    return res.status(400).json({
      success: false,
      error: '사용자 ID와 승인 상태가 필요합니다'
    })
  }

  try {
    const updateData = {
      approval_status: status,
      updated_at: new Date().toISOString()
    }

    if (status === 'approved') {
      updateData.is_active = true
      if (pageId) {
        updateData.page_id = pageId
      }
    }

    const { data: updatedUser, error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', userId)
      .select('id, username, name, is_active, approval_status, page_id')
      .single()

    if (error) {
      console.error('Approve user error:', error)
      return res.status(500).json({
        success: false,
        error: '사용자 승인 처리 중 오류가 발생했습니다'
      })
    }

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: status === 'approved' ? '사용자가 승인되었습니다' : '사용자가 거부되었습니다'
    })

  } catch (error) {
    console.error('Approve user exception:', error)
    return res.status(500).json({
      success: false,
      error: '사용자 승인 처리 중 오류가 발생했습니다'
    })
  }
}

// Version: 2025-01-22 - Unified User Management API
