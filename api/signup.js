const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

// Supabase 설정
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required')
}

const supabase = createClient(supabaseUrl, supabaseKey)

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
      const { username, password, name } = req.body || {};

      console.log('Signup request:', { username, hasPassword: !!password, name });

      if (!username || !password || !name) {
        return res.status(400).json({
          success: false,
          error: '사용자명, 비밀번호, 이름을 모두 입력하세요'
        });
      }

      // 중복 사용자명 체크
      const { data: existingUser } = await supabase
        .from('admin_users')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: '이미 존재하는 사용자명입니다'
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
          is_active: false, // 승인 대기 상태
          approval_status: 'pending', // 승인 상태 추가
          page_id: null // 관리자가 승인 시 발급
        }])
        .select('id, username, name, approval_status')
        .single();

      if (error) {
        console.error('Signup error:', error);
        return res.status(500).json({
          success: false,
          error: '회원가입 중 오류가 발생했습니다'
        });
      }

      return res.status(201).json({
        success: true,
        message: '회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.',
        data: newUser
      });
    }

    res.status(405).json({ success: false, error: "Method Not Allowed" });
    
  } catch (error) {
    console.error('Signup API Error:', error);
    return res.status(500).json({
      success: false,
      error: '서버 처리 중 오류가 발생했습니다'
    });
  }
} 