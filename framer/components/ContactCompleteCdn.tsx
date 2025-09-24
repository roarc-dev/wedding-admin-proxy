// @ts-nocheck
// ContactCompleteCdn.tsx — ContactComplete.js를 불러오는 Framer 코드 컴포넌트
import * as React from "react"
// @ts-ignore
import { addPropertyControls, ControlType } from "framer"

// @ts-ignore
import ContactComplete from "https://cdn.roarc.kr/framer/components/ContactComplete.js?v=afacd9b9b439e35f325c6633b9410d17"

function ContactCompleteCdn(props: { pageId?: string; callIcon?: string; smsIcon?: string; style?: React.CSSProperties }) {
    const { pageId = "demo", callIcon = "", smsIcon = "", style } = props
    return (
        <ContactComplete pageId={pageId} callIcon={callIcon} smsIcon={smsIcon} style={style} />
    )
}

/** @framerDisableUnlink */
ContactCompleteCdn.displayName = "ContactCompleteCdn"

addPropertyControls(ContactCompleteCdn, {
    pageId: {
        type: ControlType.String,
        title: "페이지 ID",
        defaultValue: "demo",
        description: "각 결혼식 페이지를 구분하는 고유 ID",
    },
    callIcon: {
        type: ControlType.File,
        title: "통화 아이콘",
        allowedFileTypes: ["image/*"],
        description: "통화 버튼에 사용할 아이콘 이미지",
    },
    smsIcon: {
        type: ControlType.File,
        title: "문자 아이콘",
        allowedFileTypes: ["image/*"],
        description: "문자 버튼에 사용할 아이콘 이미지",
    },
})

export default ContactCompleteCdn as React.ComponentType


