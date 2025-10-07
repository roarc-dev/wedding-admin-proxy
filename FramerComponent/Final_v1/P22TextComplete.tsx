import React, { useEffect, useMemo } from "react"
import { addPropertyControls, ControlType } from "framer"
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=27c65dba30928cbbce6839678016d9ac"

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 50
 */

interface P22TextCompleteProps {
    text: string
    fontSize: number
    letterSpacingEm: number
    lineHeightEm: number
    style?: React.CSSProperties
}

export default function P22TextComplete(props: P22TextCompleteProps) {
    const {
        text = "Sample Text",
        fontSize = 25,
        letterSpacingEm = 0.05,
        lineHeightEm = 0.7,
        style,
    } = props

    // 폰트 로딩 보장
    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                typography.ensure()
            }
        } catch (error) {
            console.warn("[P22TextComplete] Typography loading failed:", error)
        }
    }, [])

    // P22 폰트 스택을 안전하게 가져오기
    const p22FontFamily = useMemo(() => {
        try {
            return typography?.helpers?.stacks?.p22 || '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
        } catch {
            return '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    const containerStyle = useMemo(
        () => ({
            width: "100%",
            height: "fit-content",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "visible",
            boxSizing: "border-box",
            fontFamily: p22FontFamily,
            fontSize: `${fontSize}px`,
            letterSpacing: `${letterSpacingEm}em`,
            lineHeight: `${lineHeightEm}em`,
            textAlign: "center",
            whiteSpace: "nowrap",
            color: "#000000",
            ...style,
        }),
        [p22FontFamily, fontSize, letterSpacingEm, lineHeightEm, style]
    )

    return (
        <div style={containerStyle}>
            {String(text || "")}
        </div>
    )
}

// Property Controls
addPropertyControls(P22TextComplete, {
    text: {
        type: ControlType.String,
        title: "텍스트",
        defaultValue: "Sample Text",
        placeholder: "텍스트를 입력하세요",
    },
    fontSize: {
        type: ControlType.Number,
        title: "폰트 크기",
        min: 8,
        max: 120,
        step: 1,
        defaultValue: 25,
    },
    letterSpacingEm: {
        type: ControlType.Number,
        title: "자간 (em)",
        min: -0.1,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.05,
    },
    lineHeightEm: {
        type: ControlType.Number,
        title: "줄 간격 (em)",
        min: 0.5,
        max: 3.0,
        step: 0.1,
        defaultValue: 0.7,
    },
})
