// NameSectionCompleteCdn.tsx (Framer 코드 컴포넌트)
// NameSectionComplete.js의 모든 기능을 포함한 완전한 컴포넌트를 외부에서 불러와서 사용
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

// @ts-ignore
import NameSectionComplete from "https://cdn.roarc.kr/framer/components/NameSectionComplete.js"

type Props = {
  pageId?: string
  groomName?: string
  brideName?: string
  style?: React.CSSProperties
}

function NameSectionCompleteCdn(props: Props) {
  const { pageId, groomName, brideName, style } = props
  return (
    // @ts-ignore - 외부 JS 모듈 컴포넌트 프롭스 전달
    <NameSectionComplete
      pageId={pageId}
      groomName={groomName}
      brideName={brideName}
      style={style}
    />
  )
}

/** @framerDisableUnlink */
NameSectionCompleteCdn.displayName = "NameSectionCompleteCdn"

addPropertyControls(NameSectionCompleteCdn, {
  pageId: {
    type: ControlType.String,
    title: "pageId",
    defaultValue: "",
    placeholder: "default",
  },
})

export default NameSectionCompleteCdn as React.ComponentType
