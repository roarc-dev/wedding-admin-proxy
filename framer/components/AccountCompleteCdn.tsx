// @ts-nocheck
// AccountCompleteCdn.tsx — AccountComplete.js를 불러오는 Framer 코드 컴포넌트
import * as React from "react"
// @ts-ignore
import { addPropertyControls, ControlType } from "framer"

// @ts-ignore
import AccountComplete from "./AccountComplete.js"

function AccountCompleteCdn(props: { pageId?: string; style?: React.CSSProperties }) {
    const { pageId = "default", style } = props
    return <AccountComplete pageId={pageId} style={style} />
}

/** @framerDisableUnlink */
AccountCompleteCdn.displayName = "AccountCompleteCdn"

addPropertyControls(AccountCompleteCdn, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "default",
    },
})

export default AccountCompleteCdn as React.ComponentType


