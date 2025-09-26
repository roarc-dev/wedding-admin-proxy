// CalendarComplete.js — Calendar.tsx 기능을 jsx runtime 기반 JS로 변환
// - 브라우저 ESM
// - JSX Runtime 사용 (reference.js 패턴 적용)
// - React 훅 직접 import
// - typography.js로 폰트 로딩 보장

import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import typography from "https://cdn.roarc.kr/fonts/typography.js";

// === reference.js 패턴: React 훅 직접 import로 Proxy 패턴 불필요 ===

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app";

const fallbackMotionFactory = (tag) => {
  const Component = (props = {}) => {
    const { children, ...rest } = props || {};
    if (Array.isArray(children)) {
      return jsxs(tag, { ...rest, children });
    }
    return jsx(tag, { ...rest, children });
  };
  Component.displayName = `fallback.motion.${tag}`;
  return Component;
};

const fallbackMotion = {
  div: fallbackMotionFactory("div"),
  span: fallbackMotionFactory("span"),
  button: fallbackMotionFactory("button"),
};

const resolveMotionEnv = () => {
  const g =
    typeof globalThis !== "undefined"
      ? globalThis
      : typeof window !== "undefined"
        ? window
        : {};
  const framerNS = (g && g.Framer) || {};
  const motionEnv = (framerNS && framerNS.motion) || g.motion || null;

  const getMotion = (tag) => {
    const candidate = motionEnv && typeof motionEnv[tag] === "function" ? motionEnv[tag] : null;
    return candidate || fallbackMotion[tag];
  };

  return {
    motion: {
      div: getMotion("div"),
      span: getMotion("span"),
      button: getMotion("button"),
    },
  };
};

// 하트 모양 SVG (색상/크기 적용)
function HeartShape({ color, size = 16 }) {
  return jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size * 0.875,
      viewBox: "0 0 16 14",
      fill: "none",
      style: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -45%)",
        zIndex: 0,
      },
      children: [
        jsx(
          "g",
          {
            clipPath: "url(#clip0_31_239)",
            children: jsxs(
              "g",
              {
                style: { mixBlendMode: "multiply" },
                children: [
                  jsx("path", {
                    d: "M8.21957 1.47997C8.08957 1.59997 7.99957 1.73997 7.87957 1.85997C7.75957 1.73997 7.66957 1.59997 7.53957 1.47997C3.08957 -2.76003 -2.51043 2.94997 1.21957 7.84997C2.91957 10.08 5.58957 11.84 7.86957 13.43C10.1596 11.83 12.8196 10.08 14.5196 7.84997C18.2596 2.94997 12.6596 -2.76003 8.19957 1.47997H8.21957Z",
                    fill: color,
                  }),
                ],
              }
            ),
          }
        ),
        jsx(
          "defs",
          {
            children: jsx(
              "clipPath",
              {
                id: "clip0_31_239",
                children: jsx("rect", { width: 15.76, height: 13.44, fill: "white" }),
              }
            ),
          }
        ),
      ],
    }
  );
}

// 프록시를 통한 invite_cards 데이터 가져오기
async function getInviteData(pageId) {
  try {
    const response = await fetch(`${PROXY_BASE_URL}/api/invite?pageId=${pageId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      console.warn(`Invite API 응답 오류: ${response.status}`);
      return null;
    }
    const result = await response.json();
    if (result && result.success && result.data) {
      return { groom_name: result.data.groom_name, bride_name: result.data.bride_name };
    }
    console.warn("초대장 데이터가 없습니다:", result && result.error);
    return null;
  } catch (error) {
    console.error("초대장 데이터 가져오기 실패:", error);
    return null;
  }
}

// 프록시를 통한 페이지 설정 가져오기 (invite와 병합)
async function getPageSettings(pageId) {
  try {
    const [inviteResult, pageResult] = await Promise.all([
      getInviteData(pageId),
      fetch(`${PROXY_BASE_URL}/api/page-settings?pageId=${pageId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    if (!pageResult.ok) {
      throw new Error(`HTTP ${pageResult.status}: ${pageResult.statusText}`);
    }
    const result = await pageResult.json();
    if (result && result.success && result.data) {
      const data = result.data;
      const groom_name = (inviteResult && inviteResult.groom_name) || data.groom_name_kr || data.groom_name || "";
      const bride_name = (inviteResult && inviteResult.bride_name) || data.bride_name_kr || data.bride_name || "";
      return {
        id: data.id,
        page_id: data.page_id,
        wedding_date: data.wedding_date,
        wedding_time: `${data.wedding_hour || "14"}:${data.wedding_minute || "00"}`,
        groom_name,
        bride_name,
        venue_name: data.venue_name || "",
        venue_address: data.venue_address || "",
        highlight_shape: data.highlight_shape || "circle",
        highlight_color: data.highlight_color || "#e0e0e0",
        highlight_text_color: data.highlight_text_color || "black",
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }
    console.warn("페이지 설정이 없습니다:", result && result.error);
    return null;
  } catch (error) {
    console.error("페이지 설정 가져오기 실패:", error);
    return null;
  }
}

// 프록시를 통한 캘린더 데이터 가져오기
async function getCalendarData(pageId) {
  try {
    const response = await fetch(`${PROXY_BASE_URL}/api/calendar?pageId=${pageId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      console.warn(`캘린더 API 응답 오류: ${response.status}`);
      return [];
    }
    const result = await response.json();
    if (result && result.success && result.data) {
      return result.data;
    }
    console.warn("캘린더 데이터가 없습니다:", result && result.error);
    return [];
  } catch (error) {
    console.error("캘린더 데이터 가져오기 실패:", error);
    return [];
  }
}

function CalendarComplete(props) {
  const {
    pageId = "default",
    highlightColor = "#e0e0e0",
    style,
    overrideWeddingDate,
    overrideWeddingHour,
    overrideWeddingMinute,
    overrideGroomName,
    overrideBrideName,
    overrideHighlightShape,
    overrideHighlightTextColor,
  } = props || {};

  const { motion } = useMemo(resolveMotionEnv, []);

  const [calendarData, setCalendarData] = useState([]);
  const [pageSettings, setPageSettings] = useState(null);
  const [currentMonth, setCurrentMonth] = useState("");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      typography && typeof typography.ensure === "function" && typography.ensure();
    } catch (_) {}
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [settings, calendar] = await Promise.all([
          getPageSettings(pageId),
          getCalendarData(pageId),
        ]);

        if (!active) return;

        const baseSettings = settings || {};
        const mergedSettings = {
          ...baseSettings,
          wedding_date: overrideWeddingDate || baseSettings.wedding_date,
          wedding_time:
            overrideWeddingHour || overrideWeddingMinute
              ? `${overrideWeddingHour || "14"}:${overrideWeddingMinute || "00"}`
              : baseSettings.wedding_time,
          groom_name: overrideGroomName || baseSettings.groom_name,
          bride_name: overrideBrideName || baseSettings.bride_name,
          highlight_shape: overrideHighlightShape || baseSettings.highlight_shape || "circle",
          highlight_color: highlightColor || baseSettings.highlight_color || "#e0e0e0",
          highlight_text_color: overrideHighlightTextColor || baseSettings.highlight_text_color || "black",
        };

        const calendarList = Array.isArray(calendar) ? calendar : [];

        setPageSettings(mergedSettings);
        setCalendarData(calendarList);

        if (calendarList.length > 0) {
          const firstDate = new Date(calendarList[0].date);
          setCurrentMonth(String(firstDate.getMonth() + 1));
          setCurrentYear(firstDate.getFullYear());
        } else if (mergedSettings && mergedSettings.wedding_date) {
          const weddingDate = new Date(mergedSettings.wedding_date);
          if (!Number.isNaN(weddingDate.getTime())) {
            setCurrentMonth(String(weddingDate.getMonth() + 1));
            setCurrentYear(weddingDate.getFullYear());
          }
        }
      } catch (e) {
        if (!active) return;
        setError((e && e.message) || "데이터를 불러오는 중 오류가 발생했습니다");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [
    pageId,
    highlightColor,
    overrideWeddingDate,
    overrideWeddingHour,
    overrideWeddingMinute,
    overrideGroomName,
    overrideBrideName,
    overrideHighlightShape,
    overrideHighlightTextColor,
  ]);

  const dDayText = useMemo(() => {
    try {
      const weddingDate = pageSettings && pageSettings.wedding_date;
      if (!weddingDate) return "D-00일";
      const today = new Date();
      const target = new Date(weddingDate);
      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      const diff = target.getTime() - today.getTime();
      const dayDiff = Math.ceil(diff / (1000 * 3600 * 24));

      if (dayDiff <= 1 && dayDiff >= 0) return "D-DAY";
      if (dayDiff > 1) return `D-${String(dayDiff).padStart(2, "0")}일`;
      return `D+${String(Math.abs(dayDiff)).padStart(2, "0")}일`;
    } catch (_) {
      return "D-00일";
    }
  }, [pageSettings && pageSettings.wedding_date]);

  const formattedDateTime = useMemo(() => {
    try {
      const weddingDate = pageSettings && pageSettings.wedding_date;
      const weddingTime = pageSettings && pageSettings.wedding_time;
      if (!weddingDate || !weddingTime) return "날짜 정보 없음";
      const date = new Date(weddingDate);
      const [hourStr, minuteStr] = weddingTime.split(":");
      date.setHours(parseInt(hourStr, 10), parseInt(minuteStr, 10));
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
      const dayName = dayNames[date.getDay()];
      const hour24 = parseInt(hourStr, 10);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 < 12 ? "오전" : "오후";
      const minuteVal = parseInt(minuteStr, 10);
      const minuteText = minuteVal !== 0 ? ` ${minuteVal}분` : "";
      return `${year}년 ${month}월 ${day}일 ${dayName} ${ampm} ${hour12}시${minuteText}`;
    } catch (_) {
      return "날짜 형식이 올바르지 않습니다";
    }
  }, [pageSettings && pageSettings.wedding_date, pageSettings && pageSettings.wedding_time]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const generateCalendar = () => {
    if (!currentMonth) {
      return { weeks: [], days: ["S", "M", "T", "W", "T", "F", "S"], maxWeeks: 0 };
    }
    const monthIndex = parseInt(currentMonth, 10) - 1;
    const daysInMonth = getDaysInMonth(currentYear, monthIndex);
    const firstDay = getFirstDayOfMonth(currentYear, monthIndex);
    const weeks = [];
    const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
    const totalCells = daysInMonth + firstDay;
    const actualWeeks = Math.ceil(totalCells / 7);

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const daysForColumn = [];
      let dateValue = dayIndex - firstDay + 1;
      let weekCount = 0;
      while (weekCount < actualWeeks) {
        if (dateValue > 0 && dateValue <= daysInMonth) {
          daysForColumn.push(dateValue);
        } else {
          daysForColumn.push(null);
        }
        dateValue += 7;
        weekCount += 1;
      }
      weeks.push(daysForColumn);
    }

    return { weeks, days: dayNames, maxWeeks: actualWeeks };
  };

  const isHighlighted = (day) => {
    if (day === null) return false;
    const currentMonthIndex = parseInt(currentMonth || "0", 10) - 1;
    if (pageSettings && pageSettings.wedding_date) {
      const weddingDate = new Date(pageSettings.wedding_date);
      const isWeddingDay =
        weddingDate.getDate() === day &&
        weddingDate.getMonth() === currentMonthIndex &&
        weddingDate.getFullYear() === currentYear;
      if (isWeddingDay) return true;
    }
    return (calendarData || []).some((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getDate() === day &&
        itemDate.getMonth() === currentMonthIndex &&
        itemDate.getFullYear() === currentYear
      );
    });
  };

  const { weeks, days } = generateCalendar();
  const fixedMarginTop = 40;
  const highlightFill = (pageSettings && pageSettings.highlight_color) || highlightColor;
  const highlightTextColor = (pageSettings && pageSettings.highlight_text_color) || "black";
  const highlightShape = (pageSettings && pageSettings.highlight_shape) || "circle";

  if (loading) {
    return jsxs("div", {
      style: {
        width: "fit-content",
        height: "fit-content",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px",
      },
      children: [
        jsx("div", {
          style: {
            fontSize: "16px",
            fontFamily: "Pretendard Regular",
            textAlign: "center",
          },
          children: "로딩 중...",
        }),
      ],
    });
  }

  if (error) {
    return jsxs("div", {
      style: {
        width: "fit-content",
        height: "fit-content",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px",
      },
      children: [
        jsx("div", {
          style: {
            fontSize: "16px",
            fontFamily: "Pretendard Regular",
            textAlign: "center",
            color: "#888",
          },
          children: "정보 없음",
        }),
      ],
    });
  }

  const calendarColumns = weeks.map((daysInColumn, columnIndex) => {
    const dayCells = daysInColumn.map((day, dayIndex) => {
      if (day === null) {
        return jsx("div", {
          key: `empty-${columnIndex}-${dayIndex}`,
          style: { width: "31px", height: "31px", marginBottom: "2px" },
        });
      }

      const highlighted = isHighlighted(day);
      return jsxs(
        "div",
        {
          key: `day-${columnIndex}-${dayIndex}`,
          style: {
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "31px",
            height: "31px",
            marginBottom: "2px",
          },
          children: [
            highlighted
              ? highlightShape === "heart"
                ? jsx(motion.div, {
                    style: { position: "absolute", zIndex: 0 },
                    animate: { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] },
                    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    children: jsx(HeartShape, { color: highlightFill, size: 28 }),
                  })
                : jsx(motion.div, {
                    style: {
                      position: "absolute",
                      width: "31px",
                      height: "31px",
                      borderRadius: "50%",
                      backgroundColor: highlightFill,
                      zIndex: 0,
                    },
                    animate: { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] },
                    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  })
              : null,
            jsx("div", {
              style: {
                fontSize: "15px",
                lineHeight: "2.6em",
                fontFamily: highlighted ? "Pretendard SemiBold" : "Pretendard Regular",
                color: highlighted ? highlightTextColor : "black",
                zIndex: 1,
                position: "relative",
              },
              children: day,
            }),
          ],
        }
      );
    });

    return jsxs(
      "div",
      {
        key: `col-${columnIndex}`,
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        },
        children: [
          jsx("div", {
            style: {
              fontSize: "15px",
              lineHeight: "2.6em",
              fontFamily: "Pretendard SemiBold",
              marginBottom: "5px",
            },
            children: days[columnIndex],
          }),
          ...dayCells,
        ],
      }
    );
  });

  return jsxs("div", {
    style: {
      width: "fit-content",
      height: "fit-content",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      ...(style || {}),
    },
    children: [
      jsx("div", {
        style: {
          fontSize: "16px",
          lineHeight: "1.8em",
          fontFamily: "Pretendard Regular",
          textAlign: "center",
          marginBottom: "20px",
        },
        children: formattedDateTime,
      }),
      jsx("div", {
        style: {
          fontSize: "50px",
          lineHeight: "1.8em",
          fontFamily: "P22LateNovemberW01-Regular Regular",
          textAlign: "center",
          marginBottom: "20px",
        },
        children: currentMonth,
      }),
      jsxs("div", {
        style: {
          display: "flex",
          flexDirection: "row",
          gap: "11px",
          padding: "0 20px 0 20px",
          alignItems: "flex-start",
          justifyContent: "center",
        },
        children: calendarColumns,
      }),
      jsxs("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: `${fixedMarginTop}px`,
        },
        children: [
          jsx("div", {
            style: {
              fontSize: "17px",
              lineHeight: "1em",
              fontFamily: "Pretendard Regular",
              textAlign: "center",
              marginBottom: "10px",
            },
            children: `${(pageSettings && pageSettings.groom_name) || "신랑"} ♥ ${(pageSettings && pageSettings.bride_name) || "신부"}의 결혼식`,
          }),
          jsx("div", {
            style: {
              fontSize: "17px",
              lineHeight: "1em",
              fontFamily: "Pretendard SemiBold",
              textAlign: "center",
            },
            children: dDayText,
          }),
        ],
      }),
    ],
  });
}

CalendarComplete.displayName = "CalendarComplete";
export default CalendarComplete;

