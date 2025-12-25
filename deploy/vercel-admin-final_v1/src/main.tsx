import React from "react"
import { createRoot } from "react-dom/client"

import Admin from "./Admin"
import { init } from "./typography"

// 타이포그래피 시스템 초기화 (Pretendard 폰트 로드)
init()

const container = document.getElementById('root')
if (!container) {
  throw new Error('Failed to find the root element')
}

const root = createRoot(container)
root.render(
  <React.StrictMode>
    <Admin />
  </React.StrictMode>
)
