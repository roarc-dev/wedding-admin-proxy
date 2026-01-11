import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js"

/** ------------------------------------------------------
 * THEME & TOKENS — Local (Framer standalone)
 * - 외부 파일 import 없이 이 컴포넌트 단독 실행을 보장
 * - 값은 프로젝트 표준과 동일하게 유지(읽기 전용)
 * ----------------------------------------------------- */
const theme = {
    color: {
        bg: "#ffffff",
        text: "#111827",
        sub: "#374151",
        muted: "#6b7280",
        border: "#e5e7eb",
        overlay: "rgba(0,0,0,0.04)",
        primary: "#111827",
        primaryText: "#ffffff",
        danger: "#ef4444",
        success: "#10b981",
        surface: "#f9fafb",
    },
    font: {
        body: "'Pretendard', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        bodyBold:
            "'Pretendard SemiBold', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        display: "P22LateNovemberW01-Regular Regular, serif",
    },
    radius: { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 },
    shadow: {
        card: "0 1px 3px rgba(0,0,0,0.08)",
        pop: "0 8px 24px rgba(0,0,0,0.12)",
    },
    space: (n: number) => n * 4,
    text: {
        xs: 12,
        sm: 14,
        base: 16,
        md: 17,
        lg: 20,
        xl: 24,
        display: 48,
    },
} as const

function mergeStyles(
    ...styles: Array<React.CSSProperties | undefined>
): React.CSSProperties {
    return Object.assign({}, ...styles)
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
type ButtonSize = "sm" | "md" | "lg"

function Button({
    children,
    variant = "primary",
    size = "md",
    fullWidth,
    style,
    disabled,
    ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
    size?: ButtonSize
    fullWidth?: boolean
}) {
    const base: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.space(1),
        border: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: theme.radius.lg,
        fontFamily: theme.font.bodyBold,
        transition: "transform .05s ease, opacity .2s ease",
        width: fullWidth ? "100%" : undefined,
        whiteSpace: "nowrap",
        userSelect: "none",
        minHeight: 40, // a11y touch target
    }

    const sizes: Record<ButtonSize, React.CSSProperties> = {
        sm: { padding: "8px 12px", fontSize: theme.text.sm },
        md: { padding: "10px 14px", fontSize: theme.text.base },
        lg: { padding: "12px 18px", fontSize: theme.text.lg },
    }

    const variants: Record<ButtonVariant, React.CSSProperties> = {
        primary: {
            background: theme.color.primary,
            color: theme.color.primaryText,
        },
        secondary: {
            background: theme.color.surface,
            color: theme.color.text,
            border: `1px solid ${theme.color.border}`,
        },
        ghost: {
            background: "transparent",
            color: theme.color.text,
            border: `1px solid ${theme.color.border}`,
        },
        danger: {
            background: theme.color.danger,
            color: theme.color.primaryText,
        },
    }

    return (
        <button
            {...rest}
            disabled={disabled}
            style={mergeStyles(base, sizes[size], variants[variant], style)}
            onMouseDown={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.transform =
                    "scale(0.99)"
            }}
            onMouseUp={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.transform =
                    "scale(1)"
            }}
        >
            {children}
        </button>
    )
}

function Card({
    children,
    style,
}: React.PropsWithChildren<{ style?: React.CSSProperties }>) {
    return (
        <div
            style={mergeStyles(
                {
                    background: theme.color.bg,
                    border: `1px solid ${theme.color.border}`,
                    borderRadius: theme.radius.xl,
                    boxShadow: theme.shadow.card,
                    padding: theme.space(5),
                },
                style
            )}
        >
            {children}
        </div>
    )
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 430
 * @framerIntrinsicHeight 600
 */

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

interface ImageData {
    id: string
    src: string
    alt: string
    public_url?: string
    path?: string
    url?: string
    original_name?: string
}

interface UnifiedGalleryCompleteProps {
    pageId: string
    style?: React.CSSProperties
}

async function getImagesByPageId(pageId: string): Promise<ImageData[]> {
    const res = await fetch(
        `${PROXY_BASE_URL}/api/images?action=getByPageId&pageId=${encodeURIComponent(pageId)}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    if (json && json.success) return json.data || []
    throw new Error(
        json && json.error ? json.error : "이미지 목록을 가져올 수 없습니다"
    )
}

type PageSettingsMinimal = {
    gallery_type?: string
    vid_url?: string
    gallery_zoom?: string
    type?: string
}

async function getPageSettings(pageId: string): Promise<{
    galleryType: string
    videoUrl: string
    galleryZoomEnabled: boolean
    pageType: string
}> {
    const res = await fetch(
        `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        }
    )
    if (!res.ok) {
        return {
            galleryType: "thumbnail",
            videoUrl: "",
            galleryZoomEnabled: false,
            pageType: "",
        }
    }
    const json = await res.json()
    const data = (json && json.success ? json.data : null) as
        | PageSettingsMinimal
        | null
        | undefined
    return {
        galleryType: data?.gallery_type || "thumbnail",
        videoUrl: data?.vid_url || "",
        galleryZoomEnabled: data?.gallery_zoom === "on",
        pageType: data?.type || "",
    }
}

export default function UnifiedGalleryComplete({
    pageId = "default",
    style,
}: UnifiedGalleryCompleteProps) {
    // Typography 폰트 로딩
    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                typography.ensure()
            }
        } catch (error) {
            console.warn(
                "[UnifiedGalleryComplete] Typography loading failed:",
                error
            )
        }
    }, [])

    // P22 폰트 스택을 안전하게 가져오기
    const p22FontFamily = useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.p22 ||
                '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    // Goldenbook 폰트 스택을 안전하게 가져오기
    const goldenbookFontFamily = useMemo(() => {
        try {
            // typography.helpers.stacks.goldenbook 사용
            if (typography?.helpers?.stacks?.goldenbook) {
                return typography.helpers.stacks.goldenbook
            }
            // fallback
            return '"goldenbook", "Goldenbook", serif'
        } catch {
            return '"goldenbook", "Goldenbook", serif'
        }
    }, [])

    const [galleryType, setGalleryType] = useState("thumbnail")
    const [images, setImages] = useState<ImageData[]>([])
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [videoUrl, setVideoUrl] = useState<string>("")
    const [galleryZoomEnabled, setGalleryZoomEnabled] = useState(false)
    const [pageType, setPageType] = useState("")
    const [focusedNav, setFocusedNav] = useState<"prev" | "next" | null>(null)

    const rootRef = useRef<HTMLDivElement>(null)

    // 터치 이벤트를 위한 state (썸네일형용)
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    // 슬라이드형 갤러리 터치 제어를 위한 state
    const [slideOffset, setSlideOffset] = useState(0) // 현재 드래그 오프셋
    const [isDragging, setIsDragging] = useState(false)
    const slideStartX = useRef<number | null>(null)
    const slideStartOffset = useRef<number>(0)

    // 그라데이션 상태
    const [showLeftGradient, setShowLeftGradient] = useState(false)
    const [showRightGradient, setShowRightGradient] = useState(false)

    // 스크롤 컨테이너 ref
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const thumbnailScrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        let live = true
        ;(async () => {
            try {
                setLoading(true)
                setError("")
                const [settings, list] = await Promise.all([
                    getPageSettings(pageId),
                    getImagesByPageId(pageId),
                ])
                if (!live) return
                // 테스트를 위해 강제로 slide 타입 설정 (pageId가 "test"일 때)
                const finalType =
                    pageId === "test" ? "slide" : settings.galleryType
                setGalleryType(finalType)
                const mapped = (list || [])
                    .map((img, idx) => ({
                        id: img.id || String(idx),
                        src: img.public_url || img.path || img.url || "",
                        alt: img.original_name || `Image ${idx + 1}`,
                    }))
                    .filter((x) => !!x.src)
                setImages(mapped)
                setVideoUrl(settings.videoUrl)
                setGalleryZoomEnabled(settings.galleryZoomEnabled)
                setPageType(settings.pageType)
                if (mapped.length === 0) setSelectedIndex(0)
                else if (selectedIndex >= mapped.length) setSelectedIndex(0)
            } catch (e) {
                if (!live) return
                setError(
                    e instanceof Error && e.message
                        ? e.message
                        : "갤러리 로딩 실패"
                )
            } finally {
                if (live) setLoading(false)
            }
        })()
        return () => {
            live = false
        }
    }, [pageId])

    // gallery_zoom === "on" 인 경우: 이 컴포넌트 영역에서만 document의 핀치줌 차단 리스너를 우회
    // (document에 등록된 touchstart/gesture* preventDefault가 버블링 단계에서 실행되지 않게 stopPropagation)
    useEffect(() => {
        if (!galleryZoomEnabled) return

        const root = rootRef.current
        if (!root) return

        const onTouchStart = (e: TouchEvent) => {
            // 멀티터치(핀치) 시작 시에만 document 리스너로 버블링 차단
            if (e.touches && e.touches.length > 1) {
                e.stopPropagation()
            }
        }

        const onGesture = (e: Event) => {
            // iOS Safari gesturestart/change/end 차단 우회
            e.stopPropagation()
        }

        root.addEventListener("touchstart", onTouchStart, { passive: true })
        root.addEventListener("gesturestart", onGesture)
        root.addEventListener("gesturechange", onGesture)
        root.addEventListener("gestureend", onGesture)

        return () => {
            root.removeEventListener(
                "touchstart",
                onTouchStart as EventListener
            )
            root.removeEventListener("gesturestart", onGesture as EventListener)
            root.removeEventListener(
                "gesturechange",
                onGesture as EventListener
            )
            root.removeEventListener("gestureend", onGesture as EventListener)
        }
    }, [galleryZoomEnabled])

    const hasImages = images && images.length > 0

    // 애니메이션 설정
    const animationVariants = {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    }

    // 상단 라벨(GALLERY) 스타일
    const labelStyle = useMemo(
        () => ({
            width: "100%",
            height: "fit-content",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "visible",
            fontFamily: pageType === "eternal" || pageType === "fiore" ? goldenbookFontFamily : p22FontFamily,
            fontSize: "25px",
            letterSpacing: "0.05em",
            lineHeight: "0.7em",
            textAlign: "center" as const,
            whiteSpace: "nowrap",
            color: "black",
            marginBottom: "50px",
        }),
        [p22FontFamily, goldenbookFontFamily, pageType]
    )

    // 공통 컨테이너 스타일
    const baseContainerStyle = useMemo(
        () => ({
            width: "100%",
            maxWidth: "430px",
            margin: "0 auto", // 중앙 정렬
            backgroundColor: "#fafafa",
            padding: "0",
            paddingBottom: galleryType === "slide" ? "20px" : "60px",
        }),
        [galleryType]
    )

    const containerStyle = useMemo(() => {
        const display = hasImages
            ? style && style.display
                ? style.display
                : "block"
            : "none"
        return mergeStyles(baseContainerStyle, style, { display })
    }, [style, hasImages, baseContainerStyle])

    // GALLERY 라벨 스타일에 상단 여백 포함
    const labelStyleWithMargin = useMemo(
        () => ({
            ...labelStyle,
            paddingTop: "80px", // GALLERY 글씨 위에 80px 여백 추가
        }),
        [labelStyle]
    )

    // YouTube URL을 embed URL로 변환하는 함수
    const convertToEmbedUrl = useCallback((url: string) => {
        if (!url) return ""

        // YouTube URL 패턴 매칭
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
        ]

        for (const pattern of patterns) {
            const match = url.match(pattern)
            if (match) {
                const videoId = match[1]
                return `https://www.youtube.com/embed/${videoId}?controls=0&autoplay=1&mute=1&loop=1&playlist=${videoId}&modestbranding=1&rel=0&showinfo=0&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0&enablejsapi=0&widget_referrer=`
            }
        }

        return url // YouTube가 아닌 경우 원본 URL 반환
    }, [])

    // 이미지 비율에 따른 표시 방식 결정
    const handleImageLoad = useCallback(
        (e: React.SyntheticEvent<HTMLImageElement>) => {
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
        },
        []
    )

    // 슬라이드 갤러리 상수
    const SLIDE_WIDTH = 344 // 이미지 너비 (슬라이드형)
    const SLIDE_GAP = 10 // 이미지 간격 (슬라이드형)
    const SLIDE_TOTAL = SLIDE_WIDTH + SLIDE_GAP // 슬라이드 하나의 전체 너비
    
    // 썸네일 갤러리 상수 (큰 이미지 영역)
    const THUMBNAIL_SLIDE_WIDTH = 430 // 썸네일형 이미지 너비
    const THUMBNAIL_SLIDE_GAP = 0 // 썸네일형 이미지 간격
    const THUMBNAIL_SLIDE_TOTAL = THUMBNAIL_SLIDE_WIDTH + THUMBNAIL_SLIDE_GAP

    // 썸네일 스크롤을 가운데로 위치시키는 함수
    const scrollThumbnailToCenter = useCallback((index: number) => {
        if (thumbnailScrollRef.current && galleryType === "thumbnail") {
            const container = thumbnailScrollRef.current
            const thumbnailWidth = 60 // 썸네일 너비
            const gap = 6 // 썸네일 간격
            const paddingLeft = 16 // 왼쪽 패딩

            // 선택된 썸네일의 왼쪽 위치 계산
            const thumbnailLeft = index * (thumbnailWidth + gap) + paddingLeft

            // 컨테이너 중앙에 썸네일을 위치시키기 위한 스크롤 위치 계산
            const containerWidth = container.clientWidth
            const scrollLeft = thumbnailLeft - (containerWidth / 2) + (thumbnailWidth / 2)

            // 스크롤 위치가 음수가 되지 않도록 하고, 최대 스크롤 범위를 넘지 않도록 제한
            const maxScrollLeft = container.scrollWidth - containerWidth
            const clampedScrollLeft = Math.max(0, Math.min(scrollLeft, maxScrollLeft))

            container.scrollTo({
                left: clampedScrollLeft,
                behavior: 'smooth'
            })
        }
    }, [galleryType])

    // 썸네일형 갤러리 터치 이벤트 핸들러
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }, [])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }, [])

    const handleTouchEnd = useCallback(() => {
        if (touchStart === null || touchEnd === null) return
        const distance = touchStart - touchEnd
        const minSwipeDistance = 50

        if (distance > minSwipeDistance) {
            // 왼쪽으로 스와이프 (다음 이미지) - 썸네일형에서만 사용됨
            setSelectedIndex((prev) => {
                const newIndex = Math.min(prev + 1, Math.max(images.length - 1, 0))
                // 썸네일 가운데 스크롤
                setTimeout(() => scrollThumbnailToCenter(newIndex), 0)
                return newIndex
            })
        } else if (distance < -minSwipeDistance) {
            // 오른쪽으로 스와이프 (이전 이미지) - 썸네일형에서만 사용됨
            setSelectedIndex((prev) => {
                const newIndex = Math.max(prev - 1, 0)
                // 썸네일 가운데 스크롤
                setTimeout(() => scrollThumbnailToCenter(newIndex), 0)
                return newIndex
            })
        }
    }, [images.length, touchEnd, touchStart, scrollThumbnailToCenter])

    // 슬라이드형 갤러리 터치 이벤트 핸들러 (직접 제어)
    const handleSlideTouchStart = useCallback(
        (e: React.TouchEvent) => {
            slideStartX.current = e.targetTouches[0].clientX
            slideStartOffset.current = slideOffset
            setIsDragging(true)
        },
        [slideOffset]
    )

    const handleSlideTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (slideStartX.current === null || !isDragging) return

            const currentX = e.targetTouches[0].clientX
            const diff = currentX - slideStartX.current
            const newOffset = slideStartOffset.current + diff

            // 갤러리 타입에 따라 적절한 슬라이드 너비 사용
            const slideTotal = galleryType === "slide" ? SLIDE_TOTAL : THUMBNAIL_SLIDE_TOTAL

            // 범위 제한 (첫 번째 이미지 이전, 마지막 이미지 이후로 제한)
            const maxOffset = 0
            const minOffset = -((images.length - 1) * slideTotal)

            // 경계에서 저항감 추가 (elastic effect)
            if (newOffset > maxOffset) {
                setSlideOffset(newOffset * 0.3) // 저항감
            } else if (newOffset < minOffset) {
                setSlideOffset(minOffset + (newOffset - minOffset) * 0.3)
            } else {
                setSlideOffset(newOffset)
            }
        },
        [images.length, isDragging, slideOffset, SLIDE_TOTAL, THUMBNAIL_SLIDE_TOTAL, galleryType]
    )

    const handleSlideTouchEnd = useCallback(() => {
        if (slideStartX.current === null) return

        setIsDragging(false)

        // 갤러리 타입에 따라 적절한 슬라이드 너비 사용
        const slideTotal = galleryType === "slide" ? SLIDE_TOTAL : THUMBNAIL_SLIDE_TOTAL

        // 드래그 거리 계산
        const dragDistance = slideOffset - slideStartOffset.current

        // 조정 가능한 수치들
        const SNAP_THRESHOLD = 0.2 // 20%만 넘기면 다음 장 (0.15 ~ 0.35 권장)
        const MIN_SWIPE_DISTANCE = 30 // 최소 스와이프 거리 (px)

        let targetIndex = selectedIndex

        // 드래그 거리가 임계값을 넘었는지 확인
        if (
            dragDistance < -slideTotal * SNAP_THRESHOLD ||
            dragDistance < -MIN_SWIPE_DISTANCE * 2
        ) {
            // 왼쪽으로 드래그 → 다음 장
            targetIndex = Math.min(selectedIndex + 1, images.length - 1)
        } else if (
            dragDistance > slideTotal * SNAP_THRESHOLD ||
            dragDistance > MIN_SWIPE_DISTANCE * 2
        ) {
            // 오른쪽으로 드래그 → 이전 장
            targetIndex = Math.max(selectedIndex - 1, 0)
        }

        // 해당 인덱스로 스냅
        setSelectedIndex(targetIndex)
        setSlideOffset(-targetIndex * slideTotal)

        slideStartX.current = null
    }, [SLIDE_TOTAL, THUMBNAIL_SLIDE_TOTAL, images.length, selectedIndex, slideOffset, galleryType])

    // 다음/이전 이미지로 이동
    const goToNext = useCallback(() => {
        const slideTotal = galleryType === "slide" ? SLIDE_TOTAL : THUMBNAIL_SLIDE_TOTAL
        const nextIndex =
            selectedIndex < images.length - 1
                ? selectedIndex + 1
                : selectedIndex
        setSelectedIndex(nextIndex)
        setSlideOffset(-nextIndex * slideTotal)
    }, [SLIDE_TOTAL, THUMBNAIL_SLIDE_TOTAL, galleryType, images.length, selectedIndex])

    const goToPrevious = useCallback(() => {
        const slideTotal = galleryType === "slide" ? SLIDE_TOTAL : THUMBNAIL_SLIDE_TOTAL
        const prevIndex =
            selectedIndex > 0 ? selectedIndex - 1 : selectedIndex
        setSelectedIndex(prevIndex)
        setSlideOffset(-prevIndex * slideTotal)
    }, [SLIDE_TOTAL, THUMBNAIL_SLIDE_TOTAL, galleryType, selectedIndex])

    const handlePrevFocus = useCallback(() => {
        setFocusedNav("prev")
    }, [])

    const handleNextFocus = useCallback(() => {
        setFocusedNav("next")
    }, [])

    const handleNavBlur = useCallback(() => {
        setFocusedNav(null)
    }, [])

    // 썸네일 클릭 핸들러 (썸네일형용)
    const handleThumbnailClick = useCallback((index: number) => {
        setSelectedIndex(index)
        // slideOffset도 동기화하여 부드러운 슬라이드 애니메이션 제공
        setSlideOffset(-index * THUMBNAIL_SLIDE_TOTAL)
    }, [THUMBNAIL_SLIDE_TOTAL])

    // 슬라이드 갤러리 인덱스 변경 시 오프셋 동기화
    useEffect(() => {
        if (!isDragging) {
            const slideTotal = galleryType === "slide" ? SLIDE_TOTAL : THUMBNAIL_SLIDE_TOTAL
            setSlideOffset(-selectedIndex * slideTotal)
        }
    }, [selectedIndex, galleryType, isDragging, SLIDE_TOTAL, THUMBNAIL_SLIDE_TOTAL])

    // 썸네일형 갤러리에서 selectedIndex 변경 시 썸네일 가운데 스크롤
    useEffect(() => {
        if (galleryType === "thumbnail" && images.length > 0) {
            scrollThumbnailToCenter(selectedIndex)
        }
    }, [selectedIndex, galleryType, images.length, scrollThumbnailToCenter])

    // 썸네일 스크롤 상태 체크 함수
    const checkThumbnailScrollState = useCallback(() => {
        if (!thumbnailScrollRef.current) return

        const container = thumbnailScrollRef.current
        const scrollLeft = container.scrollLeft
        const scrollWidth = container.scrollWidth
        const clientWidth = container.clientWidth

        // 좌측 그라데이션: 스크롤이 시작되면 표시
        setShowLeftGradient(scrollLeft > 0)

        // 우측 그라데이션: 끝에 도달하면 숨김
        setShowRightGradient(scrollLeft < scrollWidth - clientWidth)
    }, [])

    // 썸네일 스크롤 이벤트 리스너
    useEffect(() => {
        const container = thumbnailScrollRef.current
        if (!container || galleryType !== "thumbnail") return

        // 초기 상태 체크
        checkThumbnailScrollState()

        // 스크롤 이벤트 리스너 추가
        container.addEventListener("scroll", checkThumbnailScrollState)

        // 리사이즈 이벤트도 추가 (반응형 대응)
        const handleResize = () => {
            setTimeout(checkThumbnailScrollState, 100)
        }
        window.addEventListener("resize", handleResize)

        return () => {
            container.removeEventListener("scroll", checkThumbnailScrollState)
            window.removeEventListener("resize", handleResize)
        }
    }, [galleryType, images.length])

    if (!hasImages && loading) {
        return (
            <div style={mergeStyles(baseContainerStyle, style)} ref={rootRef}>
                <div style={labelStyleWithMargin}>GALLERY</div>
            </div>
        )
    }

    if (!hasImages && !loading) {
        // 이미지가 없으면 완전히 숨김(display: none) 처리됨
        return <div style={containerStyle} ref={rootRef} />
    }

    // 갤러리 렌더링 함수
    const renderGallery = () => {
        if (galleryType === "slide") {
            // 슬라이드형 갤러리
            return (
                <>
                    <motion.div
                        style={labelStyleWithMargin}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        viewport={{ once: true }}
                    >
                        GALLERY
                    </motion.div>
                    <motion.div
                        style={{
                            width: "100%",
                            height: "529px",
                            position: "relative",
                            overflow: "hidden",
                            touchAction: galleryZoomEnabled
                                ? "pan-y pinch-zoom"
                                : "pan-y", // 세로 스크롤만 브라우저에 위임
                        }}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.5,
                            ease: "easeOut",
                            delay: 0.1,
                        }}
                        viewport={{ once: true }}
                        onTouchStart={handleSlideTouchStart}
                        onTouchMove={handleSlideTouchMove}
                        onTouchEnd={handleSlideTouchEnd}
                    >
                        <div
                            ref={scrollContainerRef}
                            style={{
                                display: "flex",
                                height: "100%",
                                gap: `${SLIDE_GAP}px`,
                                transform: `translateX(${slideOffset}px)`,
                                transition: isDragging
                                    ? "none"
                                    : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                                willChange: "transform",
                            }}
                        >
                            {images.map((image, index) => (
                                <div
                                    key={image.id || String(index)}
                                    style={{
                                        flexShrink: 0,
                                        width: `${SLIDE_WIDTH}px`,
                                        height: "529px",
                                        borderRadius: "0px",
                                        overflow: "hidden",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        position: "relative",
                                    }}
                                >
                                    <img
                                        src={image.src}
                                        alt={image.alt}
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            objectPosition: "center",
                                            userSelect: "none",
                                            pointerEvents: "none",
                                            display: "block",
                                        }}
                                        onLoad={handleImageLoad}
                                        onError={(e) => {
                                            try {
                                                ;(
                                                    e.target as HTMLImageElement
                                                ).style.display = "none"
                                            } catch (_) {}
                                        }}
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
                            <Button
                                onClick={goToPrevious}
                                aria-label="이전 이미지"
                                variant="ghost"
                                size="sm"
                                onFocus={handlePrevFocus}
                                onBlur={handleNavBlur}
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
                                    outline:
                                        focusedNav === "prev"
                                            ? `2px solid ${theme.color.primary}`
                                            : "2px solid transparent",
                                    outlineOffset: 2,
                                }}
                            >
                                <div
                                    style={{
                                        width: "7px",
                                        height: "12px",
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transform: "translateX(-1px)",
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: '<svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.0625 11.229L0.999769 6.11461L6.0625 1.00022" stroke="white" stroke-width="1.54982" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                                    }}
                                />
                            </Button>
                            {/* 다음 버튼 */}
                            <Button
                                onClick={goToNext}
                                aria-label="다음 이미지"
                                variant="ghost"
                                size="sm"
                                onFocus={handleNextFocus}
                                onBlur={handleNavBlur}
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
                                    outline:
                                        focusedNav === "next"
                                            ? `2px solid ${theme.color.primary}`
                                            : "2px solid transparent",
                                    outlineOffset: 2,
                                }}
                            >
                                <div
                                    style={{
                                        width: "7px",
                                        height: "12px",
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transform:
                                            "scaleX(-1) translateX(-1px)",
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: '<svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.0625 11.229L0.999769 6.11461L6.0625 1.00022" stroke="white" stroke-width="1.54982" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                                    }}
                                />
                            </Button>
                        </div>
                    </motion.div>
                    {/* 스크롤바 숨김을 위한 스타일 */}
                    <style
                        dangerouslySetInnerHTML={{
                            __html: `div::-webkit-scrollbar { display: none; }`,
                        }}
                    />
                </>
            )
        }

        // 썸네일형 갤러리 (기본값) - 고정 높이
        return (
            <>
                <motion.div
                    style={labelStyleWithMargin}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    viewport={{ once: true }}
                >
                    GALLERY
                </motion.div>
                <motion.div
                    style={{
                        width: "100%",
                        height: "460px", // 고정 높이
                        position: "relative",
                        overflow: "hidden",
                        touchAction: galleryZoomEnabled
                            ? "pan-y pinch-zoom"
                            : "pan-y",
                    }}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                    viewport={{ once: true }}
                    onTouchStart={handleSlideTouchStart}
                    onTouchMove={handleSlideTouchMove}
                    onTouchEnd={handleSlideTouchEnd}
                >
                    <div
                        style={{
                            display: "flex",
                            height: "100%",
                            gap: `${THUMBNAIL_SLIDE_GAP}px`,
                            transform: `translateX(${slideOffset}px)`,
                            transition: isDragging
                                ? "none"
                                : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                            willChange: "transform",
                        }}
                    >
                        {images.map((image, index) => (
                            <div
                                key={image.id || String(index)}
                                style={{
                                    flexShrink: 0,
                                    width: `${THUMBNAIL_SLIDE_WIDTH}px`,
                                    height: "460px",
                                    borderRadius: "0px",
                                    overflow: "hidden",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    position: "relative",
                                }}
                            >
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    draggable={false}
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "100%",
                                        objectFit: "contain",
                                        objectPosition: "center",
                                        userSelect: "none",
                                        pointerEvents: "none",
                                        display: "block",
                                    }}
                                    onLoad={handleImageLoad}
                                    onError={(e) => {
                                        try {
                                            ;(
                                                e.target as HTMLImageElement
                                            ).style.display = "none"
                                        } catch (_) {}
                                    }}
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
                        <Button
                            onClick={goToPrevious}
                            aria-label="이전 이미지"
                            variant="ghost"
                            size="sm"
                            onFocus={handlePrevFocus}
                            onBlur={handleNavBlur}
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
                                outline:
                                    focusedNav === "prev"
                                        ? `2px solid ${theme.color.primary}`
                                        : "2px solid transparent",
                                outlineOffset: 2,
                            }}
                        >
                            <div
                                style={{
                                    width: "7px",
                                    height: "12px",
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transform: "translateX(-1px)",
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: '<svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.0625 11.229L0.999769 6.11461L6.0625 1.00022" stroke="white" stroke-width="1.54982" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                                }}
                            />
                        </Button>
                        {/* 다음 버튼 */}
                        <Button
                            onClick={goToNext}
                            aria-label="다음 이미지"
                            variant="ghost"
                            size="sm"
                            onFocus={handleNextFocus}
                            onBlur={handleNavBlur}
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
                                outline:
                                    focusedNav === "next"
                                        ? `2px solid ${theme.color.primary}`
                                        : "2px solid transparent",
                                outlineOffset: 2,
                            }}
                        >
                            <div
                                style={{
                                    width: "7px",
                                    height: "12px",
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transform:
                                        "scaleX(-1) translateX(-1px)",
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: '<svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.0625 11.229L0.999769 6.11461L6.0625 1.00022" stroke="white" stroke-width="1.54982" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                                }}
                            />
                        </Button>
                    </div>
                </motion.div>

                {/* 썸네일 영역(가로 스크롤) */}
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
                        ref={thumbnailScrollRef}
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
                    >
                        {images.map((img, idx) => (
                            <div
                                key={img.id || String(idx)}
                                style={{
                                    flexShrink: 0,
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    border:
                                        selectedIndex === idx
                                            ? "0px solid #6366f1"
                                            : "0px solid transparent",
                                    transition: "border-color 0.2s ease",
                                }}
                                onClick={() => handleThumbnailClick(idx)}
                            >
                                <img
                                    src={img.src}
                                    alt={img.alt}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        opacity:
                                            selectedIndex === idx ? 1 : 0.5,
                                        transition: "opacity 0.2s ease",
                                    }}
                                    onError={(e) => {
                                        try {
                                            ;(
                                                e.target as HTMLImageElement
                                            ).style.display = "none"
                                            const parent = (
                                                e.target as HTMLImageElement
                                            ).parentNode as HTMLElement
                                            if (parent) {
                                                parent.innerHTML =
                                                    '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:10px;">Error</div>'
                                            }
                                        } catch (_) {}
                                    }}
                                />
                            </div>
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
                        __html: `.thumbnail-scroll::-webkit-scrollbar { display: none; }`,
                    }}
                />
            </>
        )
    }

    // 비디오 렌더링 함수
    const renderVideo = () => {
        if (!videoUrl) return null

        return (
            <div
                style={{
                    width: "100%",
                    maxWidth: "430px",
                    margin: "0 auto",
                    backgroundColor: "#fafafa",
                    padding: "0",
                }}
            >
                <div
                    style={{
                        marginTop: galleryType === "thumbnail" ? "0px" : "80px",
                        width: "100%",
                        position: "relative",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: 0,
                            paddingBottom: "56.25%", // 16:9 비율
                            overflow: "hidden",
                        }}
                    >
                        <iframe
                            src={convertToEmbedUrl(videoUrl)}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="autoplay; encrypted-media; gyroscope;"
                            referrerPolicy="strict-origin-when-cross-origin"
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                borderRadius: 0,
                            }}
                        />
                    </div>
                </div>
            </div>
        )
    }

    // 메인 렌더링
    return (
        <div ref={rootRef} style={mergeStyles({ width: "100%" }, undefined)}>
            <Card
                style={mergeStyles(containerStyle, {
                    border: "none",
                    boxShadow: "none",
                    padding: 0,
                    borderRadius: 0,
                    background: "#fafafa",
                })}
            >
                {renderGallery()}
            </Card>
            {renderVideo()}
            {/* 로컬 테스트 시나리오:
               - page_settings.gallery_zoom = 'off' => 기존처럼 페이지 전체 핀치줌이 막혀야 함
               - page_settings.gallery_zoom = 'on'  => 이 컴포넌트 영역에서만 핀치줌이 동작해야 함 */}
        </div>
    )
}

// Property Controls
addPropertyControls(UnifiedGalleryComplete, {
    pageId: {
        type: ControlType.String,
        title: "페이지 ID",
        defaultValue: "",
        placeholder: "페이지 ID를 입력하세요",
    },
})
