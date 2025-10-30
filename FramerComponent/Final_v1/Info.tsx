import React, { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// P22 폰트 로딩을 위한 typography import
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=6fdc95bcc8fd197d879c051a8c2d5a03"

const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

interface InfoItem {
    id?: string
    title: string
    description: string
    display_order: number
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
                            `${base}/api/page-settings?info&pageId=${encodeURIComponent(pageId)}`
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
                const url = `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`
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

    // infoItems 정렬
    const sortedInfoItems = useMemo(() => {
        return [...infoItems].sort(
            (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
        )
    }, [infoItems])

    // 자동 슬라이드 타이머
    useEffect(() => {
        if (!isAutoPlaying || sortedInfoItems.length <= 1) return

        const timer = setInterval(() => {
            setSlideDir(1)
            setCurrentIndex((prev) => (prev + 1) % sortedInfoItems.length)
        }, 5000)

        return () => clearInterval(timer)
    }, [isAutoPlaying, sortedInfoItems.length])

    // 카드 높이 계산
    const maxCardHeight = useMemo(() => {
        const heights: number[] = []

        sortedInfoItems.forEach((item) => {
            const titleHeight = 32
            const descriptionLines = (item.description || "").split("\n").length
            const descriptionHeight = descriptionLines * 27
            const totalHeight = titleHeight + descriptionHeight + 80
            heights.push(totalHeight)
        })

        return Math.max(...heights, 280)
    }, [sortedInfoItems])

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
                ...style,
            }}
        >
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
                    style={{
                        width: "88%",
                        height: maxCardHeight,
                        backgroundColor: "white",
                        position: "relative",
                        overflow: "hidden",
                    }}
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
                                    stiffness: 300,
                                    damping: 30,
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

                                // 스와이프 임계값: 50px 이상 드래그 또는 빠른 스와이프
                                if (offset.x < -50 || swipe < -500) {
                                    // 다음 슬라이드
                                    setSlideDir(1)
                                    setCurrentIndex(
                                        (prev) =>
                                            (prev + 1) % sortedInfoItems.length
                                    )
                                } else if (offset.x > 50 || swipe > 500) {
                                    // 이전 슬라이드
                                    setSlideDir(-1)
                                    setCurrentIndex(
                                        (prev) =>
                                            (prev -
                                                1 +
                                                sortedInfoItems.length) %
                                            sortedInfoItems.length
                                    )
                                }

                                // 5초 후 자동 재생 재개
                                setTimeout(() => setIsAutoPlaying(true), 5000)
                            }}
                            style={{
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 40,
                                boxSizing: "border-box",
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
                                    marginBottom: 20,
                                }}
                            >
                                {sortedInfoItems[currentIndex]?.title || ""}
                            </div>

                            {/* 본문 */}
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
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
                                        sortedInfoItems[currentIndex]
                                            ?.description || "",
                                        pretendardFontFamily
                                    )}
                                </div>
                            </div>
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
        defaultValue: "aeyong",
        placeholder: "예: aeyong",
    },
})

export default Info
