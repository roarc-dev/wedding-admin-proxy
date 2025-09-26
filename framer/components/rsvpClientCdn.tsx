// @ts-nocheck
// rsvpClientCdn.tsx — rsvpClient.js를 불러오는 Framer 코드 컴포넌트
import * as React from "react"
// @ts-ignore
import { addPropertyControls, ControlType } from "framer"

// 로컬 파일에서 직접 import (CDN 배포 시 URL로 교체 가능)
// @ts-ignore
import RSVPClient from "https://cdn.roarc.kr/framer/components/rsvpClient.js"

type RSVPClientProps = {
    pageId?: string
    style?: React.CSSProperties
    backgroundColor?: string
    buttonColor?: string
    buttonTextColor?: string
    borderColor?: string
    accentColor?: string
    textColor?: string
    selectionTextColor?: string
    selectionButtonBgColor?: string
    selectionButtonBorderColor?: string
    selectionButtonActiveBgColor?: string
    selectionButtonActiveBorderColor?: string
    checkboxBorderColor?: string
    checkboxCheckedBgColor?: string
    checkboxCheckedBorderColor?: string
    rsvpEnabled?: string
}

function RSVPClientCdn(props: RSVPClientProps) {
    const {
        pageId = "",
        style,
        backgroundColor = "transparent",
        buttonColor = "#e0e0e0",
        buttonTextColor = "#000",
        borderColor = "#99999933",
        accentColor = "#000",
        textColor = "#999999",
        selectionTextColor = "#000000",
        selectionButtonBgColor = "#bbbbbb26",
        selectionButtonBorderColor = "#88888819",
        selectionButtonActiveBgColor = "#99999966",
        selectionButtonActiveBorderColor = "#00000088",
        checkboxBorderColor = "#88888833",
        checkboxCheckedBgColor = "#000",
        checkboxCheckedBorderColor = "#000",
        rsvpEnabled = "off",
    } = props

    return (
        <RSVPClient
            pageId={pageId}
            style={style}
            backgroundColor={backgroundColor}
            buttonColor={buttonColor}
            buttonTextColor={buttonTextColor}
            borderColor={borderColor}
            accentColor={accentColor}
            textColor={textColor}
            selectionTextColor={selectionTextColor}
            selectionButtonBgColor={selectionButtonBgColor}
            selectionButtonBorderColor={selectionButtonBorderColor}
            selectionButtonActiveBgColor={selectionButtonActiveBgColor}
            selectionButtonActiveBorderColor={selectionButtonActiveBorderColor}
            checkboxBorderColor={checkboxBorderColor}
            checkboxCheckedBgColor={checkboxCheckedBgColor}
            checkboxCheckedBorderColor={checkboxCheckedBorderColor}
            rsvpEnabled={rsvpEnabled}
        />
    )
}

/** @framerDisableUnlink */
RSVPClientCdn.displayName = "RSVPClientCdn"

addPropertyControls(RSVPClientCdn, {
    pageId: {
        type: ControlType.String,
        title: "페이지 ID",
        defaultValue: "",
        placeholder: "예: wedding-main, anniversary-2024",
    },
    rsvpEnabled: {
        type: ControlType.Enum,
        title: "RSVP 활성화",
        defaultValue: "off",
        options: ["on", "off"],
        optionTitles: ["켜짐", "꺼짐"],
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "배경색",
        defaultValue: "transparent",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "버튼 배경색",
        defaultValue: "#e0e0e0",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "버튼 글자색",
        defaultValue: "#000",
    },
    borderColor: {
        type: ControlType.Color,
        title: "테두리색",
        defaultValue: "#99999933",
    },
    textColor: {
        type: ControlType.Color,
        title: "텍스트색",
        defaultValue: "#999999",
    },
    selectionTextColor: {
        type: ControlType.Color,
        title: "선택 버튼 글자색",
        defaultValue: "#000000",
    },
    selectionButtonBgColor: {
        type: ControlType.Color,
        title: "선택 버튼 배경색",
        defaultValue: "#bbbbbb26",
    },
    selectionButtonBorderColor: {
        type: ControlType.Color,
        title: "선택 버튼 테두리색",
        defaultValue: "#88888819",
    },
    selectionButtonActiveBgColor: {
        type: ControlType.Color,
        title: "활성 선택 버튼 배경색",
        defaultValue: "#99999966",
    },
    selectionButtonActiveBorderColor: {
        type: ControlType.Color,
        title: "활성 선택 버튼 테두리색",
        defaultValue: "#00000088",
    },
    checkboxBorderColor: {
        type: ControlType.Color,
        title: "체크박스 테두리색",
        defaultValue: "#88888833",
    },
    checkboxCheckedBgColor: {
        type: ControlType.Color,
        title: "체크된 체크박스 배경색",
        defaultValue: "#000",
    },
    checkboxCheckedBorderColor: {
        type: ControlType.Color,
        title: "체크된 체크박스 테두리색",
        defaultValue: "#000",
    },
})

export default RSVPClientCdn as React.ComponentType
