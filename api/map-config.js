module.exports = async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  // 캐시 방지
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
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


