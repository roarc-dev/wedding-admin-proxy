const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

// 환경 변수에서 Supabase 설정 가져오기
const supabase = createClient(
  "https://yjlzizakdjghpfduxcki.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbHppemFrZGpnaHBmZHV4Y2tpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkzNjI3OCwiZXhwIjoyMDY3NTEyMjc4fQ.2dDp8I8CNRX3tYJK1hJrM8_1PZ2E3WKY5SyqQPAGCas" // service_role key 사용
)

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

module.exports = async function handler(req, res) {
  try {
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
        if (!username || !password) {
          return res.status(400).json({ 
            success: false, 
            error: '아이디와 비밀번호를 입력하세요' 
          });
        }

        // 사용자 조회
        const { data: user, error: fetchError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('username', username)
          .eq('is_active', true)
          .single();

        if (fetchError || !user) {
          return res.status(401).json({ 
            success: false, 
            error: '아이디 또는 비밀번호가 잘못되었습니다' 
          });
        }

        // 비밀번호 검증
        let isValidPassword = false;
        
        if (user.password) {
          // 해시된 비밀번호인지 평문인지 확인
          if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            // 이미 해시된 비밀번호
            isValidPassword = await bcrypt.compare(password, user.password);
          } else {
            // 평문 비밀번호 (기존 데이터 - hobo1016! 등)
            isValidPassword = password === user.password;
            
            // 로그인 성공 시 해시로 업데이트
            if (isValidPassword) {
              const hashedPassword = await bcrypt.hash(password, 10);
              await supabase
                .from('admin_users')
                .update({ password: hashedPassword })
                .eq('id', user.id);
            }
          }
        }

        if (!isValidPassword) {
          return res.status(401).json({ 
            success: false, 
            error: '아이디 또는 비밀번호가 잘못되었습니다' 
          });
        }

        // 로그인 시간 업데이트
        await supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id);

        // 세션 토큰 생성
        const sessionToken = generateSecureToken({
          id: user.id,
          username: user.username,
          name: user.name
        });

        return res.status(200).json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            name: user.name
          },
          token: sessionToken
        });
      }
      
      return res.status(400).json({ success: false, error: "Invalid action" });
    }

    res.status(405).json({ success: false, error: "Method Not Allowed" });
    
  } catch (error) {
    console.error('Auth API Error:', error);
    return res.status(500).json({
      success: false,
      error: '인증 처리 중 오류가 발생했습니다'
    });
  }
}
