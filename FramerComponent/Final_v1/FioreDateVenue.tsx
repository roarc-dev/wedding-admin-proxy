import React, { useEffect, useState, useMemo } from "react"
import { addPropertyControls, ControlType } from "framer"
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=93b9ecf6126b65d121cf207f509f7d07"

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

interface PageSettings {
    page_id: string
    groom_name_kr?: string
    groom_name_en?: string
    bride_name_kr?: string
    bride_name_en?: string
    wedding_date?: string | null
    wedding_hour?: string | null
    wedding_minute?: string | null
    venue_name?: string | null
    venue_address?: string | null
    photo_section_image_url?: string | null
    photo_section_image_path?: string | null
    photo_section_overlay_position?: "top" | "bottom" | null
    photo_section_overlay_color?: "#ffffff" | "#000000" | null
    photo_section_locale?: "en" | "kr" | null
    updated_at?: string | null
}

async function getPageSettingsByPageId(
    pageId: string
): Promise<PageSettings | null> {
    try {
        const response = await fetch(
            `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            }
        )
        if (!response.ok) {
            return null
        }
        const result = await response.json()
        if (result.success && result.data) return result.data as PageSettings
        return null
    } catch (error) {
        console.error("페이지 설정 조회 실패:", error)
        return null
    }
}

interface FioreDateVenueProps {
    pageId?: string
    style?: React.CSSProperties
    fontColor?: string
    venueMarginBottom?: number
}

// 날짜를 '2026. 1. 18. SAT. 12:30 PM' 형식으로 변환하는 함수
function formatDateForDisplay(
    dateStr: string | null,
    hour: string | null,
    minute: string | null
): string {
    if (!dateStr) return ""
    try {
        const [year, month, day] = dateStr
            .split("-")
            .map((v) => parseInt(v, 10))
        if (!year || !month || !day) return ""

        const date = new Date(year, month - 1, day)
        const dayOfWeek = getDayOfWeek(date.getDay())

        // 시간 포맷팅
        let timeStr = ""
        if (hour !== null && minute !== null) {
            const hourNum = parseInt(hour, 10)
            const minuteNum = parseInt(minute, 10)
            if (!isNaN(hourNum) && !isNaN(minuteNum)) {
                const period = hourNum >= 12 ? "PM" : "AM"
                const displayHour =
                    hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
                const displayMinute = minuteNum.toString().padStart(2, "0")
                timeStr = ` ${displayHour}:${displayMinute} ${period}`
            }
        }

        return `${year}. ${month}. ${day}. ${dayOfWeek}.${timeStr}`
    } catch {
        return ""
    }
}

function getDayOfWeek(dayIndex: number): string {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
    return days[dayIndex] || ""
}

export default function FioreDateVenue(props: FioreDateVenueProps) {
    const { pageId, style, fontColor = "#000", venueMarginBottom = 8 } = props

    const [settings, setSettings] = useState<PageSettings | null>(null)

    // Typography 폰트 로딩 (Typekit 포함)
    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                // typography.ensure()는 Pretendard, P22, 그리고 Typekit(Goldenbook, Sloop Script Pro)을 모두 로드합니다
                typography.ensure()
            }
        } catch (error) {
            console.warn("[FioreDateVenue] Typography loading failed:", error)
        }
    }, [])

    // P22 폰트 스택 가져오기
    const p22FontFamily = useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.p22 ||
                '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    // 페이지 설정 로드
    useEffect(() => {
        let mounted = true
        async function load() {
            if (!pageId) {
                setSettings(null)
                return
            }
            const data = await getPageSettingsByPageId(pageId)
            if (!mounted) return
            setSettings(data)
        }
        load()
        return () => {
            mounted = false
        }
    }, [pageId])

    // 장소명과 날짜 추출 및 변환
    const venueName = settings?.venue_name
        ? settings.venue_name.toUpperCase()
        : ""
    const formattedDate = formatDateForDisplay(
        settings?.wedding_date || null,
        settings?.wedding_hour || null,
        settings?.wedding_minute || null
    )

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                ...style,
            }}
        >
            {venueName && (
                <div
                    style={{
                        fontFamily: p22FontFamily,
                        fontWeight: 400,
                        fontStyle: "normal",
                        fontSize: "16px",
                        letterSpacing: "0em",
                        color: fontColor,
                        marginBottom: `${venueMarginBottom}px`,
                        textAlign: "center",
                    }}
                >
                    {venueName}
                </div>
            )}
            {formattedDate && (
                <div
                    style={{
                        fontFamily: p22FontFamily,
                        fontWeight: 400,
                        fontStyle: "normal",
                        fontSize: "16px",
                        letterSpacing: "0em",
                        color: fontColor,
                        textAlign: "center",
                    }}
                >
                    {formattedDate}
                </div>
            )}
        </div>
    )
}

const defaultFioreDateVenueProps: FioreDateVenueProps = {
    pageId: undefined,
    fontColor: "#000",
    venueMarginBottom: 8,
}

FioreDateVenue.defaultProps = defaultFioreDateVenueProps

addPropertyControls(FioreDateVenue, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "",
        placeholder: "예: mypageid",
    },
    fontColor: {
        type: ControlType.Color,
        title: "Font Color",
        defaultValue: "#000000",
    },
    venueMarginBottom: {
        type: ControlType.Number,
        title: "Venue Margin Bottom",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        displayStepper: true,
    },
})
