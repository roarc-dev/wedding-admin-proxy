import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy-git-main-roarcs-projects.vercel.app"

// 프록시를 통한 안전한 이미지 목록 가져오기
async function getImagesByPageId(pageId: string) {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/images?action=getByPageId&pageId=${pageId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        
        if (result.success) {
            return result.data
        } else {
            throw new Error(result.error || '이미지 목록을 가져올 수 없습니다')
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
export default function SupabaseImageGallery(props) {
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
    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const scrollContainerRef = useRef(null)
    const mainImageRef = useRef(null)

    // 스크롤 상태 추가
    const [showLeftGradient, setShowLeftGradient] = useState(false)
    const [showRightGradient, setShowRightGradient] = useState(false)

    // 터치 이벤트를 위한 state
    const [touchStart, setTouchStart] = useState(null)
    const [touchEnd, setTouchEnd] = useState(null)

    // 기본 이미지 (데이터가 없을 때 사용)
    const defaultImages = Array.from({ length: 6 }, (_, i) => ({
        id: `default-${i}`,
        src: `https://picsum.photos/400/460?random=${i}`,
        alt: `Sample image ${i + 1}`,
        original_name: `Sample ${i + 1}`,
        created_at: new Date().toISOString(),
    }))

    // 표시할 이미지 결정 - 여기서 정의해야 함
    const galleryImages =
        images.length > 0 ? images : showLoadingState ? [] : defaultImages

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
    }, [galleryImages.length]) // galleryImages 대신 galleryImages.length 사용

    // 이미지 목록 로드
    const loadImages = async () => {
        try {
            setLoading(true)
            setError("")
            const data = await getImagesByPageId(pageId)

            // 이미지 데이터를 갤러리 형식으로 변환
            const galleryImages = data.map((img, index) => ({
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
        } catch (error) {
            setError(error.message)

            // 에러 시 fallback 이미지 사용
            if (fallbackImages.length > 0) {
                const fallbackGalleryImages = fallbackImages.map(
                    (img, index) => ({
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

    // 썸네일 클릭 핸들러
    const handleThumbnailClick = (index) => {
        setSelectedIndex(index)

        // 선택된 썸네일이 보이도록 스크롤 조정
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current
            const thumbnail = container.children[index]

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
        if (selectedIndex < galleryImages.length - 1) {
            handleThumbnailClick(selectedIndex + 1)
        }
    }

    const goToPrevious = () => {
        if (selectedIndex > 0) {
            handleThumbnailClick(selectedIndex - 1)
        }
    }

    // 터치 이벤트 핸들러
    const handleTouchStart = (e) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const handleTouchMove = (e) => {
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
        const handleKeyDown = (e) => {
            if (e.key === "ArrowLeft") {
                goToPrevious()
            } else if (e.key === "ArrowRight") {
                goToNext()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [selectedIndex, galleryImages.length])

    // 애니메이션 설정 (페이드만 사용)
    const animationVariants = {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    }

    // 파일 크기 포맷팅
    const formatFileSize = (bytes) => {
        if (!bytes) return ""
        if (bytes < 1024) return `${bytes}B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
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
        marginBottom: "60px",
    }

    // 로딩 상태
    if (loading && showLoadingState) {
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
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div style={{ fontSize: "16px", fontWeight: 500 }}>
                        이미지를 불러오는 중...
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.7 }}>
                        Page ID: {pageId}
                    </div>
                </motion.div>
            </div>
        )
    }

    // 에러 상태
    if (error && galleryImages.length === 0) {
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
    }

    // 이미지가 없는 경우
    if (galleryImages.length === 0) {
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
    }

    return (
        <div style={containerStyle}>
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
                        src={galleryImages[selectedIndex]?.src}
                        alt={galleryImages[selectedIndex]?.alt}
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
                        onError={(e) => {
                            e.target.style.display = "none"
                            e.target.parentNode.innerHTML = `
                                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; flex-direction: column; gap: 10px;">
                                    <div style="font-size: 24px;">🖼️</div>
                                    <div>이미지를 불러올 수 없습니다</div>
                                </div>
                            `
                        }}
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
                                    e.target.style.display = "none"
                                    e.target.parentNode.innerHTML = `
                                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 10px;">
                                            ❌
                                        </div>
                                    `
                                }}
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
            <style jsx>{`
                .thumbnail-scroll::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
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
        minCount: 0,
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
            thumbnailBorderRadius: {
                type: ControlType.Number,
                title: "Thumbnail Border Radius",
                min: 0,
                max: 50,
                unit: "px",
                defaultValue: 8,
            },
        },
    },
})
