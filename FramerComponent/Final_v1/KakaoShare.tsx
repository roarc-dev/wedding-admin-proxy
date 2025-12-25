import React, { useEffect, useMemo, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js"

const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

// 날짜 문자열을 UTC 자정으로 파싱하는 헬퍼 함수 (타임존 독립적 처리)
function parseDateAsUTC(dateString: string): Date {
    // YYYY-MM-DD 형식의 날짜를 UTC 자정으로 파싱
    const date = new Date(dateString + 'T00:00:00.000Z');
    return date;
}

interface PageSettings {
    page_url?: string
    groom_name_kr?: string
    bride_name_kr?: string
    kko_img?: string
    kko_title?: string
    kko_date?: string
    photo_section_image_url?: string
    wedding_date?: string
    wedding_hour?: string
    wedding_minute?: string
}

interface InviteData {
    groomName?: string
    brideName?: string
}

async function fetchPageSettings(pageId: string): Promise<PageSettings | null> {
    if (!pageId) return null
    try {
        const res = await fetch(
            `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`
        )
        if (!res.ok) return null
        const json = await res.json()
        if (json?.success && json?.data) return json.data as PageSettings
    } catch (error) {
        console.error("카카오 공유 설정 로딩 실패", error)
    }
    return null
}

async function fetchInviteData(pageId: string): Promise<InviteData | null> {
    if (!pageId) return null
    try {
        const res = await fetch(
            `${PROXY_BASE_URL}/api/invite?pageId=${encodeURIComponent(pageId)}`
        )
        if (!res.ok) return null
        const json = await res.json()
        if (json?.success && json?.data) {
            const data = json.data
            return {
                groomName: data.groom_name || "",
                brideName: data.bride_name || "",
            }
        }
    } catch (error) {
        console.error("초대장 데이터 로딩 실패", error)
    }
    return null
}

function formatWeddingDate(weddingDate?: string): string {
    if (!weddingDate) return ""
    try {
        // "2025-12-06" 형태를 "251206"으로 변환 (타임존 독립적)
        const date = parseDateAsUTC(weddingDate)
        const year = date.getUTCFullYear().toString().slice(-2) // 마지막 2자리
        const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
        const day = date.getUTCDate().toString().padStart(2, "0")
        return `${year}${month}${day}`
    } catch {
        return ""
    }
}

function formatWeddingDateTime(settings: PageSettings): string {
    const { wedding_date, wedding_hour, wedding_minute } = settings

    if (!wedding_date) return "결혼식 정보를 확인해 주세요"

    try {
        // 타임존 독립적으로 날짜 파싱
        const date = parseDateAsUTC(wedding_date)
        const year = date.getUTCFullYear()
        const month = date.getUTCMonth() + 1
        const day = date.getUTCDate()

        // 요일 계산 (UTC 기준)
        const dayNames = [
            "일요일",
            "월요일",
            "화요일",
            "수요일",
            "목요일",
            "금요일",
            "토요일",
        ]
        const dayOfWeek = dayNames[date.getUTCDay()]

        // 시간 포맷팅 (12시간제)
        const hour = wedding_hour ? parseInt(wedding_hour) : null
        const minute = wedding_minute ? parseInt(wedding_minute) : null

        let timeText = ""
        if (hour !== null) {
            const period = hour >= 12 ? "오후" : "오전"
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
            timeText = `${period} ${displayHour}시`
            if (minute && minute > 0) {
                timeText += ` ${minute.toString().padStart(2, "0")}분`
            }
        }

        return `${year}년 ${month}월 ${day}일 ${dayOfWeek}${timeText ? ` ${timeText}` : ""}`.trim()
    } catch {
        return "결혼식 정보를 확인해 주세요"
    }
}

interface KakaoShareProps {
    pageId?: string
    templateId?: string
    style?: React.CSSProperties
}

declare global {
    interface Window {
        Kakao?: {
            isInitialized: () => boolean
            Share: {
                sendCustom: (options: {
                    templateId: number
                    templateArgs: Record<string, string>
                }) => void
            }
        }
    }
}

export default function KakaoShare(props: KakaoShareProps) {
    const { pageId = "", templateId = "", style } = props

    const [settings, setSettings] = useState<PageSettings | null>(null)
    const [inviteData, setInviteData] = useState<InviteData | null>(null)

    // Typography 폰트 로딩
    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                typography.ensure()
            }
        } catch (_) {}
    }, [])

    // Pretendard 폰트 스택을 안전하게 가져오기
    const pretendardFontFamily = useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.pretendardVariable ||
                '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    useEffect(() => {
        if (!pageId) {
            setSettings(null)
            setInviteData(null)
            return
        }
        let cancelled = false

        // page-settings 데이터 가져오기
        fetchPageSettings(pageId).then((data) => {
            if (!cancelled) setSettings(data)
        })

        // invite 데이터 가져오기
        fetchInviteData(pageId).then((data) => {
            if (!cancelled) setInviteData(data)
        })

        return () => {
            cancelled = true
        }
    }, [pageId])

    const templateArgs = useMemo(() => {
        if (!settings) return null

        // 신랑/신부 이름: inviteData 우선, 없으면 page_settings에서 가져옴
        const groomName =
            inviteData?.groomName?.trim() ||
            settings.groom_name_kr?.trim() ||
            ""
        const brideName =
            inviteData?.brideName?.trim() ||
            settings.bride_name_kr?.trim() ||
            ""

        // Admin.tsx에서 이미 포맷팅된 정보를 그대로 사용
        const customTitle =
            settings.kko_title?.trim() ||
            `${groomName} ♥ ${brideName} 결혼합니다`

        const customBody =
            settings.kko_date?.trim() || formatWeddingDateTime(settings)

        // 이미지 URL: kko_img 우선, 없으면 메인 사진 사용
        // 주의: photo_section_image_url은 AVIF일 수 있어 카카오톡에서 미지원
        // AVIF URL 감지하여 경고 로그 출력
        let imageUrl = settings.kko_img?.trim() || ""
        if (!imageUrl && settings.photo_section_image_url) {
            const photoUrl = settings.photo_section_image_url
            if (photoUrl.includes(".avif") || photoUrl.includes("/avif")) {
                console.warn(
                    "[KakaoShare] 카카오톡 공유용 이미지를 별도로 업로드해주세요."
                )
            }
            imageUrl = photoUrl
        }

        // 카카오 템플릿에서 ${REGI_WEB_DOMAIN}/${WEDDING_URL} 형태로 사용
        // REGI_WEB_DOMAIN: "https://mcard.roarc.kr/"
        // WEDDING_URL: 날짜/page_id 형태 (예: "251206/wedding-demo")
        const formattedDate = formatWeddingDate(settings.wedding_date)
        const pathWithDate = formattedDate
            ? `${formattedDate}/${pageId}`
            : pageId

        return {
            WEDDING_IMAGE: imageUrl,
            CUSTOM_TITLE: customTitle,
            CUSTOM_BODY: customBody,
            WEDDING_URL: pathWithDate, // 날짜/page_id 형태 전달
        }
    }, [settings, inviteData, pageId])

    const kakao = typeof window !== "undefined" ? window.Kakao : undefined

    const isReadyToShare =
        !!templateId &&
        !!pageId &&
        !!templateArgs &&
        !!kakao &&
        kakao.isInitialized()

    const handleShare = () => {
        if (!isReadyToShare || !templateArgs) {
            alert("카카오톡 공유를 위해 필요한 설정이 준비되지 않았습니다.")
            return
        }

        try {
            kakao!.Share.sendCustom({
                templateId: Number(templateId),
                templateArgs,
            })
        } catch (error) {
            console.error("카카오톡 공유 실패", error)
            alert("카카오톡 공유 중 오류가 발생했습니다.")
        }
    }

    return (
        <div style={{ display: "inline-block", ...(style || {}) }}>
            <button
                type="button"
                onClick={handleShare}
                disabled={!isReadyToShare}
                style={{
                    width: "100%",
                    height: "100%",
                    minWidth: 160,
                    minHeight: 44,
                    border: "none",
                    backgroundColor: "#e0e0e0",
                    color: "#000",
                    fontFamily: pretendardFontFamily,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: isReadyToShare ? "pointer" : "not-allowed",
                    opacity: isReadyToShare ? 1 : 0.6,
                }}
            >
                카카오톡으로 공유하기
            </button>
        </div>
    )
}

addPropertyControls(KakaoShare, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "",
        placeholder: "예: wedding-demo",
    },
    templateId: {
        type: ControlType.String,
        title: "Template ID",
        defaultValue: "",
        placeholder: "카카오 템플릿 ID",
    },
})
