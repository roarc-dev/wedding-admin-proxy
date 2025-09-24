// NameSectionComplete.js — NameSection-Old.tsx의 모든 기능을 포함한 완전한 컴포넌트
// - 브라우저 ESM
// - JSX Runtime 사용 (reference.js 패턴 적용)
// - React 훅 직접 import
// - typography.js를 직접 import하여 폰트 CSS를 주입
import { jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo } from "react";
import typography from "https://cdn.roarc.kr/fonts/typography.js";

// === reference.js 패턴: React 훅 직접 import로 Proxy 패턴 불필요 ===

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app";

async function getInviteNamesByPageId(pageId) {
  if (!pageId) return { groom_name: "", bride_name: "" };
  const response = await fetch(
    `${PROXY_BASE_URL}/api/invite?pageId=${encodeURIComponent(pageId)}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );
  if (!response.ok) {
    return { groom_name: "", bride_name: "" };
  }
  const result = await response.json();
  if (result && result.success && result.data) {
    return {
      groom_name: result.data.groom_name || "",
      bride_name: result.data.bride_name || "",
    };
  }
  return { groom_name: "", bride_name: "" };
}

async function getPageSettingsNames(pageId) {
  if (!pageId) return { groom_name_en: "", bride_name_en: "" };
  try {
    const res = await fetch(
      `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );
    if (!res.ok) return { groom_name_en: "", bride_name_en: "" };
    const json = await res.json();
    const data = json && json.data ? json.data : {};
    return {
      groom_name_en: data.groom_name_en || "",
      bride_name_en: data.bride_name_en || "",
    };
  } catch (_) {
    return { groom_name_en: "", bride_name_en: "" };
  }
}

async function getPageTypeByPageId(pageId) {
  if (!pageId) return 'papillon';
  try {
    const res = await fetch(`${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) return 'papillon';
    const json = await res.json();
    const type = (json && json.data && json.data.type) || 'papillon';
    return type === 'eternal' ? 'eternal' : 'papillon';
  } catch (_) {
    return 'papillon';
  }
}

// === 반응형 크기 조정 유틸리티 ===
function calculateResponsiveSizes(containerWidth, groomName = "", brideName = "") {
  // 모바일 브라우저 최적화: 최대 너비 430px
  const baseWidth = 390;
  const minWidth = 280;
  const maxWidth = 430;

  // 현재 너비를 모바일 범위로 제한
  const clampedWidth = Math.max(minWidth, Math.min(maxWidth, containerWidth));

  // 비례 계수 계산 (0.7 ~ 1.1 범위로 제한하여 모바일에서 극단적 변화 방지)
  const scale = Math.max(0.7, Math.min(1.1, clampedWidth / baseWidth));

  // 기본 크기들
  const baseFontSize = 48;
  const baseMargin = 14;
  const baseSvgHeight = 42;

  // 스케일에 따른 크기 계산
  const targetFontSize = Math.round(baseFontSize * scale);
  const targetMargin = Math.round(baseMargin * scale);
  const targetSvgHeight = Math.round(baseSvgHeight * scale);

  // 모바일 최적화된 폰트 크기 제한
  const minFontSize = Math.max(20, Math.round(baseFontSize * 0.7));
  const maxFontSize = Math.min(56, Math.round(baseFontSize * 1.1));

  // SVG 스케일 계산 (높이 기준)
  const svgScale = targetSvgHeight / baseSvgHeight;

  // 사용 가능한 너비 계산 (SVG와 여백 고려)
  const availableWidth = Math.max(0, containerWidth - targetMargin * 2 - 20);

  // 최종 폰트 크기 결정
  let finalFontSize = Math.min(targetFontSize, maxFontSize);

  // 오버플로우 체크하면서 크기 조정 (간단한 방법)
  const estimatedTextWidth = Math.max(groomName.length, brideName.length) * finalFontSize * 0.6;
  while (estimatedTextWidth > availableWidth && finalFontSize > minFontSize) {
    finalFontSize -= 1;
  }

  return {
    fontSize: finalFontSize,
    margin: targetMargin,
    svgScale: svgScale,
    containerWidth: containerWidth
  };
}

// === 서브 컴포넌트: AND 아이콘 ===
function AndSvg(props = {}) {
  const { scale = 1, size = 42 } = props;
  return jsx(
    "img",
    {
      src: "https://cdn.roarc.kr/framer/components/and.svg?v=02545260b5222f9044b9492c4e759031",
      alt: "and",
      draggable: false,
      style: {
        display: "block",
        height: `${size}px`,
        width: "auto",
        transformOrigin: "center",
        objectFit: "contain"
      }
    }
  );
}

// === 메인 컴포넌트 (default export) ===
function NameSectionComplete(props) {
  const {
    groomName = "GROOM",
    brideName = "BRIDE",
    pageId = "",
    style,
  } = props;
  
  // reference.js 패턴: React 훅을 직접 import했으므로 바로 사용 가능
  // 더 이상 런타임 확인이나 Proxy 패턴 불필요

  // 이름 상태 (props 우선, 없으면 페이지에서 로드)
  const [resolvedGroomName, setResolvedGroomName] = useState(groomName);
  const [resolvedBrideName, setResolvedBrideName] = useState(brideName);
  // 레이아웃 타입 상태 (papillon | eternal)
  const [layoutType, setLayoutType] = useState('papillon');

  // Refs
  const nameContainerRef = useRef(null);
  const groomRef = useRef(null);
  const brideRef = useRef(null);
  const andRef = useRef(null);

  // 상태 관리 변수들
  let isInView = false;
  let hasTriggered = false;
  let nameFontSize = 48;
  let andSvgScale = 1;
  let marginSize = 14;
  let animationStarted = false;

  // P22 폰트 CSS 주입 (reference.js 패턴 적용)
  useEffect(() => {
    // typography.js를 통한 폰트 로딩 시도
    try {
      if (typography && typeof typography.ensure === "function") {
        typography.ensure();
      }
    } catch (error) {
      console.warn("[NameSectionComplete] Typography loading failed:", error);

      // 폴백: 직접 @font-face 추가 (P22 Late November woff2)
      const styleEl = document.createElement('style');
      styleEl.textContent = `@font-face{font-family:"P22 Late November";font-style:normal;font-weight:400;font-display:swap;src:url("https://cdn.roarc.kr/fonts/P22-LateNovember/P22-LateNovemberW01-Regular.woff2") format("woff2");}`;
      document.head.appendChild(styleEl);
    }
  }, []);

  // 페이지에서 신랑/신부 이름 로드 (props 값이 비어있을 때만)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const hasCustomGroom = !!(groomName && groomName.trim() && groomName !== "GROOM");
      const hasCustomBride = !!(brideName && brideName.trim() && brideName !== "BRIDE");
      if (hasCustomGroom || hasCustomBride) {
        return; // 사용자가 이름을 명시한 경우 API 호출 생략
      }
      // 1) page_settings에서 EN 이름 우선 사용
      const settingsNames = await getPageSettingsNames(pageId);
      if (!mounted) return;
      let updated = false;
      if (settingsNames.groom_name_en) {
        setResolvedGroomName(settingsNames.groom_name_en);
        updated = true;
      }
      if (settingsNames.bride_name_en) {
        setResolvedBrideName(settingsNames.bride_name_en);
        updated = true;
      }
      if (updated) return;

      // 2) 폴백: invite에서 이름 사용
      const names = await getInviteNamesByPageId(pageId);
      if (!mounted) return;
      if (names.groom_name && !groomName) setResolvedGroomName(names.groom_name);
      if (names.bride_name && !brideName) setResolvedBrideName(names.bride_name);
    })();
    return () => { mounted = false; };
  }, [pageId, groomName, brideName]);

  // 페이지 설정에서 레이아웃 타입 조회
  useEffect(() => {
    let mounted = true;
    (async () => {
      const t = await getPageTypeByPageId(pageId);
      if (!mounted) return;
      setLayoutType(t);
    })();
    return () => { mounted = false; };
  }, [pageId]);

  // 반응형 크기 계산 함수
  const updateResponsiveSizes = () => {
    if (!nameContainerRef.current) return;

    const containerWidth = nameContainerRef.current.clientWidth;
    const sizes = calculateResponsiveSizes(containerWidth, groomName, brideName);

    nameFontSize = sizes.fontSize;
    marginSize = sizes.margin;
    andSvgScale = sizes.svgScale;

    // DOM 업데이트
    if (groomRef.current) {
      groomRef.current.style.fontSize = `${nameFontSize}px`;
    }
    if (brideRef.current) {
      brideRef.current.style.fontSize = `${nameFontSize}px`;
    }
  };

  // Intersection Observer 설정
  useEffect(() => {
    if (!nameContainerRef.current || hasTriggered) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          isInView = true;
          hasTriggered = true;

          // 애니메이션 시작
          if (!animationStarted) {
            animationStarted = true;
            startAnimations();
          }

          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(nameContainerRef.current);

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  // ResizeObserver 설정
  useEffect(() => {
    // 초기 크기 설정
    updateResponsiveSizes();

    const resizeObserver = new ResizeObserver(() => {
      updateResponsiveSizes();
    });

    if (nameContainerRef.current) {
      resizeObserver.observe(nameContainerRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [groomName, brideName]);

  // 애니메이션 시작 함수
  const startAnimations = () => {
    if (!groomRef.current || !brideRef.current) return;

    const animateElement = (element, delay = 0) => {
      setTimeout(() => {
        if (element) {
          element.style.opacity = "1";
          element.style.transform = "translateY(0)";
        }
      }, delay);
    };

    // 초기 상태 설정
    if (groomRef.current) {
      groomRef.current.style.opacity = "0";
      groomRef.current.style.transform = "translateY(20px)";
      groomRef.current.style.transition = "opacity 1s ease-out, transform 1s ease-out";
    }

    if (andRef.current) {
      andRef.current.style.opacity = "0";
      andRef.current.style.transform = "translateY(20px)";
      andRef.current.style.transition = "opacity 1s ease-out 0.5s, transform 1s ease-out 0.5s";
    }

    if (brideRef.current) {
      brideRef.current.style.opacity = "0";
      brideRef.current.style.transform = "translateY(20px)";
      brideRef.current.style.transition = "opacity 1s ease-out 1s, transform 1s ease-out 1s";
    }

    // 애니메이션 실행
    animateElement(groomRef.current, 0);
    animateElement(andRef.current, 500);
    animateElement(brideRef.current, 1000);
  };

  // P22 우선 폰트 스택 (framer_components_NameSectionCdn.js와 동일)
  const p22Stack = (typography && typography.helpers && typography.helpers.stacks && typography.helpers.stacks.p22)
    || `"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"`;
  const goldenbookStack = (typography && typography.helpers && typography.helpers.stacks && typography.helpers.stacks.goldenbook)
    || `"Goldenbook", -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"`;
  const isEternal = layoutType === 'eternal';

  // reference.js 패턴: jsx() 함수 사용
  return jsx(
    "div",
    {
      ref: nameContainerRef,
      style: {
        width: "100%",
        height: "240px",
        minWidth: "280px",
        maxWidth: "430px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: "40px",
        boxSizing: "border-box",
        position: "relative",
        fontFamily: isEternal ? goldenbookStack : p22Stack,
        letterSpacing: isEternal ? '0.02em' : undefined,
        ...style,
      },
      children: [
        // 신랑 이름
        jsx("div", {
          ref: groomRef,
          style: {
            fontFamily: isEternal ? goldenbookStack : p22Stack,
            fontSize: `${nameFontSize}px`,
            textAlign: "center",
            lineHeight: isEternal ? "32px" : "1.2",
            whiteSpace: "nowrap",
            overflow: "hidden",
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 1s ease-out, transform 1s ease-out",
            letterSpacing: isEternal ? "0.02em" : undefined,
          },
          children: String(resolvedGroomName || "").toUpperCase()
        }),
        // AND SVG
        jsx("div", {
          ref: andRef,
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: `${marginSize}px`,
            height: `${Math.round(42 * (marginSize / 14))}px`,
          },
          children: jsx(AndSvg, { scale: andSvgScale, size: Math.round(42 * (marginSize / 14)) })
        }),
        // 신부 이름
        jsx("div", {
          ref: brideRef,
          style: {
            fontFamily: isEternal ? goldenbookStack : p22Stack,
            fontSize: `${nameFontSize}px`,
            textAlign: "center",
            lineHeight: isEternal ? "32px" : "1.2",
            whiteSpace: "nowrap",
            overflow: "hidden",
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 1s ease-out 1s, transform 1s ease-out 1s",
            letterSpacing: isEternal ? "0.02em" : undefined,
          },
          children: String(resolvedBrideName || "").toUpperCase()
        })
      ]
    }
  );
}

NameSectionComplete.displayName = "NameSectionComplete";
export default NameSectionComplete;
