import React, { useEffect, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=27c65dba30928cbbce6839678016d9ac"

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

interface PhotoSectionProxyProps {
    pageId?: string
    style?: React.CSSProperties
}

// Supabase public object URL -> render transform URL 생성 유틸
function toTransformedUrl(
    publicUrl: string,
    opts: {
        width?: number
        height?: number
        quality?: number
        format?: "webp" | "jpg" | "png"
        resize?: "cover" | "contain" | "fill"
    }
): string {
    if (!publicUrl) return publicUrl
    try {
        const url = new URL(publicUrl)
        const split = url.pathname.split("/storage/v1/object/")
        if (split.length !== 2) return publicUrl
        url.pathname = `/storage/v1/render/image/${split[1]}`
        const params = url.searchParams
        if (opts.width) params.set("width", String(opts.width))
        if (opts.height) params.set("height", String(opts.height))
        if (opts.quality) params.set("quality", String(opts.quality))
        if (opts.format) params.set("format", opts.format)
        if (opts.resize) params.set("resize", opts.resize)
        return url.toString()
    } catch {
        return publicUrl
    }
}

export default function PhotoSectionProxy(props: PhotoSectionProxyProps) {
    const {
        pageId,
        style,
    } = props

    const [settings, setSettings] = useState<PageSettings | null>(null)
    // 버전 키는 updated_at을 사용하고, 랜덤 증분은 제거 (캐시 히트 보존)

    // Typography 폰트 로딩
    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                typography.ensure()
            }
        } catch (error) {
            console.warn("[PhotoSectionProxy] Typography loading failed:", error)
        }
    }, [])

    // Pretendard 폰트 스택을 안전하게 가져오기
    const pretendardFontFamily = React.useMemo(() => {
        try {
            return typography?.helpers?.stacks?.pretendardVariable || '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
        } catch {
            return '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
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

    // Admin.tsx와 동일 형식으로 날짜/시간 문자열 생성
    const buildDisplayDateTimeFromSettings = (
        s: PageSettings | null,
        effectiveLocale: "en" | "kr"
    ): string => {
        if (!s || !s.wedding_date) return ""
        try {
            const [y, m, d] = s.wedding_date
                .split("-")
                .map((v) => parseInt(v, 10))
            if (!y || !m || !d) return ""
            const dt = new Date(y, m - 1, d)
            const year = y.toString()
            const mm = m.toString().padStart(2, "0")
            const dd = d.toString().padStart(2, "0")
            const weekdayIdx = dt.getDay()
            const weekdayEn = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][
                weekdayIdx
            ]
            const weekdayKr = [
                "일요일",
                "월요일",
                "화요일",
                "수요일",
                "목요일",
                "금요일",
                "토요일",
            ][weekdayIdx]
            const hour24 = parseInt(s.wedding_hour || "0", 10)
            const periodEn = hour24 < 12 ? "AM" : "PM"
            const periodKr = hour24 < 12 ? "오전" : "오후"
            const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
            const isEn = effectiveLocale === "en"
            if (isEn) {
                return `${year}. ${mm}. ${dd}. ${weekdayEn}. ${hour12} ${periodEn}`
            }
            return `${year}. ${mm}. ${dd}. ${weekdayKr} ${periodKr} ${hour12}시`
        } catch {
            return ""
        }
    }

    // Settings 기반 이미지 URL 생성
    const buildImageUrlFromSettings = (
        s: PageSettings | null
    ): string | undefined => {
        if (!s) return undefined
        const derived = (s as any).photo_section_image_public_url as
            | string
            | undefined
        if (derived) return derived
        const direct = s.photo_section_image_url || undefined
        const fromPath = s.photo_section_image_path
            ? `https://yjlzizakdjghpfduxcki.supabase.co/storage/v1/object/public/images/${s.photo_section_image_path}`
            : undefined
        const base = direct || fromPath
        if (!base) return undefined
        // updated_at이 있으면 캐시 키로만 사용 (랜덤 증분 제거)
        if (s.updated_at) {
            const sep = base.includes("?") ? "&" : "?"
            const cacheKey = new Date(s.updated_at).getTime()
            return `${base}${sep}v=${cacheKey}`
        }
        return base
    }

    const effectiveImageUrl = buildImageUrlFromSettings(settings)
    const effectiveLocale: "en" | "kr" = settings?.photo_section_locale === "en" ? "en" : "kr"
    const effectiveDisplayDateTime = buildDisplayDateTimeFromSettings(settings, effectiveLocale)
    const effectiveLocation = settings?.venue_name || undefined
    const effectiveOverlayPosition = settings?.photo_section_overlay_position || "bottom"
    const effectiveOverlayTextColor = settings?.photo_section_overlay_color || "#ffffff"

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
                (() => {
                    const base = effectiveImageUrl
                    const large = toTransformedUrl(base, {
                        width: 860,
                        quality: 80,
                        format: "jpg",
                        resize: "cover",
                    })
                    const small = toTransformedUrl(base, {
                        width: 430,
                        quality: 80,
                        format: "jpg",
                        resize: "cover",
                    })
                    const medium = toTransformedUrl(base, {
                        width: 640,
                        quality: 80,
                        format: "jpg",
                        resize: "cover",
                    })
                    const useTransform =
                        large !== base && small !== base && medium !== base
                    const srcSet = useTransform
                        ? [
                              `${small} 430w`,
                              `${medium} 640w`,
                              `${large} 860w`,
                          ].join(", ")
                        : undefined
                    return (
                        <img
                            src={base}
                            srcSet={srcSet}
                            sizes="(max-width: 430px) 100vw, 430px"
                            alt="Wedding couple"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: "center",
                            }}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                                const img =
                                    e.currentTarget as HTMLImageElement & {
                                        dataset?: any
                                    }
                                if (img.dataset?.fallbackDone === "1") return
                                if (!img.dataset) (img as any).dataset = {}
                                img.dataset.fallbackDone = "1"
                                img.srcset = ""
                                img.src = base
                            }}
                        />
                    )
                })()
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
                        fontFamily: pretendardFontFamily,
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
                        fontFamily: pretendardFontFamily,
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
                        <div style={{ marginBottom: "5px" }}>
                            {effectiveDisplayDateTime}
                        </div>
                    )}
                    {effectiveLocation && <div>{effectiveLocation}</div>}
                </div>
            )}
        </div>
    )
}

const defaultPhotoProps: PhotoSectionProxyProps = {
    pageId: undefined,
}

PhotoSectionProxy.defaultProps = defaultPhotoProps

addPropertyControls(PhotoSectionProxy, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "",
        placeholder: "예: mypageid",
    },
})
