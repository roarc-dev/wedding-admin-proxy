const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// Supabase 설정
const supabaseUrl = 'https://yjlzizakdjghpfduxcki.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbHppemFrZGpnaHBmZHV4Y2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MzYyNzgsImV4cCI6MjA2NzUxMjI3OH0.zvvQ1ydbil2rjxlknyYZ7NF9qsgSkO-UbkofJbxe3AU';

const supabase = createClient(supabaseUrl, supabaseKey);

app.post('/api/register', async (req, res) => {
  try {
    const { username, password, name } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({
        success: false,
        error: '사용자명, 비밀번호, 이름을 모두 입력하세요'
      });
    }

    // 중복 사용자명 체크
    const { data: existingUser, error: checkError } = await supabase
      .from('admin_users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

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

    // 새 사용자 생성
    const { data: newUser, error } = await supabase
      .from('admin_users')
      .insert([{
        username,
        password: passwordHash,
        name,
        role: 'admin',
        is_active: false
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

  } catch (error) {
    console.error('Register API Error:', error);
    return res.status(500).json({
      success: false,
      error: '서버 처리 중 오류가 발생했습니다: ' + error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
}); 