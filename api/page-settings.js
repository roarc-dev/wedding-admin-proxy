import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  // API 응답 캐시 방지 (프리뷰/실시간 반영 안정화)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 공개 조회는 인증 건너뛰기 (단, GET이라도 Authorization이 있으면 관리자 조회로 간주 가능)
  const isPublicRequest = req.method === 'GET'

  let validatedUser = null

  // GET이라도 Authorization이 있으면 검증해서 "관리자 조회"로 취급할 수 있게 함
  if (isPublicRequest) {
    try {
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const decoded = validateToken(token)
        if (decoded) {
          validatedUser = decoded
        }
      }
    } catch (_) {}
  }

  if (!isPublicRequest && !validatedUser) {
    // 관리자 기능은 토큰 검증 필요
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: '인증 토큰이 필요합니다' 
      })
    }

    const token = authHeader.substring(7)
    validatedUser = validateToken(token)
    
    if (!validatedUser) {
      return res.status(401).json({  
        success: false, 
        error: '유효하지 않은 토큰입니다' 
      })
    }
  }

  try {
    // 교통편 요청인지 확인
    if (req.query.transport !== undefined) {
      switch (req.method) {
        case 'GET':
          return await handleGetTransport(req, res)
        case 'POST':
          return await handleUpdateTransport(req, res, validatedUser)
        default:
          return res.status(405).json({
            success: false,
            error: 'Method not allowed'
          })
      }
    }

    // 안내 사항 요청인지 확인
    if (req.query.info !== undefined) {
      switch (req.method) {
        case 'GET':
          return await handleGetInfo(req, res, validatedUser)
        case 'POST':
          return await handleUpdateInfo(req, res, validatedUser)
        default:
          return res.status(405).json({
            success: false,
            error: 'Method not allowed'
          })
      }
    }

    // 승인 시 웨딩 정보 복사 요청인지 확인
    if (req.query.approval !== undefined) {
      switch (req.method) {
        case 'POST':
        case 'PUT':
          return await handleApprovalUpdateSettings(req, res, validatedUser)
        default:
          return res.status(405).json({
            success: false,
            error: 'Method not allowed'
          })
      }
    }

    switch (req.method) {
      case 'GET':
        return await handleGetSettings(req, res)
      
      case 'POST':
      case 'PUT':
        return await handleUpdateSettings(req, res, validatedUser)
      
      default:
        return res.status(405).json({ 
          success: false, 
          error: 'Method not allowed' 
        })
    }
  } catch (error) {
    console.error('Page Settings API Error:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}

async function handleGetSettings(req, res) {
  let { pageId, userUrl, date } = req.query

  // userUrl 기반 조회 지원: /YYMMDD/userUrl 라우팅을 위한 공개 조회
  // - userUrl + date(YYMMDD) -> admin_users/ navers의 (wedding_date, user_url) 매핑 -> page_id로 page_settings 조회
  // - 매핑이 없으면 userUrl을 pageId로 취급하여 하위호환 유지
  if (!pageId && userUrl) {
    const normalizedUserUrl = typeof userUrl === 'string' ? userUrl.trim() : ''
    if (!normalizedUserUrl) {
      return res.status(400).json({
        success: false,
        error: 'userUrl is required'
      })
    }
    const normalizedDate = typeof date === 'string' ? date.trim() : ''
    const isoDate = normalizedDate && /^\d{6}$/.test(normalizedDate)
      ? `20${normalizedDate.slice(0, 2)}-${normalizedDate.slice(2, 4)}-${normalizedDate.slice(4, 6)}`
      : null

    try {
      // 1. admin_users에서 user_url 조회
      let { data: adminUser, error: adminErr } = await supabase
        .from('admin_users')
        .select('page_id, user_url')
        .eq('user_url', normalizedUserUrl)
        .maybeSingle()

      // date가 있으면 wedding_date까지 포함하여 재조회 (정확 매칭)
      if (isoDate) {
        const { data: datedAdminUser, error: datedErr } = await supabase
          .from('admin_users')
          .select('page_id, user_url')
          .eq('user_url', normalizedUserUrl)
          .eq('wedding_date', isoDate)
          .maybeSingle()
        if (!datedErr && datedAdminUser?.page_id) {
          adminUser = datedAdminUser
          adminErr = null
        }
      }

      // 2. admin_users에 없으면 naver_admin_accounts에서 조회
      if (adminErr || !adminUser?.page_id) {
        const { data: naverUser, error: naverErr } = await supabase
          .from('naver_admin_accounts')
          .select('page_id, user_url')
          .eq('user_url', normalizedUserUrl)
          .maybeSingle()

        let resolvedNaver = naverUser
        // date가 있으면 wedding_date까지 포함하여 재조회
        if (isoDate) {
          const { data: datedNaverUser, error: datedNaverErr } = await supabase
            .from('naver_admin_accounts')
            .select('page_id, user_url')
            .eq('user_url', normalizedUserUrl)
            .eq('wedding_date', isoDate)
            .maybeSingle()
          if (!datedNaverErr && datedNaverUser?.page_id) {
            resolvedNaver = datedNaverUser
          }
        }

        if (!naverErr && resolvedNaver?.page_id) {
          adminUser = resolvedNaver
        }
      }

      if (adminUser?.page_id) {
        pageId = adminUser.page_id
      } else {
        // userUrl이 DB에 없으면 에러 반환 (이전 user_url로 접근하는 것을 방지)
        // 폴백 제거: userUrl이 곧 pageId인 케이스는 더 이상 지원하지 않음
        return res.status(404).json({
          success: false,
          error: `user_url '${normalizedUserUrl}' not found`
        })
      }
    } catch (err) {
      // 에러 발생 시에도 폴백하지 않고 에러 반환
      console.error('Error resolving userUrl to pageId:', err)
      return res.status(500).json({
        success: false,
        error: 'Failed to resolve user_url'
      })
    }
  }

  if (!pageId) {
    return res.status(400).json({
      success: false,
      error: 'pageId is required'
    })
  }

  try {
    // GET이라도 Authorization 헤더가 있으면 검증 후 admin_users.page_id를 우선 사용
    try {
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const decoded = validateToken(token)
        if (decoded?.userId) {
          const { data: adminUser, error: adminErr } = await supabase
            .from('admin_users')
            .select('id, page_id')
            .eq('id', decoded.userId)
            .single()
          if (!adminErr && adminUser?.page_id) {
            pageId = adminUser.page_id
          }
        }
      }
    } catch (_) {}
    const { data, error } = await supabase
      .from('page_settings')
      .select('*')
      .eq('page_id', pageId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // 레코드가 없으면 기본값으로 생성
    if (!data) {
      // 최초 로그인 시 admin_users에서 웨딩 정보 가져오기
      let weddingInfo = {}
      try {
        const { data: adminUser, error: adminErr } = await supabase
          .from('admin_users')
          .select('wedding_date, groom_name_en, bride_name_en')
          .eq('page_id', pageId)
          .single()

        if (!adminErr && adminUser) {
          weddingInfo = {
            wedding_date: adminUser.wedding_date || null,
            groom_name_en: adminUser.groom_name_en || '',
            bride_name_en: adminUser.bride_name_en || ''
          }
        }
      } catch (err) {
        console.log('Failed to fetch wedding info from admin_users:', err)
      }

      const defaultSettings = {
        page_id: pageId,
        type: '',
        groom_name_kr: '',
        groom_name_en: weddingInfo.groom_name_en || '',
        bride_name_kr: '',
        bride_name_en: weddingInfo.bride_name_en || '',
        wedding_date: weddingInfo.wedding_date || null,
        wedding_hour: '12',
        wedding_minute: '00',
        venue_name: '',
        venue_address: '',
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
        gallery_zoom: 'off',
        bgm: '',
        bgm_url: '',
        bgm_type: '',
        bgm_autoplay: true,
        bgm_vol: 3,
        rsvp: 'off',
        comments: 'off',
        kko_img: '',
        kko_title: '',
        kko_date: ''
      }

      const { data: newData, error: insertError } = await supabase
        .from('page_settings')
        .insert(defaultSettings)
        .select()
        .single()

      if (insertError) throw insertError

      return res.json({
        success: true,
        data: newData
      })
    }

    // 파생 필드 계산: 포토섹션 공개 URL (path 우선), 캐시 버스팅 쿼리 포함
    const resolved = { ...data }

    // user_url도 함께 내려주기(공개 URL 생성/정규화에 필요)
    try {
      const { data: adminUserForUrl, error: urlErr } = await supabase
        .from('admin_users')
        .select('user_url')
        .eq('page_id', pageId)
        .single()
      if (!urlErr && adminUserForUrl?.user_url) {
        resolved.user_url = adminUserForUrl.user_url
      }
    } catch (_) {}
    const storageBase = process.env.SUPABASE_URL
      ? `${process.env.SUPABASE_URL}/storage/v1/object/public/images/`
      : 'https://yjlzizakdjghpfduxcki.supabase.co/storage/v1/object/public/images/'
    const baseUrl = data.photo_section_image_url || (data.photo_section_image_path ? `${storageBase}${data.photo_section_image_path}` : '')
    const cacheKey = data.updated_at ? new Date(data.updated_at).getTime() : Date.now()
    const publicUrl = baseUrl ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}v=${cacheKey}` : ''
    resolved.photo_section_image_public_url = publicUrl

    return res.json({
      success: true,
      data: resolved
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return res.status(500).json({
      success: false,
      error: '설정 조회 중 오류가 발생했습니다'
    })
  }
}

async function handleUpdateSettings(req, res, validatedUser) {
  const { settings, pageId } = req.body

  if (!settings) {
    return res.status(400).json({
      success: false,
      error: 'settings is required'
    })
  }

  try {
    let effectivePageId = null

    // pageId가 명시적으로 제공된 경우 (승인 시 등) 해당 pageId 사용
    if (pageId) {
      effectivePageId = pageId
    } else {
      // 1) 로그인 사용자 기준으로 page_id 결정
      const userId = validatedUser?.userId
      if (!userId) {
        return res.status(401).json({ success: false, error: '인증 사용자 정보를 찾을 수 없습니다' })
      }

      const { data: adminUser, error: adminErr } = await supabase
        .from('admin_users')
        .select('id, page_id')
        .eq('id', userId)
        .single()

      if (adminErr) {
        throw adminErr
      }

      effectivePageId = adminUser?.page_id
      if (!effectivePageId) {
        return res.status(400).json({ success: false, error: '이 사용자에게 page_id가 부여되지 않았습니다' })
      }
    }

    // 허용된 컬럼만 저장 (알 수 없는 키로 인한 에러 방지)
    const allowedKeys = [
      'type',
      'groom_name_kr',
      'groom_name_en',
      'bride_name_kr',
      'bride_name_en',
      'last_groom_name_kr',
      'last_groom_name_en',
      'last_bride_name_kr',
      'last_bride_name_en',
      'wedding_date',
      'wedding_hour',
      'wedding_minute',
      'venue_name',
      'venue_name_kr',
      'venue_address',
      'venue_lat',
      'venue_lng',
      'transport_location_name',
      'photo_section_image_url',
      'photo_section_image_path',
      'photo_section_location',
      'photo_section_overlay_position',
      'photo_section_overlay_color',
      'photo_section_locale',
      'highlight_shape',
      'highlight_color',
      'highlight_text_color',
      'gallery_type',
      'gallery_zoom',
      'info',
      'account',
      'bgm',
      'bgm_url',
      'bgm_type',
      'bgm_autoplay',
      'bgm_vol',
      'rsvp',
      'comments',
      'kko_img',
      'kko_title',
      'kko_date',
      'tag_image',
      'vid_url',
      'vid_url_saved',
    ]

    let sanitized = Object.fromEntries(
      Object.entries(settings || {}).filter(([key]) => allowedKeys.includes(key))
    )

    // 빈 문자열 날짜는 NULL로 저장 (Postgres date 타입 호환)
    if (Object.prototype.hasOwnProperty.call(sanitized, 'wedding_date')) {
      if (sanitized.wedding_date === '') {
        sanitized.wedding_date = null
      }
    }

    console.log('Saving page settings:', { pageId: effectivePageId, sanitized })

    // 포토섹션 경로가 오면 공개 URL도 함께 정규화하여 저장
    const storageBase = process.env.SUPABASE_URL
      ? `${process.env.SUPABASE_URL}/storage/v1/object/public/images/`
      : 'https://yjlzizakdjghpfduxcki.supabase.co/storage/v1/object/public/images/'

    const normalized = { ...sanitized }
    if (normalized.photo_section_image_path && !normalized.photo_section_image_url) {
      normalized.photo_section_image_url = `${storageBase}${normalized.photo_section_image_path}`
    }

    // 일반 업데이트에서는 웨딩 정보 덮어쓰기 방지 로직 제거
    // 승인 시에만 덮어쓰기 방지가 적용됨
    const finalSettings = { ...normalized }

    // bgm 필드가 요청에 명시적으로 포함되지 않았으면 기존 값 유지
    // (NOT NULL 제약조건 해결 + 다른 필드 수정 시 bgm 상태 보존)
    if (!Object.prototype.hasOwnProperty.call(finalSettings, 'bgm')) {
      // 기존 데이터에서 bgm 값 조회
      const { data: existingSettings, error: selectError } = await supabase
        .from('page_settings')
        .select('bgm')
        .eq('page_id', effectivePageId)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        // 레코드가 없는 경우에만 기본값 설정
        finalSettings.bgm = 'off'
      } else if (existingSettings?.bgm) {
        // 기존 값이 있으면 유지
        finalSettings.bgm = existingSettings.bgm
      } else {
        // 기존 값이 없으면 기본값 설정
        finalSettings.bgm = 'off'
      }
    }

    const { data, error } = await supabase
      .from('page_settings')
      .upsert(
        {
          page_id: effectivePageId,
          ...finalSettings,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'page_id' }
      )
      .select()
      .single()

    console.log('Supabase upsert result:', { data, error })

    if (error) throw error

    return res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return res.status(500).json({
      success: false,
      error: '설정 업데이트 중 오류가 발생했습니다',
      message: error && error.message ? error.message : String(error),
      details: error && error.details ? error.details : undefined,
      hint: error && error.hint ? error.hint : undefined,
      code: error && error.code ? error.code : undefined
    })
  }
}

async function handleGetTransport(req, res) {
  let { pageId } = req.query

  // GET이라도 Authorization 헤더가 있으면 검증 후 admin_users.page_id를 우선 사용
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = validateToken(token)
      if (decoded?.userId) {
        const { data: adminUser, error: adminErr } = await supabase
          .from('admin_users')
          .select('id, page_id')
          .eq('id', decoded.userId)
          .single()
        if (!adminErr && adminUser?.page_id) {
          pageId = adminUser.page_id
        }
      }
    }
  } catch (_) {}

  if (!pageId) {
    return res.status(400).json({
      success: false,
      error: 'pageId is required'
    })
  }

  try {
    // transport_infos 테이블에서 교통편 정보 조회
    const { data: transportData, error: transportError } = await supabase
      .from('transport_infos')
      .select('*')
      .eq('page_id', pageId)
      .order('display_order')

    if (transportError && transportError.code !== 'PGRST116') {
      console.error('Transport query error:', transportError)
    }

    // page_settings에서 장소명과 주소 조회
    const { data: settingsData, error: settingsError } = await supabase
      .from('page_settings')
      .select('transport_location_name, venue_address')
      .eq('page_id', pageId)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Settings query error:', settingsError)
    }

    return res.json({
      success: true,
      data: transportData || [],
      locationName: settingsData?.transport_location_name || '',
      venue_address: settingsData?.venue_address || ''
    })
  } catch (error) {
    console.error('Get transport error:', error)
    return res.status(500).json({
      success: false,
      error: '교통편 조회 중 오류가 발생했습니다'
    })
  }
}

async function handleUpdateTransport(req, res, validatedUser) {
  const { pageId, items, locationName, venue_address } = req.body

  console.log('[handleUpdateTransport] 요청 시작:', {
    hasPageId: !!pageId,
    hasItems: Array.isArray(items),
    itemsCount: Array.isArray(items) ? items.length : 0,
    locationName,
    venue_address,
    hasValidatedUser: !!validatedUser
  })

  try {
    // 1) 사용자 인증 확인
    const userId = validatedUser?.userId
    if (!userId) {
      console.error('[handleUpdateTransport] 인증 실패: validatedUser 없음')
      return res.status(401).json({ 
        success: false, 
        error: '인증 사용자 정보를 찾을 수 없습니다' 
      })
    }

    // 2) pageId 결정: body에서 제공되면 사용, 없으면 사용자의 page_id 조회
    let effectivePageId = pageId

    if (!effectivePageId) {
      console.log('[handleUpdateTransport] pageId가 없어서 사용자 page_id 조회 중')
      const { data: adminUser, error: adminErr } = await supabase
        .from('admin_users')
        .select('id, page_id')
        .eq('id', userId)
        .single()

      if (adminErr) {
        console.error('[handleUpdateTransport] admin_users 조회 실패:', adminErr)
        throw adminErr
      }

      effectivePageId = adminUser?.page_id
      if (!effectivePageId) {
        console.error('[handleUpdateTransport] page_id가 없음:', { userId })
        return res.status(400).json({ 
          success: false, 
          error: '이 사용자에게 page_id가 부여되지 않았습니다' 
        })
      }
    }

    console.log('[handleUpdateTransport] effectivePageId:', effectivePageId)

    // 3) transport_infos 테이블 업데이트
    if (Array.isArray(items)) {
      console.log('[handleUpdateTransport] transport_infos 업데이트 시작:', items.length)
      // 기존 데이터 삭제
      const { error: deleteError } = await supabase
        .from('transport_infos')
        .delete()
        .eq('page_id', effectivePageId)

      if (deleteError) {
        console.error('[handleUpdateTransport] transport_infos 삭제 실패:', deleteError)
        // 삭제 실패는 경고만 하고 계속 진행
      }

      // 새 데이터 삽입
      if (items.length > 0) {
        const transportItems = items.map((item, index) => ({
          page_id: effectivePageId,
          title: item.title || '',
          description: item.description || '',
          display_order: item.display_order || index + 1
        }))

        const { error: insertError } = await supabase
          .from('transport_infos')
          .insert(transportItems)

        if (insertError) {
          console.error('[handleUpdateTransport] transport_infos 삽입 실패:', insertError)
          throw insertError
        }
        console.log('[handleUpdateTransport] transport_infos 삽입 성공')
      }
    }

    // 4) page_settings에 장소명과 주소 저장
    // 실제 값이 있을 때만 저장 (빈 문자열은 저장하지 않음)
    const updateData = {
      updated_at: new Date().toISOString()
    }

    // locationName이 실제 값이 있을 때만 저장 (빈 문자열이 아닐 때)
    if (locationName && typeof locationName === 'string' && locationName.trim() !== '') {
      updateData.transport_location_name = locationName.trim()
      console.log('[handleUpdateTransport] transport_location_name 저장:', locationName.trim())
    }

    // venue_address가 실제 값이 있을 때만 저장 (빈 문자열이 아닐 때)
    if (venue_address && typeof venue_address === 'string' && venue_address.trim() !== '') {
      updateData.venue_address = venue_address.trim()
      console.log('[handleUpdateTransport] venue_address 저장:', venue_address.trim())
    }

    if (req.body.venue_name_kr && typeof req.body.venue_name_kr === 'string' && req.body.venue_name_kr.trim() !== '') {
      updateData.venue_name_kr = req.body.venue_name_kr.trim()
    }

    // bgm 필드 처리: body에 있으면 사용, 없으면 기존 값 유지
    // 참고: bgm은 NOT NULL이지만, upsert 시 기존 레코드가 있으면 포함하지 않아도 기존 값이 유지됨
    if (Object.prototype.hasOwnProperty.call(req.body, 'bgm')) {
      updateData.bgm = req.body.bgm
    } else {
      // 기존 레코드가 있는지 확인하여 기존 값 유지
      const { data: existingSettings, error: selectError } = await supabase
        .from('page_settings')
        .select('bgm')
        .eq('page_id', effectivePageId)
        .maybeSingle()

      if (selectError && selectError.code !== 'PGRST116') {
        // 조회 에러 발생 시: bgm을 포함하지 않음
        // upsert 시 기존 레코드가 있으면 기존 값 유지, 없으면 에러 발생 가능
        console.warn('[handleUpdateTransport] bgm 조회 실패:', selectError)
      } else if (existingSettings) {
        // 기존 레코드가 있으면 bgm을 포함하지 않아도 upsert 시 기존 값 유지됨
        console.log('[handleUpdateTransport] 기존 레코드 존재, bgm 기존 값 유지')
      } else {
        // 기존 레코드가 없는 경우: 
        // 교통편 정보 저장 시점에는 일반적으로 레코드가 이미 존재함 (handleGetSettings에서 생성)
        // 만약 정말 없고 에러가 발생하면, 클라이언트에서 bgm을 포함하여 재시도하거나
        // handleGetSettings를 먼저 호출하여 레코드를 생성한 후 재시도
        console.log('[handleUpdateTransport] 기존 레코드 없음, bgm 미포함 (upsert 시 에러 가능하지만 일반적으로 레코드 존재)')
      }
      // bgm을 updateData에 포함하지 않음 → upsert 시 기존 값 유지
    }

    // 업데이트할 필드가 있으면 page_settings 업데이트
    console.log('[handleUpdateTransport] page_settings 업데이트 시작:', updateData)
    const { data: upsertData, error: updateError } = await supabase
      .from('page_settings')
      .upsert(
        {
          page_id: effectivePageId,
          ...updateData
        },
        { onConflict: 'page_id' }
      )
      .select()
      .single()

    if (updateError) {
      console.error('[handleUpdateTransport] page_settings 업데이트 실패:', updateError)
      throw updateError
    }

    console.log('[handleUpdateTransport] page_settings 업데이트 성공:', {
      transport_location_name: upsertData?.transport_location_name,
      venue_address: upsertData?.venue_address
    })

    return res.json({
      success: true,
      message: '교통편 정보가 저장되었습니다',
      data: {
        transport_location_name: upsertData?.transport_location_name,
        venue_address: upsertData?.venue_address
      }
    })
  } catch (error) {
    console.error('[handleUpdateTransport] 전체 에러:', error)
    return res.status(500).json({
      success: false,
      error: '교통편 저장 중 오류가 발생했습니다',
      message: error?.message || String(error),
      details: error?.details || undefined,
      hint: error?.hint || undefined,
      code: error?.code || undefined
    })
  }
}

async function handleGetInfo(req, res, validatedUser) {
  let { pageId } = req.query

  // GET이라도 Authorization 헤더가 있으면 검증 후 admin_users.page_id를 우선 사용
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = validateToken(token)
      if (decoded?.userId) {
        const { data: adminUser, error: adminErr } = await supabase
          .from('admin_users')
          .select('id, page_id')
          .eq('id', decoded.userId)
          .single()
        if (!adminErr && adminUser?.page_id) {
          pageId = adminUser.page_id
        }
      }
    }
  } catch (_) {}

  if (!pageId) {
    return res.status(400).json({
      success: false,
      error: 'pageId is required'
    })
  }

  try {
    // page_settings에서 info 토글 상태 조회
    const { data: settingsData, error: settingsError } = await supabase
      .from('page_settings')
      .select('info')
      .eq('page_id', pageId)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Settings query error:', settingsError)
    }

    // info가 'off'인 경우:
    // - 공개 요청(Authorization 없음/무효)에서는 기존대로 숨김 유지
    // - 관리자 요청(Authorization 유효)에서는 저장된 rows를 반환하여 편집 가능하게 함
    if (settingsData?.info === 'off' && !validatedUser) {
      return res.json({
        success: true,
        data: []
      })
    }

    // info_item 테이블에서 안내 사항 정보 조회
    const { data: infoData, error: infoError } = await supabase
      .from('info_item')
      .select('*')
      .eq('page_id', pageId)
      .order('display_order')

    if (infoError && infoError.code !== 'PGRST116') {
      console.error('Info query error:', infoError)
    }

    return res.json({
      success: true,
      data: infoData || []
    })
  } catch (error) {
    console.error('Get info error:', error)
    return res.status(500).json({
      success: false,
      error: '안내 사항 조회 중 오류가 발생했습니다'
    })
  }
}

async function handleUpdateInfo(req, res, validatedUser) {
  const { pageId, items } = req.body

  try {
    // 1) 사용자 인증 확인
    const userId = validatedUser?.userId
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '인증 사용자 정보를 찾을 수 없습니다'
      })
    }

    // 2) pageId 결정: body에서 제공되면 사용, 없으면 사용자의 page_id 조회
    let effectivePageId = pageId

    if (!effectivePageId) {
      const { data: adminUser, error: adminErr } = await supabase
        .from('admin_users')
        .select('id, page_id')
        .eq('id', userId)
        .single()

      if (adminErr) {
        throw adminErr
      }

      effectivePageId = adminUser?.page_id
      if (!effectivePageId) {
        return res.status(400).json({
          success: false,
          error: '이 사용자에게 page_id가 부여되지 않았습니다'
        })
      }
    }

    // 3) info_item 테이블 업데이트
    if (Array.isArray(items)) {
      // 기존 데이터 삭제
      await supabase
        .from('info_item')
        .delete()
        .eq('page_id', effectivePageId)

      // 새 데이터 삽입
      if (items.length > 0) {
        const infoItems = items.map((item, index) => ({
          page_id: effectivePageId,
          title: item.title || '',
          description: item.description || '',
          display_order: item.display_order || index + 1
        }))

        const { error: insertError } = await supabase
          .from('info_item')
          .insert(infoItems)

        if (insertError) {
          console.error('Info insert error:', insertError)
          throw insertError
        }
      }
    }

    return res.json({
      success: true,
      message: '안내 사항 정보가 저장되었습니다'
    })
  } catch (error) {
    console.error('Update info error:', error)
    return res.status(500).json({
      success: false,
      error: '안내 사항 저장 중 오류가 발생했습니다',
      message: error?.message || String(error)
    })
  }
}

// 승인 시 웨딩 정보 복사 함수
async function handleApprovalUpdateSettings(req, res, validatedUser) {
  const { settings } = req.body

  if (!settings) {
    return res.status(400).json({
      success: false,
      error: 'settings is required'
    })
  }

  try {
    // 승인 시에는 page_id를 직접 받아서 처리
    const { pageId } = req.query

    if (!pageId) {
      return res.status(400).json({
        success: false,
        error: 'pageId is required for approval update'
      })
    }

    // 승인 시에만 복사할 웨딩 정보 필드들
    const weddingFields = ['wedding_date', 'groom_name_en', 'bride_name_en']
    
    let sanitized = Object.fromEntries(
      Object.entries(settings || {}).filter(([key]) => weddingFields.includes(key))
    )

    // 빈 문자열 날짜는 NULL로 저장
    if (Object.prototype.hasOwnProperty.call(sanitized, 'wedding_date')) {
      if (sanitized.wedding_date === '') {
        sanitized.wedding_date = null
      }
    }

    console.log('Approval wedding info copy:', { pageId, sanitized })

    // 기존 데이터 확인
    const { data: existingData, error: selectError } = await supabase
      .from('page_settings')
      .select('wedding_date, groom_name_en, bride_name_en')
      .eq('page_id', pageId)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError
    }

    // 기존 데이터가 있으면 웨딩 정보는 덮어쓰지 않음
    const finalSettings = { ...sanitized }
    if (existingData) {
      if (existingData.wedding_date && finalSettings.wedding_date) {
        delete finalSettings.wedding_date
      }
      if (existingData.groom_name_en && finalSettings.groom_name_en) {
        delete finalSettings.groom_name_en
      }
      if (existingData.bride_name_en && finalSettings.bride_name_en) {
        delete finalSettings.bride_name_en
      }
    }

    // 업데이트할 필드가 없으면 성공으로 처리
    if (Object.keys(finalSettings).length === 0) {
      return res.json({
        success: true,
        message: '웨딩 정보가 이미 존재하여 덮어쓰지 않았습니다',
        data: existingData
      })
    }

    const { data, error } = await supabase
      .from('page_settings')
      .upsert(
        {
          page_id: pageId,
          ...finalSettings,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'page_id' }
      )
      .select()
      .single()

    console.log('Approval upsert result:', { data, error })

    if (error) throw error

    return res.json({
      success: true,
      message: '웨딩 정보가 성공적으로 복사되었습니다',
      data
    })
  } catch (error) {
    console.error('Approval update settings error:', error)
    return res.status(500).json({
      success: false,
      error: '승인 시 웨딩 정보 복사 중 오류가 발생했습니다',
      message: error && error.message ? error.message : String(error)
    })
  }
}

function validateToken(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))

    // 토큰 만료 확인
    if (Date.now() > decoded.expires) {
      return null
    }

    // 추가 검증 로직 (필요시)
    if (!decoded.userId || !decoded.username) {
      return null
    }

    return decoded
  } catch (error) {
    console.error('Token validation error:', error)
    return null
  }
} 