import React, { useState, useRef, useEffect } from "react"
import {
    motion,
    AnimatePresence,
    useTransform,
    useMotionValue,
} from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// 타입 정의
interface ImageData {
    id: string
    src: string
    alt: string
    original_name: string
    file_size?: number
    created_at: string
    public_url?: string
}

interface ZoomGalleryProps {
    pageId?: string
    showImageCounter?: boolean
    thumbnailBorderRadius?: number
    mainImageBorderRadius?: number
    backgroundColor?: string
    selectedBorderColor?: string
    autoRefresh?: boolean
    refreshInterval?: number
    showLoadingState?: boolean
    fallbackImages?: string[] | { src: string; alt?: string }[]
    allowZoom?: boolean
    fitImageToScreen?: boolean
    style?: React.CSSProperties
}

interface TouchState {
    x: number
    y: number
}

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL =
    "https://wedding-admin-proxy-git-main-roarcs-projects.vercel.app"

// 프록시를 통한 안전한 이미지 목록 가져오기
async function getImagesByPageId(pageId: string): Promise<ImageData[]> {
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

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 430
 * @framerIntrinsicHeight 650
 */
export default function ZoomGallery(props: ZoomGalleryProps) {
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
        allowZoom = true, // New prop for zoom functionality
        fitImageToScreen = true, // New prop to control image fitting
        style,
    } = props

    const [selectedIndex, setSelectedIndex] = useState<number>(0)
    const [images, setImages] = useState<ImageData[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>("")
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const mainImageRef = useRef<HTMLDivElement>(null)
    const mainImageContainerRef = useRef<HTMLDivElement>(null)

    // Zoom functionality
    const [isZoomed, setIsZoomed] = useState<boolean>(false)
    const [zoomLevel, setZoomLevel] = useState<number>(1)
    const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
    const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null)

    // Motion values for smooth transitions
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const scale = useMotionValue(1)

    // For detecting swipe vs zoom
    const [touchStartTime, setTouchStartTime] = useState<number>(0)
    const [initialTouchPos, setInitialTouchPos] = useState<TouchState>({ x: 0, y: 0 })
    const [isTouching, setIsTouching] = useState<boolean>(false)

    // 스크롤 상태 추가
    const [showLeftGradient, setShowLeftGradient] = useState<boolean>(false)
    const [showRightGradient, setShowRightGradient] = useState<boolean>(false)

    // 터치 이벤트를 위한 state
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    // 핀치 시작 기준 상태 저장용 state 추가
    const [pinchStart, setPinchStart] = useState<{
        distance: number
        midpoint: { x: number; y: number }
        panPosition: { x: number; y: number }
        zoomLevel: number
    } | null>(null)

    // 자동 줌 리셋 타이머 ref 추가
    const zoomResetTimer = useRef<NodeJS.Timeout | null>(null)

    // 기본 이미지 (데이터가 없을 때 사용)
    const defaultImages: ImageData[] = Array.from({ length: 6 }, (_, i) => ({
        id: `default-${i}`,
        src: `https://picsum.photos/400/460?random=${i}`,
        alt: `Sample image ${i + 1}`,
        original_name: `Sample ${i + 1}`,
        created_at: new Date().toISOString(),
    }))

    // 표시할 이미지 결정
    const galleryImages = images.length > 0 ? images : showLoadingState ? [] : defaultImages

    // Reset zoom when image changes or when touch ends after zooming
    useEffect(() => {
        resetZoom()
    }, [selectedIndex])

    // Reset zoom state
    const resetZoom = () => {
        if (zoomResetTimer.current) {
            clearTimeout(zoomResetTimer.current)
            zoomResetTimer.current = null
        }
        setIsZoomed(false)
        setZoomLevel(1)
        setPanPosition({ x: 0, y: 0 })
        x.set(0)
        y.set(0)
        scale.set(1)
    }

    // 스크롤 상태 체크 함수
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

    // 스크롤 이벤트 리스너
    useEffect(() => {
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
    }, [galleryImages.length])

    // 이미지 목록 로드
    const loadImages = async () => {
        try {
            setLoading(true)
            setError("")
            const data = await getImagesByPageId(pageId)

            // 이미지 데이터를 갤러리 형식으로 변환
            const galleryImages = data.map((img: ImageData) => ({
                id: img.id,
                src: img.public_url || img.src,
                alt: img.original_name || `Image ${img.id}`,
                original_name: img.original_name,
                file_size: img.file_size,
                created_at: img.created_at,
            }))

            setImages(galleryImages)

            // 새로운 이미지가 로드되면 첫 번째 이미지로 선택 초기화
            if (galleryImages.length > 0 && selectedIndex >= galleryImages.length) {
                setSelectedIndex(0)
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다"
            setError(errorMessage)

            // 에러 시 fallback 이미지 사용
            if (fallbackImages.length > 0) {
                const fallbackGalleryImages = fallbackImages.map((img, index) => ({
                    id: `fallback-${index}`,
                    src: typeof img === "string" ? img : img.src || "",
                    alt: typeof img === "object" && img.alt ? img.alt : `Fallback image ${index + 1}`,
                    original_name: `Fallback ${index + 1}`,
                    created_at: new Date().toISOString(),
                }))
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

    // 썸네일 클릭 핸들러
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
        if (isZoomed) return
        if (selectedIndex < galleryImages.length - 1) {
            handleThumbnailClick(selectedIndex + 1)
        }
    }

    const goToPrevious = () => {
        if (isZoomed) return
        if (selectedIndex > 0) {
            handleThumbnailClick(selectedIndex - 1)
        }
    }

    // Calculate optimal zoom level based on image size
    const calculateOptimalZoom = (img: HTMLImageElement | null) => {
        if (!img || !mainImageContainerRef.current) return 2

        const containerWidth = mainImageContainerRef.current.clientWidth
        const containerHeight = mainImageContainerRef.current.clientHeight
        const imgWidth = img.width || img.offsetWidth
        const imgHeight = img.height || img.offsetHeight

        // Calculate how much the image can be zoomed while still maintaining quality
        const widthRatio = img.naturalWidth / imgWidth
        const heightRatio = img.naturalHeight / imgHeight

        // Use the smaller ratio to ensure we don't over-zoom
        const baseZoom = Math.min(widthRatio, heightRatio)

        // Limit zoom to a reasonable range
        return Math.min(Math.max(baseZoom, 2), 3)
    }

    // Calculate distance between two touch points (for pinch)
    const getDistance = (touches: Touch[] | TouchList) => {
        const arr = Array.from(touches)
        if (arr.length < 2) return null
        const dx = arr[0].clientX - arr[1].clientX
        const dy = arr[0].clientY - arr[1].clientY
        return Math.sqrt(dx * dx + dy * dy)
    }

    // Get midpoint between two touch points (for pinch center)
    const getMidpoint = (touches: Touch[] | TouchList) => {
        const arr = Array.from(touches)
        if (arr.length < 2) return null
        return {
            x: (arr[0].clientX + arr[1].clientX) / 2,
            y: (arr[0].clientY + arr[1].clientY) / 2,
        }
    }

    // Handle touch start
    const handleTouchStart = (e: React.TouchEvent) => {
        if (zoomResetTimer.current) {
            clearTimeout(zoomResetTimer.current)
            zoomResetTimer.current = null
        }
        // Always capture touch start position for swipe detection
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)

        if (!allowZoom) {
            return
        }

        setIsTouching(true)
        setTouchStartTime(Date.now())

        if (e.touches.length === 1) {
            // Single touch - potential swipe
            const touch = e.touches[0]
            setInitialTouchPos({ x: touch.clientX, y: touch.clientY })
        } else if (e.touches.length === 2 && allowZoom) {
            // Pinch gesture start
            e.preventDefault()
            const touchesArr = Array.prototype.slice.call(e.touches)
            const distance = getDistance(touchesArr)
            const midpoint = getMidpoint(touchesArr)
            setLastPinchDistance(distance)
            if (distance && midpoint) {
                setPinchStart({
                    distance,
                    midpoint,
                    panPosition: { ...panPosition },
                    zoomLevel,
                })
            }
        }
    }

    // Handle touch move
    const handleTouchMove = (e: React.TouchEvent) => {
        // Always track touchEnd for swipe detection
        if (e.touches.length === 1) {
            setTouchEnd(e.targetTouches[0].clientX)
        }

        if (!allowZoom) {
            return
        }

        if (e.touches.length === 1 && isZoomed) {
            // Pan when zoomed
            e.preventDefault()
            const touch = e.touches[0]

            const deltaX = touch.clientX - initialTouchPos.x
            const deltaY = touch.clientY - initialTouchPos.y

            // Get the current image for constraints
            const img = mainImageRef.current?.querySelector("img") as HTMLImageElement | null
            if (!img) return

            const imgRect = img.getBoundingClientRect()

            // Calculate panning constraints based on image size when zoomed
            // We're limiting how far user can pan to prevent losing the image
            const maxPanX = imgRect.width * 0.4 // Allow panning up to 40% of image width
            const maxPanY = imgRect.height * 0.4 // Allow panning up to 40% of image height

            // Apply smooth panning with constraints
            const newX = Math.max(
                -maxPanX,
                Math.min(maxPanX, panPosition.x + deltaX * 0.8)
            )
            const newY = Math.max(
                -maxPanY,
                Math.min(maxPanY, panPosition.y + deltaY * 0.8)
            )

            x.set(newX)
            y.set(newY)
            setPanPosition({ x: newX, y: newY })
            setInitialTouchPos({ x: touch.clientX, y: touch.clientY })
        } else if (e.touches.length === 2 && allowZoom) {
            // Handle pinch zoom
            e.preventDefault()
            const touchesArr = Array.prototype.slice.call(e.touches)
            const distance = getDistance(touchesArr)
            const midpoint = getMidpoint(touchesArr)
            if (pinchStart && distance && midpoint) {
                // scale 계산
                const scaleRatio = distance / pinchStart.distance
                const newZoom = Math.max(1, Math.min(2.5, pinchStart.zoomLevel * scaleRatio))
                setIsZoomed(newZoom > 1.05)
                setZoomLevel(newZoom)
                scale.set(newZoom)

                // pan 계산: 기준 midpoint와 현재 midpoint의 차이만큼 기존 panPosition에 더함
                const dx = midpoint.x - pinchStart.midpoint.x
                const dy = midpoint.y - pinchStart.midpoint.y
                const newX = pinchStart.panPosition.x + dx
                const newY = pinchStart.panPosition.y + dy
                x.set(newX)
                y.set(newY)
                setPanPosition({ x: newX, y: newY })
            }
            setLastPinchDistance(distance)
        }
    }

    // Handle touch end에서 pinchStart 초기화
    const handleTouchEnd = () => {
        setIsTouching(false)
        setLastPinchDistance(null)
        setPinchStart(null)

        // 확대 상태면 1초 후 자동 리셋 예약
        if (isZoomed) {
            if (zoomResetTimer.current) {
                clearTimeout(zoomResetTimer.current)
            }
            zoomResetTimer.current = setTimeout(() => {
                resetZoom()
            }, 1000)
            return
        }

        // 스와이프 판정
        if (touchStart !== null && touchEnd !== null) {
            const distance = touchStart - touchEnd
            const minSwipeDistance = 50
            const touchDuration = Date.now() - touchStartTime

            // Only trigger swipe if it was a quick gesture (< 300ms)
            if (touchDuration < 300) {
                if (distance > minSwipeDistance) {
                    // 왼쪽으로 스와이프 (다음 이미지)
                    goToNext()
                } else if (distance < -minSwipeDistance) {
                    // 오른쪽으로 스와이프 (이전 이미지)
                    goToPrevious()
                }
            }
        }
        // 터치 상태 초기화
        setTouchStart(null)
        setTouchEnd(null)
        setTouchStartTime(0)
    }

    // 키보드 네비게이션
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isZoomed) return // Don't navigate when zoomed

            if (e.key === "ArrowLeft") {
                goToPrevious()
            } else if (e.key === "ArrowRight") {
                goToNext()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [selectedIndex, galleryImages.length, isZoomed])

    // 애니메이션 설정 (페이드만 사용)
    const animationVariants = {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    }

    // 공통 컨테이너 스타일
    const containerStyle: React.CSSProperties = {
        ...style,
        width: "100%",
        maxWidth: "430px",
        margin: "0 auto",
        backgroundColor: "transparent",
        padding: "0",
        boxSizing: "border-box",
        marginBottom: "60px",
    }

    // 로딩 상태 컴포넌트
    const LoadingState = () => (
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
                <div style={{ fontSize: "16px", fontWeight: 500 }}>
                    갤러리 불러오는 중...
                </div>
            </motion.div>
        </div>
    )

    // 에러 상태 컴포넌트
    const ErrorState = () => (
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
                <div style={{ fontSize: "32px" }}>❌</div>
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
                    {error}
                    <br />
                    Page ID: {pageId}
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

    // 이미지가 없는 상태 컴포넌트
    const EmptyState = () => (
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
                <div style={{ fontSize: "64px", opacity: 0.3 }}>📷</div>
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
                    Page ID "{pageId}"에
                    <br />
                    업로드된 이미지가 없습니다
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

    // 로딩 상태
    if (loading && showLoadingState) {
        return <LoadingState />
    }

    // 에러 상태
    if (error && galleryImages.length === 0) {
        return <ErrorState />
    }

    // 이미지가 없는 경우
    if (galleryImages.length === 0) {
        return <EmptyState />
    }

    // 스타일 컴포넌트 대신 CSS-in-JS 사용
    const styles = {
        mainImageContainer: {
            width: "100%",
            height: "460px",
            position: "relative",
            borderRadius: mainImageBorderRadius,
            overflow: "hidden",
            backgroundColor: "rgba(0,0,0,0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            touchAction: allowZoom ? "none" : "pan-y",
        } as React.CSSProperties,
        thumbnailContainer: {
            marginTop: "30px",
            marginBottom: "20px",
            paddingLeft: 0,
            paddingRight: 0,
            position: "relative",
        } as React.CSSProperties,
        thumbnailScroll: {
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingLeft: "16px",
            paddingBottom: "20px",
            paddingRight: "16px",
            WebkitScrollbar: {
                display: "none",
            },
        } as React.CSSProperties,
        gradientOverlay: (direction: "left" | "right") => ({
            position: "absolute",
            [direction]: 0,
            top: 0,
            bottom: "20px",
            width: "30px",
            background: `linear-gradient(to ${direction === "left" ? "right" : "left"}, rgba(255,255,255,0.9), transparent)`,
            pointerEvents: "none",
            zIndex: 1,
            transition: "opacity 0.2s ease",
        } as React.CSSProperties),
    }

    return (
        <div style={containerStyle}>
            {/* 메인 이미지 영역 */}
            <div
                ref={mainImageContainerRef}
                style={styles.mainImageContainer}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedIndex}
                        ref={mainImageRef}
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                        }}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={animationVariants}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.img
                            src={galleryImages[selectedIndex]?.src}
                            alt={galleryImages[selectedIndex]?.alt}
                            animate={{
                                scale: scale.get(),
                                x: x.get(),
                                y: y.get(),
                            }}
                            style={{
                                x,
                                y,
                                scale,
                                width: "auto",
                                height: "auto",
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                                userSelect: "none",
                                transformOrigin: "center",
                            }}
                            transition={{
                                scale: { type: "spring", stiffness: 180, damping: 26, overshootClamping: true },
                                x: { type: "spring", stiffness: 180, damping: 26, overshootClamping: true },
                                y: { type: "spring", stiffness: 180, damping: 26, overshootClamping: true },
                            }}
                            onLoad={(e) => {
                                const img = e.target as HTMLImageElement
                                const container = mainImageContainerRef.current

                                if (img && container) {
                                    const containerWidth = container.clientWidth
                                    const containerHeight = container.clientHeight
                                    const imgNaturalWidth = img.naturalWidth
                                    const imgNaturalHeight = img.naturalHeight

                                    const containerRatio = containerWidth / containerHeight
                                    const imgRatio = imgNaturalWidth / imgNaturalHeight

                                    if (imgRatio > containerRatio) {
                                        img.style.width = "100%"
                                        img.style.height = "auto"
                                    } else {
                                        img.style.width = "auto"
                                        img.style.height = "100%"
                                    }
                                }
                            }}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                if (target.parentNode && target.parentNode instanceof HTMLElement) {
                                    target.style.display = "none"
                                    target.parentNode.innerHTML = `
                                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; flex-direction: column; gap: 10px;">
                                            <div style="font-size: 24px;">🖼️</div>
                                            <div>이미지를 불러올 수 없습니다</div>
                                        </div>
                                    `
                                }
                            }}
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Reset zoom button */}
                {allowZoom && isZoomed && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: "10px",
                            right: "10px",
                            background: "rgba(0,0,0,0.5)",
                            color: "white",
                            borderRadius: "20px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            zIndex: 2,
                            cursor: "pointer",
                        }}
                        onClick={resetZoom}
                    >
                        원래 크기로
                    </div>
                )}
            </div>

            {/* 썸네일 영역 */}
            <div style={styles.thumbnailContainer}>
                <div
                    ref={scrollContainerRef}
                    style={styles.thumbnailScroll}
                    className="thumbnail-scroll"
                >
                    {galleryImages.map((image, index) => (
                        <motion.div
                            key={image.id || index}
                            style={{
                                flexShrink: 0,
                                width: "60px",
                                height: "60px",
                                borderRadius: `${thumbnailBorderRadius}px`,
                                overflow: "hidden",
                                cursor: "pointer",
                                border: selectedIndex === index
                                    ? `0px solid ${selectedBorderColor}`
                                    : "0px solid transparent",
                                transition: "border-color 0.2s ease",
                            }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleThumbnailClick(index)}
                        >
                            <img
                                src={image.src}
                                alt={image.alt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    opacity: selectedIndex === index ? 1 : 0.5,
                                    transition: "opacity 0.2s ease",
                                }}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    if (target.parentNode && target.parentNode instanceof HTMLElement) {
                                        target.style.display = "none"
                                        target.parentNode.innerHTML = `
                                            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 10px;">
                                                ❌
                                            </div>
                                        `
                                    }
                                }}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* 좌측 그라데이션 오버레이 */}
                {showLeftGradient && (
                    <div style={styles.gradientOverlay("left")} />
                )}

                {/* 우측 그라데이션 오버레이 */}
                {showRightGradient && (
                    <div style={styles.gradientOverlay("right")} />
                )}
            </div>

            <style>{`
                .thumbnail-scroll::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    )
}

// The default props will be shown in the code below
ZoomGallery.defaultProps = {
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
    allowZoom: true,
    fitImageToScreen: true,
}

// Property Controls 정의
addPropertyControls(ZoomGallery, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        description: "업로더와 연결할 페이지 식별자",
        defaultValue: "default",
    },
    allowZoom: {
        type: ControlType.Boolean,
        title: "Allow Zoom",
        description: "이미지 확대/축소 기능 활성화",
        defaultValue: true,
    },
    fitImageToScreen: {
        type: ControlType.Boolean,
        title: "Fit Image to Screen",
        description: "이미지를 화면에 맞게 조정",
        defaultValue: true,
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
})
