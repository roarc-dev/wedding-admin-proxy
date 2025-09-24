// UnifiedGalleryCompleteCdn.tsx — UnifiedGalleryComplete.js를 불러오는 Framer 코드 컴포넌트 래퍼
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

// @ts-ignore 외부 JS 모듈 불러오기
import UnifiedGalleryComplete from "https://cdn.roarc.kr/framer/components/UnifiedGalleryComplete.js"

type Props = {
  pageId?: string
  style?: React.CSSProperties
}

function UnifiedGalleryCompleteCdn(props: Props) {
  const { pageId = "default", style } = props
  // @ts-ignore 외부 JS 컴포넌트에 프롭 전달
  return <UnifiedGalleryComplete pageId={pageId} style={style} />
}

UnifiedGalleryCompleteCdn.displayName = "UnifiedGalleryCompleteCdn"

addPropertyControls(UnifiedGalleryCompleteCdn, {
  pageId: {
    type: ControlType.String,
    title: "pageId",
    defaultValue: "default",
  },
})

export default UnifiedGalleryCompleteCdn as React.ComponentType


