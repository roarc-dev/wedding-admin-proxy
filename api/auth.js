import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// 환경 변수에서 Supabase 설정 가져오기
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service Key 사용 (anon key 아님!)
)

export default async function handler(req, res) {
  try {
    // CORS 헤더는 항상 추가
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    if (req.method === "POST") {
      const { action, username, password } = req.body || {};
      if (action === "login") {
        // 실제 로그인 로직 (예시: admin/admin)
        if (username === "admin" && password === "admin") {
          return res.status(200).json({
            success: true,
            user: { id: 1, username: "admin" },
            token: "dummy-token",
          });
        } else {
          return res.status(401).json({
            success: false,
            error: "아이디 또는 비밀번호가 올바르지 않습니다.",
          });
        }
      }
      return res.status(400).json({ success: false, error: "Invalid action" });
    }

    res.status(405).json({ success: false, error: "Method Not Allowed" });
  } catch (error) {
    console.error('Auth API Error:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}

async function handleLogin(req, res, username, password) {
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
      .eq('is_active', true)
      .single()

    if (fetchError || !user) {
      return res.status(401).json({ 
        success: false, 
        error: '아이디 또는 비밀번호가 잘못되었습니다' 
      })
    }

    // 비밀번호 검증 (해시된 비밀번호 사용 권장)
    let isValidPassword = false
    
    if (user.password_hash) {
      // 해시된 비밀번호가 있는 경우
      isValidPassword = await bcrypt.compare(password, user.password_hash)
    } else if (user.password) {
      // 기존 평문 비밀번호 (마이그레이션 필요)
      isValidPassword = password === user.password
      
      // 로그인 성공 시 해시로 업데이트
      if (isValidPassword) {
        const hashedPassword = await bcrypt.hash(password, 10)
        await supabase
          .from('admin_users')
          .update({ 
            password_hash: hashedPassword,
            password: null // 평문 비밀번호 제거
          })
          .eq('id', user.id)
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

    // 세션 토큰 생성 (서버에서 생성하므로 더 안전)
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
        name: user.name
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

async function handleChangePassword(req, res, username, currentPassword, newPassword) {
  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      error: '모든 필드를 입력하세요' 
    })
  }

  try {
    // 현재 비밀번호 확인
    const loginResult = await handleLogin(req, { json: () => {} }, username, currentPassword)
    
    if (!loginResult.success) {
      return res.status(401).json({ 
        success: false, 
        error: '현재 비밀번호가 틀렸습니다' 
      })
    }

    // 새 비밀번호 해시화
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // 비밀번호 업데이트
    const { error } = await supabase
      .from('admin_users')
      .update({ 
        password_hash: hashedNewPassword,
        password: null,
        updated_at: new Date().toISOString()
      })
      .eq('username', username)

    if (error) {
      throw error
    }

    return res.status(200).json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다'
    })

  } catch (error) {
    console.error('Change password error:', error)
    return res.status(500).json({ 
      success: false, 
      error: '비밀번호 변경 중 오류가 발생했습니다' 
    })
  }
}

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
