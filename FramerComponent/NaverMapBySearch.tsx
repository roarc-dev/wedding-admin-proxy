/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
import React, { useRef, useEffect, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

declare global {
    interface Window {
        naver: any
        google: any
        initGoogleMaps: () => void
    }
}

// pageId prop 추가
interface Props {
    pageId: string
    placeName: string
    markerImage: string
    retina: boolean
    style?: React.CSSProperties
}

export default function NaverPlaceSearchMap({
    pageId = "default",
    placeName = "",
    markerImage,
    retina,
    style,
}: Props) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstance = useRef<any>(null)
    const markerInstance = useRef<any>(null)
    const geocoderInstance = useRef<any>(null)
    const placesServiceInstance = useRef<any>(null)
    const [venueName, setVenueName] = useState("")
    const [naverClientId, setNaverClientId] = useState("")
    const [googleMapsApiKey, setGoogleMapsApiKey] = useState("")
    const [tmapApiKey, setTmapApiKey] = useState("")
    const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number }>({ lat: 37.3595704, lng: 127.105399 })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>("")
    const [apiKeysLoaded, setApiKeysLoaded] = useState(false)

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
        if (!query.trim()) return
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
                updateMapAndMarker(result.lat, result.lng)
            }
        } catch (err: any) {
            setError(err.message || "장소 검색에 실패했습니다")
        } finally {
            setIsLoading(false)
        }
    }

    // 지도와 마커 위치 업데이트
    const updateMapAndMarker = (lat: number, lng: number) => {
        if (!mapInstance.current || !window.naver) return

        const position = new window.naver.maps.LatLng(lat, lng)
        mapInstance.current.morph(position, 15) // 고정된 줌 레벨

        if (markerInstance.current) {
            markerInstance.current.setPosition(position)
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
            // UI 컨트롤 모두 제거
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
                url: markerImage,
                size: originalSize,
                scaledSize: displaySize,
                origin: new window.naver.maps.Point(0, 0),
                anchor: iconAnchor,
            },
            clickable: true,
        })

        window.naver.maps.Event.addListener(
            markerInstance.current,
            "click",
            () => {
                const encodedName = encodeURIComponent(venueName || "위치")
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

    // 구글 Maps 서비스 초기화
    const initGoogleServices = () => {
        if (!window.google || !window.google.maps) return

        try {
            geocoderInstance.current = new window.google.maps.Geocoder()

            const tempDiv = document.createElement("div")
            document.body.appendChild(tempDiv)
            placesServiceInstance.current =
                new window.google.maps.places.PlacesService(tempDiv)

            if (venueName.trim()) {
                setTimeout(() => searchPlace(venueName), 500)
            }
        } catch (err) {
            setError("구글 Maps 서비스 초기화에 실패했습니다")
        }
    }

    // API 로드
    useEffect(() => {
        const fetchConfigAndVenue = async () => {
            try {
                // 임시: placeName prop 직접 사용
                setVenueName(placeName || "")
                
                // API에서 인증키만 가져오기 (실패해도 계속 진행)
                try {
                    const configRes = await fetch('https://wedding-admin-proxy.vercel.app/api/map-config')
                    if (configRes.ok) {
                        const configJson = await configRes.json()
                        if (configJson.success) {
                            setNaverClientId(configJson.data.naverClientId || "3cxftuac0e")
                            setGoogleMapsApiKey(configJson.data.googleMapsApiKey || "")
                            setTmapApiKey(configJson.data.tmapApiKey || "")
                        } else {
                            // API 응답은 성공했지만 데이터가 없는 경우
                            setNaverClientId("3cxftuac0e")
                            setGoogleMapsApiKey("")
                        }
                    } else {
                        // API 호출 실패
                        setNaverClientId("3cxftuac0e")
                        setGoogleMapsApiKey("")
                    }
                } catch (err) {
                    // API 호출 자체가 실패한 경우
                    setNaverClientId("3cxftuac0e")
                    setGoogleMapsApiKey("")
                    console.log("API config 로드 실패, 기본값 사용:", err)
                }
                
                // API 키 로딩 완료 표시
                setApiKeysLoaded(true)

            } catch (err) {
                setError("지도 설정 정보를 불러오지 못했습니다")
                setApiKeysLoaded(true)
            }
        }
        fetchConfigAndVenue()

        return () => {
            if (window.initGoogleMaps) delete window.initGoogleMaps
        }
    }, [pageId, placeName])

    // 네이버 지도 및 구글 서비스 초기화 (API 키가 준비된 후)
    useEffect(() => {
        if (!apiKeysLoaded) return

        // 네이버 지도는 항상 로드 (기본 클라이언트 ID 사용)
        if (!window.naver || !window.naver.maps) {
            const currentNaverClientId = naverClientId || "3cxftuac0e"
            const naverScript = document.createElement("script")
            naverScript.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${currentNaverClientId}`
            naverScript.async = true
            naverScript.onload = () => {
                setTimeout(() => {
                    initNaverMap()
                    // 네이버 지도 초기화 후, 장소명이 있으면 구글 서비스도 초기화
                    if (googleMapsApiKey && venueName.trim()) {
                        initGoogleServicesAndSearch()
                    }
                }, 200)
            }
            naverScript.onerror = () => setError("네이버 지도 API 로드 실패")
            document.head.appendChild(naverScript)
        } else {
            initNaverMap()
            // 네이버 지도가 이미 있고, 구글 키가 있으면서 장소명이 있으면 구글 서비스 초기화
            if (googleMapsApiKey && venueName.trim()) {
                initGoogleServicesAndSearch()
            }
        }

        // 구글 Maps는 API 키가 있을 때만 로드
        if (googleMapsApiKey && (!window.google || !window.google.maps)) {
            window.initGoogleMaps = () => {
                initGoogleServices()
                // 구글 서비스 초기화 후 바로 검색 실행
                if (venueName.trim()) {
                    setTimeout(() => searchPlace(venueName), 500)
                }
            }

            const googleScript = document.createElement("script")
            googleScript.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initGoogleMaps`
            googleScript.async = true
            googleScript.defer = true
            googleScript.onerror = () => setError("구글 Maps API 로드 실패")
            document.head.appendChild(googleScript)
        } else if (window.google && window.google.maps && googleMapsApiKey && venueName.trim()) {
            // 구글 Maps가 이미 로드되어 있고, 키와 장소명이 있으면 바로 서비스 초기화 및 검색
            initGoogleServicesAndSearch()
        }
    }, [apiKeysLoaded, naverClientId, googleMapsApiKey, venueName])

    // 구글 서비스 초기화 후 바로 검색하는 헬퍼 함수
    const initGoogleServicesAndSearch = () => {
        if (window.google && window.google.maps) {
            initGoogleServices()
            if (venueName.trim()) {
                setTimeout(() => searchPlace(venueName), 500)
            }
        }
    }

    // 장소명만 변경되었을 때의 검색 (지도와 서비스가 이미 준비된 상태)
    useEffect(() => {
        console.log('venueName 상태 변경:', venueName)
        if (
            venueName.trim() &&
            mapInstance.current &&
            geocoderInstance.current &&
            placesServiceInstance.current &&
            apiKeysLoaded &&
            googleMapsApiKey
        ) {
            console.log('모든 조건 만족, 검색 실행:', venueName)
            searchPlace(venueName)
        }
    }, [venueName])

    // 이제 불필요한 useEffect 제거 (기존의 venueName, naverClientId 의존성)
    // useEffect(() => {
    //     if (!venueName || !naverClientId) return
    //     // 네이버/구글 지도 스크립트 로드 및 검색 등
    // }, [venueName, naverClientId])

    // venueName 없으면 안내 메시지
    if (!venueName || !venueName.trim()) {
        return <div style={{ padding: 24, color: "#f00", background: "#fffbe6", borderRadius: 8 }}>장소명이 입력되지 않았습니다. Property Controls에서 장소명을 입력하세요.</div>
    }

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

            {/* API 키 로딩 중 */}
            {!apiKeysLoaded && (
                <div
                    style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        right: "10px",
                        padding: "8px 12px",
                        backgroundColor: "#007aff",
                        color: "white",
                        borderRadius: "4px",
                        fontSize: "14px",
                        textAlign: "center",
                        zIndex: 1000,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                >
                    API 키 로딩 중...
                </div>
            )}

            {/* API 키 필수 안내 */}
            {apiKeysLoaded && !googleMapsApiKey && venueName && (
                <div
                    style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        right: "10px",
                        padding: "8px 12px",
                        backgroundColor: "#ff9500",
                        color: "white",
                        borderRadius: "4px",
                        fontSize: "14px",
                        textAlign: "center",
                        zIndex: 1000,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                >
                    정확한 장소 검색을 위해 구글 Maps API 키가 필요합니다
                </div>
            )}

            {/* 로딩 */}
            {isLoading && (
                <div
                    style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        right: "10px",
                        padding: "8px 12px",
                        backgroundColor: "#007aff",
                        color: "white",
                        borderRadius: "4px",
                        fontSize: "14px",
                        textAlign: "center",
                        zIndex: 1000,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                >
                    검색 중...
                </div>
            )}

            {/* 에러 */}
            {error && (
                <div
                    style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        right: "10px",
                        padding: "8px 12px",
                        backgroundColor: "#ff3b30",
                        color: "white",
                        borderRadius: "4px",
                        fontSize: "14px",
                        textAlign: "center",
                        zIndex: 1000,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                >
                    {error}
                </div>
            )}
        </div>
    )
}

NaverPlaceSearchMap.defaultProps = {
    pageId: "default",
    placeName: "",
    markerImage: "https://via.placeholder.com/100x104.png?text=Marker",
    retina: true,
}

addPropertyControls(NaverPlaceSearchMap, {
    pageId: {
        type: ControlType.String,
        title: "페이지 ID",
        defaultValue: "default",
        placeholder: "각 결혼식 페이지를 구분하는 고유 ID",
    },
    placeName: {
        type: ControlType.String,
        title: "장소명",
        defaultValue: "",
        placeholder: "검색할 장소의 이름",
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
})
