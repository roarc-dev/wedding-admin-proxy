import React, { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// P22 폰트 로딩을 위한 typography import
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=6fdc95bcc8fd197d879c051a8c2d5a03"

// 텍스트 포맷팅 유틸리티 함수들 (Admin.tsx에서 가져옴)
function renderBoldSegments(text: string, baseStyle?: React.CSSProperties): JSX.Element[] {
    const out: JSX.Element[] = []
    let last = 0
    let key = 0
    const re = /\*\*([^*]+)\*\*/g
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
        const start = m.index
        const end = start + m[0].length
        if (start > last) {
            const chunk = text.slice(last, start)
            if (chunk)
                out.push(
                    <span key={`nb-${key++}`} style={baseStyle}>
                        {chunk}
                    </span>
                )
        }
        const boldText = m[1]
        out.push(
            <span
                key={`b-${key++}`}
                style={{
                    ...(baseStyle || {}),
                    fontFamily: "Pretendard SemiBold",
                }}
            >
                {boldText}
            </span>
        )
        last = end
    }
    if (last < text.length) {
        const rest = text.slice(last)
        if (rest)
            out.push(
                <span key={`nb-${key++}`} style={baseStyle}>
                    {rest}
                </span>
            )
    }
    return out
}

function renderSmallSegments(text: string, baseStyle?: React.CSSProperties): JSX.Element[] {
    const lines = (text || "").split("\n")
    const rendered: JSX.Element[] = []
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const parts: JSX.Element[] = []
        let lastIndex = 0
        let keySeq = 0
        const regex = /\{([^}]*)\}/g
        let match: RegExpExecArray | null
        while ((match = regex.exec(line)) !== null) {
            const start = match.index
            const end = start + match[0].length
            if (start > lastIndex) {
                const chunk = line.slice(lastIndex, start)
                if (chunk)
                    parts.push(
                        <span key={`t-${i}-${keySeq++}`}>
                            {renderBoldSegments(chunk, baseStyle)}
                        </span>
                    )
            }
            const inner = match[1]
            if (inner)
                parts.push(
                    <span
                        key={`s-${i}-${keySeq++}`}
                        style={{
                            fontSize: 13,
                            lineHeight: "1.8em",
                            color: "#757575",
                            fontFamily: "Pretendard Regular",
                        }}
                    >
                        {renderBoldSegments(inner, {
                            fontSize: 13,
                            lineHeight: "1.8em",
                            color: "#757575",
                            fontFamily: "Pretendard Regular",
                        })}
                    </span>
                )
            lastIndex = end
        }
        if (lastIndex < line.length) {
            const rest = line.slice(lastIndex)
            if (rest)
                parts.push(
                    <span key={`t-${i}-${keySeq++}`}>
                        {renderBoldSegments(rest, baseStyle)}
                    </span>
                )
        }
        rendered.push(
            <span key={`line-${i}`}>
                {parts}
                {i !== lines.length - 1 && <br />}
            </span>
        )
    }
    return rendered
}

// Info 컴포넌트
function Info({
    infoItems = [],
    style,
}: {
    infoItems?: Array<{
        id?: string
        title: string
        description: string
        display_order: number
    }>
    style?: React.CSSProperties
}) {
    // P22 폰트 로딩
    useEffect(() => {
        try {
            typography && typeof typography.ensure === "function" && typography.ensure()
        } catch (_) {}
    }, [])

    // P22 폰트 스택
    const p22Stack = typography.helpers.stacks.p22

    // 슬라이드 상태 관리
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)

    // 자동 슬라이드 타이머
    useEffect(() => {
        if (!isAutoPlaying || infoItems.length <= 1) return

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % infoItems.length)
        }, 5000)

        return () => clearInterval(timer)
    }, [isAutoPlaying, infoItems.length])

    // 드래그 상태
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState(0)
    const [startX, setStartX] = useState(0)

    // 카드 높이 계산 (가장 긴 내용 기준)
    const maxCardHeight = useMemo(() => {
        const heights: number[] = []

        infoItems.forEach((item) => {
            // 제목 높이 계산 (예상)
            const titleHeight = 32 // 18px * 1.8em ≈ 32px
            // 본문 높이 계산 (예상)
            const descriptionLines = (item.description || "").split("\n").length
            const descriptionHeight = descriptionLines * 27 // 15px * 1.8em ≈ 27px

            // 여백 포함
            const totalHeight = titleHeight + descriptionHeight + 80 // padding + margin
            heights.push(totalHeight)
        })

        return Math.max(...heights, 200) // 최소 높이 200px
    }, [infoItems])

    // 드래그 핸들러
    const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true)
        setIsAutoPlaying(false)
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        setStartX(clientX)
    }, [])

    const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const deltaX = clientX - startX
        setDragOffset(deltaX)
    }, [isDragging, startX])

    const handleDragEnd = useCallback(() => {
        if (!isDragging) return

        setIsDragging(false)
        setDragOffset(0)

        const threshold = 50
        if (Math.abs(dragOffset) > threshold) {
            if (dragOffset > 0) {
                // 오른쪽으로 드래그 (이전)
                setCurrentIndex((prev) => (prev - 1 + infoItems.length) % infoItems.length)
            } else {
                // 왼쪽으로 드래그 (다음)
                setCurrentIndex((prev) => (prev + 1) % infoItems.length)
            }
        }

        // 5초 후 자동 재생 재개
        setTimeout(() => setIsAutoPlaying(true), 5000)
    }, [isDragging, dragOffset, infoItems.length])

    // 페이지네이션 클릭
    const handlePaginationClick = useCallback((index: number) => {
        setCurrentIndex(index)
        setIsAutoPlaying(false)
        setTimeout(() => setIsAutoPlaying(true), 5000)
    }, [])

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
            x: direction < 0 ? 300 : -300,
            opacity: 0,
        }),
    }

    // 현재 슬라이드 방향 계산
    const slideDirection = useMemo(() => {
        if (dragOffset > 0) return -1 // 이전
        if (dragOffset < 0) return 1  // 다음
        return 0
    }, [dragOffset])

    if (!infoItems || infoItems.length === 0) {
        return null
    }

    return (
        <div
            style={{
                backgroundColor: "#ebebeb",
                overflow: "hidden",
                width: "100%",
                height: "fit-content",
                marginTop: 80,
                marginBottom: 80,
                display: "flex",
                flexDirection: "column",
                gap: 40,
                ...style,
            }}
        >
            {/* 제목 */}
            <div
                style={{
                    width: "100%",
                    height: "fit-content",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "visible",
                    boxSizing: "border-box",
                    fontFamily: p22Stack,
                    fontSize: "25px",
                    letterSpacing: "0.05em",
                    lineHeight: "0.7em",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    color: "#000000",
                }}
            >
                INFORMATION
            </div>

            {/* 슬라이드 카드 영역 */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <div
                    style={{
                        width: "88%",
                        height: maxCardHeight,
                        backgroundColor: "white",
                        borderRadius: 8,
                        position: "relative",
                        overflow: "hidden",
                        cursor: infoItems.length > 1 ? "grab" : "default",
                    }}
                    onMouseDown={infoItems.length > 1 ? handleDragStart : undefined}
                    onMouseMove={infoItems.length > 1 ? handleDragMove : undefined}
                    onMouseUp={infoItems.length > 1 ? handleDragEnd : undefined}
                    onMouseLeave={infoItems.length > 1 ? handleDragEnd : undefined}
                    onTouchStart={infoItems.length > 1 ? handleDragStart : undefined}
                    onTouchMove={infoItems.length > 1 ? handleDragMove : undefined}
                    onTouchEnd={infoItems.length > 1 ? handleDragEnd : undefined}
                >
                    <AnimatePresence initial={false} custom={slideDirection}>
                        <motion.div
                            key={currentIndex}
                            custom={slideDirection}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 },
                            }}
                            drag={infoItems.length > 1 ? "x" : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragStart={() => {
                                setIsDragging(true)
                                setIsAutoPlaying(false)
                            }}
                            onDragEnd={(event, { offset, velocity }) => {
                                setIsDragging(false)
                                setDragOffset(0)

                                const swipe = Math.abs(offset.x) * velocity.x
                                if (swipe < -500) {
                                    setCurrentIndex((prev) => (prev + 1) % infoItems.length)
                                } else if (swipe > 500) {
                                    setCurrentIndex((prev) => (prev - 1 + infoItems.length) % infoItems.length)
                                }

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
                                transform: isDragging ? `translateX(${dragOffset}px)` : "translateX(0)",
                                transition: isDragging ? "none" : "transform 0.1s ease-out",
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
                                    fontFamily: "Pretendard SemiBold",
                                    lineHeight: "1.8em",
                                    marginBottom: 20,
                                }}
                            >
                                {infoItems[currentIndex]?.title || ""}
                            </div>

                            {/* 본문 */}
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    textAlign: "center",
                                    color: "#000",
                                    fontSize: 15,
                                    fontFamily: "Pretendard Regular",
                                    lineHeight: "1.8em",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {renderSmallSegments(infoItems[currentIndex]?.description || "")}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* 페이지네이션 */}
            {infoItems.length > 1 && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    {infoItems.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handlePaginationClick(index)}
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: index === currentIndex ? "#000000" : "rgba(0, 0, 0, 0.25)",
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
    infoItems: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "제목",
                },
                description: {
                    type: ControlType.String,
                    title: "내용",
                    control: {
                        type: ControlType.Textarea,
                    },
                },
                display_order: {
                    type: ControlType.Number,
                    title: "순서",
                    min: 1,
                },
            },
        },
        title: "안내 사항 목록",
        defaultValue: [
            {
                title: "첫 번째 안내 사항",
                description: "첫 번째 안내 사항 내용입니다. **굵은글씨**와 {작은글씨}를 사용할 수 있습니다.",
                display_order: 1,
            },
        ],
    },
})

export default Info
