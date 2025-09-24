// @ts-nocheck
// P22TextCompleteCdn.tsx — P22TextComplete.js를 불러오는 Framer 코드 컴포넌트
import * as React from "react"
// @ts-ignore
import { addPropertyControls, ControlType } from "framer"

// 로컬 파일에서 직접 import (CDN 배포 시 URL로 교체 가능)
// @ts-ignore
import P22TextComplete from "https://cdn.roarc.kr/framer/components/P22TextComplete.js"

type P22TextProps = {
    text?: string
    fontSize?: number
    letterSpacingEm?: number
    lineHeightEm?: number
    style?: React.CSSProperties
}

function P22TextCompleteCdn(props: P22TextProps) {
    const {
        text = "Sample Text",
        fontSize = 25,
        letterSpacingEm = 0.05,
        lineHeightEm = 0.7,
        style,
    } = props
    return (
        <P22TextComplete
            text={text}
            fontSize={fontSize}
            letterSpacingEm={letterSpacingEm}
            lineHeightEm={lineHeightEm}
            style={style}
        />
    )
}

/** @framerDisableUnlink */
P22TextCompleteCdn.displayName = "P22TextCompleteCdn"

addPropertyControls(P22TextCompleteCdn, {
    text: {
        type: ControlType.String,
        title: "text",
        defaultValue: "Sample Text",
        placeholder: "텍스트 입력",
    },
    fontSize: {
        type: ControlType.Number,
        title: "fontSize",
        defaultValue: 25,
        displayStepper: true,
        min: 1,
        max: 200,
        unit: "px",
    },
    letterSpacingEm: {
        type: ControlType.Number,
        title: "letterSpacing",
        defaultValue: 0.05,
        step: 0.01,
    },
    lineHeightEm: {
        type: ControlType.Number,
        title: "lineHeight",
        defaultValue: 0.7,
        step: 0.05,
    },
})

export default P22TextCompleteCdn as React.ComponentType


