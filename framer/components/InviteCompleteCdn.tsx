// @ts-nocheck
// InviteCompleteCdn.tsx — InviteComplete.js를 불러오는 Framer 코드 컴포넌트
import * as React from "react"
// @ts-ignore
import { addPropertyControls, ControlType } from "framer"

// 로컬 파일에서 직접 import (CDN 배포 시 URL로 교체 가능)
// @ts-ignore
import InviteComplete from "https://cdn.roarc.kr/framer/components/InviteComplete.js?v=c4e081f92126be8c0b2a82a8c3ea669b"

function InviteCompleteCdn(props: { page_id?: string; style?: React.CSSProperties }) {
    const { page_id = "default", style } = props
    return <InviteComplete pageId={page_id} style={style} />
}

/** @framerDisableUnlink */
InviteCompleteCdn.displayName = "InviteCompleteCdn"

addPropertyControls(InviteCompleteCdn, {
    page_id: {
        type: ControlType.String,
        title: "page_id",
        defaultValue: "default",
        placeholder: "예: default",
    },
})

export default InviteCompleteCdn as React.ComponentType


