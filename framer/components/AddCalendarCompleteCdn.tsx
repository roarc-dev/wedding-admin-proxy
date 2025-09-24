// @ts-nocheck
// AddCalendarCompleteCdn.tsx — AddCalendarComplete.js를 불러오는 Framer 코드 컴포넌트
import * as React from "react"
// @ts-ignore
import { addPropertyControls, ControlType } from "framer"

// @ts-ignore
import AddCalendarComplete from "https://cdn.roarc.kr/framer/components/AddCalendarComplete.js?v=4928f293ee62a46452de6dfeebd5bd8e"

function AddCalendarCompleteCdn(props: { pageId?: string; style?: React.CSSProperties }) {
    const { pageId = "demo", style } = props
    return <AddCalendarComplete pageId={pageId} style={style} />
}

/** @framerDisableUnlink */
AddCalendarCompleteCdn.displayName = "AddCalendarCompleteCdn"

addPropertyControls(AddCalendarCompleteCdn, {
    pageId: {
        type: ControlType.String,
        title: "페이지 ID",
        defaultValue: "demo",
        description: "각 결혼식 페이지를 구분하는 고유 ID",
    },
})

export default AddCalendarCompleteCdn as React.ComponentType


