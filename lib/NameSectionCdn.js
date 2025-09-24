// NameSectionCdn.js — 완성 컴포넌트(default export) + P22 우선 적용
// - 브라우저 ESM
// - JSX/TS 미사용 (createElement)
// - Framer/React 전역 런타임에서 동작
// - typography.js를 직접 import하여 폰트 CSS를 주입
//   ※ v= 파라미터는 최신 ETag로 교체 권장
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=73ec350103c71ae8190673accafe44f1";

// === 런타임 전역에서 React 확보 ===
const React =
  (globalThis && (globalThis.React || (globalThis.Framer && globalThis.Framer.React))) ||
  null;
if (!React) {
  throw new Error("[NameSectionCdn] React global not found. This module expects to run inside Framer/React runtime.");
}

// (옵션) framer-motion이 전역에 있으면 쓰고, 없으면 div로 폴백
const motionEnv =
  (globalThis && globalThis.Framer && globalThis.Framer.motion) || globalThis.motion || {};
const motion = (motionEnv && motionEnv.motion) || ((props) => React.createElement("div", props));

// === 서브 컴포넌트: AND 아이콘 ===
function AndSvg(props = {}) {
  const { size = 20, color = "#111827" } = props;
  return React.createElement(
    "svg",
    { width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("path", { d: "M7 12h10", stroke: color, strokeWidth: 1.5, strokeLinecap: "round" }),
    React.createElement("path", { d: "M12 7v10", stroke: color, strokeWidth: 1.5, strokeLinecap: "round" })
  );
}

// === 메인 컴포넌트 (default export) ===
function NameSectionCdn(props) {
  const {
    groomName = "GROOM",
    brideName = "BRIDE",
    style,
    andIconSize = 18,
    textColor = "#111827",
    subColor = "#6b7280",
    fontSize = 36,        // 기본 글자 크기 (필요 시 props로 조절)
  } = props;

  const { useEffect, useRef, useMemo } = React;
  const nameWrapRef = useRef(null);

  // P22 폰트 CSS 주입 (실패해도 렌더는 진행)
  useEffect(() => {
    try {
      typography && typeof typography.ensure === "function" && typography.ensure();
    } catch (_) {}
  }, []);

  // ✅ P22 우선 폰트 스택
  const p22Stack = `"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"`;

  const containerStyle = useMemo(
    () => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: "12px 16px",
      color: textColor,
      fontFamily: p22Stack,        // ← P22 우선
      ...(style || {}),
    }),
    [style, textColor]
  );

  const nameStyle = {
    fontSize: `${fontSize}px`,
    letterSpacing: "0.02em",
    fontWeight: 600,
    lineHeight: 1.1,
    whiteSpace: "nowrap",
    textAlign: "center",
  };

  const subStyle = {
    fontSize: Math.max(10, Math.round(fontSize * 0.33)),
    color: subColor,
    letterSpacing: "0.02em",
    lineHeight: 1.1,
    textAlign: "center",
  };

  return React.createElement(
    "div",
    { ref: nameWrapRef, style: containerStyle },
    // GROOM
    React.createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", alignItems: "center" } },
      React.createElement("div", { style: nameStyle }, String(groomName || "").toUpperCase()),
      React.createElement("div", { style: subStyle }, "Groom")
    ),
    // AND
    React.createElement(
      motion, // framer-motion 있으면 애니메이션 div, 없으면 일반 div
      { style: { display: "flex", alignItems: "center", justifyContent: "center" } },
      React.createElement(AndSvg, { size: andIconSize, color: textColor })
    ),
    // BRIDE
    React.createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", alignItems: "center" } },
      React.createElement("div", { style: nameStyle }, String(brideName || "").toUpperCase()),
      React.createElement("div", { style: subStyle }, "Bride")
    )
  );
}

NameSectionCdn.displayName = "NameSectionCdn";
export default NameSectionCdn;