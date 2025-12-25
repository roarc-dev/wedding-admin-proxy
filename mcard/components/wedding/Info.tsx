'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Typography 폰트 스택 (typography.js에서 가져온 값들)
const FONT_STACKS = {
    pretendardVariable: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    pretendard: 'Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    p22: '"P22 Late November", "Pretendard", -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    goldenbook: '"goldenbook", "Goldenbook", serif',
    sloopScriptPro: '"sloop-script-pro", "Sloop Script Pro", cursive, sans-serif',
}

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

interface InfoItem {
    id: string
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
            const innerSegments = processBoldAndLineBreak(inner, `small-${key}`)
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
                    {innerSegments}
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

function processBoldAndLineBreak(
    text: string,
    keyPrefix: string
): JSX.Element[] {
    const segments: JSX.Element[] = []
    let index = 0
    const regex = /(\*([^*]+)\*)|(\n\n)|(\n)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
        const start = match.index
        const end = start + match[0].length

        if (start > index) {
            const lineHeight = keyPrefix.startsWith("q-") ? "20px" : "1.6em"
            segments.push(
                <span key={`${keyPrefix}-${index}`} style={{ lineHeight }}>
                    {text.slice(index, start)}
                </span>
            )
        }

        if (match[1]) {
            const inner = match[2] || ""
            const lineHeight = keyPrefix.startsWith("q-") ? "20px" : "1.6em"
            segments.push(
                <span
                    key={`${keyPrefix}-b-${start}`}
                    style={{
                        fontFamily:
                            '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
                        fontWeight: 600,
                        lineHeight,
                    }}
                >
                    {inner}
                </span>
            )
        } else if (match[3]) {
            segments.push(
                <div
                    key={`${keyPrefix}-double-br-${start}`}
                    style={{ height: "0.6em" }}
                />
            )
        } else if (match[4]) {
            segments.push(<br key={`${keyPrefix}-br-${start}`} />)
        }

        index = end
    }

    if (index < text.length) {
        const lineHeight = keyPrefix.startsWith("q-") ? "20px" : "1.6em"
        segments.push(
            <span key={`${keyPrefix}-${index}`} style={{ lineHeight }}>
                {text.slice(index)}
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
    // Typography 폰트 로딩 - 페이지 레벨에서 처리됨

    // 폰트 패밀리 설정 (typography.js에서 가져온 폰트 스택 사용)
    const pretendardFontFamily = FONT_STACKS.pretendardVariable
    const p22FontFamily = FONT_STACKS.p22
    const goldenbookFontFamily = FONT_STACKS.goldenbook

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

    // 로컬 개발에서는 더미 데이터 사용
    const isDevelopment = process.env.NODE_ENV === 'development'

    // 데이터 로딩
    useEffect(() => {
        if (isDevelopment) {
            // 로컬 개발용 더미 데이터
            const dummyInfoItems: InfoItem[] = [
                {
                    id: "1",
                    title: "청첩장 본문",
                    description: "저희 두 사람의 소중한 만남을 축하해 주시고\n귀한 걸음 하시어 참석해 주시면\n더 없는 기쁨이겠습니다.\n\n*참석이 어려우신 분들께는*\n마음 전하는 곳을 마련하였으니\n너그러운 마음으로 양해 부탁드립니다.",
                    display_order: 1
                },
                {
                    id: "2",
                    title: "참석 안내",
                    description: "*예식 시간*\n오후 2시\n\n*예식 장소*\n서울 강남구 청첩장홀\n\n*주소*\n서울특별시 강남구 테헤란로 123",
                    display_order: 2
                }
            ]
            setInfoItems(dummyInfoItems)
            setPageType("default")
            return
        }

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
    }, [pageId, isDevelopment])

    useEffect(() => {
        if (isDevelopment) return

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
    }, [pageId, isDevelopment])

    // 슬라이드 상태 관리
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)
    const [slideDir, setSlideDir] = useState(0)
    const [imageHeights, setImageHeights] = useState<Record<number, number>>({})

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

    // 이미지 로드 핸들러
    const handleImageLoad = useMemo(() =>
        (index: number, event: React.SyntheticEvent<HTMLImageElement>) => {
            const img = event.currentTarget
            const naturalHeight = img.naturalHeight
            const naturalWidth = img.naturalWidth
            const displayedWidth = img.offsetWidth || img.width || 400
            const aspectRatio = naturalHeight / naturalWidth
            const displayedHeight = displayedWidth * aspectRatio

            setImageHeights((prev) => ({
                ...prev,
                [index]: displayedHeight,
            }))
        }, []
    )

    // 자동 슬라이드 타이머
    useEffect(() => {
        if (!isAutoPlaying || sortedInfoItems.length <= 1) return

        const timer = setInterval(() => {
            setSlideDir(1)
            setCurrentIndex((prev) => (prev + 1) % sortedInfoItems.length)
        }, 5000)

        return () => clearInterval(timer)
    }, [isAutoPlaying, sortedInfoItems.length])

    // 카드 높이 계산 - 모든 카드 중 가장 높은 카드 기준으로 통일
    const maxCardHeight = useMemo(() => {
        const heights: number[] = []
        const cardPadding = 80 // padding 40px * 2
        const imageMargin = 42 // marginTop 18 + marginBottom 24
        const fallbackImageHeight = 400 // 안전 여유 높이

        sortedInfoItems.forEach((item, index) => {
            const titleHeight = 32
            const titleMargin = item.image ? 12 : 20

            const rawImageHeight = item.image
                ? Math.max(imageHeights[index] || 0, fallbackImageHeight)
                : 0
            const imageHeight = rawImageHeight ? rawImageHeight + imageMargin : 0

            const descriptionLines = (item.description || "").split("\n").length
            const descriptionHeight = Math.max(descriptionLines * 27, 80)

            const totalHeight =
                cardPadding + titleHeight + titleMargin + imageHeight + descriptionHeight
            heights.push(totalHeight)
        })

        return heights.length > 0 ? Math.max(...heights, 280) : 280
    }, [sortedInfoItems, imageHeights])

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
                            <div
                                style={{
                                    width: "100%",
                                    height: maxCardHeight,
                                    padding: 40,
                                    border: "none",
                                    boxShadow: "none",
                                    borderRadius: 0,
                                    background: "white",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                    boxSizing: "border-box",
                                    overflow: "visible",
                                }}
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
                                            ? 12
                                            : 20,
                                    }}
                                >
                                    {currentItem?.title || ""}
                                </div>

                                {/* 이미지 */}
                                {currentItem?.image ? (
                                    <div
                                        style={{
                                            width: "100%",
                                            marginTop: 18,
                                            marginBottom: 24,
                                        }}
                                    >
                                        <a
                                            href={currentItem.image}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`${
                                                currentItem.title || "정보"
                                            } 이미지 크게 보기`}
                                            style={{
                                                display: "block",
                                                width: "100%",
                                                borderRadius: 0,
                                                outline: "none",
                                            }}
                                        >
                                            <img
                                                src={currentItem.image}
                                                alt={
                                                    currentItem.title
                                                        ? `${currentItem.title} 이미지`
                                                        : "정보 이미지"
                                                }
                                                loading="lazy"
                                                onLoad={(e) =>
                                                    handleImageLoad(
                                                        currentIndex,
                                                        e
                                                    )
                                                }
                                                style={{
                                                    display: "block",
                                                    width: "100%",
                                                    height: "auto",
                                                    objectFit: "cover",
                                                    objectPosition: "center",
                                                    borderRadius: 0,
                                                    cursor: "zoom-in",
                                                }}
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

export default Info
