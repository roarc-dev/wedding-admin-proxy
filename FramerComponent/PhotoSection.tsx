import React, { useEffect, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

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

async function getPageSettingsByPageId(pageId: string): Promise<PageSettings | null> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        })
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

interface PhotoSectionProps {
    pageId?: string
    imageUrl?: string | null
    displayDateTime?: string
    location?: string
    useOverrideDateTime?: boolean
    useOverrideLocation?: boolean
    useOverrideOverlayTextColor?: boolean
    useOverrideOverlayPosition?: boolean
    useOverrideLocale?: boolean
    overlayPosition?: "top" | "bottom"
    overlayTextColor?: "#ffffff" | "#000000"
    locale?: "en" | "ko"
    style?: React.CSSProperties
}

export default function PhotoSection(props: PhotoSectionProps) {
    const {
        pageId,
        imageUrl,
        displayDateTime,
        location,
        useOverrideDateTime = false,
        useOverrideLocation = false,
        useOverrideOverlayTextColor = false,
        useOverrideOverlayPosition = false,
        useOverrideLocale = false,
        overlayPosition,
        overlayTextColor,
        locale = "en",
        style,
    } = props

    const [settings, setSettings] = useState<PageSettings | null>(null)
    const [version, setVersion] = useState<number>(0)

    // 페이지 설정 로드
    useEffect(() => {
        let mounted = true
        async function load() {
            if (!pageId) {
                setSettings(null)
                setVersion((v) => v + 1)
                return
            }
            const data = await getPageSettingsByPageId(pageId)
            if (!mounted) return
            setSettings(data)
            setVersion((v) => v + 1)
        }
        load()
        return () => {
            mounted = false
        }
    }, [pageId])

    // Admin.tsx와 동일 형식으로 날짜/시간 문자열 생성
    const buildDisplayDateTimeFromSettings = (s: PageSettings | null, effectiveLocale: 'en' | 'kr'): string => {
        if (!s || !s.wedding_date) return ""
        try {
            const [y, m, d] = s.wedding_date.split('-').map((v) => parseInt(v, 10))
            if (!y || !m || !d) return ""
            const dt = new Date(y, m - 1, d)
            const year = y.toString()
            const mm = m.toString().padStart(2, '0')
            const dd = d.toString().padStart(2, '0')
            const weekdayIdx = dt.getDay()
            const weekdayEn = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][weekdayIdx]
            const weekdayKr = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][weekdayIdx]
            const hour24 = parseInt(s.wedding_hour || '0', 10)
            const periodEn = hour24 < 12 ? 'AM' : 'PM'
            const periodKr = hour24 < 12 ? '오전' : '오후'
            const hour12 = ((hour24 % 12) === 0 ? 12 : (hour24 % 12))
            const isEn = effectiveLocale === 'en'
            if (isEn) {
                return `${year}. ${mm}. ${dd}. ${weekdayEn}. ${hour12} ${periodEn}`
            }
            return `${year}. ${mm}. ${dd}. ${weekdayKr} ${periodKr} ${hour12}시`
        } catch {
            return ""
        }
    }

    // Settings 기반 이미지 URL 생성
    const buildImageUrlFromSettings = (s: PageSettings | null): string | undefined => {
        if (!s) return undefined
        const derived = (s as any).photo_section_image_public_url as string | undefined
        if (derived) return derived
        const direct = s.photo_section_image_url || undefined
        const fromPath = s.photo_section_image_path
            ? `https://yjlzizakdjghpfduxcki.supabase.co/storage/v1/object/public/images/${s.photo_section_image_path}`
            : undefined
        const base = direct || fromPath
        if (!base) return undefined
        const sep = base.includes("?") ? "&" : "?"
        // updated_at이 있으면 캐시 키로 사용
        const cacheKey = s.updated_at ? new Date(s.updated_at).getTime() : Date.now()
        return `${base}${sep}v=${cacheKey}-${version}`
    }

    const effectiveImageUrl = imageUrl ?? buildImageUrlFromSettings(settings)
    const effectiveLocale: 'en' | 'kr' = useOverrideLocale
        ? (locale === 'en' ? 'en' : 'kr')
        : ((settings?.photo_section_locale === 'en') ? 'en' : 'kr')
    const effectiveDisplayDateTime = useOverrideDateTime
        ? (displayDateTime || "")
        : buildDisplayDateTimeFromSettings(settings, effectiveLocale)
    const effectiveLocation = useOverrideLocation
        ? (location || undefined)
        : (settings?.venue_name || undefined)
    // overlayPosition 우선순위: 수동 입력 Yes일 때만 props 사용, 그 외에는 settings > 기본값
    const effectiveOverlayPosition = useOverrideOverlayPosition
        ? (overlayPosition || "bottom")
        : (settings?.photo_section_overlay_position || "bottom")
    const effectiveOverlayTextColor = useOverrideOverlayTextColor
        ? (overlayTextColor || "#ffffff")
        : (settings?.photo_section_overlay_color || "#ffffff")

    return (
        <div
            style={{
                width: "100%",
                height: "640px",
                position: "relative",
                overflow: "hidden",
                ...style,
            }}
        >
            {effectiveImageUrl ? (
                <img
                    src={effectiveImageUrl}
                    alt="Wedding couple"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                    }}
                />
            ) : (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f5f5f5",
                        color: "#6b7280",
                        fontFamily: "'Pretendard Regular', sans-serif",
                        fontSize: 14,
                        letterSpacing: 0.2,
                    }}
                >
                    사진을 업로드 해주세요
                </div>
            )}
            {/* 날짜 및 장소 오버레이 */}
            {(effectiveDisplayDateTime || effectiveLocation) && (
                <div
                    style={{
                        position: "absolute",
                        width: "100%",
                        textAlign: "center",
                        color: effectiveOverlayTextColor,
                        fontFamily: "'Pretendard Regular', sans-serif",
                        fontSize: "15px",
                        lineHeight: "1.4",
                        zIndex: 10,
                        textShadow:
                            effectiveOverlayTextColor === "#ffffff"
                                ? "0px 1px 4px rgba(0, 0, 0, 0.25)"
                                : "none",
                        ...(effectiveOverlayPosition === "top"
                            ? { top: "40px" }
                            : { bottom: "40px" }),
                    }}
                >
                    {effectiveDisplayDateTime && (
                        <div style={{ marginBottom: "5px" }}>{effectiveDisplayDateTime}</div>
                    )}
                    {effectiveLocation && <div>{effectiveLocation}</div>}
                </div>
            )}
        </div>
    )
}

const defaultPhotoProps: PhotoSectionProps = {
    pageId: undefined,
    imageUrl: null,
    displayDateTime: "2025. 0. 00. SUN. 0 PM",
    location: "LOCATION",
    useOverrideDateTime: false,
    useOverrideLocation: false,
    useOverrideOverlayTextColor: false,
    useOverrideOverlayPosition: false,
    useOverrideLocale: false,
    overlayPosition: "bottom",
    overlayTextColor: "#ffffff",
    locale: "en",
}

PhotoSection.defaultProps = defaultPhotoProps

addPropertyControls(PhotoSection, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "",
        placeholder: "예: mypageid",
    },
    imageUrl: {
        type: ControlType.File,
        title: "이미지 업로드",
        allowedFileTypes: ["image/*"],
    },
    useOverrideDateTime: {
        type: ControlType.Boolean,
        title: "일시 수동 입력(Override)",
        defaultValue: false,
        /** Note: Boolean control in Framer does not support segmented titles */
    },
    displayDateTime: {
        type: ControlType.String,
        title: "예식 일시",
        defaultValue: "2025. 0. 00. SUN. 0 PM",
        placeholder: "예: 2025. 12. 25. SUN. 2 PM",
        hidden: (props: any) => !props.useOverrideDateTime,
    },
    useOverrideLocation: {
        type: ControlType.Boolean,
        title: "장소 수동 입력(Override)",
        defaultValue: false,
        /** Note: Boolean control in Framer does not support segmented titles */
    },
    location: {
        type: ControlType.String,
        title: "예식 장소",
        defaultValue: "LOCATION",
        placeholder: "예식장 이름을 입력하세요",
        hidden: (props: any) => !props.useOverrideLocation,
    },
    overlayPosition: {
        type: ControlType.Enum,
        title: "날짜/장소 위치",
        options: ["top", "bottom"],
        optionTitles: ["상단", "하단"],
        defaultValue: "bottom",
        displaySegmentedControl: true,
    },
    overlayTextColor: {
        type: ControlType.Enum,
        title: "오버레이 텍스트 색상",
        options: ["#ffffff", "#000000"],
        optionTitles: ["흰색", "검정"],
        defaultValue: "#ffffff",
        displaySegmentedControl: true,
        hidden: (props: any) => !props.useOverrideOverlayTextColor,
    },
    useOverrideOverlayTextColor: {
        type: ControlType.Boolean,
        title: "텍스트 색상 수동 입력(Override)",
        defaultValue: false,
    },
    useOverrideOverlayPosition: {
        type: ControlType.Boolean,
        title: "날짜/장소 위치 수동 입력(Override)",
        defaultValue: false,
    },
    useOverrideLocale: {
        type: ControlType.Boolean,
        title: "언어 수동 입력(Override)",
        defaultValue: false,
    },
    locale: {
        type: ControlType.Enum,
        title: "날짜/시간 언어",
        options: ["en", "ko"],
        optionTitles: ["영문", "한글"],
        defaultValue: "en",
        displaySegmentedControl: true,
        hidden: (props: any) => !props.useOverrideLocale,
    },
})
