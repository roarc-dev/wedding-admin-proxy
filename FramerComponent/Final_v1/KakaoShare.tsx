import React, { useEffect, useMemo, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js"

const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

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

function formatWeddingDate(weddingDate?: string): string {
    if (!weddingDate) return ""
    try {
        // "2025-12-06" 형태를 "251206"으로 변환
        const date = new Date(weddingDate)
        const year = date.getFullYear().toString().slice(-2) // 마지막 2자리
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const day = date.getDate().toString().padStart(2, "0")
        return `${year}${month}${day}`
    } catch {
        return ""
    }
}

function formatWeddingDateTime(settings: PageSettings): string {
    const { wedding_date, wedding_hour, wedding_minute } = settings

    if (!wedding_date) return "결혼식 정보를 확인해 주세요"

    try {
        const date = new Date(wedding_date)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()

        // 요일 계산
        const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]
        const dayOfWeek = dayNames[date.getDay()]

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
            return
        }
        let cancelled = false
        fetchPageSettings(pageId).then((data) => {
            if (!cancelled) setSettings(data)
        })
        return () => {
            cancelled = true
        }
    }, [pageId])

    const templateArgs = useMemo(() => {
        if (!settings) return null

        // Admin.tsx에서 이미 포맷팅된 정보를 그대로 사용
        const customTitle =
            settings.kko_title?.trim() ||
            `${settings.groom_name_kr || "신랑"} ♥ ${settings.bride_name_kr || "신부"} 결혼합니다`

        const customBody =
            settings.kko_date?.trim() || formatWeddingDateTime(settings)

        const imageUrl =
            settings.kko_img?.trim() || settings.photo_section_image_url || ""

        // 카카오 템플릿에서 ${REGI_WEB_DOMAIN}/${WEDDING_URL} 형태로 사용
        // REGI_WEB_DOMAIN: "https://mcard.roarc.kr/"
        // WEDDING_URL: 날짜/page_id 형태 (예: "251206/wedding-demo")
        const formattedDate = formatWeddingDate(settings.wedding_date)
        const pathWithDate = formattedDate ? `${formattedDate}/${pageId}` : pageId

        return {
            WEDDING_IMAGE: imageUrl,
            CUSTOM_TITLE: customTitle,
            CUSTOM_BODY: customBody,
            WEDDING_URL: pathWithDate, // 날짜/page_id 형태 전달
        }
    }, [settings])

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
