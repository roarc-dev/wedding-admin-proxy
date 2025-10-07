// P22TextComplete.js — 간단 텍스트 컴포넌트 (P22 Late November 사용)
// - 브라우저 ESM
// - JSX Runtime 사용 (reference.js 패턴 적용)
// - React 훅 직접 import
// - typography.js를 통해 폰트 로딩 보장

import { jsx } from "react/jsx-runtime";
import { useEffect, useMemo } from "react";
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=27c65dba30928cbbce6839678016d9ac"

// === reference.js 패턴: React 훅 직접 import로 Proxy 패턴 불필요 ===

function P22TextComplete(props) {
  const {
    text = "Sample Text",
    fontSize = 25,
    letterSpacingEm = 0.05,
    lineHeightEm = 0.7,
    style,
  } = props || {};

  // reference.js 패턴: React 훅을 직접 import했으므로 바로 사용 가능
  // 더 이상 런타임 확인이나 Proxy 패턴 불필요

  // 폰트 로딩 보장
  useEffect(() => {
    try {
      typography && typeof typography.ensure === "function" && typography.ensure();
    } catch (_) {}
  }, []);

  // P22 우선 폰트 스택 (typography.js에서 제공)
  const p22Stack = typography.helpers.stacks.p22;

  const containerStyle = useMemo(
    () => ({
      width: "100%",
      height: "fit-content",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "visible",
      boxSizing: "border-box",
      fontFamily: p22Stack,
      fontSize: `${fontSize}px`,
      letterSpacing: `${letterSpacingEm}em`,
      lineHeight: `${lineHeightEm}em`,
      textAlign: "center",
      whiteSpace: "nowrap",
      ...((style || {})),
    }),
    [style, fontSize, letterSpacingEm, lineHeightEm]
  );

  return jsx("div", { style: containerStyle, children: String(text || "") });
}

P22TextComplete.displayName = "P22TextComplete";
export default P22TextComplete;


