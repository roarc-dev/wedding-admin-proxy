import React, { useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=27c65dba30928cbbce6839678016d9ac"

interface PretendardBtnTxtProps {
    text: string
    fontSize: number
    lineHeight: number
    fontColor: string
    style?: React.CSSProperties
}

export default function PretendardBtnTxt(props: PretendardBtnTxtProps) {
    const { text, fontSize, lineHeight, fontColor, style } = props

    // Typography 폰트 로딩
    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                typography.ensure()
            }
        } catch (error) {
            console.warn("[PretendardBtnTxt] Typography loading failed:", error)
        }
    }, [])

    // Pretendard SemiBold 스타일 (weight: 600)
    const pretendardSemiBoldStyle: React.CSSProperties = React.useMemo(() => {
        try {
            return typography?.helpers?.fontPretendard?.(600, fontSize, `${lineHeight}em`) || {
                fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
                fontWeight: 600,
                fontSize: `${fontSize}px`,
                lineHeight: `${lineHeight}em`
            }
        } catch {
            return {
                fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
                fontWeight: 600,
                fontSize: `${fontSize}px`,
                lineHeight: `${lineHeight}em`
            }
        }
    }, [fontSize, lineHeight])

    return (
        <div
            style={{
                color: fontColor,
                ...pretendardSemiBoldStyle,
                wordWrap: "break-word",
                ...style,
            }}
        >
            {text}
        </div>
    )
}

addPropertyControls(PretendardBtnTxt, {
    text: {
        type: ControlType.String,
        title: "텍스트",
        defaultValue: "버튼 텍스트",
        placeholder: "텍스트를 입력하세요",
    },
    fontSize: {
        type: ControlType.Number,
        title: "폰트 크기",
        defaultValue: 16,
        min: 8,
        max: 72,
        step: 1,
    },
    lineHeight: {
        type: ControlType.Number,
        title: "줄 간격",
        defaultValue: 1.5,
        min: 0.8,
        max: 3.0,
        step: 0.1,
    },
    fontColor: {
        type: ControlType.Color,
        title: "폰트 색상",
        defaultValue: "#000000",
    },
})
