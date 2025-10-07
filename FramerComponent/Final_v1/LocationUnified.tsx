import React, { useState, useRef, useEffect, useMemo } from "react"
import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=27c65dba30928cbbce6839678016d9ac"

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 430
 * @framerIntrinsicHeight 800
 */

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

interface LocationSettings {
    venue_name: string
    venue_address: string
    transport_location_name: string
}

interface Coordinates {
    lat: number
    lng: number
}

interface TransportItem {
    title: string
    description: string
    display_order: number
}

interface MapAppLinks {
    naver: string
    kakao: string
    tmap: string
}

interface LocationUnifiedProps {
    pageId: string
    style?: React.CSSProperties
}

// SVG 인코딩 유틸리티
const encodeSvgToBase64 = (svg: string): string => {
    try {
        if (typeof btoa === "function") {
            return btoa(svg)
        }
    } catch (_) {}
    if (typeof Buffer !== "undefined") {
        return Buffer.from(svg, "utf-8").toString("base64")
    }
    return ""
}

const NAVER_MARKER_SVG = `
<svg width="800" height="1000" viewBox="0 0 800 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
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
</svg>
`.trim()

const DEFAULT_MARKER_SVG = `data:image/svg+xml;base64,${encodeSvgToBase64(NAVER_MARKER_SVG)}`

// API 함수들
async function getLocationSettings(pageId: string): Promise<LocationSettings> {
    if (!pageId)
        return {
            venue_name: "",
            venue_address: "",
            transport_location_name: "",
        }
    try {
        const response = await fetch(
            `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`,
            { method: "GET", headers: { "Content-Type": "application/json" } }
        )
        if (!response.ok)
            return {
                venue_name: "",
                venue_address: "",
                transport_location_name: "",
            }
        const result = await response.json()
        if (result && result.success && result.data) {
            return {
                venue_name: result.data.venue_name || "",
                venue_address: result.data.venue_address || "",
                transport_location_name:
                    result.data.transport_location_name || "",
            }
        }
    } catch (_) {
        return {
            venue_name: "",
            venue_address: "",
            transport_location_name: "",
        }
    }
    return { venue_name: "", venue_address: "", transport_location_name: "" }
}

async function getMapConfig(): Promise<{
    naverClientId: string
    tmapApiKey: string
}> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/map-config`)
        if (!response.ok) return { naverClientId: "3cxftuac0e", tmapApiKey: "" }
        const result = await response.json()
        if (result.success) {
            return {
                naverClientId:
                    result.data.naverClientId ||
                    result.data.naverMapsKey ||
                    "3cxftuac0e",
                tmapApiKey:
                    result.data.tmapApiKey || result.data.tmapAppKey || "",
            }
        }
    } catch (_) {
        return { naverClientId: "3cxftuac0e", tmapApiKey: "" }
    }
    return { naverClientId: "3cxftuac0e", tmapApiKey: "" }
}

async function getPageCoordinates(pageId: string): Promise<Coordinates | null> {
    if (!pageId) return null
    try {
        const response = await fetch(
            `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`,
            { method: "GET", headers: { "Content-Type": "application/json" } }
        )
        if (!response.ok) return null
        const result = await response.json()
        if (result && result.success && result.data) {
            const data = result.data
            if (data.venue_lat && data.venue_lng) {
                return { lat: data.venue_lat, lng: data.venue_lng }
            }
        }
    } catch (_) {
        return null
    }
    return null
}

async function getTransportDetails(pageId: string): Promise<TransportItem[]> {
    if (!pageId) return []
    try {
        const bases = [
            typeof window !== "undefined" ? window.location.origin : "",
            PROXY_BASE_URL,
        ].filter(Boolean)
        let res = null
        for (const base of bases) {
            try {
                const tryRes = await fetch(
                    `${base}/api/page-settings?transport&pageId=${encodeURIComponent(pageId)}`
                )
                res = tryRes
                if (tryRes.ok) break
            } catch {}
        }
        if (!res) return []
        const result = await res.json()
        if (result?.success && Array.isArray(result.data)) {
            return result.data
        }
    } catch (_) {
        return []
    }
    return []
}

function getMapAppLinks(
    lat: number,
    lng: number,
    placeName: string,
    tmapAppKey?: string
): MapAppLinks {
    const locationName = placeName || "목적지"

    return {
        naver: `nmap://route/public?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(locationName)}`,
        kakao: `kakaomap://route?ep=${lat},${lng}&by=CAR`,
        tmap: `https://apis.openapi.sk.com/tmap/app/routes?${
            tmapAppKey ? `appKey=${encodeURIComponent(tmapAppKey)}&` : ""
        }name=${encodeURIComponent(locationName)}&lon=${lng}&lat=${lat}`,
    }
}

// 텍스트 스타일링 유틸리티
function renderStyledText(text: string): React.ReactNode[] {
    const segments: React.ReactNode[] = []
    let index = 0
    const regex = /(\{([^}]*)\})|(\n\n)|(\n)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
        const start = match.index
        const end = start + match[0].length

        if (start > index) {
            const beforeText = text.slice(index, start)
            segments.push(...processBoldAndLineBreak(beforeText, `t-${index}`))
        }

        if (match[1]) {
            const inner = match[2] || ""
            const innerSegments = processBoldAndLineBreak(inner, `q-${start}`)
            segments.push(
                <span
                    key={`q-${start}`}
                    style={{ fontSize: 13, lineHeight: "20px" }}
                >
                    {innerSegments}
                </span>
            )
        } else if (match[3]) {
            segments.push(
                <div key={`double-br-${start}`} style={{ height: "0.6em" }} />
            )
        } else if (match[4]) {
            segments.push(<br key={`br-${start}`} />)
        }

        index = end
    }

    if (index < text.length) {
        const remainingText = text.slice(index)
        segments.push(...processBoldAndLineBreak(remainingText, `t-${index}`))
    }

    return segments
}

function processBoldAndLineBreak(
    text: string,
    keyPrefix: string
): React.ReactNode[] {
    const segments: React.ReactNode[] = []
    let index = 0
    const regex = /(\*([^*]+)\*)|(\n\n)|(\n)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
        const start = match.index
        const end = start + match[0].length

        if (start > index) {
            const lineHeight = keyPrefix.startsWith("q-") ? "20px" : "1.6em"
            segments.push(
                <span key={`${keyPrefix}-${index}`} style={{ lineHeight }}>
                    {text.slice(index, start)}
                </span>
            )
        }

        if (match[1]) {
            const inner = match[2] || ""
            const lineHeight = keyPrefix.startsWith("q-") ? "20px" : "1.6em"
            segments.push(
                <span
                    key={`${keyPrefix}-b-${start}`}
                    style={{
                        fontFamily:
                            '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
                        fontWeight: 600,
                        lineHeight,
                    }}
                >
                    {inner}
                </span>
            )
        } else if (match[3]) {
            segments.push(
                <div
                    key={`${keyPrefix}-double-br-${start}`}
                    style={{ height: "0.6em" }}
                />
            )
        } else if (match[4]) {
            segments.push(<br key={`${keyPrefix}-br-${start}`} />)
        }

        index = end
    }

    if (index < text.length) {
        const lineHeight = keyPrefix.startsWith("q-") ? "20px" : "1.6em"
        segments.push(
            <span key={`${keyPrefix}-${index}`} style={{ lineHeight }}>
                {text.slice(index)}
            </span>
        )
    }

    return segments
}

export default function LocationUnified({
    pageId = "",
    style,
}: LocationUnifiedProps) {
    // Typography 폰트 로딩
    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                typography.ensure()
            }
        } catch (error) {
            console.warn("[LocationUnified] Typography loading failed:", error)
        }
    }, [])

    // Pretendard 폰트 스택을 안전하게 가져오기
    const pretendardFontFamily = useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.pretendard ||
                '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    // 통합 상태 관리
    const [locationSettings, setLocationSettings] = useState<LocationSettings>({
        venue_name: "",
        venue_address: "",
        transport_location_name: "",
    })
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
    const [transportItems, setTransportItems] = useState<TransportItem[]>([])
    const [naverClientId, setNaverClientId] = useState("3cxftuac0e")
    const [isLoading, setIsLoading] = useState(true)
    const [tmapAppKey, setTmapAppKey] = useState("")
    const [showCopyMessage, setShowCopyMessage] = useState(false)

    // Refs
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstance = useRef<any>(null)
    const markerInstance = useRef<any>(null)

    // 초기 데이터 로드
    useEffect(() => {
        let mounted = true
        ;(async () => {
            setIsLoading(true)
            try {
                const [settings, coords, transport, config] = await Promise.all(
                    [
                        getLocationSettings(pageId),
                        getPageCoordinates(pageId),
                        getTransportDetails(pageId),
                        getMapConfig(),
                    ]
                )

                if (!mounted) return

                setLocationSettings(settings)
                setCoordinates(coords)
                setTransportItems(transport)
                setNaverClientId(config.naverClientId)
                setTmapAppKey(config.tmapApiKey || "")
            } catch (error) {
                console.error("LocationUnified data load error:", error)
            } finally {
                if (mounted) setIsLoading(false)
            }
        })()

        return () => {
            mounted = false
        }
    }, [pageId])

    // 네이버 지도 초기화
    useEffect(() => {
        if (typeof window === "undefined" || typeof document === "undefined")
            return
        if (!naverClientId || !mapRef.current) return

        const initMap = () => {
            if (!(window as any).naver || !(window as any).naver.maps) return

            const position = new (window as any).naver.maps.LatLng(
                coordinates?.lat || 37.3595704,
                coordinates?.lng || 127.105399
            )

            mapInstance.current = new (window as any).naver.maps.Map(
                mapRef.current,
                {
                    center: position,
                    zoom: 15,
                    mapTypeControl: false,
                    zoomControl: false,
                    logoControl: false,
                    scaleControl: false,
                }
            )

            // 마커 아이콘 사이즈 설정 (레티나 대응: 원본 크기와 스케일 적용 크기 분리)
            const isRetina = (window.devicePixelRatio || 1) > 1
            const originalSize = isRetina
                ? new (window as any).naver.maps.Size(84, 104)
                : new (window as any).naver.maps.Size(42, 52)
            const scaledSize = new (window as any).naver.maps.Size(42, 52)
            const iconAnchor = new (window as any).naver.maps.Point(21, 26)

            markerInstance.current = new (window as any).naver.maps.Marker({
                map: mapInstance.current,
                position,
                icon: {
                    url: DEFAULT_MARKER_SVG,
                    size: originalSize,
                    scaledSize: scaledSize,
                    origin: new (window as any).naver.maps.Point(0, 0),
                    anchor: iconAnchor,
                },
                clickable: true,
                visible: true,
            })
            ;(window as any).naver.maps.Event.addListener(
                markerInstance.current,
                "click",
                () => {
                    const venueName =
                        locationSettings.venue_name ||
                        locationSettings.venue_address ||
                        "위치"
                    const encodedName = encodeURIComponent(venueName)
                    const host =
                        typeof window !== "undefined" && window.location
                            ? window.location.hostname
                            : "framer"
                    const appName = encodeURIComponent(host || "framer")
                    const mobileUrl = `nmap://route/public?lat=${position.lat}&lng=${position.lng}&name=${encodedName}&appname=${appName}`
                    const webUrl = `https://map.naver.com/p/?c=${position.lng},${position.lat},15,0,0,0,dh`
                    const isMobile =
                        typeof navigator !== "undefined" &&
                        /iPhone|iPad|iPod|Android/i.test(
                            navigator.userAgent || ""
                        )
                    if (typeof window !== "undefined" && window.open) {
                        window.open(isMobile ? mobileUrl : webUrl, "_blank")
                    }
                }
            )
        }

        let injectedScript: HTMLScriptElement | null = null
        if ((window as any).naver && (window as any).naver.maps) {
            initMap()
        } else {
            injectedScript = document.createElement("script")
            injectedScript.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${naverClientId}`
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
    }, [naverClientId, coordinates, locationSettings])

    // 복사 기능
    const copyToClipboard = async () => {
        if (typeof navigator === "undefined" || !navigator.clipboard) return
        try {
            await navigator.clipboard.writeText(
                locationSettings.venue_address || ""
            )
            setShowCopyMessage(true)
            setTimeout(() => setShowCopyMessage(false), 2000)
        } catch (_) {
            // ignore clipboard failures silently
        }
    }

    // 표시할 장소명
    const displayLocationName =
        locationSettings.transport_location_name ||
        locationSettings.venue_name ||
        "장소이름"

    // 지도 앱 링크
    const mapLinks = coordinates
        ? getMapAppLinks(
              coordinates.lat,
              coordinates.lng,
              displayLocationName,
              tmapAppKey
          )
        : null

    // 폴백 교통편 아이템
    const safeTransportItems =
        transportItems.length > 0
            ? transportItems
            : [
                  {
                      title: "교통편",
                      description: "상세 항목",
                      display_order: 1,
                  },
                  {
                      title: "교통편",
                      description: "상세 항목",
                      display_order: 2,
                  },
              ]

    return (
        <div
            style={{
                width: "fit-content",
                height: "fit-content",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                ...style,
            }}
        >
            {/* 1. Location.tsx 부분 - 장소 정보 */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
                viewport={{ once: true }}
                style={{
                    width: "fit-content",
                    height: "fit-content",
                    paddingTop: 40,
                    paddingBottom: 28,
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 10,
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        alignSelf: "stretch",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        gap: 5,
                    }}
                >
                    {/* 장소 이름 */}
                    <div
                        style={{
                            alignSelf: "stretch",
                            textAlign: "center",
                            color: "black",
                            fontSize: 18,
                            lineHeight: "32px",
                            fontFamily: pretendardFontFamily,
                        }}
                    >
                        {isLoading ? (
                            ""
                        ) : displayLocationName.includes("|") ? (
                            displayLocationName
                                .split("|")
                                .map((part, index, array) => (
                                    <React.Fragment key={index}>
                                        <span
                                            style={{
                                                fontFamily:
                                                    pretendardFontFamily,
                                                fontWeight: 600,
                                                fontSize: 18,
                                                lineHeight: "32px",
                                            }}
                                        >
                                            {part.trim()}
                                        </span>
                                        {index < array.length - 1 && (
                                            <span
                                                style={{
                                                    fontFamily:
                                                        pretendardFontFamily,
                                                    fontWeight: 400,
                                                    fontSize: 18,
                                                    lineHeight: "32px",
                                                }}
                                            >
                                                {" | "}
                                            </span>
                                        )}
                                    </React.Fragment>
                                ))
                        ) : (
                            <span
                                style={{
                                    fontFamily: pretendardFontFamily,
                                    fontWeight: 600,
                                    fontSize: 18,
                                    lineHeight: "32px",
                                }}
                            >
                                {displayLocationName}
                            </span>
                        )}
                    </div>
                    {/* 주소 + 복사 */}
                    <div
                        style={{
                            alignSelf: "stretch",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: 5,
                        }}
                    >
                        <div
                            style={{
                                alignSelf: "stretch",
                                textAlign: "center",
                                color: "black",
                                fontSize: 16,
                                fontFamily: pretendardFontFamily,
                                lineHeight: "32px",
                            }}
                        >
                            {isLoading
                                ? ""
                                : locationSettings.venue_address ||
                                  "장소 상세주소"}
                        </div>
                        <div
                            onClick={copyToClipboard}
                            style={{
                                display: "inline-flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: 5,
                                cursor: locationSettings.venue_address
                                    ? "pointer"
                                    : "default",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="11"
                                    height="13"
                                    viewBox="0 0 11 13"
                                    fill="none"
                                    style={{ marginRight: 4 }}
                                >
                                    <rect
                                        x="0.5"
                                        y="0.5"
                                        width="7.35989"
                                        height="9.41763"
                                        stroke="#7F7F7F"
                                    />
                                    <path
                                        d="M3.2998 12.5001H10.4997V3.23438"
                                        stroke="#7F7F7F"
                                    />
                                </svg>
                                <div
                                    style={{
                                        color: "#9ca3af",
                                        fontSize: 14,
                                        fontFamily: pretendardFontFamily,
                                    }}
                                >
                                    복사
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* 복사 메시지 */}
                {showCopyMessage && (
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: 200,
                            height: 40,
                            background: "#FFFFFF",
                            borderRadius: 5,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
                            zIndex: 1000,
                            pointerEvents: "none",
                        }}
                    >
                        <div
                            style={{
                                color: "#000000",
                                fontSize: 14,
                                fontFamily: pretendardFontFamily,
                                textAlign: "center",
                            }}
                        >
                            복사되었습니다
                        </div>
                    </div>
                )}
            </motion.div>

            {/* 2. NaverMapSimple.tsx 부분 - 지도 */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
                viewport={{ once: true }}
                style={{
                    width: "100%",
                    minWidth: "320px",
                    height: "300px",
                    position: "relative",
                    margin: "20px 0",
                }}
            >
                <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
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
                            fontFamily: pretendardFontFamily,
                        }}
                    >
                        지도 로딩 중...
                    </div>
                )}
            </motion.div>

            {/* 3. LocationDetail.tsx 부분 - 교통편 상세 */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
                viewport={{ once: true }}
                style={{
                    width: "88%",
                    height: "fit-content",
                    paddingTop: 30,
                    paddingBottom: 30,
                    overflow: "hidden",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 15,
                    display: "inline-flex",
                    marginBottom: "20px",
                }}
            >
                {safeTransportItems
                    .sort(
                        (a, b) =>
                            (a.display_order ?? 0) - (b.display_order ?? 0)
                    )
                    .map((item, idx) => (
                        <div
                            key={idx}
                            style={{
                                alignSelf: "stretch",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                                display: "inline-flex",
                                gap: 10,
                            }}
                        >
                            <div
                                style={{
                                    width: 52,
                                    color: "black",
                                    fontSize: 15,
                                    fontFamily: pretendardFontFamily,
                                    fontWeight: 600,
                                    lineHeight: "1.6em",
                                    wordWrap: "break-word",
                                }}
                            >
                                {item.title || ""}
                            </div>
                            <div
                                style={{
                                    flex: "1 1 0",
                                    color: "black",
                                    fontSize: 15,
                                    fontFamily: pretendardFontFamily,
                                    wordWrap: "break-word",
                                }}
                            >
                                {renderStyledText(item.description || "")}
                            </div>
                        </div>
                    ))}
            </motion.div>

            {/* 4. MapBtn.tsx 부분 - 지도 앱 링크 */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
                viewport={{ once: true }}
                style={{
                    height: "44px",
                    width: "88%",
                    display: "flex",
                    gap: 6,
                    marginBottom: "20px",
                }}
            >
                {mapLinks && (
                    <a
                        href={mapLinks.naver}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            padding: "13px 13px",
                            border: "none",
                            background: "#f5f5f5",
                            cursor: "pointer",
                            textDecoration: "none",
                            fontFamily: pretendardFontFamily,
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#000000",
                            whiteSpace: "nowrap",
                        }}
                    >
                        <img
                            src="https://cdn.roarc.kr/framer/LocationIcon/nmap.png"
                            alt="네이버 지도"
                            style={{ width: "20px", height: "20px" }}
                        />
                        네이버 지도
                    </a>
                )}
                {mapLinks && (
                    <a
                        href={mapLinks.kakao}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            padding: "13px 13px",
                            border: "none",
                            background: "#f5f5f5",
                            cursor: "pointer",
                            textDecoration: "none",
                            fontFamily: pretendardFontFamily,
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#000000",
                            whiteSpace: "nowrap",
                        }}
                    >
                        <img
                            src="https://cdn.roarc.kr/framer/LocationIcon/kakaomap_basic.png"
                            alt="카카오맵"
                            style={{ width: "20px", height: "20px" }}
                        />
                        카카오맵
                    </a>
                )}
                {mapLinks && (
                    <a
                        href={mapLinks.tmap}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            padding: "13px 13px",
                            border: "none",
                            background: "#f5f5f5",
                            cursor: "pointer",
                            textDecoration: "none",
                            fontFamily: pretendardFontFamily,
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#000000",
                            whiteSpace: "nowrap",
                        }}
                    >
                        <img
                            src="https://cdn.roarc.kr/framer/LocationIcon/tmap.svg"
                            alt="티맵"
                            style={{ width: "20px", height: "20px" }}
                        />
                        티맵
                    </a>
                )}
            </motion.div>
        </div>
    )
}

// Property Controls
addPropertyControls(LocationUnified, {
    pageId: {
        type: ControlType.String,
        title: "페이지 ID",
        defaultValue: "",
        placeholder: "페이지 ID를 입력하세요",
    },
})
