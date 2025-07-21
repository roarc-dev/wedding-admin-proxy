const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const supabase = createClient(
  "https://yjlzizakdjghpfduxcki.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbHppemFrZGpnaHBmZHV4Y2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MzYyNzgsImV4cCI6MjA2NzUxMjI3OH0.zvvQ1ydbil2rjxlknyYZ7NF9qsgSkO-UbkofJbxe3AU"
)

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

    // GET: 사용자 목록 조회
    if (req.method === "GET") {
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

    // POST: 새 사용자 추가
    if (req.method === "POST") {
      const { username, password, name } = req.body;

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

    // PUT: 사용자 정보 수정
    if (req.method === "PUT") {
      const { id, username, name, is_active, newPassword } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: '사용자 ID가 필요합니다'
        });
      }

      const updateData = {};
      if (username) updateData.username = username;
      if (name) updateData.name = name;
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

    res.status(405).json({ 
      success: false, 
      error: "Method Not Allowed" 
    });

  } catch (error) {
    console.error('Users API Error:', error);
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다: ' + error.message
    });
  }
} 