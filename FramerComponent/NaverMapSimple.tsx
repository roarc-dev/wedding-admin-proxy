/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
import React, { useRef, useEffect, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

// 페이지 설정 정보 타입 정의
interface PageSettings {
    id?: string
    page_id: string
    venue_name?: string
    venue_address?: string
    venue_lat?: number
    venue_lng?: number
    created_at?: string
    updated_at?: string
}

// 프록시를 통한 안전한 페이지 설정 가져오기
async function getPageSettings(pageId: string): Promise<PageSettings | null> {
    try {
        const response = await fetch(
            `${PROXY_BASE_URL}/api/page-settings?pageId=${pageId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        )

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        if (result.success && result.data) {
            return {
                id: result.data.id,
                page_id: result.data.page_id,
                venue_name: result.data.venue_name || "",
                venue_address: result.data.venue_address || "",
                venue_lat: result.data.venue_lat || null,
                venue_lng: result.data.venue_lng || null,
                created_at: result.data.created_at,
                updated_at: result.data.updated_at,
            }
        } else {
            console.warn("페이지 설정이 없습니다:", result.error)
            return null
        }
    } catch (error) {
        console.error("페이지 설정 가져오기 실패:", error)
        return null
    }
}

declare global {
    interface Window {
        naver: any
        navermap_authFailure: () => void
    }
}

interface Props {
    pageId: string
    retina: boolean
    style?: React.CSSProperties
}

export default function NaverMapSimple({
    pageId = "default",
    retina,
    style,
}: Props) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstance = useRef<any>(null)
    const markerInstance = useRef<any>(null)
    const [pageSettings, setPageSettings] = useState<PageSettings | null>(null)
    const [naverClientId, setNaverClientId] = useState("")
    const [currentPosition, setCurrentPosition] = useState<{
        lat: number
        lng: number
    }>({ lat: 37.3595704, lng: 127.105399 }) // 기본값: 판교
    const [isLoading, setIsLoading] = useState(false)

    // 기본 마커 SVG 데이터 URL
    const defaultMarkerSvg = `data:image/svg+xml;base64,${btoa(`<svg width="800" height="1000" viewBox="0 0 800 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M676.89 393.29C676.89 561.91 497.9 788.29 427.74 870.55C413.08 887.74 386.6 887.98 371.66 871.04C301.08 791.03 123.11 571.59 123.11 393.3C123.11 240.38 247.08 116.41 400 116.41C552.92 116.41 676.89 240.38 676.89 393.3V393.29Z" fill="url(#paint0_linear_16_59)"/>
<path d="M400.001 514.31C470.688 514.31 527.991 457.007 527.991 386.32C527.991 315.633 470.688 258.33 400.001 258.33C329.314 258.33 272.011 315.633 272.011 386.32C272.011 457.007 329.314 514.31 400.001 514.31Z" fill="url(#paint1_linear_16_59)"/>
<defs>
<linearGradient id="paint0_linear_16_59" x1="400" y1="883.6" x2="400" y2="116.4" gradientUnits="userSpaceOnUse">
<stop stop-color="#5C5C5C"/>
<stop offset="1" stop-color="#C8C8C8"/>
</linearGradient>
<linearGradient id="paint1_linear_16_59" x1="400.001" y1="514.32" x2="400.001" y2="258.33" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="1" stop-color="#C8C8C8"/>
</linearGradient>
</defs>
</svg>`)}`

    // DB에서 가져온 좌표로 지도 위치 설정
    const updateMapFromCoordinates = (lat: number, lng: number) => {
        setCurrentPosition({ lat, lng })
        updateMapAndMarker(lat, lng)
    }

    // 지도와 마커 위치 업데이트
    const updateMapAndMarker = (lat: number, lng: number) => {
        if (!mapInstance.current || !window.naver) return

        const position = new window.naver.maps.LatLng(lat, lng)
        mapInstance.current.setCenter(position)
        mapInstance.current.setZoom(15)

        if (markerInstance.current) {
            markerInstance.current.setPosition(position)
            markerInstance.current.setVisible(true)
        }
    }

    // 네이버 지도 초기화
    const initNaverMap = () => {
        if (!window.naver || !mapRef.current) return

        const position = new window.naver.maps.LatLng(
            currentPosition.lat,
            currentPosition.lng
        )

        mapInstance.current = new window.naver.maps.Map(mapRef.current, {
            center: position,
            zoom: 15,
            mapTypeControl: false,
            zoomControl: false,
            logoControl: false,
            scaleControl: false,
        })

        const originalSize = retina
            ? new window.naver.maps.Size(84, 104)
            : new window.naver.maps.Size(42, 52)
        const displaySize = new window.naver.maps.Size(42, 52)
        const iconAnchor = new window.naver.maps.Point(21, 26)

        markerInstance.current = new window.naver.maps.Marker({
            map: mapInstance.current,
            position,
            icon: {
                url: defaultMarkerSvg,
                size: originalSize,
                scaledSize: displaySize,
                origin: new window.naver.maps.Point(0, 0),
                anchor: iconAnchor,
            },
            clickable: true,
            visible: true,
        })

        window.naver.maps.Event.addListener(
            markerInstance.current,
            "click",
            () => {
                const venueName =
                    pageSettings?.venue_name ||
                    pageSettings?.venue_address ||
                    "위치"
                const encodedName = encodeURIComponent(venueName)
                const appName =
                    encodeURIComponent(window.location.hostname) || "framer"

                const mobileUrl = `nmap://route/public?lat=${currentPosition.lat}&lng=${currentPosition.lng}&name=${encodedName}&appname=${appName}`
                const webUrl = `https://map.naver.com/p/?c=${currentPosition.lng},${currentPosition.lat},15,0,0,0,dh`

                const isMobile = /iPhone|iPad|iPod|Android/i.test(
                    navigator.userAgent
                )
                window.open(isMobile ? mobileUrl : webUrl, "_blank")
            }
        )
    }

    // 페이지 설정과 네이버 지도 API 로드
    useEffect(() => {
        const loadPageSettingsAndMap = async () => {
            setIsLoading(true)
            try {
                // 페이지 설정과 네이버 API 설정을 병렬로 로드
                const [settings, configRes] = await Promise.all([
                    getPageSettings(pageId),
                    fetch(
                        "https://wedding-admin-proxy.vercel.app/api/map-config"
                    ),
                ])

                setPageSettings(settings)

                // 좌표가 있으면 해당 위치로 설정, 없으면 기본값 유지
                if (settings?.venue_lat && settings?.venue_lng) {
                    console.log(
                        "DB 좌표 사용:",
                        settings.venue_lat,
                        settings.venue_lng
                    )
                    updateMapFromCoordinates(
                        settings.venue_lat,
                        settings.venue_lng
                    )
                } else {
                    console.log("좌표가 없어 기본 위치 사용")
                }

                // 네이버 API 키 설정
                if (configRes.ok) {
                    const configJson = await configRes.json()
                    if (configJson.success) {
                        setNaverClientId(
                            configJson.data.naverMapsKey ||
                                configJson.data.naverClientId ||
                                "3cxftuac0e"
                        )
                    } else {
                        setNaverClientId("3cxftuac0e")
                    }
                } else {
                    setNaverClientId("3cxftuac0e")
                }
            } catch (err) {
                console.error("지도 설정 로드 실패:", err)
                setNaverClientId("3cxftuac0e")
            } finally {
                setIsLoading(false)
            }
        }

        loadPageSettingsAndMap()
    }, [pageId])

    // 네이버 지도 API 로드 및 초기화
    useEffect(() => {
        if (!naverClientId || isLoading) return

        // 네이버 지도 API 인증 실패 처리
        window.navermap_authFailure = function () {
            console.error("네이버 지도 API 인증 실패")
        }

        // 네이버 지도 API 로드
        if (!window.naver || !window.naver.maps) {
            const naverScript = document.createElement("script")
            naverScript.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${naverClientId}`
            naverScript.async = true
            naverScript.onload = () => {
                setTimeout(() => {
                    initNaverMap()
                }, 100)
            }
            naverScript.onerror = () =>
                console.error("네이버 지도 API 로드 실패")
            document.head.appendChild(naverScript)
        } else {
            // 이미 로드된 경우 바로 초기화
            initNaverMap()
        }
    }, [naverClientId, isLoading])

    // 좌표 변경 시 지도 업데이트
    useEffect(() => {
        if (mapInstance.current && currentPosition) {
            updateMapAndMarker(currentPosition.lat, currentPosition.lng)
        }
    }, [currentPosition])

    // 좌표가 없으면 기본 지도 표시 (에러 메시지 제거)
    const hasValidCoordinates =
        pageSettings?.venue_lat && pageSettings?.venue_lng

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                ...style,
            }}
        >
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

            {/* 로딩 상태 표시 (선택사항) */}
            {isLoading && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        padding: "8px 16px",
                        borderRadius: "4px",
                        fontSize: "14px",
                        color: "#666",
                    }}
                >
                    지도 로딩 중...
                </div>
            )}
        </div>
    )
}

NaverMapSimple.defaultProps = {
    pageId: "default",
    retina: true,
}

addPropertyControls(NaverMapSimple, {
    pageId: {
        type: ControlType.String,
        title: "페이지 ID",
        defaultValue: "default",
        placeholder: "각 결혼식 페이지를 구분하는 고유 ID",
    },
    retina: {
        type: ControlType.Boolean,
        title: "레티나",
        defaultValue: true,
    },
})
