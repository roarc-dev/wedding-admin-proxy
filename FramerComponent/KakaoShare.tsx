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
    wedding_hour?: string
    wedding_minute?: string
    venue_name?: string
    updated_at?: string
    // 카카오톡 공유 관련 필드들
    kko_img?: string
    kko_title?: string
    kko_date?: string
}

// 페이지 설정 로드 (카카오톡 공유 관련 필드들 포함)
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

// Kakao 공유 호환성을 위해: 변환 URL 대신 공개 원본 URL을 그대로 사용
// - Kakao 서버에서 이미지 크롤링 시 일부 변환 파라미터/포맷에 따라 실패 가능성이 있어 안정 경로 우선
async function getOptimizedImageUrl(imageUrl: string): Promise<string> {
    return imageUrl || ""
}

// 카카오톡 공유 이미지 URL 생성 (kko_img 우선, PhotoSection 이미지 백업)
function buildImageUrl(settings: PageSettings | null): string {
    if (!settings) return ""

    // 1. 카카오톡 전용 이미지 우선 사용
    if (settings.kko_img) {
        return settings.kko_img
    }

    // 2. 백업: PhotoSection 이미지 사용
    const derived = (settings as any).photo_section_image_public_url as string | undefined
    if (derived) return derived

    const direct = settings.photo_section_image_url
    const fromPath = settings.photo_section_image_path
        ? `https://yjlzizakdjghpfduxcki.supabase.co/storage/v1/object/public/images/${settings.photo_section_image_path}`
        : undefined

    const base = direct || fromPath
    if (!base) return ""

    // 안정적인 버전 키 (updated_at 기반)만 유지해, 캐시 히트 보존
    if (settings.updated_at) {
        const separator = base.includes("?") ? "&" : "?"
        const cacheKey = new Date(settings.updated_at).getTime()
        return `${base}${separator}v=${cacheKey}`
    }
    return base
}

interface KakaoShareProps {
    pageId?: string
    templateId?: string
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
        templateId = "",
        style,
    } = props

    const [settings, setSettings] = useState<PageSettings | null>(null)
    const [isKakaoReady, setIsKakaoReady] = useState(false)
    const [preparedArgs, setPreparedArgs] = useState<Record<string, string> | null>(null)

    // 페이지 설정 로드
    useEffect(() => {
        if (!pageId) return

        async function loadSettings() {
            const data = await getPageSettings(pageId)
            setSettings(data)
        }
        loadSettings()
    }, [pageId])

    // 카카오 SDK 간단 확인 (사용자 정의 템플릿 방식)
    useEffect(() => {
        let mounted = true
        let checkInterval: NodeJS.Timeout | null = null

        const checkKakaoSDK = () => {
            if (window.Kakao && window.Kakao.isInitialized()) {
                console.log("✅ 카카오 SDK 준비 완료")
                if (mounted) setIsKakaoReady(true)
                return true
            }
            return false
        }

        // 즉시 확인
        if (checkKakaoSDK()) {
            return
        }

        // 주기적 확인 (500ms 간격, 최대 10초)
        let attempts = 0
        checkInterval = setInterval(() => {
            attempts++
            
            if (checkKakaoSDK()) {
                if (checkInterval) {
                    clearInterval(checkInterval)
                    checkInterval = null
                }
                return
            }
            
            // 10초 후 포기
            if (attempts >= 20) {
                console.error("❌ 카카오 SDK 준비 타임아웃")
                if (checkInterval) {
                    clearInterval(checkInterval)
                    checkInterval = null
                }
                if (mounted) setIsKakaoReady(false)
            }
        }, 500)

        return () => {
            mounted = false
            if (checkInterval) {
                clearInterval(checkInterval)
            }
        }
    }, [])

    // 템플릿 인자 사전 준비: settings 변경 시 한 번 계산해 둔다
    useEffect(() => {
        let cancelled = false
        async function prepare() {
            if (!settings) {
                setPreparedArgs(null)
                return
            }

            // 이미지 URL 생성 사전 처리 (비동기는 여기서)
            let imageUrl = ""
            try {
                const baseImageUrl = buildImageUrl(settings)
                imageUrl = await getOptimizedImageUrl(baseImageUrl)
            } catch (imageError) {
                console.warn("이미지 생성 실패:", imageError)
                const baseImageUrl = buildImageUrl(settings)
                if (baseImageUrl) {
                    const separator = baseImageUrl.includes("?") ? "&" : "?"
                    imageUrl = `${baseImageUrl}${separator}width=400&height=600`
                }
            }

            // 웨딩 날짜 형식 생성
            const formatWeddingDate = (): string => {
                if (!settings?.wedding_date) return "결혼식 날짜 미정"
                try {
                    const [year, month, day] = settings.wedding_date.split('-').map(v => parseInt(v, 10))
                    const date = new Date(year, month - 1, day)
                    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
                    const weekday = weekdays[date.getDay()]
                    const hour24 = parseInt(settings.wedding_hour || '0', 10)
                    const minute = parseInt(settings.wedding_minute || '0', 10)
                    const period = hour24 < 12 ? '오전' : '오후'
                    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12

                    // 분단위가 있는 경우에만 분 표시
                    const minuteStr = minute > 0 ? ` ${minute}분` : ''
                    return `${year}년 ${month}월 ${day}일 ${weekday} ${period} ${hour12}시${minuteStr}`
                } catch {
                    return "결혼식 날짜 미정"
                }
            }

            // URL에서 경로(path) 부분만 추출
            const getUrlPath = (url: string): string => {
                try {
                    const urlObj = new URL(url)
                    return urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname
                } catch {
                    return url
                }
            }

            const computedArgs: Record<string, string> = {
                // 카카오톡 공유 전용 필드들 사용
                GROOM_NAME: settings.groom_name_kr || "신랑",
                BRIDE_NAME: settings.bride_name_kr || "신부",
                KKO_TITLE: settings.kko_title || `${settings.groom_name_kr || "신랑"} ♥ ${settings.bride_name_kr || "신부"} 결혼합니다`,
                KKO_DATE: settings.kko_date || formatWeddingDate(),
                WEDDING_IMAGE: imageUrl, // 카카오톡 전용 이미지가 우선 사용됨 (buildImageUrl에서 kko_img 우선)
                WEDDING_URL: getUrlPath(settings.page_url || (typeof window !== 'undefined' ? window.location.href : '')),
            }

            if (!cancelled) setPreparedArgs(computedArgs)
        }
        prepare()
        return () => {
            cancelled = true
        }
    }, [settings])

    // 카카오톡 공유 실행: 클릭 시 동기적으로 즉시 호출 (iOS Safari 제스처 인정)
    const handleKakaoShare = () => {
        if (!templateId) {
            alert("템플릿 ID가 설정되지 않았습니다.\nFramer에서 Template ID를 입력해주세요.")
            return
        }
        if (!pageId) {
            alert("페이지 ID가 설정되지 않았습니다.")
            return
        }
        if (!settings || !preparedArgs) {
            alert("페이지 설정을 불러오는 중입니다. 잠시 후 다시 시도해주세요.")
            return
        }
        if (!window.Kakao || !window.Kakao.isInitialized()) {
            alert("카카오 SDK가 준비되지 않았습니다. 페이지를 새로고침해주세요.")
            return
        }

        try {
            window.Kakao.Share.sendCustom({
                templateId: parseInt(templateId),
                templateArgs: preparedArgs,
            })
        } catch (error) {
            console.error("카카오톡 공유 오류:", error)
            alert("카카오톡 공유에 실패했습니다.")
        }
    }

    // 고정된 버튼 스타일
    const buttonStyle = {
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        border: "none",
        backgroundColor: "#E0E0E0",
        fontFamily: "Pretendard SemiBold",
        fontSize: "14px",
        color: "#000", // 글씨 색상은 강제로 검정색으로 설정
        textDecoration: "none",
        cursor: "pointer",
        transition: "all 0.2s ease",
    }

    return (
        <div style={{ ...style, display: "inline-block" }}>
            <button
                onClick={handleKakaoShare}
                disabled={!settings || !isKakaoReady || !templateId || !preparedArgs}
                style={{
                    ...buttonStyle,
                    opacity: (!settings || !isKakaoReady || !templateId || !preparedArgs) ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                    if (settings && isKakaoReady && templateId && preparedArgs) {
                        e.currentTarget.style.transform = "scale(1.02)"
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)"
                }}
            >
                {"카카오톡으로 공유하기"}
            </button>
        </div>
    )
}

addPropertyControls(KakaoShare, {
    templateId: {
        type: ControlType.String,
        title: "Template ID",
        defaultValue: "",
        placeholder: "카카오 개발자 콘솔에서 생성한 템플릿 ID (숫자)",
    },
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "",
        placeholder: "예: mypageid",
    },
})
