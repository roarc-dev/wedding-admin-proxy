// 프록시 서버 URL (기존 API와 연동) - Supabase 직접 연결 대신 PROXY 사용
export const PROXY_BASE_URL = process.env.NEXT_PUBLIC_PROXY_URL || 'https://wedding-admin-proxy.vercel.app'

/**
 * 페이지 설정 데이터 타입
 */
export interface PageSettings {
  id: string
  page_id: string
  // NOTE: proxy(`wedding-admin-proxy`) 기준으로는 user_url이 없거나 userUrl 조회가 지원되지 않을 수 있어 optional 처리
  user_url?: string
  groom_name?: string
  bride_name?: string
  groom_name_en?: string
  bride_name_en?: string
  wedding_date?: string
  wedding_time?: string
  venue_name?: string
  venue_address?: string
  venue_lat?: number
  venue_lng?: number
  main_photo_url?: string
  component_order?: string[] // 컴포넌트 순서 배열
  theme?: string
  created_at?: string
  updated_at?: string
}

/**
 * user_url로 페이지 설정 조회
 *
 * @deprecated proxy API가 `userUrl` 파라미터를 지원하지 않는 경우가 있어, 현재는 page_id 조회로 폴백합니다.
 * - 호환성 목적: 기존 호출부 유지
 */
export async function getPageSettingsByUserUrl(userUrl: string, dateSegment?: string): Promise<PageSettings | null> {
  const normalized = userUrl?.trim()
  if (!normalized) return null
  try {
    const dateParam = dateSegment?.trim() ? `&date=${encodeURIComponent(dateSegment.trim())}` : ''
    const response = await fetch(
      `${PROXY_BASE_URL}/api/page-settings?userUrl=${encodeURIComponent(normalized)}${dateParam}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 60 },
      }
    )
    if (!response.ok) {
      // 하위호환: 일부 환경에서 userUrl 지원이 없을 수 있어 pageId로 재시도
      return await getPageSettingsByPageId(normalized)
    }
    const result = await response.json()
    if (result.success && result.data) {
      return result.data as PageSettings
    }
    return await getPageSettingsByPageId(normalized)
  } catch (error) {
    console.error('[getPageSettingsByUserUrl] Error:', error)
    return await getPageSettingsByPageId(normalized)
  }
}

/**
 * page_id로 페이지 설정 조회
 */
export async function getPageSettingsByPageId(pageId: string): Promise<PageSettings | null> {
  try {
    const response = await fetch(
      `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 60 },
      }
    )

    if (!response.ok) {
      console.error(`[getPageSettingsByPageId] HTTP ${response.status}`)
      return null
    }

    const result = await response.json()
    
    if (result.success && result.data) {
      return result.data as PageSettings
    }
    
    return null
  } catch (error) {
    console.error('[getPageSettingsByPageId] Error:', error)
    return null
  }
}

/**
 * wedding_date("YYYY-MM-DD") -> "YYMMDD" (예: "2026-12-21" => "261221")
 */
export function formatWeddingDateToSegment(isoDate: string): string | null {
  if (!isoDate) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim())
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const yy = String(year % 100).padStart(2, '0')
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${yy}${mm}${dd}`
}

/**
 * "YYMMDD" -> "YYYY-MM-DD"
 * - "261221" => "2026-12-21"
 */
export function parseDateSegmentToIso(dateSegment: string): string | null {
  const raw = dateSegment.trim()
  if (!/^\d{6}$/.test(raw)) return null
  const yy = Number(raw.slice(0, 2))
  const mm = Number(raw.slice(2, 4))
  const dd = Number(raw.slice(4, 6))
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null
  const yyyy = 2000 + yy
  const date = new Date(yyyy, mm - 1, dd)
  // 유효하지 않은 날짜(예: 02/31) 방지
  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) {
    return null
  }
  return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
}







