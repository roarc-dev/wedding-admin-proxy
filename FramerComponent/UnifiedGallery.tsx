import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

// 갤러리 타입 정의
type GalleryType = "thumbnail" | "slide"

// 네트워크 상태 타입 정의
interface NetworkInfo {
    effectiveType: string
    downlink: number
    rtt: number
}

// 이미지 타입 정의
interface GalleryImage {
    id: string
    src: string
    alt: string
    original_name: string
    file_size?: number
    created_at: string
}

// Supabase public URL을 변환(render) URL로 변경해 크기/품질 최적화
const toTransformedUrl = (
    publicUrl: string,
    opts: { width?: number; height?: number; quality?: number; format?: "webp" | "jpg" | "png"; resize?: "cover" | "contain" | "fill" }
) => {
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

// 변환 실패 시 원본 URL로 폴백하는 핸들러
const makeOnErrorFallback = (originalUrl?: string) => (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget as HTMLImageElement & { dataset: any }
    if (!originalUrl) return
    if (!img.dataset || img.dataset.fallbackDone === "1") return
    img.dataset.fallbackDone = "1"
    ;(img as any).srcset = ""
    img.src = originalUrl
}

// 프록시를 통한 안전한 이미지 목록 가져오기
async function getImagesByPageId(pageId: string) {
    try {
        const response = await fetch(
            `${PROXY_BASE_URL}/api/images?action=getByPageId&pageId=${pageId}`,
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

        if (result.success) {
            return result.data
        } else {
            throw new Error(result.error || "이미지 목록을 가져올 수 없습니다")
        }
    } catch (error) {
        console.error("이미지 목록 가져오기 실패:", error)
        throw error
    }
}

// 페이지 설정에서 갤러리 타입 가져오기
async function getPageGalleryType(pageId: string): Promise<GalleryType> {
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
            console.warn(`페이지 설정 조회 실패: ${response.status}`)
            return "thumbnail" // 기본값
        }

        const result = await response.json()

        if (result.success && result.data) {
            return result.data.gallery_type || "thumbnail" // 기본값
        } else {
            console.warn("페이지 설정이 없습니다:", result.error)
            return "thumbnail" // 기본값
        }
    } catch (error) {
        console.error("갤러리 타입 가져오기 실패:", error)
        return "thumbnail" // 기본값
    }
}

interface UnifiedGalleryProps {
    pageId: string
    showImageCounter?: boolean
    backgroundColor?: string
    selectedBorderColor?: string
    autoRefresh?: boolean
    refreshInterval?: number
    showLoadingState?: boolean
    fallbackImages?: any[]
    style?: any
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 430
 * @framerIntrinsicHeight 650
 */
export default function UnifiedGallery(props: UnifiedGalleryProps) {
    const {
        pageId = "default",
        showImageCounter = true,
        backgroundColor = "#1a1a1a",
        selectedBorderColor = "#6366f1",
        autoRefresh = false,
        refreshInterval = 30,
        showLoadingState = true,
        fallbackImages = [],
        style,
    } = props

    // 고정된 값들
    const thumbnailBorderRadius = 8
    const mainImageBorderRadius = 0

    const [galleryType, setGalleryType] = useState<GalleryType>("thumbnail")
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [images, setImages] = useState<GalleryImage[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const mainImageRef = useRef<HTMLDivElement>(null)

    // 스크롤 상태 추가 (썸네일형용)
    const [showLeftGradient, setShowLeftGradient] = useState(false)
    const [showRightGradient, setShowRightGradient] = useState(false)

    // 터치 이벤트를 위한 state
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    // 이미지 프리로딩을 위한 state
    const [preloadedImages, setPreloadedImages] = useState(new Set<string>())

    // 점진적 로딩을 위한 state
    const [loadedImages, setLoadedImages] = useState<GalleryImage[]>([])
    const [isLoadingMore, setIsLoadingMore] = useState(false)

    // 네트워크 상태 감지
    const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null)
    const [isSlowNetwork, setIsSlowNetwork] = useState(false)

    // 기본 이미지 (데이터가 없을 때 사용)
    const defaultImages: GalleryImage[] = Array.from({ length: 6 }, (_, i) => ({
        id: `default-${i}`,
        src: `https://picsum.photos/400/460?random=${i}`,
        alt: `Sample image ${i + 1}`,
        original_name: `Sample ${i + 1}`,
        created_at: new Date().toISOString(),
    }))

    // 표시할 이미지 결정 - 네트워크 상태에 따라 조정
    const galleryImages =
        images.length > 0 ? images : showLoadingState ? [] : defaultImages
    const displayImages = isSlowNetwork
        ? galleryImages.slice(0, 3)
        : galleryImages

    // 갤러리 타입과 이미지 데이터를 함께 로드
    useEffect(() => {
        async function loadGalleryData() {
            try {
                setLoading(true)
                setError("")
                
                // 갤러리 타입과 이미지 데이터를 병렬로 로드
                const [type, imageData] = await Promise.all([
                    getPageGalleryType(pageId),
                    getImagesByPageId(pageId)
                ])
                
                setGalleryType(type)
                
                // 이미지 데이터를 갤러리 형식으로 변환
                const galleryImages: GalleryImage[] = imageData.map(
                    (img: any, index: number) => ({
                        id: img.id,
                        src: img.public_url,
                        alt: img.original_name || `Image ${index + 1}`,
                        original_name: img.original_name,
                        file_size: img.file_size,
                        created_at: img.created_at,
                    })
                )

                setImages(galleryImages)

                // 새로운 이미지가 로드되면 첫 번째 이미지로 선택 초기화
                if (
                    galleryImages.length > 0 &&
                    selectedIndex >= galleryImages.length
                ) {
                    setSelectedIndex(0)
                }

                // 첫 번째 이미지 프리로딩
                if (galleryImages.length > 0) {
                    preloadImage(galleryImages[0].src)
                }
            } catch (error) {
                console.error("갤러리 데이터 로드 실패:", error)
                setGalleryType("thumbnail") // 기본값
                setError(
                    error instanceof Error
                        ? error.message
                        : "알 수 없는 오류가 발생했습니다"
                )

                // 에러 시 fallback 이미지 사용
                if (fallbackImages.length > 0) {
                    const fallbackGalleryImages: GalleryImage[] =
                        fallbackImages.map((img: any, index: number) => ({
                            id: `fallback-${index}`,
                            src: typeof img === "string" ? img : img.src || img,
                            alt:
                                typeof img === "object"
                                    ? img.alt
                                    : `Fallback image ${index + 1}`,
                            original_name: `Fallback ${index + 1}`,
                            created_at: new Date().toISOString(),
                        }))
                    setImages(fallbackGalleryImages)
                }
            } finally {
                setLoading(false)
            }
        }

        loadGalleryData()
    }, [pageId])

    // 네트워크 상태 감지
    useEffect(() => {
        if ("connection" in navigator) {
            const connection = (navigator as any).connection as NetworkInfo
            setNetworkInfo(connection)
            setIsSlowNetwork(
                connection.effectiveType === "slow-2g" ||
                    connection.effectiveType === "2g" ||
                    connection.downlink < 1
            )
        }
    }, [])

    // 이미지 프리로딩 함수
    const preloadImage = (src: string) => {
        if (!src || preloadedImages.has(src)) return

        const img = new Image()
        img.onload = () => {
            setPreloadedImages((prev) => new Set([...prev, src]))
        }
        img.onerror = () => {
            console.warn(`이미지 프리로딩 실패: ${src}`)
        }
        img.src = src
    }

    // 현재 선택된 이미지 변경 시 다음 이미지 프리로딩
    useEffect(() => {
        if (selectedIndex < displayImages.length - 1) {
            const nextImage = displayImages[selectedIndex + 1]
            if (nextImage?.src) {
                preloadImage(nextImage.src)
            }
        }
    }, [selectedIndex, displayImages])

    // 점진적 로딩 - 첫 번째 이미지만 먼저 로드
    useEffect(() => {
        if (galleryImages.length > 0 && loadedImages.length === 0) {
            // 첫 번째 이미지만 먼저 표시
            setLoadedImages([galleryImages[0]])

            // 나머지 이미지들을 백그라운드에서 로드
            setTimeout(() => {
                setLoadedImages(galleryImages)
            }, 100)
        }
    }, [galleryImages])

    // 스크롤 상태 체크 함수 (썸네일형용)
    const checkScrollState = () => {
        if (!scrollContainerRef.current) return

        const container = scrollContainerRef.current
        const scrollLeft = container.scrollLeft
        const scrollWidth = container.scrollWidth
        const clientWidth = container.clientWidth

        // 좌측 그라데이션: 스크롤이 시작되면 표시
        setShowLeftGradient(scrollLeft > 0)

        // 우측 그라데이션: 끝에 도달하면 숨김
        setShowRightGradient(scrollLeft < scrollWidth - clientWidth)
    }

    // 스크롤 이벤트 리스너 (썸네일형용)
    useEffect(() => {
        if (galleryType !== "thumbnail") return

        const container = scrollContainerRef.current
        if (!container) return

        // 초기 상태 체크
        checkScrollState()

        // 스크롤 이벤트 리스너 추가
        container.addEventListener("scroll", checkScrollState)

        // 리사이즈 이벤트도 추가 (반응형 대응)
        const handleResize = () => {
            setTimeout(checkScrollState, 100)
        }
        window.addEventListener("resize", handleResize)

        return () => {
            container.removeEventListener("scroll", checkScrollState)
            window.removeEventListener("resize", handleResize)
        }
    }, [displayImages.length, galleryType])

    // 이미지 목록 새로고침 (자동 새로고침용)
    const refreshImages = async () => {
        try {
            const data = await getImagesByPageId(pageId)

            // 이미지 데이터를 갤러리 형식으로 변환
            const galleryImages: GalleryImage[] = data.map(
                (img: any, index: number) => ({
                    id: img.id,
                    src: img.public_url,
                    alt: img.original_name || `Image ${index + 1}`,
                    original_name: img.original_name,
                    file_size: img.file_size,
                    created_at: img.created_at,
                })
            )

            setImages(galleryImages)

            // 새로운 이미지가 로드되면 첫 번째 이미지로 선택 초기화
            if (
                galleryImages.length > 0 &&
                selectedIndex >= galleryImages.length
            ) {
                setSelectedIndex(0)
            }
        } catch (error) {
            console.error("이미지 새로고침 실패:", error)
        }
    }

    // 자동 새로고침
    useEffect(() => {
        if (autoRefresh && refreshInterval > 0) {
            const interval = setInterval(refreshImages, refreshInterval * 1000)
            return () => clearInterval(interval)
        }
    }, [autoRefresh, refreshInterval, pageId])

    // 썸네일 클릭 핸들러 (썸네일형용)
    const handleThumbnailClick = (index: number) => {
        setSelectedIndex(index)

        // 선택된 썸네일이 보이도록 스크롤 조정
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current
            const thumbnail = container.children[index] as HTMLElement

            if (thumbnail) {
                const containerWidth = container.offsetWidth
                const thumbnailLeft = thumbnail.offsetLeft
                const thumbnailWidth = thumbnail.offsetWidth

                // 썸네일이 중앙에 오도록 스크롤 위치 계산
                const scrollLeft =
                    thumbnailLeft - containerWidth / 2 + thumbnailWidth / 2

                container.scrollTo({
                    left: scrollLeft,
                    behavior: "smooth",
                })
            }
        }
    }

    // 다음/이전 이미지로 이동
    const goToNext = () => {
        if (galleryType === "slide") {
            const nextIndex =
                selectedIndex < displayImages.length - 1 ? selectedIndex + 1 : 0
            setSelectedIndex(nextIndex)
            scrollToImage(nextIndex)
        } else {
            if (selectedIndex < displayImages.length - 1) {
                handleThumbnailClick(selectedIndex + 1)
            }
        }
    }

    const goToPrevious = () => {
        if (galleryType === "slide") {
            const prevIndex =
                selectedIndex > 0 ? selectedIndex - 1 : displayImages.length - 1
            setSelectedIndex(prevIndex)
            scrollToImage(prevIndex)
        } else {
            if (selectedIndex > 0) {
                handleThumbnailClick(selectedIndex - 1)
            }
        }
    }

    // 특정 이미지로 스크롤 (슬라이드형용)
    const scrollToImage = (index: number) => {
        if (scrollContainerRef.current) {
            const scrollLeft = index * (344 + 10) // 이미지 너비 + 간격
            scrollContainerRef.current.scrollTo({
                left: scrollLeft,
                behavior: "smooth",
            })
        }
    }

    // 스크롤 이벤트로 현재 이미지 인덱스 업데이트 (슬라이드형용)
    const handleScroll = () => {
        if (scrollContainerRef.current && galleryType === "slide") {
            const scrollLeft = scrollContainerRef.current.scrollLeft
            const imageWidth = 344 + 10 // 이미지 너비 + 간격
            const newIndex = Math.round(scrollLeft / imageWidth)
            if (newIndex !== selectedIndex && newIndex < displayImages.length) {
                setSelectedIndex(newIndex)
            }
        }
    }

    // 터치 이벤트 핸들러
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return

        const distance = touchStart - touchEnd
        const minSwipeDistance = 50

        if (distance > minSwipeDistance) {
            // 왼쪽으로 스와이프 (다음 이미지)
            goToNext()
        } else if (distance < -minSwipeDistance) {
            // 오른쪽으로 스와이프 (이전 이미지)
            goToPrevious()
        }
    }

    // 키보드 네비게이션
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                goToPrevious()
            } else if (e.key === "ArrowRight") {
                goToNext()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [selectedIndex, displayImages.length, galleryType])

    // 애니메이션 설정 (페이드만 사용)
    const animationVariants = {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    }

    // 파일 크기 포맷팅
    const formatFileSize = (bytes: number) => {
        if (!bytes) return ""
        if (bytes < 1024) return `${bytes}B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
    }

    // 캐싱 최적화된 이미지 URL 생성
    const getOptimizedImageUrl = (originalUrl: string, timestamp: string) => {
        return `${originalUrl}?v=${timestamp}&cache=1`
    }

    // 공통 컨테이너 스타일 (반응형)
    const containerStyle = {
        ...style,
        width: "100%",
        maxWidth: "430px",
        margin: "0 auto", // 중앙 정렬
        backgroundColor: "transparent",
        padding: "0",
        boxSizing: "border-box",
        marginBottom: galleryType === "thumbnail" ? "60px" : "0",
    }

    // 로딩 스켈레톤 컴포넌트
    const LoadingSkeleton = () => (
        <div
            style={{
                ...containerStyle,
                height: "650px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <motion.div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "15px",
                    color: "white",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                {/* 메인 이미지 스켈레톤 */}
                <div
                    style={{
                        width: "100%",
                        height: galleryType === "slide" ? "529px" : "460px",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "30px",
                    }}
                >
                    <div style={{ fontSize: "32px", opacity: 0.5 }}>
                        Loading
                    </div>
                </div>

                {/* 썸네일 스켈레톤 (썸네일형만) */}
                {galleryType === "thumbnail" && (
                    <div
                        style={{
                            display: "flex",
                            gap: "6px",
                            paddingLeft: "16px",
                            paddingRight: "16px",
                            width: "100%",
                        }}
                    >
                        {Array.from({ length: 6 }, (_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: "60px",
                                    height: "60px",
                                    backgroundColor: "rgba(255,255,255,0.1)",
                                    borderRadius: "8px",
                                    flexShrink: 0,
                                }}
                            />
                        ))}
                    </div>
                )}

                <div style={{ fontSize: "16px", fontWeight: 500 }}>
                    이미지를 불러오는 중...
                </div>
            </motion.div>
        </div>
    )

    // 개선된 이미지 에러 처리 함수
    const handleImageError = (e: any, fallbackSrc?: string) => {
        const target = e.target as HTMLImageElement
        target.style.display = "none"

        if (target.parentNode) {
            const parent = target.parentNode as HTMLElement
            parent.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; flex-direction: column; gap: 10px;">
                    <div style="font-size: 24px;">Image Error</div>
                    <div>이미지를 불러올 수 없습니다</div>
                </div>
            `
        }
    }

    // 이미지 비율에 따른 표시 방식 결정
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget
        const isLandscape = img.naturalWidth > img.naturalHeight

        if (isLandscape) {
            // 가로 사진: 가로를 100% 채우고 세로는 비율에 맞게 조정
            img.style.objectFit = "contain"
            img.style.objectPosition = "center"
        } else {
            // 세로 사진: 세로를 100% 채우고 가로는 중앙 정렬
            img.style.objectFit = "cover"
            img.style.objectPosition = "center"
        }
    }

    // 로딩 중일 때
    if (loading && showLoadingState) {
        return <LoadingSkeleton />
    }

    // 에러 상태
    if (error && displayImages.length === 0) {
        return (
            <div
                style={{
                    ...containerStyle,
                    height: "650px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <motion.div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "15px",
                        color: "white",
                        textAlign: "center",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div style={{ fontSize: "32px" }}>Error</div>
                    <div style={{ fontSize: "16px", fontWeight: 500 }}>
                        이미지를 불러올 수 없습니다
                    </div>
                    <div
                        style={{
                            fontSize: "12px",
                            opacity: 0.7,
                            lineHeight: 1.4,
                        }}
                    >
                        네트워크 연결을 확인해주세요
                    </div>
                    <button
                        onClick={refreshImages}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: selectedBorderColor,
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            cursor: "pointer",
                            marginTop: "10px",
                        }}
                    >
                        다시 시도
                    </button>
                </motion.div>
            </div>
        )
    }

    // 이미지가 없는 경우
    if (displayImages.length === 0) {
        return (
            <div
                style={{
                    ...containerStyle,
                    height: "650px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <motion.div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "15px",
                        color: "white",
                        textAlign: "center",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div style={{ fontSize: "64px", opacity: 0.3 }}>
                        No Images
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 500 }}>
                        업로드된 이미지가 없습니다
                    </div>
                    <div
                        style={{
                            fontSize: "12px",
                            opacity: 0.7,
                            lineHeight: 1.4,
                        }}
                    >
                        이미지를 업로드한 후 다시 시도해주세요
                    </div>
                    <button
                        onClick={refreshImages}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: selectedBorderColor,
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            cursor: "pointer",
                            marginTop: "10px",
                        }}
                    >
                        새로고침
                    </button>
                </motion.div>
            </div>
        )
    }

    // 갤러리 타입에 따른 렌더링
    if (galleryType === "slide") {
        // 베이직형 (슬라이드) 갤러리
        return (
            <div style={containerStyle}>
                {/* 네트워크 상태 표시 (느린 네트워크일 때만) */}
                {isSlowNetwork && (
                    <div
                        style={{
                            padding: "8px 12px",
                            backgroundColor: "rgba(255, 193, 7, 0.2)",
                            color: "#856404",
                            borderRadius: "6px",
                            fontSize: "12px",
                            marginBottom: "10px",
                            textAlign: "center",
                            border: "1px solid rgba(255, 193, 7, 0.3)",
                        }}
                    >
                        느린 네트워크 감지됨 - 최적화된 로딩 모드
                    </div>
                )}

                {/* 메인 이미지 스크롤 영역 */}
                <div
                    style={{
                        width: "100%",
                        height: "529px",
                        position: "relative",
                        overflow: "hidden",
                        backgroundColor: "rgba(0,0,0,0)",
                    }}
                >
                    <div
                        ref={scrollContainerRef}
                        style={{
                            display: "flex",
                            height: "100%",
                            overflowX: "auto",
                            overflowY: "hidden",
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                            gap: "10px",
                            scrollSnapType: "x mandatory",
                        }}
                        onScroll={handleScroll}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {displayImages.map((image, index) => (
                            <div
                                key={image.id || index}
                                style={{
                                    flexShrink: 0,
                                    width: "344px",
                                    height: "529px",
                                    borderRadius: `${mainImageBorderRadius}px`,
                                    overflow: "hidden",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    scrollSnapAlign: "start",
                                    position: "relative",
                                }}
                            >
                                <img
                                    src={toTransformedUrl(image.src, { width: 640, quality: isSlowNetwork ? 60 : 75, format: "jpg", resize: "contain" })}
                                    srcSet={[
                                        `${toTransformedUrl(image.src, { width: 320, quality: isSlowNetwork ? 60 : 75, format: 'jpg', resize: 'contain' })} 320w`,
                                        `${toTransformedUrl(image.src, { width: 480, quality: isSlowNetwork ? 60 : 75, format: 'jpg', resize: 'contain' })} 480w`,
                                        `${toTransformedUrl(image.src, { width: 640, quality: isSlowNetwork ? 60 : 75, format: 'jpg', resize: 'contain' })} 640w`,
                                    ].join(', ')}
                                    sizes="(max-width: 430px) 100vw, 430px"
                                    alt={image.alt}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        userSelect: "none",
                                        pointerEvents: "none",
                                        display: "block",
                                    }}
                                    loading="lazy"
                                    decoding="async"
                                    onLoad={handleImageLoad}
                                    onError={makeOnErrorFallback(image.src)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* 네비게이션 버튼 */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: "12px",
                            left: "12px",
                            display: "flex",
                            gap: "5px",
                        }}
                    >
                        {/* 이전 버튼 */}
                        <button
                            onClick={goToPrevious}
                            style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "14px",
                                border: "none",
                                backgroundColor: "rgba(0, 0, 0, 0.08)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "opacity 0.2s ease",
                                padding: "0",
                            }}
                        >
                            <svg
                                width="7"
                                height="12"
                                viewBox="0 0 7 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M6.0625 11.229L0.999769 6.11461L6.0625 1.00022"
                                    stroke="white"
                                    strokeWidth="1.54982"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>

                        {/* 다음 버튼 */}
                        <button
                            onClick={goToNext}
                            style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "14px",
                                border: "none",
                                backgroundColor: "rgba(0, 0, 0, 0.08)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "opacity 0.2s ease",
                                padding: "0",
                            }}
                        >
                            <svg
                                width="7"
                                height="12"
                                viewBox="0 0 7 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ transform: "scaleX(-1)" }}
                            >
                                <path
                                    d="M6.0625 11.229L0.999769 6.11461L6.0625 1.00022"
                                    stroke="white"
                                    strokeWidth="1.54982"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 스크롤바 숨김을 위한 스타일 */}
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                        div::-webkit-scrollbar {
                            display: none;
                        }
                    `,
                    }}
                />
            </div>
        )
    }

    // 썸네일형 갤러리 (기본값)
    return (
        <div style={containerStyle}>
            {/* 네트워크 상태 표시 (느린 네트워크일 때만) */}
            {isSlowNetwork && (
                <div
                    style={{
                        padding: "8px 12px",
                        backgroundColor: "rgba(255, 193, 7, 0.2)",
                        color: "#856404",
                        borderRadius: "6px",
                        fontSize: "12px",
                        marginBottom: "10px",
                        textAlign: "center",
                        border: "1px solid rgba(255, 193, 7, 0.3)",
                    }}
                >
                    느린 네트워크 감지됨 - 최적화된 로딩 모드
                </div>
            )}

            {/* 메인 이미지 영역 */}
            <div
                ref={mainImageRef}
                style={{
                    width: "100%",
                    height: "460px",
                    position: "relative",
                    borderRadius: 0,
                    overflow: "hidden",
                    backgroundColor: "#rgba(0,0,0,0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <AnimatePresence mode="wait">
                    <motion.img
                        key={selectedIndex}
                        src={displayImages[selectedIndex]?.src}
                        alt={displayImages[selectedIndex]?.alt}
                        style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            userSelect: "none",
                            pointerEvents: "none",
                            display: "block",
                        }}
                        variants={animationVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        onError={handleImageError}
                    />
                </AnimatePresence>

                {/* 이미지 정보 오버레이 */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        color: "white",
                        padding: "20px 16px 16px",
                        fontSize: "12px",
                    }}
                >
                    <div
                        style={{
                            opacity: 0.8,
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    ></div>
                </div>
            </div>

            {/* 썸네일 영역 */}
            <div
                style={{
                    marginTop: "30px",
                    marginBottom: "20px",
                    paddingLeft: 0,
                    paddingRight: 0,
                    position: "relative",
                }}
            >
                <div
                    ref={scrollContainerRef}
                    style={{
                        display: "flex",
                        gap: "6px",
                        overflowX: "auto",
                        scrollbarWidth: "none", // Firefox
                        msOverflowStyle: "none", // IE
                        paddingLeft: "16px",
                        paddingBottom: "20px",
                        paddingRight: "16px",
                    }}
                    className="thumbnail-scroll"
                >
                    {displayImages.map((image, index) => (
                        <motion.div
                            key={image.id || index}
                            style={{
                                flexShrink: 0,
                                width: "60px",
                                height: "60px",
                                borderRadius: `${thumbnailBorderRadius}px`,
                                overflow: "hidden",
                                cursor: "pointer",
                                border:
                                    selectedIndex === index
                                        ? `0px solid ${selectedBorderColor}`
                                        : "0px solid transparent",
                                transition: "border-color 0.2s ease",
                            }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleThumbnailClick(index)}
                        >
                            <img
                                src={toTransformedUrl(image.src, { width: 120, quality: isSlowNetwork ? 50 : 65, format: "webp", resize: "cover" })}
                                srcSet={[
                                    `${toTransformedUrl(image.src, { width: 80, quality: 60, format: 'webp', resize: 'cover' })} 80w`,
                                    `${toTransformedUrl(image.src, { width: 120, quality: 60, format: 'webp', resize: 'cover' })} 120w`,
                                    `${toTransformedUrl(image.src, { width: 160, quality: 60, format: 'webp', resize: 'cover' })} 160w`,
                                ].join(', ')}
                                sizes="60px"
                                alt={image.alt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    opacity: selectedIndex === index ? 1 : 0.5,
                                    transition: "opacity 0.2s ease",
                                }}
                                loading="lazy"
                                decoding="async"
                                onError={makeOnErrorFallback(image.src)}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* 좌측 그라데이션 오버레이 - 동적으로 표시/숨김 */}
                {showLeftGradient && (
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: "20px",
                            width: "30px",
                            background:
                                "linear-gradient(to right, rgba(255,255,255,0.9), transparent)",
                            pointerEvents: "none",
                            zIndex: 1,
                            transition: "opacity 0.2s ease",
                        }}
                    />
                )}

                {/* 우측 그라데이션 오버레이 - 동적으로 표시/숨김 */}
                {showRightGradient && (
                    <div
                        style={{
                            position: "absolute",
                            right: 0,
                            top: 0,
                            bottom: "20px",
                            width: "30px",
                            background:
                                "linear-gradient(to left, rgba(255,255,255,0.9), transparent)",
                            pointerEvents: "none",
                            zIndex: 1,
                            transition: "opacity 0.2s ease",
                        }}
                    />
                )}
            </div>

            {/* 스크롤바 숨김을 위한 스타일 */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    .thumbnail-scroll::-webkit-scrollbar {
                        display: none;
                    }
                `,
                }}
            />
        </div>
    )
}

// Property Controls 정의
addPropertyControls(UnifiedGallery, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        description: "업로더와 연결할 페이지 식별자",
        defaultValue: "default",
    },
    autoRefresh: {
        type: ControlType.Boolean,
        title: "Auto Refresh",
        description: "자동으로 새 이미지를 확인",
        defaultValue: false,
    },
    refreshInterval: {
        type: ControlType.Number,
        title: "Refresh Interval",
        description: "새로고침 간격 (초)",
        min: 5,
        max: 300,
        step: 5,
        unit: "초",
        defaultValue: 30,
        hidden: (props) => !props.autoRefresh,
    },
    showLoadingState: {
        type: ControlType.Boolean,
        title: "Show Loading State",
        description: "로딩 상태 표시",
        defaultValue: true,
    },
    fallbackImages: {
        type: ControlType.Array,
        title: "Fallback Images",
        description: "에러 시 표시할 대체 이미지",
        control: {
            type: ControlType.Image,
            title: "Fallback Image",
        },
        defaultValue: [],
        maxCount: 10,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "transparent",
    },
    selectedBorderColor: {
        type: ControlType.Color,
        title: "Selected Border Color",
        defaultValue: "#6366f1",
    },
})
