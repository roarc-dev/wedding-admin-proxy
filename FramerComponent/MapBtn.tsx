/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
import React, { useRef, useEffect, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

declare global {
    interface Window {
        google: any
        initGoogleMaps: () => void
    }
}

type Props = {
    placeName: string
    buttonFont: any
    buttonTextColor: string
    buttonBackgroundColor: string
    iconSize: number
    naverIcon: string
    kakaoIcon: string
    tmapIcon: string
    style?: React.CSSProperties
}

export default function MapLinkButtonGroup({
    placeName,
    buttonFont,
    buttonTextColor,
    buttonBackgroundColor,
    iconSize,
    naverIcon,
    kakaoIcon,
    tmapIcon,
    style,
}: Props) {
    const geocoderInstance = useRef<any>(null)
    const placesServiceInstance = useRef<any>(null)
    const [currentPosition, setCurrentPosition] = useState<{
        lat: number
        lng: number
    }>({ lat: 37.556499, lng: 127.005305 }) // 기본값: 라비두스
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>("")
    const [naverClientId, setNaverClientId] = useState("3cxftuac0e")
    const [googleMapsApiKey, setGoogleMapsApiKey] = useState("")
    const [tmapAppKey, setTmapAppKey] = useState("")
    const [apiKeysLoaded, setApiKeysLoaded] = useState(false)

    // map-config에서 키 받아오기
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(
                    "https://wedding-admin-proxy.vercel.app/api/map-config"
                )
                const json = await res.json()
                if (json.success) {
                    setNaverClientId(json.data.naverClientId || "3cxftuac0e")
                    setGoogleMapsApiKey(json.data.googleMapsApiKey || "")
                    setTmapAppKey(json.data.tmapApiKey || "")
                } else {
                    setNaverClientId("3cxftuac0e")
                    setGoogleMapsApiKey("")
                    setTmapAppKey("")
                }
            } catch {
                setNaverClientId("3cxftuac0e")
                setGoogleMapsApiKey("")
                setTmapAppKey("")
            }
            setApiKeysLoaded(true)
        }
        fetchConfig()
    }, [])

    // 구글 Places Text Search 사용
    const searchWithPlacesTextSearch = async (query: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!placesServiceInstance.current) {
                reject(new Error("Places Service가 초기화되지 않았습니다"))
                return
            }

            const request = {
                query: query,
                fields: [
                    "name",
                    "geometry",
                    "formatted_address",
                    "place_id",
                    "types",
                ],
            }

            placesServiceInstance.current.textSearch(
                request,
                (results: any[], status: any) => {
                    if (
                        status ===
                            window.google.maps.places.PlacesServiceStatus.OK &&
                        results &&
                        results.length > 0
                    ) {
                        const place = results[0]
                        const location = place.geometry.location

                        const result = {
                            lat: location.lat(),
                            lng: location.lng(),
                            name: place.name,
                            address: place.formatted_address,
                            placeId: place.place_id,
                            types: place.types,
                        }

                        resolve(result)
                    } else if (
                        status ===
                        window.google.maps.places.PlacesServiceStatus
                            .REQUEST_DENIED
                    ) {
                        reject(
                            new Error(
                                "Places API가 활성화되지 않았거나 API 키 권한 문제입니다"
                            )
                        )
                    } else {
                        reject(new Error(`Places 검색 실패: ${status}`))
                    }
                }
            )
        })
    }

    // 구글 Geocoder 사용
    const searchWithGeocoder = async (query: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!geocoderInstance.current) {
                reject(new Error("Geocoder가 초기화되지 않았습니다"))
                return
            }

            const request = {
                address: query,
                region: "KR",
                language: "ko",
                componentRestrictions: {
                    country: "KR",
                },
            }

            geocoderInstance.current.geocode(
                request,
                (results: any[], status: any) => {
                    if (status === "OK" && results && results.length > 0) {
                        const result = results[0]
                        const location = result.geometry.location

                        const geocodeResult = {
                            lat: location.lat(),
                            lng: location.lng(),
                            address: result.formatted_address,
                            placeId: result.place_id,
                            types: result.types,
                        }

                        resolve(geocodeResult)
                    } else {
                        reject(new Error(`Geocoder 검색 실패: ${status}`))
                    }
                }
            )
        })
    }

    // 구글 Places Nearby Search 사용
    const searchWithNearbySearch = async (query: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!placesServiceInstance.current) {
                reject(new Error("Places Service가 초기화되지 않았습니다"))
                return
            }

            const request = {
                location: { lat: 37.5665, lng: 126.978 }, // 서울 중심
                radius: 50000, // 50km
                keyword: query,
                language: "ko",
            }

            placesServiceInstance.current.nearbySearch(
                request,
                (results: any[], status: any) => {
                    if (
                        status ===
                            window.google.maps.places.PlacesServiceStatus.OK &&
                        results &&
                        results.length > 0
                    ) {
                        const place = results[0]
                        const location = place.geometry.location

                        const result = {
                            lat: location.lat(),
                            lng: location.lng(),
                            name: place.name,
                            address: place.vicinity,
                            placeId: place.place_id,
                            types: place.types,
                        }

                        resolve(result)
                    } else {
                        reject(new Error(`Nearby Search 실패: ${status}`))
                    }
                }
            )
        })
    }

    // 메인 검색 함수
    const searchPlace = async (query: string) => {
        if (!query || !query.trim()) return
        if (!googleMapsApiKey) {
            setError("구글 Maps API 키가 필요합니다")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            let result = null

            // 방법 1: Places Text Search (가장 정확함)
            try {
                result = await searchWithPlacesTextSearch(query)
            } catch (error1) {
                // 방법 2: Geocoder (주소 검색)
                try {
                    result = await searchWithGeocoder(query)
                } catch (error2) {
                    // 방법 3: Nearby Search (키워드 검색)
                    try {
                        result = await searchWithNearbySearch(query)
                    } catch (error3) {
                        throw new Error(`"${query}"를 찾을 수 없습니다`)
                    }
                }
            }

            if (result) {
                setCurrentPosition({ lat: result.lat, lng: result.lng })
            }
        } catch (err: any) {
            setError(err.message || "장소 검색에 실패했습니다")
        } finally {
            setIsLoading(false)
        }
    }

    // 구글 Maps 서비스 초기화
    const initGoogleServices = () => {
        if (!window.google || !window.google.maps) return
        try {
            geocoderInstance.current = new window.google.maps.Geocoder()
            const tempDiv = document.createElement("div")
            document.body.appendChild(tempDiv)
            placesServiceInstance.current =
                new window.google.maps.places.PlacesService(tempDiv)
            if (placeName && placeName.trim()) {
                setTimeout(() => searchPlace(placeName), 500)
            }
        } catch (err) {
            setError("구글 Maps 서비스 초기화에 실패했습니다")
        }
    }

    // 구글 Maps API 로드
    useEffect(() => {
        if (!apiKeysLoaded) return
        if (googleMapsApiKey && (!window.google || !window.google.maps)) {
            window.initGoogleMaps = initGoogleServices
            const googleScript = document.createElement("script")
            googleScript.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initGoogleMaps`
            googleScript.async = true
            googleScript.defer = true
            googleScript.onerror = () => setError("구글 Maps API 로드 실패")
            document.head.appendChild(googleScript)
        } else if (window.google && window.google.maps) {
            initGoogleServices()
        }
        return () => {
            if (window.initGoogleMaps) delete window.initGoogleMaps
        }
    }, [googleMapsApiKey, apiKeysLoaded])

    // 장소명 변경 시 검색
    useEffect(() => {
        if (placeName && placeName.trim() && geocoderInstance.current) {
            searchPlace(placeName)
        }
    }, [placeName])

    // 지도 앱 링크 핸들러들
    const handleNaverClick = () => {
        const locationName = placeName || "목적지"
        const url = `nmap://route/public?dlat=${currentPosition.lat}&dlng=${currentPosition.lng}&dname=${encodeURIComponent(
            locationName
        )}`
        window.open(url, "_blank")
    }

    const handleKakaoClick = () => {
        const url = `kakaomap://route?ep=${currentPosition.lat},${currentPosition.lng}&by=CAR`
        window.open(url, "_blank")
    }

    const handleTmapClick = () => {
        const locationName = placeName || "목적지"
        const url = `https://apis.openapi.sk.com/tmap/app/routes?appKey=${tmapAppKey}&name=${encodeURIComponent(
            locationName
        )}&lon=${currentPosition.lng}&lat=${currentPosition.lat}`
        window.open(url, "_blank")
    }

    // 버튼 스타일
    const buttonStyle: React.CSSProperties = {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        padding: "13px 13px",
        border: "none",
        background: buttonBackgroundColor,
        cursor: "pointer",
    }

    const textStyle: React.CSSProperties = {
        ...buttonFont,
        color: buttonTextColor,
    }

    return (
        <div style={{ position: "relative", ...style }}>
            {/* API 키 필수 안내 */}
            {!googleMapsApiKey && (
                <div
                    style={{
                        position: "absolute",
                        top: "-40px",
                        left: "0",
                        right: "0",
                        padding: "4px 8px",
                        backgroundColor: "#ff9500",
                        color: "white",
                        borderRadius: "4px",
                        fontSize: "12px",
                        textAlign: "center",
                        zIndex: 1000,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                >
                    구글 Maps API 키가 필요합니다
                </div>
            )}

            {/* 에러 메시지 */}
            {error && (
                <div
                    style={{
                        position: "absolute",
                        top: "-40px",
                        left: "0",
                        right: "0",
                        padding: "4px 8px",
                        backgroundColor: "#ff3b30",
                        color: "white",
                        borderRadius: "4px",
                        fontSize: "12px",
                        textAlign: "center",
                        zIndex: 1000,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                >
                    {error}
                </div>
            )}

            {/* 버튼 그룹 */}
            <div style={{ display: "flex", gap: 6 }}>
                <button style={buttonStyle} onClick={handleNaverClick}>
                    {naverIcon && (
                        <img
                            src={naverIcon}
                            alt="네이버 지도"
                            style={{ width: iconSize, height: iconSize }}
                        />
                    )}
                    <span style={textStyle}>네이버 지도</span>
                </button>
                <button style={buttonStyle} onClick={handleKakaoClick}>
                    {kakaoIcon && (
                        <img
                            src={kakaoIcon}
                            alt="카카오맵"
                            style={{ width: iconSize, height: iconSize }}
                        />
                    )}
                    <span style={textStyle}>카카오맵</span>
                </button>
                <button style={buttonStyle} onClick={handleTmapClick}>
                    {tmapIcon && (
                        <img
                            src={tmapIcon}
                            alt="티맵"
                            style={{ width: iconSize, height: iconSize }}
                        />
                    )}
                    <span style={textStyle}>티맵</span>
                </button>
            </div>
        </div>
    )
}

MapLinkButtonGroup.defaultProps = {
    placeName: "",
    buttonFont: {
        size: 16,
        weight: "normal",
        lineHeight: "1.2em",
    },
    buttonTextColor: "#000000",
    buttonBackgroundColor: "#ffffff",
    iconSize: 32,
    naverIcon: "https://via.placeholder.com/32.png?text=N",
    kakaoIcon: "https://via.placeholder.com/32.png?text=K",
    tmapIcon: "https://via.placeholder.com/32.png?text=T",
}

addPropertyControls(MapLinkButtonGroup, {
    placeName: {
        type: ControlType.String,
        title: "장소명",
        defaultValue: "",
        placeholder: "예: 더그랜드컨벤션웨딩홀, 롯데호텔 서울",
    },
    buttonFont: {
        type: ControlType.Font,
        title: "버튼 폰트",
        controls: "extended",
        defaultValue: {
            size: 16,
            weight: "normal",
            lineHeight: "1.2em",
        },
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "버튼 텍스트 색상",
        defaultValue: "#000000",
    },
    buttonBackgroundColor: {
        type: ControlType.Color,
        title: "버튼 배경 색상",
        defaultValue: "#ffffff",
    },
    iconSize: {
        type: ControlType.Number,
        title: "아이콘 크기",
        defaultValue: 32,
        min: 16,
        max: 100,
        step: 1,
    },
    naverIcon: {
        type: ControlType.File,
        title: "네이버 아이콘",
        allowedFileTypes: ["image/*"],
    },
    kakaoIcon: {
        type: ControlType.File,
        title: "카카오 아이콘",
        allowedFileTypes: ["image/*"],
    },
    tmapIcon: {
        type: ControlType.File,
        title: "티맵 아이콘",
        allowedFileTypes: ["image/*"],
    },
})
