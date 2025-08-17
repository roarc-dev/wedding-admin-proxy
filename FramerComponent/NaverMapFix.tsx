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
                venue_name: result.data.venue_name || '',
                venue_address: result.data.venue_address || '',
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
        google: any
        initGoogleMaps: () => void
        navermap_authFailure: () => void
    }
}

interface Props {
    pageId: string
    placeName: string
    forcePlaceName: string
    retina: boolean
    style?: React.CSSProperties
}

export default function NaverMapFix({
    pageId = "default",
    placeName = "",
    forcePlaceName = "",
    retina,
    style,
}: Props) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstance = useRef<any>(null)
    const markerInstance = useRef<any>(null)
    const geocoderInstance = useRef<any>(null)
    const placesServiceInstance = useRef<any>(null)
    const [pageSettings, setPageSettings] = useState<PageSettings | null>(null)
    const [venueName, setVenueName] = useState("")
    const [naverClientId, setNaverClientId] = useState("")
    const [googleMapsApiKey, setGoogleMapsApiKey] = useState("")
    const [tmapApiKey, setTmapApiKey] = useState("")
    const [currentPosition, setCurrentPosition] = useState<{
        lat: number
        lng: number
    }>({ lat: 37.3595704, lng: 127.105399 })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>("")
    const [apiKeysLoaded, setApiKeysLoaded] = useState(false)
    const [searchAttempted, setSearchAttempted] = useState(false)
    const [searchSuccess, setSearchSuccess] = useState(false)

    // 검색 재시도 관련 state
    const searchRetryCount = useRef(0)
    const maxRetries = 3
    const retryDelay = 2000 // 2초

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

    // 검색 재시도 로직이 포함된 메인 검색 함수
    const searchPlaceWithRetry = async (
        query: string,
        retryCount = 0
    ): Promise<void> => {
        if (!query.trim()) return

        console.log(`검색 시도 ${retryCount + 1}/${maxRetries + 1}: ${query}`)

        if (!googleMapsApiKey) {
            console.log("구글 Maps API 키가 필요합니다")
            setSearchAttempted(true)
            setSearchSuccess(false)
            return
        }

        setIsLoading(true)
        if (retryCount === 0) {
            setSearchAttempted(false)
            setSearchSuccess(false)
        }

        try {
            let result = null

            // 방법 1: Places Text Search (가장 정확함)
            try {
                result = await searchWithPlacesTextSearch(query)
                console.log("Places Text Search 성공:", result)
            } catch (error1) {
                console.log("Places Text Search 실패:", error1)
                // 방법 2: Geocoder (주소 검색)
                try {
                    result = await searchWithGeocoder(query)
                    console.log("Geocoder 성공:", result)
                } catch (error2) {
                    console.log("Geocoder 실패:", error2)
                    // 방법 3: Nearby Search (키워드 검색)
                    try {
                        result = await searchWithNearbySearch(query)
                        console.log("Nearby Search 성공:", result)
                    } catch (error3) {
                        console.log("모든 검색 방법 실패")
                        throw new Error(`"${query}"를 찾을 수 없습니다`)
                    }
                }
            }

            if (result) {
                setCurrentPosition({ lat: result.lat, lng: result.lng })
                updateMapAndMarker(result.lat, result.lng)
                setSearchSuccess(true)
                setSearchAttempted(true)
                searchRetryCount.current = 0 // 성공 시 재시도 카운트 리셋
                console.log("검색 성공, 위치 업데이트:", result)
            }
        } catch (err: any) {
            console.log(
                `검색 실패 (${retryCount + 1}/${maxRetries + 1}):`,
                err.message
            )

            // 재시도 로직
            if (retryCount < maxRetries) {
                console.log(`${retryDelay}ms 후 재시도...`)
                setTimeout(() => {
                    searchPlaceWithRetry(query, retryCount + 1)
                }, retryDelay)
                return // 여기서 return하여 아래 finally 블록을 실행하지 않음
            } else {
                // 모든 재시도 실패
                console.log(
                    "모든 재시도 실패:",
                    err.message || "장소 검색에 실패했습니다"
                )
                setSearchAttempted(true)
                setSearchSuccess(false)
                console.log("모든 재시도 실패, 기본 위치 유지")
            }
        } finally {
            // 재시도 중이 아닐 때만 로딩 상태 해제
            if (retryCount >= maxRetries || searchSuccess) {
                setIsLoading(false)
            }
        }
    }

    // 기존 searchPlace 함수를 새로운 재시도 함수로 교체
    const searchPlace = (query: string) => {
        searchRetryCount.current = 0
        searchPlaceWithRetry(query, 0)
    }

    // 지도와 마커 위치 업데이트 - morph 효과 제거
    const updateMapAndMarker = (lat: number, lng: number) => {
        if (!mapInstance.current || !window.naver) return

        const position = new window.naver.maps.LatLng(lat, lng)
        // morph 대신 setCenter 사용으로 즉시 이동
        mapInstance.current.setCenter(position)
        mapInstance.current.setZoom(15)

        if (markerInstance.current) {
            markerInstance.current.setPosition(position)
            markerInstance.current.setVisible(true)
        }
    }

    // 네이버 지도 초기화 - 검색 완료 후에만 지도 표시
    const initNaverMap = () => {
        if (!window.naver || !mapRef.current) return

        // 검색이 완료된 위치로 바로 초기화
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

            console.log("구글 서비스 초기화 완료")

            // 서비스 초기화 후 대기 시간을 더 길게
            if (venueName.trim()) {
                setTimeout(() => {
                    console.log("구글 서비스 초기화 후 검색 시작:", venueName)
                    searchPlace(venueName)
                }, 1000) // 1초로 증가
            }
        } catch (err) {
            console.log("구글 Maps 서비스 초기화 실패:", err)
        }
    }

    // API 로드 및 페이지 설정 가져오기
    useEffect(() => {
        const fetchConfigAndVenue = async () => {
            try {
                // 페이지 설정과 API 설정을 병렬로 로드
                const [settings, configRes] = await Promise.all([
                    getPageSettings(pageId),
                    fetch("https://wedding-admin-proxy.vercel.app/api/map-config")
                ])
                
                setPageSettings(settings)
                
                // 장소명 결정 로직: 강제 입력 > 서버 데이터 > 기본값
                let finalVenueName = ""
                
                if (forcePlaceName && forcePlaceName.trim()) {
                    // 강제 입력된 장소명이 있으면 우선 사용
                    finalVenueName = forcePlaceName.trim()
                    console.log("강제 입력된 장소명 사용:", finalVenueName)
                } else if (settings?.venue_name && settings.venue_name.trim()) {
                    // 서버에서 가져온 venue_name 사용
                    finalVenueName = settings.venue_name.trim()
                    console.log("서버 venue_name 사용:", finalVenueName)
                } else if (placeName && placeName.trim()) {
                    // 기존 placeName 사용 (하위 호환성)
                    finalVenueName = placeName.trim()
                    console.log("기존 placeName 사용:", finalVenueName)
                }
                
                setVenueName(finalVenueName)
                
                // 검색 결과 검토 로직 추가
                if (settings?.venue_name && settings?.venue_address) {
                    console.log("서버 데이터 검토:", {
                        venue_name: settings.venue_name,
                        venue_address: settings.venue_address,
                        final_venue_name: finalVenueName
                    })
                }

                // API 키 설정
                if (configRes.ok) {
                    const configJson = await configRes.json()
                    console.log("Map config response:", configJson)
                    
                    if (configJson.success) {
                        // map-config.js의 실제 필드명에 맞춰 수정
                        setNaverClientId(
                            configJson.data.naverMapsKey || 
                            configJson.data.naverClientId || 
                            "3cxftuac0e"
                        )
                        setGoogleMapsApiKey(
                            configJson.data.googleMapsApiKey || 
                            configJson.data.googleMapsKey || 
                            ""
                        )
                        setTmapApiKey(
                            configJson.data.tmapApiKey || 
                            ""
                        )
                        
                        console.log("API keys loaded:", {
                            naver: configJson.data.naverMapsKey || configJson.data.naverClientId,
                            google: configJson.data.googleMapsApiKey || configJson.data.googleMapsKey,
                            tmap: configJson.data.tmapApiKey
                        })
                    } else {
                        console.warn("Map config failed:", configJson.error)
                        setNaverClientId("3cxftuac0e")
                        setGoogleMapsApiKey("")
                    }
                } else {
                    console.warn("Map config request failed:", configRes.status)
                    setNaverClientId("3cxftuac0e")
                    setGoogleMapsApiKey("")
                }

                // API 키 로딩 완료를 약간 지연시켜 안정성 확보
                setTimeout(() => {
                    setApiKeysLoaded(true)
                }, 500)
            } catch (err) {
                console.log("지도 설정 정보를 불러오지 못했습니다:", err)
                setApiKeysLoaded(true)
            }
        }
        fetchConfigAndVenue()

        return () => {
            // cleanup
        }
    }, [pageId, placeName, forcePlaceName])

    // 네이버 지도 및 구글 서비스 초기화 (API 키가 준비된 후)
    useEffect(() => {
        if (!apiKeysLoaded) return

        // 네이버 지도 API 인증 실패 처리
        window.navermap_authFailure = function () {
            console.log("네이버 지도 API 인증 실패")
            setError("네이버 지도 API 인증에 실패했습니다")
        }

        // 구글 Maps 먼저 로드하여 검색 완료 후 네이버 지도 초기화
        if (googleMapsApiKey && (!window.google || !window.google.maps)) {
            window.initGoogleMaps = () => {
                initGoogleServices()
            }

            const googleScript = document.createElement("script")
            googleScript.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initGoogleMaps`
            googleScript.async = true
            googleScript.defer = true
            googleScript.onerror = () => console.log("구글 Maps API 로드 실패")
            document.head.appendChild(googleScript)
        } else if (
            window.google &&
            window.google.maps &&
            googleMapsApiKey &&
            venueName.trim()
        ) {
            initGoogleServicesAndSearch()
        }

        // 네이버 지도는 검색 완료 후에만 초기화하도록 수정하지 않고,
        // 검색이 없는 경우를 위해 여전히 로드하되 마커만 숨김
        if (!window.naver || !window.naver.maps) {
            const currentNaverClientId = naverClientId || "3cxftuac0e"
            const naverScript = document.createElement("script")
            naverScript.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${currentNaverClientId}`
            naverScript.async = true
            naverScript.onload = () => {
                // 네이버 지도 로드 후 대기 시간 단축
                setTimeout(() => {
                    // 검색이 이미 완료된 경우에만 지도 초기화
                    if (
                        searchSuccess ||
                        !venueName.trim() ||
                        !googleMapsApiKey
                    ) {
                        initNaverMap()
                    }
                }, 100)
            }
            naverScript.onerror = () => console.log("네이버 지도 API 로드 실패")
            document.head.appendChild(naverScript)
        }
    }, [apiKeysLoaded, naverClientId, googleMapsApiKey, venueName])

    // 구글 서비스 초기화 후 바로 검색하는 헬퍼 함수
    const initGoogleServicesAndSearch = () => {
        if (window.google && window.google.maps) {
            initGoogleServices()
        }
    }

    // 장소명만 변경되었을 때의 검색
    useEffect(() => {
        console.log("venueName 상태 변경:", venueName)
        if (
            venueName.trim() &&
            mapInstance.current &&
            geocoderInstance.current &&
            placesServiceInstance.current &&
            apiKeysLoaded &&
            googleMapsApiKey &&
            !isLoading && // 현재 로딩 중이 아닐 때만
            searchRetryCount.current === 0 // 재시도 중이 아닐 때만
        ) {
            console.log("조건 만족, 검색 실행:", venueName)
            searchPlace(venueName)
        }
    }, [venueName])

    // 검색 성공 시 지도 초기화 및 마커 표시 업데이트
    useEffect(() => {
        if (searchSuccess && window.naver && window.naver.maps) {
            // 검색 성공 후 지도가 없다면 초기화
            if (!mapInstance.current) {
                initNaverMap()
            } else {
                // 이미 지도가 있다면 위치만 업데이트
                updateMapAndMarker(currentPosition.lat, currentPosition.lng)
            }
        }
    }, [searchSuccess, currentPosition])

    // venueName 없으면 안내 메시지
    if (!venueName || !venueName.trim()) {
        return (
            <div
                style={{
                    padding: 24,
                    color: "#f00",
                    background: "#fffbe6",
                    borderRadius: 8,
                }}
            >
                장소명이 입력되지 않았습니다. Property Controls에서 장소명을
                입력하세요.
            </div>
        )
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

            {/* 모든 상태 메시지 제거 - 고객용 컴포넌트 */}
        </div>
    )
}

NaverMapFix.defaultProps = {
    pageId: "default",
    placeName: "",
    forcePlaceName: "",
    retina: true,
}

addPropertyControls(NaverMapFix, {
    pageId: {
        type: ControlType.String,
        title: "페이지 ID",
        defaultValue: "default",
        placeholder: "각 결혼식 페이지를 구분하는 고유 ID",
    },
    forcePlaceName: {
        type: ControlType.String,
        title: "강제 장소명",
        defaultValue: "",
        placeholder: "서버 데이터 대신 사용할 장소명 (공란시 서버 데이터 사용)",
    },
    placeName: {
        type: ControlType.String,
        title: "장소명 (하위 호환)",
        defaultValue: "",
        placeholder: "검색할 장소의 이름 (강제 장소명이 없을 때 사용)",
    },
    retina: {
        type: ControlType.Boolean,
        title: "레티나",
        defaultValue: true,
    },
})
