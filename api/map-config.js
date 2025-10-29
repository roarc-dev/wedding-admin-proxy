module.exports = async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  // 캐시 방지
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Naver 지오코딩 API 프록시 처리
  if (req.method === 'POST') {
    try {
      const { query } = req.body

      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' })
      }

      // 환경 변수 확인
      const clientId = process.env.NCP_CLIENT_ID
      const clientSecret = process.env.NCP_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        console.error('Naver API 환경 변수가 설정되지 않았습니다')
        return res.status(500).json({
          error: "Naver API credentials not configured",
          details: {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret
          }
        })
      }

      console.log('Naver API 호출 시도:', query)

      // 네이버 지오코딩 API 호출 (서버에서 호출하니까 CORS 안 걸림)
      const naverRes = await fetch(
        `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            "X-NCP-APIGW-API-KEY-ID": clientId,
            "X-NCP-APIGW-API-KEY": clientSecret,
          },
        }
      )

      console.log('Naver API 응답 상태:', naverRes.status)

      if (!naverRes.ok) {
        const errorText = await naverRes.text()
        console.error('Naver API 에러:', errorText)
        return res.status(naverRes.status).json({
          error: "Naver API request failed",
          details: errorText
        })
      }

      const data = await naverRes.json()
      console.log('Naver API 응답 데이터:', data)

      // 프론트로 그대로 전달
      res.status(200).json(data)
    } catch (err) {
      console.error('Naver 지오코딩 API 호출 중 에러:', err)
      res.status(500).json({
        error: "geocoding failed",
        details: err.message
      })
    }
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    // 다양한 환경변수 키 네이밍을 모두 지원 (fallback)
    const pickEnv = (keys) => keys.map((k) => process.env[k]).find((v) => !!v) || ''

    const googleMapsApiKey = pickEnv([
      'GOOGLE_MAPS_API_KEY',
      'GOOGLE_MAPS_KEY',
      'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
      'NEXT_PUBLIC_GOOGLE_MAPS_KEY',
    ])

    const tmapApiKey = pickEnv([
      'TMAP_API_KEY',
      'NEXT_PUBLIC_TMAP_API_KEY',
      'NEXT_PUBLIC_TMAP_KEY',
    ])

    const naverMapsKey = pickEnv([
      'NAVER_MAPS_CLIENT_ID',
      'NAVER_CLIENT_ID',
      'NEXT_PUBLIC_NAVER_MAPS_KEY',
      'NEXT_PUBLIC_NAVER_CLIENT_ID',
    ])

    return res.json({
      success: true,
      data: {
        // 표준 키
        googleMapsApiKey,
        tmapApiKey,
        naverMapsKey,
        // 하위 호환 필드 (기존 코드에서 사용 가능성)
        googleMapsKey: googleMapsApiKey,
        naverClientId: naverMapsKey,
      }
    })
  } catch (error) {
    console.error('Map config error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to get map configuration'
    })
  }
}


