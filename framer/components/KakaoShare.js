// KakaoShare.js — Admin에서 설정한 Kakao 공유 데이터를 사용하는 브라우저 ESM 컴포넌트
// - JSX Runtime 사용 (reference.js 패턴)
// - React 훅 직접 import

import { jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=6fdc95bcc8fd197d879c051a8c2d5a03";

const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app";

const fetchPageSettings = async (pageId) => {
  if (!pageId) return null;
  try {
    const res = await fetch(
      `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.success && json?.data) return json.data;
  } catch (error) {
    console.error("카카오 공유 설정 로딩 실패", error);
  }
  return null;
};

const extractPath = (url) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\//, "");
    return path || "";
  } catch (error) {
    return url;
  }
};

const formatFallbackBody = (settings) => {
  if (!settings?.wedding_date) return "결혼식 정보를 확인해 주세요";
  try {
    const [yearStr, monthStr, dayStr] = settings.wedding_date
      .split("-")
      .map((value) => value.trim());
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!year || !month || !day) return "결혼식 정보를 확인해 주세요";

    const date = new Date(year, month - 1, day);
    const weekdays = [
      "일요일",
      "월요일",
      "화요일",
      "수요일",
      "목요일",
      "금요일",
      "토요일",
    ];
    const weekday = weekdays[date.getDay()];

    const hourRaw = settings.wedding_hour ?? "";
    const minuteRaw = settings.wedding_minute ?? "";
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);

    const hasHour = hourRaw !== "" && !Number.isNaN(hour);
    const hasMinute = minuteRaw !== "" && !Number.isNaN(minute);

    const period = hasHour ? (hour < 12 ? "오전" : "오후") : "";
    const hour12 = hasHour
      ? hour % 12 === 0
        ? 12
        : hour % 12
      : "";
    const minuteText = hasMinute && minute > 0 ? ` ${minute}분` : "";
    const timeText = hasHour
      ? `${period ? `${period} ` : ""}${hour12}시${minuteText}`
      : "";

    return `${year}년 ${month}월 ${day}일 ${weekday}${
      timeText ? ` ${timeText}` : ""
    }`;
  } catch (error) {
    return "결혼식 정보를 확인해 주세요";
  }
};

function KakaoShare(props = {}) {
  const { pageId = "", templateId = "", style } = props;
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    try {
      typography && typeof typography.ensure === "function" && typography.ensure();
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!pageId) {
      setSettings(null);
      return;
    }
    let cancelled = false;
    fetchPageSettings(pageId).then((data) => {
      if (!cancelled) setSettings(data);
    });
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  const templateArgs = useMemo(() => {
    if (!settings) return null;

    const fallbackTitle = `${settings.groom_name_kr || "신랑"} ♥ ${
      settings.bride_name_kr || "신부"
    } 결혼합니다`;
    const fallbackBody = formatFallbackBody(settings);

    const customTitle = settings.kko_title?.trim()
      ? settings.kko_title
      : fallbackTitle;
    const customBody = settings.kko_date?.trim()
      ? settings.kko_date
      : fallbackBody;

    const imageUrl = settings.kko_img?.trim()
      ? settings.kko_img
      : settings.photo_section_image_url || "";

    return {
      WEDDING_IMAGE: imageUrl,
      CUSTOM_TITLE: customTitle,
      CUSTOM_BODY: customBody,
      WEDDING_URL: extractPath(settings.page_url),
    };
  }, [settings]);

  const kakao = typeof window !== "undefined" ? window.Kakao : undefined;
  const isReadyToShare =
    !!templateId &&
    !!pageId &&
    !!templateArgs &&
    !!kakao &&
    kakao.isInitialized();

  const handleShare = () => {
    if (!isReadyToShare || !templateArgs || !kakao?.Share) {
      alert("카카오톡 공유를 위해 필요한 설정이 준비되지 않았습니다.");
      return;
    }

    try {
      kakao.Share.sendCustom({
        templateId: Number(templateId),
        templateArgs,
      });
    } catch (error) {
      console.error("카카오톡 공유 실패", error);
      alert("카카오톡 공유 중 오류가 발생했습니다.");
    }
  };

  return jsx("div", {
    style: { display: "inline-block", ...(style || {}) },
    children: jsx("button", {
      type: "button",
      onClick: handleShare,
      disabled: !isReadyToShare,
      style: {
        width: "100%",
        height: "100%",
        minWidth: 160,
        minHeight: 44,
        border: "none",
        backgroundColor: "#e0e0e0",
        color: "#000",
        fontFamily: typography?.helpers?.stacks?.pretendard?.semiBold || "Pretendard SemiBold",
        fontSize: 14,
        cursor: isReadyToShare ? "pointer" : "not-allowed",
        opacity: isReadyToShare ? 1 : 0.6,
      },
      children: "카카오톡으로 공유하기",
    }),
  });
}

KakaoShare.displayName = "KakaoShare";
export default KakaoShare;
