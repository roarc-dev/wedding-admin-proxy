'use client'

import React, { useMemo, useEffect } from 'react'
import type { PageSettings } from '@/lib/supabase'
import { ComponentType, DEFAULT_COMPONENT_ORDER } from '@/lib/components-registry'
// @ts-ignore
import typography from "@/lib/typography.js"

// 컴포넌트 imports
import BGM from '@/components/wedding/BGM'
import NameSection from '@/components/wedding/NameSection'
import PhotoSectionProxy from '@/components/wedding/PhotoSectionProxy'
import WeddingInvitationSection from '@/components/wedding/WeddingInvitationSection'
import CalendarSection from '@/components/wedding/CalendarSection'
import LocationUnified from '@/components/wedding/LocationUnified'
import CommentBoard from '@/components/wedding/CommentBoard'
import Account from '@/components/wedding/Account'
import Info from '@/components/wedding/Info'
import RSVPClient from '@/components/wedding/RSVPClient'
import KakaoShare from '@/components/wedding/KakaoShare'
import { PlaceholderComponent } from '@/components/wedding'
import MobileCoverAnimation from '@/components/wedding/mobileCover'

interface WeddingPageProps {
  pageSettings: PageSettings
}

/**
 * 청첩장 페이지 컴포넌트
 * 
 * - pageSettings에서 컴포넌트 순서를 읽어서 렌더링
 * - 각 컴포넌트에 pageId를 전달하여 API에서 데이터를 가져옴
 */
export default function WeddingPage({ pageSettings }: WeddingPageProps) {
  // 로컬 테스트용: "taehohoho"를 임시 pageId로 사용
  // 실제 운영 시에는 pageSettings.page_id를 사용
  const pageId =
    process.env.NODE_ENV === 'development' && pageSettings.page_id === 'taehohoho'
      ? 'taehohoho'
      : pageSettings.page_id

  // Typography 폰트 로딩 (페이지 레벨에서 한번만)
  useEffect(() => {
    try {
      if (typography && typeof typography.ensure === 'function') {
        typography.ensure()
      }
    } catch (error) {
      console.warn('[WeddingPage] Typography loading failed:', error)
    }
  }, [])

  // 컴포넌트 순서 결정 (설정에서 가져오거나 기본값 사용)
  const componentOrder = useMemo(() => {
    if (pageSettings.component_order && Array.isArray(pageSettings.component_order)) {
      return pageSettings.component_order as ComponentType[]
    }
    return DEFAULT_COMPONENT_ORDER
  }, [pageSettings.component_order])

  // 컴포넌트 렌더링 함수
  const renderComponent = (type: ComponentType, index: number) => {
    switch (type) {
      // 연결된 컴포넌트
      case 'bgm':
        return (
          <BGM
            key={`${type}-${index}`}
            pageId={pageId}
          />
        )
      case 'NameSection':
        return (
          <NameSection
            key={`${type}-${index}`}
            groomName={pageSettings.groom_name}
            brideName={pageSettings.bride_name}
            pageId={pageId}
            style={{ width: '88%' }}
          />
        )
      case 'PhotoSectionProxy':
        return (
          <PhotoSectionProxy
            key={`${type}-${index}`}
            pageId={pageId}
          />
        )
      case 'InviteName':
        return (
          <WeddingInvitationSection
            key={`${type}-${index}`}
            pageId={pageId}
          />
        )
      case 'CalendarProxy':
        return (
          <CalendarSection
            key={`${type}-${index}`}
            pageId={pageId}
          />
        )
      case 'LocationUnified':
        return (
          <LocationUnified
            key={`${type}-${index}`}
            pageId={pageId}
            style={{ width: '100%' }}
          />
        )
      case 'CommentBoard':
        return (
          <CommentBoard
            key={`${type}-${index}`}
            pageId={pageId}
          />
        )
      case 'Account':
        return (
          <Account
            key={`${type}-${index}`}
            pageId={pageId}
          />
        )
      case 'Info':
        return (
          <Info
            key={`${type}-${index}`}
            pageId={pageId}
          />
        )
      case 'RSVPClient':
        return (
          <RSVPClient
            key={`${type}-${index}`}
            pageId={pageId}
          />
        )
      case 'KakaoShare':
        return (
          <KakaoShare
            key={`${type}-${index}`}
            pageId={pageId}
            userUrl={pageSettings.user_url || ''}
          />
        )

      case 'InviteName':
        return (
          <WeddingInvitationSection
            key={`${type}-${index}`}
            pageId={pageId}
          />
        )

      // 아직 연결되지 않은 컴포넌트 - Placeholder로 표시
      case 'CalendarAddBtn':
      case 'UnifiedGalleryComplete':
      case 'rsvpResult':
      case 'CommentBoard':
      case 'KakaoShare':
      case 'bgm':
      case 'EternalDateVenue':
      case 'EternalMainPhoto':
      case 'EternalNameSection':
      case 'FioreDateVenue':
      case 'FioreNameSection':
      case 'P22TextComplete':
      case 'GoldenbookTextComplete':
      case 'PretendardBtnTxt':
        return (
          <PlaceholderComponent
            key={`${type}-${index}`}
            name={type}
            pageId={pageId}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="mcard-container" style={{ position: 'relative' }}>
      {/* 모바일 커버 오버레이 (컴포넌트 자체는 수정하지 않고, 페이지에서 위치만 제어) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          width: '100%',
          height: '1600px',
          pointerEvents: 'none',
        }}
      >
        <MobileCoverAnimation width={430} height={1600} />
      </div>

      {/* 컴포넌트들을 순서대로 렌더링 */}
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {componentOrder.map((type, index) => renderComponent(type, index))}
      </main>

      {/* 푸터 */}
      <footer style={{
        width: '100%',
        padding: '40px 30px',
        textAlign: 'center',
        background: '#fafafa',
      }}>
        <img src="https://cdn.roarc.kr/framer/logo/roarc_logotype.svg" alt="roarc" 
            style={{ 
                width: 'auto', 
                height: '10px', 
                marginBottom: '10px', 
                opacity: 0.3,
            }} />
        <div style={{
          fontSize: '12px',
          color: '#BABABA',
          letterSpacing: '0em',
          fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
          fontWeight: 400,
        }}>
          © roarc. all rights reseved.
        </div>
      </footer>
    </div>
  )
}

