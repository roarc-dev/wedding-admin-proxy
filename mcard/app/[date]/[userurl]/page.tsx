import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import {
  formatWeddingDateToSegment,
  getPageSettingsByPageId,
  getPageSettingsByUserUrl,
  PageSettings,
  parseDateSegmentToIso,
} from '@/lib/supabase'
import WeddingPage from '@/components/WeddingPage'

interface PageProps {
  params: { date: string; userurl: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date, userurl } = params

  // 1) date+userurl 우선
  let pageSettings = await getPageSettingsByUserUrl(userurl, date)
  // 2) 폴백: userurl이 사실 page_id인 레거시 링크
  if (!pageSettings) {
    pageSettings = await getPageSettingsByPageId(userurl)
  }

  if (!pageSettings) {
    return {
      title: 'roarc mobile card',
      description: 'We make Romantic Art Creations',
    }
  }

  const groomName = pageSettings.groom_name || pageSettings.groom_name_en || ''
  const brideName = pageSettings.bride_name || pageSettings.bride_name_en || ''
  const title = groomName && brideName ? `${groomName} ♥ ${brideName} 결혼합니다` : 'roarc mobile card'

  const description = pageSettings.venue_name
    ? `${pageSettings.wedding_date || ''} ${pageSettings.venue_name}`
    : 'We make Romantic Art Creations'

  const image = pageSettings.main_photo_url || 'https://cdn.roarc.kr/data/roarc_SEO_basic.jpg'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

/**
 * URL: /[YYMMDD]/[userurl]
 * - page_id는 내부 키로 유지
 * - userurl은 유저가 편집 가능한 공개 주소
 */
export default async function Page({ params }: PageProps) {
  const { date, userurl } = params

  if (!userurl || userurl.length < 1) notFound()
  if (!date || date.length < 1) notFound()

  const isoFromSegment = parseDateSegmentToIso(date)
  if (!isoFromSegment) notFound()

  // 1) date+userurl 우선
  let pageSettings: PageSettings | null = await getPageSettingsByUserUrl(userurl, date)

  // 2) 폴백: userurl이 사실 page_id인 레거시 링크
  if (!pageSettings) {
    pageSettings = await getPageSettingsByPageId(userurl)
    if (!pageSettings) notFound()

    // user_url이 있으면 canonical로 리다이렉트
    if (pageSettings.user_url) {
      redirect(`/${encodeURIComponent(date)}/${encodeURIComponent(pageSettings.user_url)}`)
    }
  }

  const expectedSegment = pageSettings.wedding_date
    ? formatWeddingDateToSegment(pageSettings.wedding_date)
    : null

  if (expectedSegment && expectedSegment !== date) {
    redirect(`/${expectedSegment}/${encodeURIComponent(userurl)}`)
  }

  void isoFromSegment

  return <WeddingPage pageSettings={pageSettings} />
}


