// PhotoSectionProxyCdn.tsx — JS 모듈을 불러오는 Framer 코드 컴포넌트 래퍼
import * as React from "react"
// @ts-ignore
import { addPropertyControls, ControlType } from "framer"

// Lazy wrapper to ensure global React/Framer is available before loading ESM
const PhotoSectionProxyLazy: React.FC<any> = React.memo((props) => {
  const LazyComp = React.useMemo(
    () =>
      React.lazy(async () => {
        if (typeof window !== "undefined") {
          // @ts-ignore
          if (!(window as any).React) (window as any).React = React
          // @ts-ignore
          ;(window as any).Framer = { ...(window as any).Framer, React }
        }
        // @ts-ignore - URL/relative import allowed at runtime
        const mod = await import("./PhotoSectionProxy.js")
        return { default: (mod as any).default || mod }
      }),
    []
  )

  return (
    <React.Suspense fallback={null}>
      <LazyComp {...props} />
    </React.Suspense>
  )
})

// Exported component for Framer
export default PhotoSectionProxyLazy as React.ComponentType

addPropertyControls(PhotoSectionProxyLazy, {
  pageId: {
    type: ControlType.String,
    title: "Page ID",
    defaultValue: "",
    placeholder: "예: mypageid",
  },
  imageUrl: { type: ControlType.File, title: "이미지 업로드", allowedFileTypes: ["image/*"] },
  useOverrideDateTime: { type: ControlType.Boolean, title: "일시 수동 입력", defaultValue: false },
  displayDateTime: {
    type: ControlType.String,
    title: "예식 일시",
    defaultValue: "2025. 0. 00. SUN. 0 PM",
    placeholder: "예: 2025. 12. 25. SUN. 2 PM",
    hidden: (p: any) => !p.useOverrideDateTime,
  },
  useOverrideLocation: { type: ControlType.Boolean, title: "장소 수동 입력", defaultValue: false },
  location: {
    type: ControlType.String,
    title: "예식 장소",
    defaultValue: "LOCATION",
    placeholder: "예식장 이름을 입력하세요",
    hidden: (p: any) => !p.useOverrideLocation,
  },
  overlayPosition: {
    type: ControlType.Enum,
    title: "날짜/장소 위치",
    options: ["top", "bottom"],
    optionTitles: ["상단", "하단"],
    defaultValue: "bottom",
    displaySegmentedControl: true,
  },
  overlayTextColor: {
    type: ControlType.Enum,
    title: "오버레이 텍스트 색상",
    options: ["#ffffff", "#000000"],
    optionTitles: ["흰색", "검정"],
    defaultValue: "#ffffff",
    displaySegmentedControl: true,
  },
  useOverrideOverlayTextColor: { type: ControlType.Boolean, title: "텍스트 색상 수동 입력", defaultValue: false },
  useOverrideOverlayPosition: { type: ControlType.Boolean, title: "날짜/장소 위치 수동 입력", defaultValue: false },
  useOverrideLocale: { type: ControlType.Boolean, title: "언어 수동 입력", defaultValue: false },
  locale: {
    type: ControlType.Enum,
    title: "날짜/시간 언어",
    options: ["en", "ko"],
    optionTitles: ["영문", "한글"],
    defaultValue: "en",
    displaySegmentedControl: true,
  },
})


