// @ts-nocheck
// KakaoShareCdn.tsx — KakaoShare.js를 불러오는 Framer 코드 컴포넌트
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

// CDN 경로에서 JS 컴포넌트를 로드 (배포 시 URL 교체 가능)
// @ts-ignore
import KakaoShare from "https://cdn.roarc.kr/framer/components/KakaoShare.js"

type KakaoShareProps = {
    pageId?: string
    templateId?: string
    style?: React.CSSProperties
}

function KakaoShareCdn(props: KakaoShareProps) {
    const { pageId = "", templateId = "", style } = props
    return (
        <KakaoShare pageId={pageId} templateId={templateId} style={style} />
    )
}

KakaoShareCdn.displayName = "KakaoShareCdn"

addPropertyControls(KakaoShareCdn, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "",
        placeholder: "예: wedding-demo",
    },
    templateId: {
        type: ControlType.String,
        title: "Template ID",
        defaultValue: "",
        placeholder: "카카오 템플릿 ID",
    },
})

export default KakaoShareCdn as React.ComponentType
