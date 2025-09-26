// AddCalendarComplete2.js — AddCalendarComplete.tsx의 reference.js 스타일 JS 버전
// - JSX Runtime 사용 (Framer 브라우저 환경 호환)
// - React 훅 직접 import (전역 의존성 제거)
// - motion 구성요소는 주입 → 전역 → 폴백 순으로 해결
// - typography.js URL import 유지

// === JSX runtime & React 훅 (reference.js 패턴) ==================================
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";

const createElement = (type, props, ...children) => {
  const normalizedProps = props || {};
  if (children.length === 0) {
    return jsx(type, normalizedProps);
  }
  const childValue = children.length === 1 ? children[0] : children;
  if (Array.isArray(childValue)) {
    return jsxs(type, { ...normalizedProps, children: childValue });
  }
  return jsx(type, { ...normalizedProps, children: childValue });
};

const renderFragment = (...children) => createElement(Fragment, null, ...children);

// === 외부 URL 의존성 ===========================================================
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=73ec350103c71ae8190673accafe44f1";

// === 모션 폴백 ================================================================
const fallbackMotionFactory = (tag) => {
  const Component = (props = {}) => {
    const { children, ...rest } = props || {};
    if (Array.isArray(children)) return createElement(tag, rest, ...children);
    return createElement(tag, rest, children);
  };
  Component.displayName = `fallback.motion.${tag}`;
  return Component;
};

const fallbackMotion = {
  div: fallbackMotionFactory("div"),
  button: fallbackMotionFactory("button"),
  svg: fallbackMotionFactory("svg"),
};

const fallbackAnimatePresence = (props = {}) => {
  const { children } = props || {};
  if (Array.isArray(children)) return renderFragment(...children);
  return renderFragment(children);
};

const fallbackMotionConfig = ({ children /*, transition*/ }) => {
  if (Array.isArray(children)) return renderFragment(...children);
  return renderFragment(children);
};

const getGlobalScope = () => {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof window !== "undefined") return window;
  return {};
};

const resolveMotionEnv = (injected = {}) => {
  const g = getGlobalScope();
  const framerNS = (g && g.Framer) || {};

  const motionEnv = injected.motion || framerNS.motion || g.motion || null;

  const motionDiv = motionEnv?.div || fallbackMotion.div;
  const motionButton = motionEnv?.button || fallbackMotion.button;
  const motionSvg = motionEnv?.svg || fallbackMotion.svg;

  const AnimatePresence = injected.AnimatePresence || framerNS.AnimatePresence || fallbackAnimatePresence;

  const MotionConfigComponent = injected.MotionConfig || framerNS.MotionConfig || fallbackMotionConfig;

  return {
    motion: { div: motionDiv, button: motionButton, svg: motionSvg },
    AnimatePresence,
    MotionConfig: MotionConfigComponent,
  };
};

// === 데이터 관련 유틸 ==========================================================
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app";

const formatDateForCalendar = (date) => {
  const pad = (num) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
};

// === 컴포넌트 =================================================================
function AddCalendarComplete(props) {
  const {
    pageId = "demo",
    style,
    __motion,
    __AnimatePresence,
    __MotionConfig,
  } = props || {};

  const { motion, MotionConfig: MotionConfigComponent } =
    typeof useMemo === "function"
      ? useMemo(
          () => resolveMotionEnv({
            motion: __motion,
            AnimatePresence: __AnimatePresence,
            MotionConfig: __MotionConfig,
          }),
          [__motion, __AnimatePresence, __MotionConfig]
        )
      : resolveMotionEnv({
          motion: __motion,
          AnimatePresence: __AnimatePresence,
          MotionConfig: __MotionConfig,
        });

  const MotionButton = motion.button || fallbackMotion.button;

  const [pageSettings, setPageSettings] = useState({
    groom_name_kr: "",
    bride_name_kr: "",
    wedding_date: "",
    wedding_hour: "14",
    wedding_minute: "00",
    venue_name: "",
    venue_address: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      if (!pageId) {
        setLoading(false);
        setError("pageId가 없습니다");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const url = `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`;
        const response = await fetch(url);
        const result = await response.json();
        if (result && result.success && result.data) {
          setPageSettings(result.data);
        } else {
          throw new Error((result && result.error) || "설정을 불러올 수 없습니다.");
        }
      } catch (err) {
        setError((err && err.message) || "설정을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [pageId]);

  useEffect(() => {
    try {
      typography && typeof typography.ensure === "function" && typography.ensure();
    } catch (_) {}
  }, []);

  const handleClick = () => {
    if (!pageSettings.wedding_date || !pageSettings.wedding_hour || !pageSettings.wedding_minute) {
      if (typeof alert !== "undefined") alert("웨딩 날짜와 시간이 설정되지 않았습니다.");
      return;
    }
    try {
      const startHour = parseInt(pageSettings.wedding_hour, 10);
      const startMinute = parseInt(pageSettings.wedding_minute, 10);
      const startDateTime = new Date(pageSettings.wedding_date);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);
      const eventDates = `${formatDateForCalendar(startDateTime)}/${formatDateForCalendar(endDateTime)}`;

      const groomFirstName = pageSettings.groom_name_kr ? pageSettings.groom_name_kr.slice(-2) : "신랑";
      const brideFirstName = pageSettings.bride_name_kr ? pageSettings.bride_name_kr.slice(-2) : "신부";
      const eventName = `${groomFirstName} ♥ ${brideFirstName}의 결혼식`;
      const eventDetails = `${groomFirstName}과 ${brideFirstName}의 새로운 출발을 축하해 주세요`;
      const eventLocation = pageSettings.venue_name || "";

      const url = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(eventName)}&dates=${eventDates}&details=${encodeURIComponent(eventDetails)}&location=${encodeURIComponent(eventLocation)}`;
      if (typeof window !== "undefined") window.open(url, "_blank");
    } catch (err) {
      if (typeof alert !== "undefined") alert("캘린더 이벤트 생성에 실패했습니다.");
    }
  };

  const buttonStyle = {
    backgroundColor: "#e0e0e0",
    color: "#000000",
    width: "100%",
    height: "100%",
    border: "none",
    borderRadius: 0,
    cursor: "pointer",
    ...(style || {}),
  };

  const textStyle = {
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial',
    fontSize: 14,
    fontWeight: 600,
    fontVariationSettings: '"wght" 600',
    lineHeight: "1.2em",
    letterSpacing: "normal",
    color: "#000000",
  };

  if (loading || error) {
    return createElement(
      MotionConfigComponent,
      { transition: { duration: 0.2, ease: "easeInOut" } },
      createElement(
        "div",
        { style: buttonStyle },
        createElement("span", { style: textStyle }, loading ? "로딩 중..." : "설정 오류")
      )
    );
  }

  return createElement(
    MotionConfigComponent,
    { transition: { duration: 0.2, ease: "easeInOut" } },
    createElement(
      MotionButton,
      { style: buttonStyle, onClick: handleClick },
      createElement("span", { style: textStyle }, "캘린더에 추가하기")
    )
  );
}

AddCalendarComplete.displayName = "AddCalendarComplete";
export default AddCalendarComplete;
