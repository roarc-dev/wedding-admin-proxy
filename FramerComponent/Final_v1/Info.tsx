import React, { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// Framer 단독 사용을 위해 로컬 토큰/프리미티브 정의
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

function Card({
    children,
    style,
    onHeightChange,
    index,
}: React.PropsWithChildren<{
    style?: React.CSSProperties
    onHeightChange?: (index: number, height: number) => void
    index?: number
}>) {
    const cardRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const el = cardRef.current
        if (!el || !onHeightChange || typeof index !== "number") return

        let raf1 = 0
        let raf2 = 0

        const reportHeight = () => {
            // 이미지 로드 직후에는 레이아웃 반영이 다음 프레임에 일어나는 경우가 있어
            // rAF 2번으로 안정적으로 반영된 높이를 잡습니다.
            cancelAnimationFrame(raf1)
            cancelAnimationFrame(raf2)

            raf1 = requestAnimationFrame(() => {
                raf2 = requestAnimationFrame(() => {
                    const rect = el.getBoundingClientRect()
                    const h = Math.ceil(rect.height)
                    onHeightChange(index, h)
                })
            })
        }

        // 1) ResizeObserver: 레이아웃 변화 감지 (이미지 로드 이후 변동 포함)
        const ro = new ResizeObserver(() => reportHeight())
        ro.observe(el)

        // 2) 이미지 로드/디코딩: “이미지 때문에 높이가 늦게 커지는 케이스”를 강제 반영
        const imgs = Array.from(el.querySelectorAll("img"))

        const onImgEvent = () => {
            reportHeight()
        }

        let cancelled = false

        // decode()가 가능한 경우: 디코딩 완료 후 측정 → 더 정확
        const decodeAll = async () => {
            try {
                await Promise.all(
                    imgs.map(async (img) => {
                        // 이미 로드된 경우에도 decode가 늦게 끝날 수 있음
                        if ("decode" in img) {
                            try {
                                // @ts-ignore
                                await img.decode()
                            } catch {
                                // decode 실패(크로스오리진/브라우저 상황 등)는 무시
                            }
                        } else {
                            // decode가 없으면 최소한 load 이후 한번 더 측정되도록
                            if (!img.complete) {
                                await new Promise<void>((resolve) => {
                                    const done = () => resolve()
                                    img.addEventListener("load", done, {
                                        once: true,
                                    })
                                    img.addEventListener("error", done, {
                                        once: true,
                                    })
                                })
                            }
                        }
                    })
                )
            } finally {
                if (!cancelled) reportHeight()
            }
        }

        imgs.forEach((img) => {
            img.addEventListener("load", onImgEvent)
            img.addEventListener("error", onImgEvent)
        })

        // 첫 마운트 시점 + 이미지 decode 이후 시점 둘 다 측정
        reportHeight()
        decodeAll()

        return () => {
            cancelled = true
            cancelAnimationFrame(raf1)
            cancelAnimationFrame(raf2)
            ro.disconnect()
            imgs.forEach((img) => {
                img.removeEventListener("load", onImgEvent)
                img.removeEventListener("error", onImgEvent)
            })
        }
    }, [onHeightChange, index])

    return (
        <div
            ref={cardRef}
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

// P22 폰트 로딩을 위한 typography import
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=6fdc95bcc8fd197d879c051a8c2d5a03"

const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

interface InfoItem {
    id?: string
    title: string
    description: string
    display_order: number
    image?: string
}

interface PageSettingsResp {
    data?: { type?: string }
    type?: string
    success?: boolean
}

// 텍스트 포맷팅 유틸리티
function processBoldAndBreak(
    text: string,
    isSmall: boolean,
    keyPrefix: string,
    pretendardStack: string
): JSX.Element[] {
    const segments: JSX.Element[] = []
    const src = (text || "").replace(/\r\n?/g, "\n")
    let index = 0
    let key = 0
    const regex = /(\*([^*]+)\*)|(\n\n)|(\n)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(src)) !== null) {
        const start = match.index
        const end = start + match[0].length

        if (start > index) {
            const normal = src.slice(index, start)
            segments.push(
                <span
                    key={`${keyPrefix}-t-${key++}`}
                    style={{
                        fontFamily: pretendardStack,
                        fontWeight: 400,
                        lineHeight: isSmall ? "1.8em" : "1.8em",
                    }}
                >
                    {normal}
                </span>
            )
        }

        if (match[1]) {
            const inner = match[2] || ""
            segments.push(
                <span
                    key={`${keyPrefix}-b-${key++}`}
                    style={{
                        fontFamily: pretendardStack,
                        fontWeight: 600,
                        lineHeight: isSmall ? "1.8em" : "1.8em",
                    }}
                >
                    {inner}
                </span>
            )
        } else if (match[3]) {
            segments.push(
                <div
                    key={`${keyPrefix}-dbl-${key++}`}
                    style={{ height: "0.6em" }}
                />
            )
        } else if (match[4]) {
            segments.push(<br key={`${keyPrefix}-br-${key++}`} />)
        }

        index = end
    }

    if (index < src.length) {
        const tail = src.slice(index)
        segments.push(
            <span
                key={`${keyPrefix}-t-${key++}`}
                style={{
                    fontFamily: pretendardStack,
                    fontWeight: 400,
                    lineHeight: isSmall ? "1.8em" : "1.8em",
                }}
            >
                {tail}
            </span>
        )
    }

    return segments
}

function renderInfoStyledText(
    text: string,
    pretendardStack: string
): JSX.Element[] {
    const src = (text || "").replace(/\r\n?/g, "\n")
    const segments: JSX.Element[] = []
    let index = 0
    let key = 0
    const regex = /(\{([^}]*)\})|(\n\n)|(\n)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(src)) !== null) {
        const start = match.index
        const end = start + match[0].length

        if (start > index) {
            const before = src.slice(index, start)
            segments.push(
                <span key={`pre-${key++}`}>
                    {processBoldAndBreak(
                        before,
                        false,
                        `pre-${key}`,
                        pretendardStack
                    )}
                </span>
            )
        }

        if (match[1]) {
            const inner = match[2] || ""
            segments.push(
                <span
                    key={`small-${key++}`}
                    style={{
                        fontSize: 13,
                        lineHeight: "1.8em",
                        color: "#757575",
                        fontFamily: pretendardStack,
                        fontWeight: 400,
                    }}
                >
                    {processBoldAndBreak(
                        inner,
                        true,
                        `small-${key}`,
                        pretendardStack
                    )}
                </span>
            )
        } else if (match[3]) {
            segments.push(
                <div key={`dbl-${key++}`} style={{ height: "0.6em" }} />
            )
        } else if (match[4]) {
            segments.push(<br key={`br-${key++}`} />)
        }

        index = end
    }

    if (index < src.length) {
        const tail = src.slice(index)
        segments.push(
            <span key={`tail-${key++}`}>
                {processBoldAndBreak(
                    tail,
                    false,
                    `tail-${key}`,
                    pretendardStack
                )}
            </span>
        )
    }

    return segments
}

// Info 컴포넌트
function Info({
    pageId = "default",
    style,
}: {
    pageId?: string
    style?: React.CSSProperties
}) {
    const [infoItems, setInfoItems] = useState<InfoItem[]>([])
    const [loading, setLoading] = useState(false)
    const [pageType, setPageType] = useState("")

    // 데이터 로딩
    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            try {
                const bases = [
                    typeof window !== "undefined" ? window.location.origin : "",
                    PROXY_BASE_URL,
                ].filter(Boolean)
                let res: Response | null = null
                for (const base of bases) {
                    try {
                        const tryRes = await fetch(
                            `${base}/api/page-settings?info&pageId=${encodeURIComponent(
                                pageId
                            )}`
                        )
                        res = tryRes
                        if (tryRes.ok) break
                    } catch {}
                }
                if (!res) throw new Error("network error")
                const result = await res.json()
                if (mounted && result?.success && Array.isArray(result.data)) {
                    setInfoItems(result.data)
                }
            } catch {
                // ignore
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => {
            mounted = false
        }
    }, [pageId])

    useEffect(() => {
        let cancelled = false
        async function fetchPageType() {
            if (!pageId) return
            try {
                const url = `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(
                    pageId
                )}`
                const res = await fetch(url, { cache: "no-store" })
                if (!res.ok) return
                const json = (await res.json()) as PageSettingsResp
                const fetchedType =
                    (json && json.data && json.data.type) || json?.type || ""
                if (!cancelled) {
                    setPageType(fetchedType)
                }
            } catch (_) {}
        }
        fetchPageType()
        return () => {
            cancelled = true
        }
    }, [pageId])

    // P22 폰트 로딩
    useEffect(() => {
        try {
            typography &&
                typeof typography.ensure === "function" &&
                typography.ensure()
        } catch (_) {}
    }, [])

    const pretendardFontFamily = useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.pretendardVariable ||
                '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    const p22FontFamily = useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.p22 ||
                '"P22 Late November", "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"P22 Late November", "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    const goldenbookFontFamily = useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.goldenbook ||
                '"Goldenbook", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"Goldenbook", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    const titleFontFamily = useMemo(() => {
        const normalizedType = (pageType || "").toLowerCase().trim()
        if (normalizedType.includes("eternal")) {
            return goldenbookFontFamily
        }
        if (
            normalizedType.includes("papillon") ||
            normalizedType.includes("fiore")
        ) {
            return p22FontFamily
        }
        return p22FontFamily
    }, [pageType, goldenbookFontFamily, p22FontFamily])

    // 슬라이드 상태 관리
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)
    const [slideDir, setSlideDir] = useState(0)

    // ✅ 카드 높이(실측) 저장
    const [cardHeights, setCardHeights] = useState<Record<number, number>>({})

    // infoItems 정렬
    const sortedInfoItems = useMemo(() => {
        return [...infoItems].sort(
            (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
        )
    }, [infoItems])

    const currentItem = useMemo(
        () => sortedInfoItems[currentIndex] || null,
        [currentIndex, sortedInfoItems]
    )

    // ✅ 카드 높이 측정 핸들러(실측)
    const handleCardHeight = useCallback((index: number, height: number) => {
        const h = Math.ceil(height)
        setCardHeights((prev) => {
            // 불필요한 state update 방지
            if (prev[index] === h) return prev
            return { ...prev, [index]: h }
        })
    }, [])

    // 자동 슬라이드 타이머
    useEffect(() => {
        if (!isAutoPlaying || sortedInfoItems.length <= 1) return

        const timer = setInterval(() => {
            setSlideDir(1)
            setCurrentIndex((prev) => (prev + 1) % sortedInfoItems.length)
        }, 5000)

        return () => clearInterval(timer)
    }, [isAutoPlaying, sortedInfoItems.length])

    // ✅ maxCardHeight = “모든 카드 실측값 중 최대”
    const maxCardHeight = useMemo(() => {
        const MIN_HEIGHT = 280
        const heights = Object.values(cardHeights)
        if (heights.length === 0) return MIN_HEIGHT
        return Math.max(MIN_HEIGHT, ...heights)
    }, [cardHeights])

    // 페이지네이션 클릭
    const handlePaginationClick = useCallback(
        (index: number) => {
            setSlideDir(index > currentIndex ? 1 : -1)
            setCurrentIndex(index)
            setIsAutoPlaying(false)
            setTimeout(() => setIsAutoPlaying(true), 5000)
        },
        [currentIndex]
    )

    // 슬라이드 애니메이션 variants
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction > 0 ? -300 : 300,
            opacity: 0,
        }),
    }

    if (!sortedInfoItems || sortedInfoItems.length === 0) {
        return null
    }

    return (
        <div
            style={{
                backgroundColor: "#ebebeb",
                overflow: "hidden",
                width: "100%",
                minWidth: 360,
                height: "fit-content",
                padding: "80px 0px",
                display: "flex",
                flexDirection: "column",
                gap: 40,
                position: "relative", // ✅ measurement wrapper absolute를 위해
                ...style,
            }}
        >
            {/* ✅ Hidden cards for height measurement (same width context as real card) */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    opacity: 0,
                    zIndex: -1,
                }}
            >
                <div style={{ width: "88%", margin: "0 auto" }}>
                    {sortedInfoItems.map((item, index) => (
                        <Card
                            key={`measure-${index}`}
                            index={index}
                            onHeightChange={handleCardHeight}
                            style={mergeStyles({
                                width: "100%",
                                padding: 40,
                                border: "none",
                                boxShadow: "none",
                                borderRadius: 0,
                                background: theme.color.bg,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "flex-start",
                                boxSizing: "border-box",
                                overflow: "visible",
                            })}
                        >
                            {/* 제목 */}
                            <div
                                style={{
                                    width: "100%",
                                    height: "fit-content",
                                    textAlign: "center",
                                    color: "#000",
                                    fontSize: 18,
                                    fontFamily: pretendardFontFamily,
                                    fontWeight: 600,
                                    lineHeight: "1.8em",
                                    marginBottom: item?.image
                                        ? theme.space(3)
                                        : theme.space(5),
                                }}
                            >
                                {item?.title || ""}
                            </div>

                            {/* 이미지 */}
                            {item?.image ? (
                                <div
                                    style={mergeStyles({
                                        width: "100%",
                                        marginTop: 18,
                                        marginBottom: 24,
                                    })}
                                >
                                    <img
                                        src={item.image}
                                        alt={
                                            item.title
                                                ? `${item.title} 이미지`
                                                : "정보 이미지"
                                        }
                                        loading="eager" // ✅ 숨김 측정은 eager 권장
                                        decoding="async"
                                        fetchPriority="high"
                                        style={mergeStyles({
                                            display: "block",
                                            width: "100%",
                                            height: "auto",
                                            objectFit: "cover",
                                            borderRadius: 0,
                                        })}
                                    />
                                </div>
                            ) : null}

                            {/* 본문 */}
                            <div
                                style={{
                                    width: "100%",
                                    flex: 1,
                                    color: "#000",
                                    fontSize: 15,
                                    fontFamily: pretendardFontFamily,
                                    lineHeight: "1.8em",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <div
                                    style={{
                                        display: "inline-block",
                                        textAlign: "center",
                                    }}
                                >
                                    {renderInfoStyledText(
                                        item?.description || "",
                                        pretendardFontFamily
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* 제목 */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                style={{
                    width: "100%",
                    height: "fit-content",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "visible",
                    boxSizing: "border-box",
                    fontFamily: titleFontFamily,
                    fontSize: "25px",
                    letterSpacing: "0.05em",
                    lineHeight: "0.7em",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    color: "#000000",
                }}
            >
                INFORMATION
            </motion.div>

            {/* 슬라이드 카드 영역 */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.8 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    style={mergeStyles({
                        width: "88%",
                        height: maxCardHeight,
                        position: "relative",
                        overflow: "hidden",
                    })}
                >
                    <AnimatePresence
                        initial={false}
                        custom={slideDir}
                        mode="popLayout"
                    >
                        <motion.div
                            key={currentIndex}
                            custom={slideDir}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: {
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 25,
                                },
                                opacity: { duration: 0.2 },
                            }}
                            drag={sortedInfoItems.length > 1 ? "x" : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragStart={() => {
                                setIsAutoPlaying(false)
                            }}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipe = Math.abs(offset.x) * velocity.x

                                if (offset.x < -50 || swipe < -500) {
                                    setSlideDir(1)
                                    setCurrentIndex(
                                        (prev) =>
                                            (prev + 1) % sortedInfoItems.length
                                    )
                                } else if (offset.x > 50 || swipe > 500) {
                                    setSlideDir(-1)
                                    setCurrentIndex(
                                        (prev) =>
                                            (prev -
                                                1 +
                                                sortedInfoItems.length) %
                                            sortedInfoItems.length
                                    )
                                }

                                setTimeout(() => setIsAutoPlaying(true), 5000)
                            }}
                            style={{
                                width: "100%",
                                height: maxCardHeight,
                                cursor:
                                    sortedInfoItems.length > 1
                                        ? "grab"
                                        : "default",
                            }}
                            whileTap={
                                sortedInfoItems.length > 1
                                    ? { cursor: "grabbing" }
                                    : {}
                            }
                        >
                            <Card
                                // ✅ visible 카드는 강제 height를 쓰므로 측정 콜백 연결 X
                                style={mergeStyles({
                                    width: "100%",
                                    height: maxCardHeight,
                                    padding: 40,
                                    border: "none",
                                    boxShadow: "none",
                                    borderRadius: 0,
                                    background: theme.color.bg,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                    boxSizing: "border-box",
                                    overflow: "visible",
                                })}
                            >
                                {/* 제목 */}
                                <div
                                    style={{
                                        width: "100%",
                                        height: "fit-content",
                                        textAlign: "center",
                                        color: "#000",
                                        fontSize: 18,
                                        fontFamily: pretendardFontFamily,
                                        fontWeight: 600,
                                        lineHeight: "1.8em",
                                        marginBottom: currentItem?.image
                                            ? theme.space(3)
                                            : theme.space(5),
                                    }}
                                >
                                    {currentItem?.title || ""}
                                </div>

                                {/* 이미지 */}
                                {currentItem?.image ? (
                                    <div
                                        style={mergeStyles({
                                            width: "100%",
                                            marginTop: 18,
                                            marginBottom: 24,
                                        })}
                                    >
                                        <a
                                            href={currentItem.image}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`${
                                                currentItem.title || "정보"
                                            } 이미지 크게 보기`}
                                            style={mergeStyles({
                                                display: "block",
                                                width: "100%",
                                                borderRadius: 0,
                                                outline: "none",
                                            })}
                                        >
                                            <img
                                                src={currentItem.image}
                                                alt={
                                                    currentItem.title
                                                        ? `${currentItem.title} 이미지`
                                                        : "정보 이미지"
                                                }
                                                loading="lazy"
                                                decoding="async"
                                                style={mergeStyles({
                                                    display: "block",
                                                    width: "100%",
                                                    height: "auto",
                                                    objectFit: "cover",
                                                    borderRadius: 0,
                                                    cursor: "zoom-in",
                                                })}
                                            />
                                        </a>
                                    </div>
                                ) : null}

                                {/* 본문 */}
                                <div
                                    style={{
                                        width: "100%",
                                        flex: 1,
                                        color: "#000",
                                        fontSize: 15,
                                        fontFamily: pretendardFontFamily,
                                        lineHeight: "1.8em",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "inline-block",
                                            textAlign: "center",
                                        }}
                                    >
                                        {renderInfoStyledText(
                                            currentItem?.description || "",
                                            pretendardFontFamily
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* 페이지네이션 */}
            {sortedInfoItems.length > 1 && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: "-30px",
                        gap: 8,
                    }}
                >
                    {sortedInfoItems.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handlePaginationClick(index)}
                            style={{
                                width: 8,
                                height: 8,
                                padding: 0,
                                borderRadius: "100%",
                                backgroundColor:
                                    index === currentIndex
                                        ? "rgba(0, 0, 0, 0.5)"
                                        : "rgba(0, 0, 0, 0.25)",
                                border: "none",
                                cursor: "pointer",
                                transition: "background-color 0.2s ease",
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// Property Controls
addPropertyControls(Info, {
    pageId: {
        type: ControlType.String,
        title: "page_id",
        defaultValue: "",
        placeholder: "",
    },
})

export default Info
