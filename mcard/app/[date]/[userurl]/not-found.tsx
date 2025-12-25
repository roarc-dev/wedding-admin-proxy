'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="error-container">
      <div style={{ marginBottom: '20px' }}>
        <img
          src="https://cdn.roarc.kr/data/roarc_pavicon_B.png"
          alt="roarc"
          style={{ width: '48px', height: '48px', opacity: 0.5 }}
        />
      </div>
      <h1 className="error-title">페이지를 찾을 수 없습니다</h1>
      <p className="error-message">
        요청하신 청첩장이 존재하지 않거나
        <br />
        주소가 변경되었을 수 있습니다.
      </p>
      <Link
        href="/"
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          background: '#333',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '14px',
        }}
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}


