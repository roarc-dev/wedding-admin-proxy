import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') return await handleGet(req, res)
    if (req.method === 'POST') return await handleUpsert(req, res)
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  } catch (error) {
    console.error('Invite API Error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

async function handleGet(req, res) {
  const { pageId } = req.query
  if (!pageId) return res.status(400).json({ success: false, error: 'pageId is required' })

  try {
    const { data, error } = await supabase
      .from('invite_cards')
      .select('*')
      .eq('page_id', pageId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (!data) {
      const defaults = getDefaultInvite(pageId)
      return res.json({ success: true, data: defaults })
    }
    return res.json({ success: true, data })
  } catch (error) {
    // 테이블이 없을 때는 기본값으로 응답
    if (error && (error.code === '42P01' || String(error.message || '').includes('invite_cards'))) {
      return res.json({ success: true, data: getDefaultInvite(pageId) })
    }
    console.error('Invite GET error:', error)
    return res.status(500).json({ success: false, error: '초대장 조회 중 오류가 발생했습니다', message: error?.message })
  }
}

async function handleUpsert(req, res) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '인증 토큰이 필요합니다' })
  }
  const token = authHeader.substring(7)
  const validated = validateToken(token)
  if (!validated) return res.status(401).json({ success: false, error: '유효하지 않은 토큰입니다' })

  try {
    // 사용자에게 할당된 page_id 조회
    const { data: adminUser, error: adminErr } = await supabase
      .from('admin_users')
      .select('id, page_id')
      .eq('id', validated.userId)
      .single()

    if (adminErr) throw adminErr
    const pageId = adminUser?.page_id
    if (!pageId) return res.status(400).json({ success: false, error: '이 사용자에게 page_id가 부여되지 않았습니다' })

    const allowedKeys = [
      'invitation_text',
      'groom_father_name', 'groom_mother_name', 'groom_name',
      'bride_father_name', 'bride_mother_name', 'bride_name',
      'show_groom_father_chrysanthemum', 'show_groom_mother_chrysanthemum',
      'show_bride_father_chrysanthemum', 'show_bride_mother_chrysanthemum'
    ]
    let { invite } = req.body || {}
    if (!invite) return res.status(400).json({ success: false, error: 'invite is required' })

    const sanitized = Object.fromEntries(
      Object.entries(invite).filter(([k]) => allowedKeys.includes(k))
    )

    const { data, error } = await supabase
      .from('invite_cards')
      .upsert({ page_id: pageId, ...sanitized, updated_at: new Date().toISOString() }, { onConflict: 'page_id' })
      .select()
      .single()

    if (error) throw error
    return res.json({ success: true, data })
  } catch (error) {
    console.error('Invite UPSERT error:', error)
    if (error && (error.code === '42P01' || String(error.message || '').includes('invite_cards'))) {
      return res.status(400).json({
        success: false,
        error: '초대장 저장 중 오류가 발생했습니다',
        message: 'invite_cards 테이블이 없습니다. 제공된 SQL을 적용해 주세요.',
        code: error.code || '42P01',
        requiresMigration: true
      })
    }
    return res.status(500).json({ success: false, error: '초대장 저장 중 오류가 발생했습니다', message: error?.message, code: error?.code })
  }
}

function getDefaultInvite(pageId) {
  return {
    page_id: pageId,
    invitation_text: '저희 두 사람이 하나 되는 약속의 시간에\n마음을 담아 소중한 분들을 모십니다.\n\n귀한 걸음으로 축복해 주시면 감사하겠습니다.',
    groom_father_name: '',
    groom_mother_name: '',
    groom_name: '',
    bride_father_name: '',
    bride_mother_name: '',
    bride_name: '',
    show_groom_father_chrysanthemum: false,
    show_groom_mother_chrysanthemum: false,
    show_bride_father_chrysanthemum: false,
    show_bride_mother_chrysanthemum: false,
  }
}

function validateToken(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    if (Date.now() > decoded.expires) return null
    if (!decoded.userId || !decoded.username) return null
    return decoded
  } catch (e) {
    return null
  }
}

// SQL (Supabase에 적용)
// create table if not exists public.invite_cards (
//   page_id text primary key,
//   invitation_text text,
//   groom_father_name text,
//   groom_mother_name text,
//   groom_name text,
//   bride_father_name text,
//   bride_mother_name text,
//   bride_name text,
//   show_groom_father_chrysanthemum boolean default false,
//   show_groom_mother_chrysanthemum boolean default false,
//   show_bride_father_chrysanthemum boolean default false,
//   show_bride_mother_chrysanthemum boolean default false,
//   updated_at timestamptz default now()
// );

