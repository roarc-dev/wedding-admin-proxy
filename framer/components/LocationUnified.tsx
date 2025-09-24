// LocationUnified.tsx (Framer 코드 컴포넌트)
// LocationUnified.js의 모든 기능을 포함한 완전한 컴포넌트를 외부에서 불러와서 사용
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

// @ts-ignore
import LocationUnified from "https://cdn.roarc.kr/framer/components/LocationUnified.js"

type Props = {
  pageId?: string
  style?: React.CSSProperties
}

function LocationUnifiedComponent(props: Props) {
  const { pageId, style } = props
  return (
    // @ts-ignore - 외부 JS 모듈 컴포넌트 프롭스 전달
    <LocationUnified
      pageId={pageId}
      style={style}
    />
  )
}

/** @framerDisableUnlink */
LocationUnifiedComponent.displayName = "LocationUnified"

addPropertyControls(LocationUnifiedComponent, {
  pageId: {
    type: ControlType.String,
    title: "페이지 ID",
    defaultValue: "default",
    placeholder: "각 결혼식 페이지를 구분하는 고유 ID (예: aeyong)",
  },
})

export default LocationUnifiedComponent as React.ComponentType
