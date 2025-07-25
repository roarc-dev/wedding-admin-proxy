export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

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
    // 환경변수에서 API 키 가져오기
    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyDcz9wJMld2rQqvgHEkD7Vx5ilHrLSVlWI"
    const tmapApiKey = process.env.TMAP_API_KEY || "l7xx7179ddde21ca4bfb8e6b03c710138f41"
    const naverClientId = process.env.NAVER_CLIENT_ID || "3cxftuac0e"

    return res.json({
      success: true,
      data: {
        googleMapsApiKey,
        tmapApiKey,
        naverClientId
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