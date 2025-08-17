import React, { useEffect, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

// 프록시 서버 URL
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

interface PageSettings {
    page_id: string
    page_title?: string
    page_description?: string
    page_url?: string
    photo_section_image_url?: string
    photo_section_image_path?: string
    groom_name_kr?: string
    bride_name_kr?: string
    wedding_date?: string
    venue_name?: string
    updated_at?: string
}

// 페이지 설정 로드
async function getPageSettings(pageId: string): Promise<PageSettings | null> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        })
        if (!response.ok) return null
        const result = await response.json()
        if (result.success && result.data) return result.data as PageSettings
        return null
    } catch (error) {
        console.error("페이지 설정 조회 실패:", error)
        return null
    }
}

// 이미지 비율 계산 및 최적화
function getOptimizedImageUrl(imageUrl: string, originalAspectRatio?: number): string {
    if (!imageUrl) return ""
    
    // 기본 비율 (2:3 = 0.67, 정사각형 = 1.0)
    const ratio = originalAspectRatio || 1.0
    let width = 400
    let height = 400
    
    if (ratio < 0.8) {
        // 세로가 긴 이미지 (2:3 비율)
        width = 400
        height = 600
    } else if (ratio > 1.2) {
        // 가로가 긴 이미지
        width = 600
        height = 400
    }
    // 정사각형에 가까운 이미지는 400x400 유지
    
    const separator = imageUrl.includes("?") ? "&" : "?"
    return `${imageUrl}${separator}width=${width}&height=${height}&quality=90&format=jpg`
}

// PhotoSection 이미지 URL 생성
function buildImageUrl(settings: PageSettings | null): string {
    if (!settings) return ""
    
    const derived = (settings as any).photo_section_image_public_url as string | undefined
    if (derived) return derived
    
    const direct = settings.photo_section_image_url
    const fromPath = settings.photo_section_image_path
        ? `https://yjlzizakdjghpfduxcki.supabase.co/storage/v1/object/public/images/${settings.photo_section_image_path}`
        : undefined
    
    const base = direct || fromPath
    if (!base) return ""
    
    const separator = base.includes("?") ? "&" : "?"
    const cacheKey = settings.updated_at ? new Date(settings.updated_at).getTime() : Date.now()
    return `${base}${separator}v=${cacheKey}`
}

interface KakaoShareProps {
    pageId?: string
    kakaoApiKey?: string
    buttonText?: string
    buttonStyle?: "default" | "custom"
    backgroundColor?: string
    textColor?: string
    borderRadius?: number
    padding?: number
    style?: React.CSSProperties
}

declare global {
    interface Window {
        Kakao: any
    }
}

export default function KakaoShare(props: KakaoShareProps) {
    const {
        pageId = "",
        kakaoApiKey = "",
        buttonText = "카카오톡 공유",
        buttonStyle = "default",
        backgroundColor = "#FEE500",
        textColor = "#000000",
        borderRadius = 8,
        padding = 12,
        style,
    } = props

    const [settings, setSettings] = useState<PageSettings | null>(null)
    const [isKakaoReady, setIsKakaoReady] = useState(false)
    const [loading, setLoading] = useState(false)

    // 페이지 설정 로드
    useEffect(() => {
        if (!pageId) return

        async function loadSettings() {
            const data = await getPageSettings(pageId)
            setSettings(data)
        }
        loadSettings()
    }, [pageId])

    // 카카오 SDK 초기화
    useEffect(() => {
        if (!kakaoApiKey) return

        // 카카오 SDK가 이미 로드되어 있는지 확인
        if (window.Kakao && window.Kakao.isInitialized()) {
            setIsKakaoReady(true)
            return
        }

        // 카카오 SDK 스크립트 로드
        const script = document.createElement("script")
        script.src = "https://developers.kakao.com/sdk/js/kakao.js"
        script.async = true
        script.onload = () => {
            if (window.Kakao) {
                window.Kakao.init(kakaoApiKey)
                setIsKakaoReady(true)
                console.log("카카오 SDK 초기화 완료")
            }
        }
        script.onerror = () => {
            console.error("카카오 SDK 로드 실패")
        }
        document.head.appendChild(script)

        return () => {
            document.head.removeChild(script)
        }
    }, [kakaoApiKey])

    // 카카오톡 공유 실행
    const handleKakaoShare = async () => {
        if (!isKakaoReady || !settings) {
            console.warn("카카오 SDK가 준비되지 않았거나 설정이 없습니다")
            return
        }

        setLoading(true)

        try {
            // 이미지 URL 생성
            const imageUrl = buildImageUrl(settings)
            const optimizedImageUrl = getOptimizedImageUrl(imageUrl)

            // 기본 제목과 설명 생성
            const defaultTitle = settings.groom_name_kr && settings.bride_name_kr 
                ? `${settings.groom_name_kr} ❤️ ${settings.bride_name_kr}의 결혼식`
                : "결혼식에 초대합니다"
            
            const defaultDescription = settings.wedding_date && settings.venue_name
                ? `${settings.wedding_date} ${settings.venue_name}에서 만나요!`
                : "특별한 순간을 함께해주세요"

            // 메시지 템플릿 데이터
            const templateData = {
                objectType: 'feed',
                content: {
                    title: settings.page_title || defaultTitle,
                    description: settings.page_description || defaultDescription,
                    imageUrl: optimizedImageUrl,
                    link: {
                        mobileWebUrl: settings.page_url || window.location.href,
                        webUrl: settings.page_url || window.location.href
                    }
                },
                buttons: [
                    {
                        title: '웹으로 보기',
                        link: {
                            mobileWebUrl: settings.page_url || window.location.href,
                            webUrl: settings.page_url || window.location.href
                        }
                    }
                ]
            }

            console.log("카카오톡 공유 데이터:", templateData)

            // 카카오톡 공유 실행
            window.Kakao.Link.sendDefault(templateData)

        } catch (error) {
            console.error("카카오톡 공유 실패:", error)
            alert("카카오톡 공유에 실패했습니다. 다시 시도해주세요.")
        } finally {
            setLoading(false)
        }
    }

    // 버튼 스타일
    const buttonStyles = {
        default: {
            backgroundColor: "#FEE500",
            color: "#000000",
            border: "none",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minWidth: "120px",
            transition: "all 0.2s ease",
        },
        custom: {
            backgroundColor,
            color: textColor,
            border: "none",
            borderRadius: `${borderRadius}px`,
            padding: `${padding}px`,
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minWidth: "120px",
            transition: "all 0.2s ease",
        }
    }

    const currentButtonStyle = buttonStyles[buttonStyle]

    return (
        <div style={{ ...style, display: "inline-block" }}>
            <button
                onClick={handleKakaoShare}
                disabled={!isKakaoReady || !settings || loading}
                style={{
                    ...currentButtonStyle,
                    opacity: (!isKakaoReady || !settings || loading) ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                    if (!loading && isKakaoReady && settings) {
                        e.currentTarget.style.transform = "scale(1.02)"
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)"
                }}
            >
                {/* 카카오톡 아이콘 */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 01-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                </svg>
                {loading ? "공유 중..." : buttonText}
            </button>
            
            {/* 상태 메시지 */}
            {!kakaoApiKey && (
                <div style={{ fontSize: "12px", color: "#ff6b6b", marginTop: "4px" }}>
                    카카오 API 키가 필요합니다
                </div>
            )}
            {!pageId && (
                <div style={{ fontSize: "12px", color: "#ff6b6b", marginTop: "4px" }}>
                    페이지 ID가 필요합니다
                </div>
            )}
        </div>
    )
}

addPropertyControls(KakaoShare, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "",
        placeholder: "예: mypageid",
    },
    kakaoApiKey: {
        type: ControlType.String,
        title: "카카오 API Key",
        defaultValue: "",
        placeholder: "카카오 개발자에서 발급받은 JavaScript 키",
    },
    buttonText: {
        type: ControlType.String,
        title: "버튼 텍스트",
        defaultValue: "카카오톡 공유",
    },
    buttonStyle: {
        type: ControlType.Enum,
        title: "버튼 스타일",
        options: ["default", "custom"],
        optionTitles: ["기본 (카카오 스타일)", "커스텀"],
        defaultValue: "default",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "배경색",
        defaultValue: "#FEE500",
        hidden: (props) => props.buttonStyle !== "custom",
    },
    textColor: {
        type: ControlType.Color,
        title: "텍스트 색상",
        defaultValue: "#000000",
        hidden: (props) => props.buttonStyle !== "custom",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "모서리 둥글기",
        defaultValue: 8,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
        hidden: (props) => props.buttonStyle !== "custom",
    },
    padding: {
        type: ControlType.Number,
        title: "내부 여백",
        defaultValue: 12,
        min: 4,
        max: 24,
        step: 2,
        unit: "px",
        hidden: (props) => props.buttonStyle !== "custom",
    },
})
