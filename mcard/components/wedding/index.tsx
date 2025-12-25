'use client'

/**
 * Wedding Components - Final_v1 컴포넌트들의 Next.js 래퍼
 * 
 * 각 컴포넌트는 pageId를 받아서 PROXY API에서 데이터를 가져옵니다.
 * typography는 클라이언트 사이드에서 동적으로 로드됩니다.
 */

import React, { useEffect, useState, Suspense, ComponentType } from 'react'
import dynamic from 'next/dynamic'
import { loadTypography } from '@/lib/typography'

// 컴포넌트 로딩 fallback
const ComponentLoader = () => (
  <div style={{
    width: '100%',
    padding: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    <div style={{ 
      width: '24px', 
      height: '24px', 
      border: '2px solid #f0f0f0',
      borderTop: '2px solid #333',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)

// 컴포넌트 에러 fallback
const ComponentError = ({ name }: { name: string }) => (
  <div style={{
    width: '100%',
    padding: '20px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
  }}>
    {name} 로드 실패
  </div>
)

// 공통 props 타입
interface BaseComponentProps {
  pageId: string
  style?: React.CSSProperties
}

// Typography 초기화 래퍼
export function useTypographyInit() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    loadTypography().then(() => {
      setIsReady(true)
    })
  }, [])

  return isReady
}

// 컴포넌트 래퍼 HOC
function withTypography<P extends BaseComponentProps>(
  WrappedComponent: ComponentType<P>,
  componentName: string
) {
  return function TypographyWrapper(props: P) {
    const isReady = useTypographyInit()
    
    if (!isReady) {
      return <ComponentLoader />
    }

    return (
      <Suspense fallback={<ComponentLoader />}>
        <WrappedComponent {...props} />
      </Suspense>
    )
  }
}

// Placeholder 컴포넌트 - 아직 연결되지 않은 컴포넌트용
// 원본 UI에 없던 요소가 페이지에 노출되지 않도록, 화면에는 렌더링하지 않습니다.
export const PlaceholderComponent = ({
  name,
  pageId,
}: {
  name: string
  pageId: string
}) => {
  void name
  void pageId
  return null
}

// 컴포넌트 exports
export { ComponentLoader, ComponentError }







