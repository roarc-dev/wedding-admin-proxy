'use client'

/**
 * Typography 유틸리티 - CDN에서 폰트 스타일 로드
 */

// 전역 typography 객체 타입
interface Typography {
  ensure?: () => void
  helpers?: {
    stacks?: {
      pretendard?: string
      pretendardVariable?: string
      p22?: string
      goldenbook?: string
    }
  }
}

// 전역 typography 캐시
let typographyCache: Typography | null = null
let loadPromise: Promise<Typography | null> | null = null

// 기본 폰트 스택
export const DEFAULT_FONT_STACKS = {
  pretendard: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"',
  pretendardVariable: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"',
  p22: '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"',
  goldenbook: '"Goldenbook", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"',
}

/**
 * Typography 로드 함수
 */
export async function loadTypography(): Promise<Typography | null> {
  // 이미 로드됨
  if (typographyCache) return typographyCache

  // 로드 중
  if (loadPromise) return loadPromise

  // 서버 사이드에서는 null 반환
  if (typeof window === 'undefined') return null

  loadPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.roarc.kr/fonts/typography.js'
    script.async = true
    
    script.onload = () => {
      // window.typography가 설정되었는지 확인
      const typography = (window as unknown as { typography?: Typography }).typography
      if (typography) {
        typographyCache = typography
        if (typeof typography.ensure === 'function') {
          typography.ensure()
        }
        resolve(typography)
      } else {
        resolve(null)
      }
    }
    
    script.onerror = () => {
      console.warn('[Typography] Failed to load typography from CDN')
      resolve(null)
    }

    document.head.appendChild(script)
  })

  return loadPromise
}

/**
 * 폰트 스택 가져오기 (typography 로드 여부와 관계없이 안전하게)
 */
export function getFontStack(type: 'pretendard' | 'pretendardVariable' | 'p22' | 'goldenbook'): string {
  if (typographyCache?.helpers?.stacks) {
    return typographyCache.helpers.stacks[type] || DEFAULT_FONT_STACKS[type]
  }
  return DEFAULT_FONT_STACKS[type]
}







