import React, { useEffect, useMemo } from "react"
import { addPropertyControls, ControlType } from "framer"
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=93b9ecf6126b65d121cf207f509f7d07"

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 50
 */

interface GoldenbookTextCompleteProps {
    text: string
    fontSize: number
    fontWeight: number
    letterSpacingEm: number
    lineHeightEm: number
    style?: React.CSSProperties
}

export default function GoldenbookTextComplete(
    props: GoldenbookTextCompleteProps
) {
    const {
        text = "Sample Text",
        fontSize = 25,
        fontWeight = 600,
        letterSpacingEm = 0.05,
        lineHeightEm = 0.7,
        style,
    } = props

    // Typography 폰트 로딩 (Typekit 포함)
    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                typography.ensure()
            }
        } catch (error) {
            console.warn(
                "[GoldenbookTextComplete] Typography loading failed:",
                error
            )
        }
    }, [])

    // goldenbook 폰트 스택 가져오기
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

    const containerStyle = useMemo(
        () => ({
            width: "100%",
            height: "fit-content",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "visible",
            boxSizing: "border-box",
            fontFamily: goldenbookFontFamily,
            fontSize: `${fontSize}px`,
            fontWeight: fontWeight,
            fontStyle: "normal",
            lineHeight: `${lineHeightEm}em`,
            letterSpacing: `${letterSpacingEm}em`,
            textAlign: "center",
            whiteSpace: "nowrap",
            color: "#000000",
            ...style,
        }),
        [
            goldenbookFontFamily,
            fontSize,
            fontWeight,
            lineHeightEm,
            letterSpacingEm,
            style,
        ]
    )

    return <div style={containerStyle}>{String(text || "")}</div>
}

addPropertyControls(GoldenbookTextComplete, {
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
    fontWeight: {
        type: ControlType.Number,
        title: "폰트 두께",
        min: 400,
        max: 600,
        step: 200,
        defaultValue: 600,
        displayStepper: true,
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
