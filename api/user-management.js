const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// RSVP 전용 R2 클라이언트 (HTML 정적 페이지 업로드/삭제)
const rsvpR2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT_RSVP,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID_RSVP,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY_RSVP,
  },
})

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
    case 'loginGeneral':
      return handleGeneralLogin(req, res, body)
    case 'createUser':
      return handleCreateUser(req, res, body)
    case 'approveUser':
      return handleApproveUser(req, res, body)
    case 'generateRSVPHTML':
      return handleGenerateRSVPHTML(req, res, body)
    case 'deleteRSVPHTML':
      return handleDeleteRSVPHTML(req, res, body)
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
    .select('id, username, name, is_active, created_at, last_login, updated_at, role, approval_status, page_id, expiry_date, wedding_date, groom_name_en, bride_name_en')
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

  const { id, username: newUsername, name: newName, is_active, newPassword, page_id: newPageId, expiry_date, role } = req.body

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
  if (expiry_date !== undefined) updateData.expiry_date = expiry_date || null
  if (role) updateData.role = role
  if (newPassword) {
    updateData.password = await bcrypt.hash(newPassword, 10)
  }
  updateData.updated_at = new Date().toISOString()

  const { data: updatedUser, error } = await supabase
    .from('admin_users')
    .update(updateData)
    .eq('id', id)
    .select('id, username, name, is_active, updated_at, page_id, approval_status, expiry_date, role')
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

  const { id, deleteAllData } = req.body

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

  try {
    // 완전 삭제 옵션이 활성화된 경우
    if (deleteAllData) {
      // 1. 사용자 정보 조회 (page_id 가져오기)
      const { data: user, error: userError } = await supabase
        .from('admin_users')
        .select('page_id')
        .eq('id', id)
        .single()

      if (userError || !user) {
        return res.status(404).json({
          success: false,
          error: '사용자를 찾을 수 없습니다'
        })
      }

      const pageId = user.page_id

      if (pageId) {
        console.log(`[DELETE] 페이지 ID "${pageId}"의 모든 데이터를 삭제합니다...`)

        // 2. R2에서 images/{page_id}/ 폴더 전체 삭제
        try {
          const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3')
          const r2Client = new S3Client({
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT,
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.R2_ACCESS_KEY_ID,
              secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            },
          })

          // R2에서 images/{page_id}/ 경로의 모든 객체 조회
          const r2Prefix = `images/${pageId}/`
          console.log(`[DELETE] R2 폴더 조회: ${r2Prefix}`)

          const listCommand = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET,
            Prefix: r2Prefix,
          })

          const listResponse = await r2Client.send(listCommand)

          if (listResponse.Contents && listResponse.Contents.length > 0) {
            console.log(`[DELETE] R2에서 ${listResponse.Contents.length}개의 객체를 찾았습니다`)

            // 최대 1000개까지 한 번에 삭제 가능
            const objectsToDelete = listResponse.Contents.map(obj => ({ Key: obj.Key }))

            const deleteCommand = new DeleteObjectsCommand({
              Bucket: process.env.R2_BUCKET,
              Delete: {
                Objects: objectsToDelete,
                Quiet: false,
              },
            })

            const deleteResponse = await r2Client.send(deleteCommand)
            console.log(`[DELETE] R2 폴더 삭제 완료: ${r2Prefix}`, {
              deleted: deleteResponse.Deleted?.length || 0,
              errors: deleteResponse.Errors?.length || 0,
            })

            if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
              console.warn(`[DELETE] R2 일부 파일 삭제 실패:`, deleteResponse.Errors)
            }
          } else {
            console.log(`[DELETE] R2 폴더에 객체가 없습니다: ${r2Prefix}`)
          }
        } catch (r2Error) {
          console.error(`[DELETE] R2 폴더 삭제 실패:`, r2Error)
          // R2 삭제 실패해도 계속 진행
        }

        // Supabase Storage 이미지도 삭제 (레거시 지원)
        const { data: images, error: imagesError } = await supabase
          .from('images')
          .select('url, public_url')
          .eq('page_id', pageId)

        if (!imagesError && images && images.length > 0) {
          console.log(`[DELETE] Supabase Storage 이미지 ${images.length}개 확인`)
          
          for (const image of images) {
            try {
              const imageUrl = image.url || image.public_url || ''
              
              if (imageUrl.includes('supabase.co/storage')) {
                // Supabase Storage에서 삭제
                const urlParts = imageUrl.split('/storage/v1/object/public/')
                if (urlParts.length > 1) {
                  const [bucket, ...pathParts] = urlParts[1].split('/')
                  const filePath = pathParts.join('/')
                  await supabase.storage.from(bucket).remove([filePath])
                  console.log(`[DELETE] Supabase Storage 이미지 삭제: ${filePath}`)
                }
              }
            } catch (imgError) {
              console.warn(`[DELETE] Supabase Storage 이미지 삭제 실패:`, imgError)
            }
          }
        }

        // images 테이블 레코드 삭제
        const { error: imagesTableError } = await supabase
          .from('images')
          .delete()
          .eq('page_id', pageId)
        
        if (!imagesTableError) {
          console.log(`[DELETE] images 테이블 레코드 삭제 완료`)
        } else {
          console.warn(`[DELETE] images 테이블 삭제 실패:`, imagesTableError)
        }

        // 3. page_settings 삭제
        const { error: pageSettingsError } = await supabase
          .from('page_settings')
          .delete()
          .eq('page_id', pageId)
        if (!pageSettingsError) {
          console.log(`[DELETE] page_settings 삭제 완료`)
        }

        // 4. wedding_contacts 삭제
        const { error: contactsError } = await supabase
          .from('wedding_contacts')
          .delete()
          .eq('page_id', pageId)
        if (!contactsError) {
          console.log(`[DELETE] wedding_contacts 삭제 완료`)
        }

        // 5. transport_infos 삭제 (복수형)
        const { error: transportError } = await supabase
          .from('transport_infos')
          .delete()
          .eq('page_id', pageId)
        if (!transportError) {
          console.log(`[DELETE] transport_infos 삭제 완료`)
        } else {
          console.warn(`[DELETE] transport_infos 삭제 실패:`, transportError)
        }

        // 6. info_item 삭제 (단수형)
        const { error: infoItemError } = await supabase
          .from('info_item')
          .delete()
          .eq('page_id', pageId)
        if (!infoItemError) {
          console.log(`[DELETE] info_item 삭제 완료`)
        } else {
          console.warn(`[DELETE] info_item 삭제 실패:`, infoItemError)
        }

        // 7. rsvp_responses 삭제
        const { error: rsvpError } = await supabase
          .from('rsvp_responses')
          .delete()
          .eq('page_id', pageId)
        if (!rsvpError) {
          console.log(`[DELETE] rsvp_responses 삭제 완료`)
        } else {
          console.warn(`[DELETE] rsvp_responses 삭제 실패:`, rsvpError)
        }

        // 8. comments_framer 삭제
        const { error: commentsError } = await supabase
          .from('comments_framer')
          .delete()
          .eq('page_id', pageId)
        if (!commentsError) {
          console.log(`[DELETE] comments_framer 삭제 완료`)
        } else {
          console.warn(`[DELETE] comments_framer 삭제 실패:`, commentsError)
        }

        // 9. invite_cards 삭제
        const { error: inviteError } = await supabase
          .from('invite_cards')
          .delete()
          .eq('page_id', pageId)
        if (!inviteError) {
          console.log(`[DELETE] invite_cards 삭제 완료`)
        } else {
          console.warn(`[DELETE] invite_cards 삭제 실패:`, inviteError)
        }

        console.log(`[DELETE] 페이지 ID "${pageId}"의 모든 데이터 삭제 완료`)
      }
    }

    // 마지막으로 사용자 계정 삭제
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
      message: deleteAllData 
        ? '사용자 계정 및 모든 관련 데이터가 성공적으로 삭제되었습니다' 
        : '사용자가 성공적으로 삭제되었습니다'
    })

  } catch (error) {
    console.error('사용자 삭제 예외:', error)
    return res.status(500).json({
      success: false,
      error: '사용자 삭제 중 오류가 발생했습니다',
      details: error.message
    })
  }
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
  const { username, password, name, page_id, wedding_date, groom_name_en, bride_name_en, role } = body

  console.log('Processing register/signup request')

  if (!username || !password || !name || !groom_name_en || !bride_name_en) {
    return res.status(400).json({
      success: false,
      error: '사용자명, 비밀번호, 이름, 신랑 영문 이름, 신부 영문 이름을 모두 입력하세요'
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

    const { data: newUser, error } = await supabase
      .from('admin_users')
      .insert([{
        username,
        password: passwordHash,
        name,
        is_active: false, // 승인 대기 상태
        role: role || 'user', // 요청에서 받은 role 사용, 없으면 기본값 'user'
        approval_status: 'pending',
        page_id: page_id || null,
        wedding_date: wedding_date || null,
        groom_name_en: groom_name_en,
        bride_name_en: bride_name_en
      }])
      .select('id, username, name, is_active, role, approval_status, page_id, wedding_date, groom_name_en, bride_name_en')
      .single()

    if (error) {
      console.error('Register error:', error)
      return res.status(500).json({
        success: false,
        error: '회원가입 중 오류가 발생했습니다'
      })
    }

    return res.status(201).json({
      success: true,
      message: '회원가입 신청이 완료되었습니다. 제출주신 정보를 바탕으로 페이지 생성 중입니다. 로그인은 다음날 오전 10시부터 가능합니다.',
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

// 일반 로그인 처리 (Admin.tsx용 - 모든 권한 허용)
async function handleGeneralLogin(req, res, body) {
  const { username, password } = body

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: '아이디와 비밀번호를 입력하세요'
    })
  }

  try {
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, username, name, password, is_active, approval_status, role, page_id, wedding_date')
      .eq('username', username)
      .single()

    if (error) {
      console.error('General login error:', error)
      return res.status(401).json({
        success: false,
        error: '아이디 또는 비밀번호가 올바르지 않습니다.'
      })
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '아이디 또는 비밀번호가 올바르지 않습니다.'
      })
    }

    if (user.approval_status !== 'approved') {
      return res.status(401).json({
        success: false,
        error: '승인되지 않은 계정입니다.'
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
      try {
        isValidPassword = await bcrypt.compare(password, user.password)
      } catch (bcryptError) {
        console.error('비밀번호 검증 오류:', bcryptError)
        return res.status(500).json({
          success: false,
          error: '비밀번호 검증 중 오류가 발생했습니다.'
        })
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: '아이디 또는 비밀번호가 올바르지 않습니다.'
      })
    }

    // 마지막 로그인 시간 업데이트
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // 토큰 생성
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      page_id: user.page_id,
      wedding_date: user.wedding_date,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24시간
    }

    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64')

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        page_id: user.page_id,
        wedding_date: user.wedding_date
      }
    })

  } catch (error) {
    console.error('General login exception:', error)
    return res.status(500).json({
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다.'
    })
  }
}

// 로그인 처리 (UserManagement용 - admin만 허용)
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

    // role 검증 - admin만 로그인 가능 (UserManagement용)
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '관리자 권한이 필요한 서비스입니다.'
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

  const { username, password, name, page_id, role } = body

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
        role: role || 'admin', // 요청에서 받은 role 사용, 없으면 기본값 'admin'
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

    const trimmedPageId = typeof pageId === 'string' ? pageId.trim() : ''

    if (status === 'approved') {
      updateData.is_active = true
      if (trimmedPageId) {
        updateData.page_id = trimmedPageId
      }
    }

    const { data: updatedUser, error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', userId)
      .select('id, username, name, is_active, approval_status, page_id, wedding_date, groom_name_en, bride_name_en')
      .single()

    if (error) {
      console.error('Approve user error:', error)
      return res.status(500).json({
        success: false,
        error: '사용자 승인 처리 중 오류가 발생했습니다'
      })
    }

    const finalPageId = (trimmedPageId || updatedUser.page_id || '').trim()

    // 승인 시 page_settings 테이블에 초기 row 생성
    if (status === 'approved' && finalPageId) {
      await seedPageSettingsForUser(finalPageId, {
        wedding_date: updatedUser.wedding_date || null,
        groom_name_en: updatedUser.groom_name_en || '',
        bride_name_en: updatedUser.bride_name_en || ''
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

// RSVP HTML 페이지 생성 (관리자용)
async function handleGenerateRSVPHTML(req, res, body) {
  const authResult = checkAuth(req, res)
  if (authResult.error) {
    return res.status(authResult.error.status).json({
      success: false,
      error: authResult.error.message,
    })
  }

  const { pageId } = body || {}

  if (!pageId) {
    return res.status(400).json({ success: false, error: 'pageId is required' })
  }

  try {
    const htmlContent = generateRSVPHTML(pageId)
    const publicUrl = `https://admin.roarc.kr/rsvp/${pageId}`
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME_RSVP || 'rsvp',
      Key: `rsvp/${pageId}/index.html`,
      Body: htmlContent,
      ContentType: 'text/html; charset=utf-8',
      CacheControl: 'public, max-age=3600',
    })

    await rsvpR2Client.send(uploadCommand)

    return res.status(200).json({
      success: true,
      message: 'RSVP page generated and uploaded successfully',
      url: publicUrl,
      pageId,
    })
  } catch (error) {
    console.error('RSVP HTML generate error:', error)
    return res.status(500).json({
      success: false,
      error: 'RSVP 페이지 업로드 중 오류가 발생했습니다',
      details: error.message,
    })
  }
}

// RSVP HTML 페이지 삭제 (관리자용)
async function handleDeleteRSVPHTML(req, res, body) {
  const authResult = checkAuth(req, res)
  if (authResult.error) {
    return res.status(authResult.error.status).json({
      success: false,
      error: authResult.error.message,
    })
  }

  const { pageId } = body || {}

  if (!pageId) {
    return res.status(400).json({ success: false, error: 'pageId is required' })
  }

  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME_RSVP || 'rsvp',
      Key: `rsvp/${pageId}/index.html`,
    })

    await rsvpR2Client.send(deleteCommand)

    return res.status(200).json({
      success: true,
      message: 'RSVP page deleted successfully',
      pageId,
    })
  } catch (error) {
    console.error('RSVP HTML delete error:', error)
    return res.status(500).json({
      success: false,
      error: 'RSVP 페이지 삭제 중 오류가 발생했습니다',
      details: error.message,
    })
  }
}

// RSVP HTML 템플릿 (직접 이식)
function generateRSVPHTML(pageId) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RSVP 결과 - ${pageId}</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');

        @font-face {
            font-family: "P22 Late November";
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: url("https://cdn.roarc.kr/fonts/P22-LateNovember/6f9032835db3c6c496b1c0384815d38e.woff2") format("woff2");
        }

        body {
            margin: 0;
            padding: 0;
            background-color: #EBEBEB;
            font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, 'Apple Color Emoji', 'Segoe UI Emoji';
            width: 100vw;
            min-height: 100vh;
        }

        .full-width-container { width: 100vw; min-height: 100vh; display: flex; justify-content: center; align-items: flex-start; background-color: #EBEBEB; }
        .content-wrapper { width: 100%; max-width: 430px; height: fit-content; margin-top: 40px; margin-bottom: 40px; display: flex; align-items: center; }
        .header-text { display: flex; flex-direction: column; align-items: center; gap: 20px; margin-bottom: 0px; width: 100%; max-width: 430px; }
        .rsvp-title { font-family: 'P22 Late November', 'Pretendard Variable', Pretendard, serif; font-size: 25px; line-height: 0.7em; color: black; margin: 0; }
        .rsvp-subtitle { font-family: 'Pretendard Variable', Pretendard, sans-serif; font-weight: 400; color: #8c8c8c; font-size: 15px; margin: 0; }
        #root { width: 100%; max-width: 430px; margin: 0 auto; padding: 24px; background-color: transparent; border-radius: 0px; font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"; height: fit-content; flex-direction: column; align-items: center; }
    </style>
    <script type="module" src="https://cdn.roarc.kr/fonts/typography.js?v=27c65dba30928cbbce6839678016d9ac"></script>
    <script>
      (function ensureTypography() {
        var tries = 0;
        var maxTries = 50; // ~5s
        var timer = setInterval(function() {
          tries++;
          if (window.__typography && typeof window.__typography.ensure === 'function') {
            try { window.__typography.ensure(); } catch (e) {}
            clearInterval(timer);
          }
          if (tries >= maxTries) { clearInterval(timer); }
        }, 100);
      })();
    </script>
</head>
<body>
    <div class="full-width-container">
        <div class="content-wrapper">
            <div id="root"></div>
            <script type="text/babel">
        const { useState, useEffect, useMemo } = React;
        function RSVPAttendeeList({ pageId }) {
            const [attendees, setAttendees] = useState([]);
            const [filteredAttendees, setFilteredAttendees] = useState([]);
            const [isLoading, setIsLoading] = useState(false);
            const [error, setError] = useState("");
            const [searchTerm, setSearchTerm] = useState("");
            const [filterType, setFilterType] = useState("all");
            const [currentPage, setCurrentPage] = useState(1);
            const [itemsPerPage] = useState(10);
            const [activeTab, setActiveTab] = useState("statistics");
            const [showFilterDropdown, setShowFilterDropdown] = useState(false);
            const [summary, setSummary] = useState({ total: 0, attending: 0, notAttending: 0, groomSide: 0, brideSide: 0, groomSideAttending: 0, brideSideAttending: 0, totalGuests: 0, groomMealCount: 0, brideMealCount: 0, mealCount: 0, mealYes: 0, mealNo: 0 });

            const showOnlyAttending = false;
            const cardBackgroundColor = "white";
            const headerColor = "#333333";
            const borderColor = "#e0e0e0";
            const groomSideColor = "#4a90e2";
            const brideSideColor = "#e24a90";

            const p22FontFamily = useMemo(() => {
                try { return (window.__typography?.helpers?.stacks?.p22 || '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'); } catch { return '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'; }
            }, []);
            const pretendardRegular = useMemo(() => {
                try { return window.__typography?.helpers?.stacks?.body || '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'; } catch { return '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'; }
            }, []);
            const pretendardSemiBold = useMemo(() => {
                try { return window.__typography?.helpers?.stacks?.heading || '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'; } catch { return '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'; }
            }, []);

            const loadAttendees = async () => {
                if (!pageId.trim()) { setError("페이지 ID를 입력해주세요."); return; }
                setIsLoading(true); setError("");
                try {
                    const url = "https://wedding-admin-proxy.vercel.app/api/rsvp-unified";
                    const requestBody = { action: "getByPageId", pageId: pageId.trim(), showOnlyAttending: showOnlyAttending };
                    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
                    if (!response.ok) { const errorText = await response.text(); throw new Error("HTTP " + response.status + ": " + errorText); }
                    const result = await response.json();
                    if (result.success) { setAttendees(result.data); setFilteredAttendees(result.data); calculateSummary(result.data); } else { throw new Error(result.error || "데이터를 가져올 수 없습니다"); }
                } catch (error) { console.error('데이터 로드 에러:', error); setError("데이터 로드 실패: " + error.message); } finally { setIsLoading(false); }
            };

            const calculateSummary = (data) => {
                const attendingData = data.filter((item) => item.relation_type === "참석");
                const groomData = data.filter((item) => item.guest_type === "신랑측");
                const brideData = data.filter((item) => item.guest_type === "신부측");
                const groomAttendingData = attendingData.filter((item) => item.guest_type === "신랑측");
                const brideAttendingData = attendingData.filter((item) => item.guest_type === "신부측");
                const stats = { total: data.length, attending: attendingData.length, notAttending: data.filter((item) => item.relation_type === "미참석").length, groomSide: groomData.length, brideSide: brideData.length, groomSideAttending: groomAttendingData.length, brideSideAttending: brideAttendingData.length, totalGuests: attendingData.reduce((s, i) => s + (i.guest_count || 0), 0), groomMealCount: groomAttendingData.filter((i) => i.meal_time === "식사 가능").reduce((s, i) => s + (i.guest_count || 0), 0), brideMealCount: brideAttendingData.filter((i) => i.meal_time === "식사 가능").reduce((s, i) => s + (i.guest_count || 0), 0), mealYes: data.filter((i) => i.meal_time === "식사 가능").length, mealNo: data.filter((i) => i.meal_time === "식사 불가").length, mealCount: attendingData.filter((i) => i.meal_time === "식사 가능").reduce((s, i) => s + (i.guest_count || 0), 0) };
                setSummary(stats);
            };

            const applyFilters = () => {
                let filtered = [...attendees];
                if (searchTerm.trim()) { filtered = filtered.filter((item) => (item.guest_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (item.phone_number || "").includes(searchTerm)); }
                if (filterType !== "all") {
                    filtered = filtered.filter((item) => {
                        switch (filterType) {
                            case "attending": return item.relation_type === "참석";
                            case "notAttending": return item.relation_type === "미참석";
                            case "groomSide": return item.guest_type === "신랑측";
                            case "brideSide": return item.guest_type === "신부측";
                            case "mealYes": return item.meal_time === "식사 가능";
                            case "mealNo": return item.meal_time === "식사 불가";
                            default: return true;
                        }
                    });
                }
                setFilteredAttendees(filtered); setCurrentPage(1);
            };

            useEffect(() => { if (pageId.trim()) { loadAttendees(); } }, [pageId, showOnlyAttending]);
            useEffect(() => { applyFilters(); }, [searchTerm, filterType, attendees]);

            const totalPages = Math.ceil(filteredAttendees.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const currentItems = filteredAttendees.slice(startIndex, endIndex);

            const renderStatisticsTab = () => (
                React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" } },
                    React.createElement("div", { style: { backgroundColor: cardBackgroundColor, padding: "24px" } },
                        React.createElement("h3", { style: { fontSize: "14px", color: headerColor, marginBottom: "12px", textAlign: "center" } }, "참석 여부"),
                        React.createElement("div", { style: { width: "100%", height: "1px", backgroundColor: borderColor, marginBottom: "16px" } }),
                        React.createElement("div", { style: { display: "flex", gap: "6px" } },
                            React.createElement("div", { style: { flex: "1", padding: "0 12px", textAlign: "center" } },
                                React.createElement("div", { style: { fontSize: "12px", color: "#666666", marginBottom: "8px" } }, "참석가능"),
                                React.createElement("div", { style: { fontSize: "16px", color: headerColor } }, summary.attending)
                            ),
                            React.createElement("div", { style: { flex: "1", padding: "0 12px", textAlign: "center" } },
                                React.createElement("div", { style: { fontSize: "12px", color: "#999999", marginBottom: "8px" } }, "신랑측"),
                                React.createElement("div", { style: { fontSize: "16px", color: groomSideColor } }, summary.groomSideAttending)
                            ),
                            React.createElement("div", { style: { flex: "1", padding: "0 12px", textAlign: "center" } },
                                React.createElement("div", { style: { fontSize: "12px", color: "#999999", marginBottom: "8px" } }, "신부측"),
                                React.createElement("div", { style: { fontSize: "16px", color: brideSideColor } }, summary.brideSideAttending)
                            )
                        )
                    )
                )
            );

            const renderListTab = () => (
                <div></div>
            );

            return (
                <div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", marginBottom: "20px", width: "100%" }}>
                        <h1 style={{ fontFamily: p22FontFamily, fontSize: "25px", lineHeight: "0.7em", color: "black", margin: 0 }}>RSVP</h1>
                        <p style={{ fontWeight: 400, color: "#8c8c8c", fontSize: "15px", margin: 0 }}>결과 페이지</p>
                    </div>
                    <div style={{ backgroundColor: "transparent", padding: 0 }}>
                        {activeTab === 'statistics' ? renderStatisticsTab() : renderListTab()}
                    </div>
                </div>
            );
        }

            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(RSVPAttendeeList, { pageId: "${pageId}" }));
            </script>
        </div>
    </div>
</body>
</html>`
}

async function seedPageSettingsForUser(pageId, weddingInfo = {}) {
  if (!pageId) return

  try {
    const { data: existingSettingsRaw, error: existingError } = await supabase
      .from('page_settings')
      .select('page_id, wedding_date, groom_name_en, bride_name_en')
      .eq('page_id', pageId)
      .maybeSingle()

    let existingSettings = existingSettingsRaw

    if (existingError && existingError.code && existingError.code !== 'PGRST116') {
      console.error('Page settings lookup error:', existingError)
      return
    }

    const now = new Date().toISOString()

    if (!existingSettings) {
      const defaults = buildDefaultPageSettings(pageId, weddingInfo, now)
      const { error: insertError } = await supabase
        .from('page_settings')
        .insert(defaults)

      if (insertError) {
        if (insertError.code === '23505') {
          const { data: reloadedData, error: reloadError } = await supabase
            .from('page_settings')
            .select('page_id, wedding_date, groom_name_en, bride_name_en')
            .eq('page_id', pageId)
            .maybeSingle()

          if (reloadError && reloadError.code && reloadError.code !== 'PGRST116') {
            console.error('Page settings reload error after conflict:', reloadError)
            return
          }

          existingSettings = reloadedData
        } else {
          console.error('Page settings seed insert error:', insertError)
          return
        }
      } else {
        console.log(`Page settings seeded for page_id: ${pageId}`)
        return
      }
    }

    if (!existingSettings) {
      return
    }

    const weddingUpdates = {}
    if (!existingSettings.wedding_date && weddingInfo.wedding_date) {
      weddingUpdates.wedding_date = weddingInfo.wedding_date
    }
    if (!existingSettings.groom_name_en && weddingInfo.groom_name_en) {
      weddingUpdates.groom_name_en = weddingInfo.groom_name_en
    }
    if (!existingSettings.bride_name_en && weddingInfo.bride_name_en) {
      weddingUpdates.bride_name_en = weddingInfo.bride_name_en
    }

    if (Object.keys(weddingUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from('page_settings')
        .update({ ...weddingUpdates, updated_at: now })
        .eq('page_id', pageId)

      if (updateError) {
        console.error('Page settings wedding info update error:', updateError)
      }
    }
  } catch (error) {
    console.error('Page settings seeding failed:', error)
  }
}

function buildDefaultPageSettings(pageId, weddingInfo = {}, timestamp = new Date().toISOString()) {
  return {
    page_id: pageId,
    type: 'papillon',
    groom_name_kr: '',
    groom_name_en: weddingInfo.groom_name_en || '',
    bride_name_kr: '',
    bride_name_en: weddingInfo.bride_name_en || '',
    last_groom_name_kr: '',
    last_groom_name_en: '',
    last_bride_name_kr: '',
    last_bride_name_en: '',
    wedding_date: weddingInfo.wedding_date || null,
    wedding_hour: '14',
    wedding_minute: '00',
    venue_name: '',
    venue_name_kr: '',
    venue_address: '',
    venue_lat: null,
    venue_lng: null,
    photo_section_image_url: '',
    photo_section_image_path: '',
    photo_section_location: '',
    photo_section_overlay_position: 'bottom',
    photo_section_overlay_color: '#ffffff',
    photo_section_locale: 'en',
    highlight_shape: 'circle',
    highlight_color: '#e0e0e0',
    highlight_text_color: 'black',
    gallery_type: 'thumbnail',
    info: null,
    account: null,
    bgm: 'off',
    bgm_url: '',
    bgm_type: 'none',
    bgm_autoplay: false,
    bgm_vol: 50,
    rsvp: 'off',
    comments: 'off',
    kko_img: '',
    kko_title: '',
    kko_date: '',
    vid_url: '',
    vid_url_saved: '',
    created_at: timestamp,
    updated_at: timestamp
  }
}

// Version: 2025-10-13 - Unified User Management API
