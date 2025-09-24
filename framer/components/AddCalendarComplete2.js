// AddCalendarComplete.js — AddCalender.tsx 기능을 React.createElement 기반 JS로 변환
// - 브라우저 ESM
// - JSX/TS 미사용 (createElement)
// - Framer/React 전역 런타임에서 동작

import typography from "https://cdn.roarc.kr/fonts/typography.js?v=73ec350103c71ae8190673accafe44f1";

// React 전역은 Framer/Canvas 최적화 단계에서 아직 준비 전일 수 있으므로
// 즉시 검사/throw하지 않고, 접근 시점에 동적으로 해소하는 Proxy + 폴백을 사용한다.
const React = (() => {
  const resolve = () =>
    (globalThis && (globalThis.React || (globalThis.Framer && globalThis.Framer.React))) || null;
  const fallback = {
    createElement: () => null,
    Fragment: "div",
  };
  return new Proxy(
    {},
    {
      get(_t, key) {
        const r = resolve();
        if (!r) {
          return (fallback && fallback[key]) || (() => null);
        }
        return r[key];
      },
    }
  );
})();

// framer-motion 환경 감지 (없으면 폴백 제공)
const framerNS = (globalThis && globalThis.Framer) || {};
let motion = null;
try {
  const motionEnv = framerNS.motion || globalThis.motion || null;
  motion = motionEnv && motionEnv.button ? motionEnv : null;
} catch (_) {
  motion = null;
}
if (!motion) {
  const factory = (tag) => (props) => React.createElement(tag, props, props && props.children);
  motion = { button: factory("button") };
}

// 프록시 서버 URL (원본 컴포넌트의 값 유지)
const PROXY_BASE_URL = "https://wedding-admin-proxy-git-main-roarcs-projects.vercel.app";

// 날짜를 구글 캘린더 형식(YYYYMMDDTHHmmss)으로 포맷
function formatDateForCalendar(date) {
  const pad = (num) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

function AddCalendarComplete(props) {
  const { pageId = "demo", style } = props || {};
  const resolveReactNow = () =>
    (globalThis && (globalThis.React || (globalThis.Framer && globalThis.Framer.React))) || null;
  const R = resolveReactNow();
  if (!R) return null;
  const { useEffect, useState } = R;

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
    fetchPageSettings();
  }, [pageId]);

  // 폰트 로딩 보장
  useEffect(() => {
    try {
      typography && typeof typography.ensure === "function" && typography.ensure();
    } catch (_) {}
  }, []);

  async function fetchPageSettings() {
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
      setError(err && err.message ? err.message : "설정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleClick() {
    if (!pageSettings.wedding_date || !pageSettings.wedding_hour || !pageSettings.wedding_minute) {
      if (typeof alert !== "undefined") alert("웨딩 날짜와 시간이 설정되지 않았습니다.");
      return;
    }
    try {
      const startHour = parseInt(pageSettings.wedding_hour, 10);
      const startMinute = parseInt(pageSettings.wedding_minute, 10);
      const startDateTime = new Date(pageSettings.wedding_date);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // +2시간
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
  }

  // 버튼 스타일 (기본값 고정): 배경 #e0e0e0, 텍스트 #000000, 100% 채움, radius 0
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
    return React.createElement(
      "div",
      { style: buttonStyle },
      React.createElement("span", { style: textStyle }, loading ? "로딩 중..." : "설정 오류")
    );
  }

  return React.createElement(
    motion.button,
    { style: buttonStyle, onClick: handleClick },
    React.createElement("span", { style: textStyle }, "캘린더에 추가하기")
  );
}

AddCalendarComplete.displayName = "AddCalendarComplete";
export default AddCalendarComplete;


