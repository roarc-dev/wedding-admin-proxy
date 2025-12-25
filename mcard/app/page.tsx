'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * 루트 페이지 - 기본 안내 또는 리다이렉트
 * 실제 청첩장은 /[pageId] 경로에서 렌더링됩니다.
 */
export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // 필요시 기본 페이지로 리다이렉트
    // router.push('/demo')
  }, [router])

  return (
    <div className="mcard-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '40px 20px',
      textAlign: 'center',
    }}>
      <div style={{ marginBottom: '40px' }}>
        <img 
          src="https://cdn.roarc.kr/data/roarc_pavicon_B.png" 
          alt="roarc" 
          style={{ width: '60px', height: '60px' }}
        />
      </div>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: '600', 
        color: '#333',
        marginBottom: '16px',
      }}>
        roarc mobile card
      </h1>
      <p style={{ 
        fontSize: '16px', 
        color: '#666',
        lineHeight: '1.6',
      }}>
        고유 주소로 접속해 주세요.
        <br />
        예: card.roarc.kr/YYMMDD/page-id (예: card.roarc.kr/261221/minjunseoyun)
      </p>
    </div>
  )
}







