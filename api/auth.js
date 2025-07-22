const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

// 환경 변수에서 Supabase 설정 가져오기
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service Key 사용
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

// JWT 토큰 검증 함수
function validateToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString())
    return Date.now() < payload.expires ? payload : null
  } catch {
    return null
  }
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
      const { action, username, password, name } = req.body || {};
      
      // 로그인 처리
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

      // 새 사용자 추가 (action === "createUser")
      if (action === "createUser") {
        // 인증 확인
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ 
            success: false, 
            error: '인증이 필요합니다' 
          });
        }

        const token = authHeader.substring(7);
        const tokenData = validateToken(token);
        if (!tokenData) {
          return res.status(401).json({ 
            success: false, 
            error: '유효하지 않은 토큰입니다' 
          });
        }

        if (!username || !password || !name) {
          return res.status(400).json({
            success: false,
            error: '사용자명, 비밀번호, 이름을 모두 입력하세요'
          });
        }

        // 비밀번호 해싱
        const passwordHash = await bcrypt.hash(password, 10);

        const { data: newUser, error } = await supabase
          .from('admin_users')
          .insert([{
            username,
            password: passwordHash,
            name,
            is_active: true
          }])
          .select('id, username, name, is_active, created_at')
          .single();

        if (error) {
          if (error.code === '23505') {
            return res.status(400).json({
              success: false,
              error: '이미 존재하는 사용자명입니다'
            });
          }
          throw error;
        }

        return res.status(201).json({
          success: true,
          data: newUser,
          message: '사용자가 성공적으로 추가되었습니다'
        });
      }
      
      return res.status(400).json({ success: false, error: "Invalid action" });
    }

    // GET: 사용자 목록 조회
    if (req.method === "GET") {
      // 인증 확인
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          error: '인증이 필요합니다' 
        });
      }

      const token = authHeader.substring(7);
      const tokenData = validateToken(token);
      if (!tokenData) {
        return res.status(401).json({ 
          success: false, 
          error: '유효하지 않은 토큰입니다' 
        });
      }

      const { data: users, error } = await supabase
        .from('admin_users')
        .select('id, username, name, is_active, created_at, last_login')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: users
      });
    }

    // PUT: 사용자 정보 수정
    if (req.method === "PUT") {
      // 인증 확인
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          error: '인증이 필요합니다' 
        });
      }

      const token = authHeader.substring(7);
      const tokenData = validateToken(token);
      if (!tokenData) {
        return res.status(401).json({ 
          success: false, 
          error: '유효하지 않은 토큰입니다' 
        });
      }

      const { id, username: newUsername, name: newName, is_active, newPassword } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: '사용자 ID가 필요합니다'
        });
      }

      const updateData = {};
      if (newUsername) updateData.username = newUsername;
      if (newName) updateData.name = newName;
      if (typeof is_active === 'boolean') updateData.is_active = is_active;
      if (newPassword) {
        updateData.password = await bcrypt.hash(newPassword, 10);
      }
      updateData.updated_at = new Date().toISOString();

      const { data: updatedUser, error } = await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', id)
        .select('id, username, name, is_active, updated_at')
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: updatedUser,
        message: '사용자 정보가 성공적으로 수정되었습니다'
      });
    }

    // DELETE: 사용자 삭제
    if (req.method === "DELETE") {
      // 인증 확인
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          error: '인증이 필요합니다' 
        });
      }

      const token = authHeader.substring(7);
      const tokenData = validateToken(token);
      if (!tokenData) {
        return res.status(401).json({ 
          success: false, 
          error: '유효하지 않은 토큰입니다' 
        });
      }

      const { id } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: '사용자 ID가 필요합니다'
        });
      }

      if (id === tokenData.userId) {
        return res.status(400).json({
          success: false,
          error: '자기 자신은 삭제할 수 없습니다'
        });
      }

      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: '사용자가 성공적으로 삭제되었습니다'
      });
    }

    res.status(405).json({ success: false, error: "Method Not Allowed" });
    
  } catch (error) {
    console.error('Auth API Error:', error);
    return res.status(500).json({
      success: false,
      error: '서버 처리 중 오류가 발생했습니다'
    });
  }
}
