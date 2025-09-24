// @ts-nocheck
// CalendarCompleteCdn.tsx — CalendarComplete.js를 불러오는 Framer 코드 컴포넌트
import * as React from "react"
// @ts-ignore
import { addPropertyControls, ControlType } from "framer"

// 로컬 파일에서 직접 import (CDN 배포 시 URL로 교체 가능)
// @ts-ignore
import CalendarComplete from "https://cdn.roarc.kr/framer/components/CalendarComplete.js?v=b2006d28b1af0e1be41905d5d98e3831"

function CalendarCompleteCdn(props: { pageId?: string; highlightColor?: string; style?: React.CSSProperties }) {
    const { pageId = "default", highlightColor = "#e0e0e0", style } = props
    return <CalendarComplete pageId={pageId} highlightColor={highlightColor} style={style} />
}

/** @framerDisableUnlink */
CalendarCompleteCdn.displayName = "CalendarCompleteCdn"

addPropertyControls(CalendarCompleteCdn, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "default",
        placeholder: "Enter page ID",
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Highlight Color",
        defaultValue: "#e0e0e0",
    },
})

export default CalendarCompleteCdn as React.ComponentType


