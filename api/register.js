const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

// Supabase 설정
const supabaseUrl = process.env.SUPABASE_URL || 'https://yjlzizakdjghpfduxcki.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbHppemFrZGpnaHBmZHV4Y2tpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzI5NjQwOCwiZXhwIjoyMDUyODcyNDA4fQ.Cj8tD8KVzqbgBKwJZGcCpFQktPY3QVh6MJ8b5ZX0_38'

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = async function handler(req, res) {
  try {
    console.log('Register API called - method:', req.method);
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    if (req.method === "POST") {
      const { username, password, name } = req.body || {};

      console.log('Register request:', { username, hasPassword: !!password, name });

      if (!username || !password || !name) {
        return res.status(400).json({
          success: false,
          error: '사용자명, 비밀번호, 이름을 모두 입력하세요'
        });
      }

      try {
        // 중복 사용자명 체크
        const { data: existingUser, error: checkError } = await supabase
          .from('admin_users')
          .select('username')
          .eq('username', username)
          .maybeSingle(); // single() 대신 maybeSingle() 사용

        if (checkError) {
          console.error('User check error:', checkError);
          return res.status(500).json({
            success: false,
            error: '사용자명 중복 확인 중 오류가 발생했습니다: ' + checkError.message
          });
        }

        if (existingUser) {
          return res.status(400).json({
            success: false,
            error: '이미 존재하는 사용자명입니다'
          });
        }

        // 비밀번호 해싱
        const passwordHash = await bcrypt.hash(password, 10);

        // 새 사용자 생성 (실제 테이블 구조에 맞춤)
        const { data: newUser, error } = await supabase
          .from('admin_users')
          .insert([{
            username,
            password: passwordHash,
            name,
            role: 'admin', // 기본 역할
            is_active: false // 승인 대기 상태 (기본값이 true이지만 명시적으로 false 설정)
          }])
          .select('id, username, name, role, is_active')
          .single();

        if (error) {
          console.error('Supabase insert error:', error);
          return res.status(500).json({
            success: false,
            error: '회원가입 중 데이터베이스 오류가 발생했습니다: ' + error.message
          });
        }

        console.log('User created successfully:', newUser);

        return res.status(201).json({
          success: true,
          message: '회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.',
          data: {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            status: newUser.is_active ? 'active' : 'pending_approval'
          }
        });

      } catch (supabaseError) {
        console.error('Supabase connection error:', supabaseError);
        return res.status(500).json({
          success: false,
          error: 'Supabase 연결 오류: ' + supabaseError.message
        });
      }
    }

    res.status(405).json({ success: false, error: "Method Not Allowed" });
    
  } catch (error) {
    console.error('Register API Error:', error);
    return res.status(500).json({
      success: false,
      error: '서버 처리 중 오류가 발생했습니다: ' + error.message
    });
  }
} 