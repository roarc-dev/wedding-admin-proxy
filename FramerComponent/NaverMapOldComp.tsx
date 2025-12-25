/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
import React, { useRef, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

declare global {
    interface Window {
        naver: any
    }
}

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

// API 함수들
async function getMapConfig(): Promise<{
    naverClientId: string
    tmapApiKey: string
}> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/map-config`)
        if (!response.ok) {
            console.error('Map config API 호출 실패:', response.status)
            return { naverClientId: "", tmapApiKey: "" }
        }
        const result = await response.json()
        if (result.success && result.data) {
            const naverClientId = result.data.naverClientId || result.data.naverMapsKey || ""
            if (!naverClientId) {
                console.warn('NAVER 클라이언트 ID가 설정되지 않았습니다. 환경변수 NCP_CLIENT_ID를 확인해주세요.')
            }
            return {
                naverClientId,
                tmapApiKey: result.data.tmapApiKey || result.data.tmapAppKey || "",
            }
        } else {
            console.error('Map config API 응답 형식이 올바르지 않습니다:', result)
            return { naverClientId: "", tmapApiKey: "" }
        }
    } catch (error) {
        console.error('Map config API 호출 중 에러:', error)
        return { naverClientId: "", tmapApiKey: "" }
    }
}

type Props = {
    latitude: number
    longitude: number
    zoom: number
    markerImage: string
    retina: boolean
    /** 마커를 클릭했을 때 표시할 장소명(네이버 지도용) */
    placeName: string
    pageId: string
    style?: React.CSSProperties
}

export default function NaverRetinaImageMarkerMap({
    latitude,
    longitude,
    zoom,
    markerImage,
    retina,
    placeName,
    pageId,
    style,
}: Props) {
    const mapRef = useRef<HTMLDivElement>(null)
    const [naverClientId, setNaverClientId] = React.useState("")

    // API에서 naverClientId 가져오기
    useEffect(() => {
        let mounted = true
        ;(async () => {
            try {
                const config = await getMapConfig()
                if (mounted) {
                    setNaverClientId(config.naverClientId)
                }
            } catch (error) {
                console.error("Map config load error:", error)
            }
        })()

        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        if (!naverClientId) return

        const initMap = () => {
            if (window.naver && mapRef.current) {
                const position = new window.naver.maps.LatLng(
                    latitude,
                    longitude
                )
                const map = new window.naver.maps.Map(mapRef.current, {
                    center: position,
                    zoom,
                })

                // 레티나 대응 마커 설정
                const originalSize = retina
                    ? new window.naver.maps.Size(84, 104)
                    : new window.naver.maps.Size(42, 52)
                const displaySize = new window.naver.maps.Size(42, 52)
                const iconAnchor = new window.naver.maps.Point(21, 26)

                const marker = new window.naver.maps.Marker({
                    map,
                    position,
                    icon: {
                        url: markerImage,
                        size: originalSize,
                        scaledSize: displaySize,
                        origin: new window.naver.maps.Point(0, 0),
                        anchor: iconAnchor,
                    },
                    clickable: true,
                })

                // 👉 마커 클릭 시 네이버 지도 열기
                window.naver.maps.Event.addListener(marker, "click", () => {
                    const encodedName = encodeURIComponent(placeName || "위치")
                    const appName =
                        encodeURIComponent(window.location.hostname) || "framer"
                    // 모바일(앱)용 딥링크
                    const mobileUrl = `nmap://route/public?lat=${latitude}&lng=${longitude}&name=${encodedName}&appname=${appName}`
                    // 데스크톱 웹 fallback (중심좌표 이동)
                    const webUrl = `https://map.naver.com/p/?c=${longitude},${latitude},${zoom},0,0,0,dh`

                    const isMobile = /iPhone|iPad|iPod|Android/i.test(
                        navigator.userAgent
                    )
                    window.open(isMobile ? mobileUrl : webUrl, "_blank")
                })
            }
        }

        let injectedScript: HTMLScriptElement | null = null
        if ((window as any).naver && (window as any).naver.maps) {
            initMap()
        } else {
            injectedScript = document.createElement("script")
            injectedScript.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${naverClientId}`
            injectedScript.async = true
            injectedScript.onload = initMap
            injectedScript.onerror = () =>
                console.error("네이버 지도 API 로드 실패")
            document.head.appendChild(injectedScript)
        }

        return () => {
            if (injectedScript && injectedScript.parentNode) {
                injectedScript.parentNode.removeChild(injectedScript)
            }
        }
    }, [naverClientId, latitude, longitude, zoom, markerImage, retina, placeName])

    return (
        <div ref={mapRef} style={{ width: "100%", height: "100%", ...style }} />
    )
}

NaverRetinaImageMarkerMap.defaultProps = {
    latitude: 37.3595704,
    longitude: 127.105399,
    zoom: 15,
    markerImage: "https://via.placeholder.com/100x104.png?text=Marker",
    retina: true,
    placeName: "목적지",
    pageId: "",
}

addPropertyControls(NaverRetinaImageMarkerMap, {
    pageId: {
        type: ControlType.String,
        title: "페이지 ID",
        defaultValue: "",
        placeholder: "페이지 ID를 입력하세요",
    },
    latitude: {
        type: ControlType.Number,
        title: "위도",
        defaultValue: 37.3595704,
        min: -90,
        max: 90,
        step: 0.0001,
    },
    longitude: {
        type: ControlType.Number,
        title: "경도",
        defaultValue: 127.105399,
        min: -180,
        max: 180,
        step: 0.0001,
    },
    zoom: {
        type: ControlType.Number,
        title: "줌",
        defaultValue: 15,
        min: 0,
        max: 20,
    },
    markerImage: {
        type: ControlType.File,
        title: "마커 이미지",
        allowedFileTypes: ["image/*"],
    },
    retina: {
        type: ControlType.Boolean,
        title: "레티나",
        defaultValue: true,
    },
    placeName: {
        type: ControlType.String,
        title: "장소명",
        defaultValue: "목적지",
    },
})
