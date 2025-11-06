import React, { useEffect, useMemo } from "react"
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
        console.error("메타태그 설정 로딩 실패", error)
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
                brideName: data.bride_name || ""
            }
        }
    } catch (error) {
        console.error("초대장 데이터 로딩 실패", error)
    }
    return null
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

interface MetaTagsProps {
    pageId?: string
    defaultTitle?: string
    defaultDescription?: string
    defaultImage?: string
    siteName?: string
}

export default function MetaTags(props: MetaTagsProps) {
    const {
        pageId = "",
        defaultTitle = "결혼식 초대장",
        defaultDescription = "결혼식 초대장을 확인해보세요",
        defaultImage = "",
        siteName = "Roarc Wedding"
    } = props

    const [settings, setSettings] = React.useState<PageSettings | null>(null)
    const [inviteData, setInviteData] = React.useState<InviteData | null>(null)

    // Typography 폰트 로딩
    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                typography.ensure()
            }
        } catch (_) {}
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

    const metaData = useMemo(() => {
        if (!settings) {
            return {
                title: defaultTitle,
                description: defaultDescription,
                image: defaultImage,
            }
        }

        const title =
            settings.kko_title?.trim() ||
            `${inviteData?.groomName || ""} ♥ ${inviteData?.brideName || ""} 결혼합니다`

        const description =
            settings.kko_date?.trim() || formatWeddingDateTime(settings)

        const image =
            settings.kko_img?.trim() || settings.photo_section_image_url || defaultImage

        return {
            title,
            description,
            image,
        }
    }, [settings, inviteData, defaultTitle, defaultDescription, defaultImage])

    // 메타태그 업데이트
    useEffect(() => {
        if (typeof window === "undefined") return

        const updateMetaTag = (name: string, content: string, property?: boolean) => {
            const attribute = property ? "property" : "name"
            let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement

            if (element) {
                element.content = content
            } else {
                element = document.createElement("meta")
                element.setAttribute(attribute, name)
                element.content = content
                document.head.appendChild(element)
            }
        }

        // Open Graph 메타태그
        updateMetaTag("og:title", metaData.title, true)
        updateMetaTag("og:description", metaData.description, true)
        updateMetaTag("og:image", metaData.image, true)
        updateMetaTag("og:site_name", siteName, true)
        updateMetaTag("og:type", "website", true)

        // Twitter Card 메타태그
        updateMetaTag("twitter:card", "summary_large_image")
        updateMetaTag("twitter:title", metaData.title)
        updateMetaTag("twitter:description", metaData.description)
        updateMetaTag("twitter:image", metaData.image)

        // 기본 메타태그
        updateMetaTag("description", metaData.description)

        // 문서 타이틀 업데이트
        document.title = metaData.title

    }, [metaData, siteName])

    // 이 컴포넌트는 시각적으로 아무것도 렌더링하지 않음
    return null
}

addPropertyControls(MetaTags, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "",
        placeholder: "예: wedding-demo",
    },
    defaultTitle: {
        type: ControlType.String,
        title: "기본 타이틀",
        defaultValue: "결혼식 초대장",
    },
    defaultDescription: {
        type: ControlType.String,
        title: "기본 설명",
        defaultValue: "결혼식 초대장을 확인해보세요",
    },
    defaultImage: {
        type: ControlType.String,
        title: "기본 이미지 URL",
        defaultValue: "",
    },
    siteName: {
        type: ControlType.String,
        title: "사이트 이름",
        defaultValue: "Roarc Wedding",
    },
})
