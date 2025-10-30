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

interface EternalDateVenueProps {
    pageId?: string
    style?: React.CSSProperties
    fontSize?: number
    lineHeight?: number
    fontWeight?: number
    fontColor?: string
    venueMarginBottom?: number
}

// 장소명을 Title Case로 변환하는 함수
function toTitleCase(str: string): string {
    return str
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
}

// 날짜를 '9th November 2025' 형식으로 변환하는 함수
function formatDateForDisplay(dateStr: string | null): string {
    if (!dateStr) return ""
    try {
        const [year, month, day] = dateStr
            .split("-")
            .map((v) => parseInt(v, 10))
        if (!year || !month || !day) return ""

        const date = new Date(year, month - 1, day)
        const dayWithSuffix = getDayWithSuffix(day)
        const monthName = getMonthName(date.getMonth())

        return `${dayWithSuffix} ${monthName} ${year}`
    } catch {
        return ""
    }
}

function getDayWithSuffix(day: number): string {
    if (day >= 11 && day <= 13) {
        return `${day}th`
    }
    switch (day % 10) {
        case 1:
            return `${day}st`
        case 2:
            return `${day}nd`
        case 3:
            return `${day}rd`
        default:
            return `${day}th`
    }
}

function getMonthName(monthIndex: number): string {
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]
    return months[monthIndex] || ""
}

export default function EternalDateVenue(props: EternalDateVenueProps) {
    const { 
        pageId, 
        style, 
        fontSize = 32, 
        lineHeight = 1.2, 
        fontWeight = 400, 
        fontColor = "#000", 
        venueMarginBottom = 8 
    } = props

    const [settings, setSettings] = useState<PageSettings | null>(null)

    // Typography 폰트 로딩 (Typekit 포함)
    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                // typography.ensure()는 Pretendard, P22, 그리고 Typekit(Goldenbook, Sloop Script Pro)을 모두 로드합니다
                typography.ensure()
            }
        } catch (error) {
            console.warn("[EternalDateVenue] Typography loading failed:", error)
        }
    }, [])

    // sloop-script-pro 폰트 스택 가져오기
    const sloopFontFamily = useMemo(() => {
        try {
            // typography.helpers.stacks.sloopScriptPro 사용
            if (typography?.helpers?.stacks?.sloopScriptPro) {
                return typography.helpers.stacks.sloopScriptPro
            }
            // fallback
            return '"sloop-script-pro", "Sloop Script Pro", sans-serif'
        } catch {
            return '"sloop-script-pro", "Sloop Script Pro", sans-serif'
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
        ? toTitleCase(settings.venue_name)
        : ""
    const formattedDate = formatDateForDisplay(settings?.wedding_date || null)

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100px",
                ...style,
            }}
        >
            {venueName && (
                <div
                    style={{
                        fontFamily: sloopFontFamily,
                        fontWeight: fontWeight,
                        fontStyle: "normal",
                        fontSize: `${fontSize}px`,
                        lineHeight: `${lineHeight}em`,
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
                        fontFamily: sloopFontFamily,
                        fontWeight: fontWeight,
                        fontStyle: "normal",
                        fontSize: `${fontSize}px`,
                        lineHeight: `${lineHeight}em`,
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

const defaultEternalDateVenueProps: EternalDateVenueProps = {
    pageId: undefined,
    fontSize: 32,
    lineHeight: 1.2,
    fontWeight: 400,
    fontColor: "#000",
    venueMarginBottom: 8,
}

EternalDateVenue.defaultProps = defaultEternalDateVenueProps

addPropertyControls(EternalDateVenue, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "",
        placeholder: "예: mypageid",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 32,
        min: 12,
        max: 72,
        step: 1,
        displayStepper: true,
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1.2,
        min: 0.8,
        max: 2.5,
        step: 0.1,
        displayStepper: true,
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Font Weight",
        defaultValue: 400,
        min: 100,
        max: 900,
        step: 100,
        displayStepper: true,
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
