import React, { useEffect, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

interface PageSettings {
    page_id: string
    photo_section_image_url?: string | null
    photo_section_image_public_url?: string | null
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

interface EternalMainPhotoProps {
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

// 이미지 URL 생성 헬퍼 함수 (간소화된 버전)
function buildImageUrlFromSettings(s: PageSettings | null): string | undefined {
    if (!s) return undefined
    const derived = s.photo_section_image_public_url as string | undefined
    if (derived) return derived
    const direct = s.photo_section_image_url || undefined
    if (!direct) return undefined
    // updated_at이 있으면 캐시 키로만 사용
    if (s.updated_at) {
        const sep = direct.includes("?") ? "&" : "?"
        const cacheKey = new Date(s.updated_at).getTime()
        return `${direct}${sep}v=${cacheKey}`
    }
    return direct
}

export default function EternalMainPhoto(props: EternalMainPhotoProps) {
    const { pageId, style } = props
    const [settings, setSettings] = useState<PageSettings | null>(null)

    // 페이지 설정 로드 (간소화된 버전)
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

    const imageUrl = buildImageUrlFromSettings(settings)

    return (
        <div
            style={{
                width: "100%",
                height: "223px",
                position: "relative",
                overflow: "hidden",
                ...style,
            }}
        >
            {imageUrl ? (
                <img
                    src={toTransformedUrl(imageUrl, {
                        width: 700, // 70% width에 대응하는 픽셀값 (반응형 고려)
                        height: 223,
                        quality: 80,
                        format: "jpg",
                        resize: "cover",
                    })}
                    alt="Main photo"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                    }}
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "#e0e0e0",
                    }}
                />
            )}
        </div>
    )
}

const defaultPhotoProps: EternalMainPhotoProps = {
    pageId: undefined,
}

EternalMainPhoto.defaultProps = defaultPhotoProps

addPropertyControls(EternalMainPhoto, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "",
        placeholder: "예: mypageid",
    },
})
