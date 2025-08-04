import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

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

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 430
 * @framerIntrinsicHeight 650
 */
export default function SupabaseImageGallery(props: any) {
    const {
        pageId = "default",
        showImageCounter = true,
        thumbnailBorderRadius = 8,
        mainImageBorderRadius = 12,
        backgroundColor = "#1a1a1a",
        selectedBorderColor = "#6366f1",
        autoRefresh = false,
        refreshInterval = 30,
        showLoadingState = true,
        fallbackImages = [],
        style,
    } = props

    const [selectedIndex, setSelectedIndex] = useState(0)
    const [images, setImages] = useState<GalleryImage[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const scrollContainerRef = useRef<HTMLDivElement>(null)

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
    const galleryImages = images.length > 0 ? images : showLoadingState ? [] : defaultImages
    const displayImages = isSlowNetwork ? galleryImages.slice(0, 3) : galleryImages

    // 네트워크 상태 감지
    useEffect(() => {
        if ('connection' in navigator) {
            const connection = (navigator as any).connection as NetworkInfo
            setNetworkInfo(connection)
            setIsSlowNetwork(
                connection.effectiveType === 'slow-2g' || 
                connection.effectiveType === '2g' ||
                connection.downlink < 1
            )
        }
    }, [])

    // 이미지 프리로딩 함수
    const preloadImage = (src: string) => {
        if (!src || preloadedImages.has(src)) return
        
        const img = new Image()
        img.onload = () => {
            setPreloadedImages(prev => new Set([...prev, src]))
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

    // 이미지 목록 로드
    const loadImages = async () => {
        try {
            setLoading(true)
            setError("")
            const data = await getImagesByPageId(pageId)

            // 이미지 데이터를 갤러리 형식으로 변환
            const galleryImages: GalleryImage[] = data.map((img: any, index: number) => ({
                id: img.id,
                src: img.public_url,
                alt: img.original_name || `Image ${index + 1}`,
                original_name: img.original_name,
                file_size: img.file_size,
                created_at: img.created_at,
            }))

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
            setError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다")

            // 에러 시 fallback 이미지 사용
            if (fallbackImages.length > 0) {
                const fallbackGalleryImages: GalleryImage[] = fallbackImages.map(
                    (img: any, index: number) => ({
                        id: `fallback-${index}`,
                        src: typeof img === "string" ? img : img.src || img,
                        alt:
                            typeof img === "object"
                                ? img.alt
                                : `Fallback image ${index + 1}`,
                        original_name: `Fallback ${index + 1}`,
                        created_at: new Date().toISOString(),
                    })
                )
                setImages(fallbackGalleryImages)
            }
        } finally {
            setLoading(false)
        }
    }

    // 초기 로드
    useEffect(() => {
        loadImages()
    }, [pageId])

    // 자동 새로고침
    useEffect(() => {
        if (autoRefresh && refreshInterval > 0) {
            const interval = setInterval(loadImages, refreshInterval * 1000)
            return () => clearInterval(interval)
        }
    }, [autoRefresh, refreshInterval, pageId])

    // 다음/이전 이미지로 이동 (무한 스크롤)
    const goToNext = () => {
        const nextIndex =
            selectedIndex < displayImages.length - 1 ? selectedIndex + 1 : 0
        setSelectedIndex(nextIndex)
        scrollToImage(nextIndex)
    }

    const goToPrevious = () => {
        const prevIndex =
            selectedIndex > 0 ? selectedIndex - 1 : displayImages.length - 1
        setSelectedIndex(prevIndex)
        scrollToImage(prevIndex)
    }

    // 특정 이미지로 스크롤
    const scrollToImage = (index: number) => {
        if (scrollContainerRef.current) {
            const scrollLeft = index * (344 + 10) // 이미지 너비 + 간격
            scrollContainerRef.current.scrollTo({
                left: scrollLeft,
                behavior: "smooth",
            })
        }
    }

    // 스크롤 이벤트로 현재 이미지 인덱스 업데이트
    const handleScroll = () => {
        if (scrollContainerRef.current) {
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
    }, [selectedIndex, displayImages.length])

    // 캐싱 최적화된 이미지 URL 생성
    const getOptimizedImageUrl = (originalUrl: string, timestamp: string) => {
        return `${originalUrl}?v=${timestamp}&cache=1`
    }

    // 공통 컨테이너 스타일 (반응형)
    const containerStyle = {
        ...style,
        width: "100%",
        maxWidth: "430px",
        margin: "0 auto",
        backgroundColor: "transparent",
        padding: "0",
        boxSizing: "border-box",
        position: "relative",
    }

    // 로딩 스켈레톤 컴포넌트
    const LoadingSkeleton = () => (
        <div style={{
            ...containerStyle,
            height: "650px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
        }}>
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
                <div style={{
                    width: "100%",
                    height: "529px",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "30px"
                }}>
                    <div style={{ fontSize: "32px", opacity: 0.5 }}>Loading</div>
                </div>
                
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

    // 로딩 상태
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
                        onClick={loadImages}
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
                    <div style={{ fontSize: "64px", opacity: 0.3 }}>No Images</div>
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
                        onClick={loadImages}
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

    return (
        <div style={containerStyle}>
            {/* 네트워크 상태 표시 (느린 네트워크일 때만) */}
            {isSlowNetwork && (
                <div style={{
                    padding: "8px 12px",
                    backgroundColor: "rgba(255, 193, 7, 0.2)",
                    color: "#856404",
                    borderRadius: "6px",
                    fontSize: "12px",
                    marginBottom: "10px",
                    textAlign: "center",
                    border: "1px solid rgba(255, 193, 7, 0.3)"
                }}>
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
                                backgroundColor: "#rgba(0,0,0,0)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                scrollSnapAlign: "start",
                            }}
                        >
                            <img
                                src={image.src}
                                alt={image.alt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    userSelect: "none",
                                    pointerEvents: "none",
                                    display: "block",
                                }}
                                onError={handleImageError}
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
            <style dangerouslySetInnerHTML={{
                __html: `
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `
            }} />
        </div>
    )
}

// 기본 props 설정
SupabaseImageGallery.defaultProps = {
    pageId: "default",
    showImageCounter: true,
    thumbnailBorderRadius: 8,
    mainImageBorderRadius: 0,
    backgroundColor: "transparent",
    selectedBorderColor: "#6366f1",
    autoRefresh: false,
    refreshInterval: 30,
    showLoadingState: true,
    fallbackImages: [],
}

// Property Controls 정의
addPropertyControls(SupabaseImageGallery, {
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
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
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
            mainImageBorderRadius: {
                type: ControlType.Number,
                title: "Main Image Border Radius",
                min: 0,
                max: 50,
                unit: "px",
                defaultValue: 0,
            },
        },
    },
})