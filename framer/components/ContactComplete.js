// ContactComplete.js — Contact.tsx 기능을 jsx runtime 기반 JS로 변환
// - 브라우저 ESM
// - JSX Runtime 사용 (reference.js 패턴 적용)
// - React 훅 직접 import

import { jsx } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo } from "react";
import typography from "https://cdn.roarc.kr/fonts/typography.js";

// === reference.js 패턴: React 훅 직접 import로 Proxy 패턴 불필요 ===

// 고정 프록시 URL
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app";

// 글로벌 캐시/프리로딩
const contactCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10분
const PRELOAD_DELAY = 100; // 100ms 후 프리로딩

const preloadContactInfo = async (pageId) => {
  if (!pageId) return;
  const cacheKey = `contact_${pageId}`;
  const cached = contactCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) return;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${PROXY_BASE_URL}/api/contacts?pageId=${pageId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const result = await response.json();
      if (result && result.success && Array.isArray(result.data) && result.data.length > 0) {
        contactCache.set(cacheKey, { data: result.data[0], timestamp: Date.now() });
      }
    }
  } catch (_) {}
};

const schedulePreload = (pageId) => {
  setTimeout(() => preloadContactInfo(pageId), PRELOAD_DELAY);
};

// 전화번호 정규화: 모든 입력을 010-1234-5678 형식 등으로 변환
function normalizePhoneNumber(input) {
  if (!input) return "";
  const digits = String(input).replace(/\D/g, "");
  // 11자리 (모바일: 3-4-4)
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  // 10자리: 서울(02) 2-4-4, 그외 3-3-4 가정
  if (digits.length === 10) {
    if (digits.startsWith("02")) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  // 9자리: 서울(02) 2-3-4 가정
  if (digits.length === 9 && digits.startsWith("02")) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  // 그 외: 가능한 경우 3-4-4 시도, 실패 시 원본 반환
  if (digits.length > 7) {
    const head = digits.length - 4 - 3; // 가운데 블록 추정
    if (head > 0) {
      return `${digits.slice(0, head)}-${digits.slice(head, head + 3)}-${digits.slice(head + 3)}`;
    }
  }
  return digits;
}

// ChrysanthemumIcon: 현 버전에서 사용되지 않으므로 제거

function ContactList({ contacts, onCall, onSMS, callIcon, smsIcon }) {
  return jsx(
    "div",
    {
      style: { display: "flex", flexDirection: "column", gap: "12px", marginTop: "0px" },
      children: (contacts || []).map((contact, index) =>
        jsx(
          ContactItem,
          {
          key: `${contact.name}-${contact.phone}-${index}`,
          label: contact.label,
          name: contact.name,
          phone: contact.phone,
          onCall,
          onSMS,
          showBorder: index < contacts.length - 1,
          callIcon,
          smsIcon,
        }
      )
    )
  );
}

function ContactItem({ label, name, phone, onCall, onSMS, showBorder = true, callIcon, smsIcon }) {
  if (!name || !phone) return null;
  const handleCall = React.useCallback(() => onCall && onCall(phone), [onCall, phone]);
  const handleSMS = React.useCallback(() => onSMS && onSMS(phone), [onSMS, phone]);

  return jsx(
    "div",
    {
      style: {
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: showBorder ? "1px solid #E5E7EB" : "none",
        padding: 0,
        margin: 0,
      },
      children: [
        // left
        jsx(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              height: "100%",
              gap: 0
            }
          },
          [
            jsx(
              "div",
              {
                style: {
                  fontSize: "14px",
                  fontFamily: "Pretendard SemiBold",
                  color: "#707070",
                  marginBottom: 0,
                  lineHeight: 1.4
                },
                children: label
              }
            ),
            jsx(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: 0
                }
              },
              [
                jsx(
                  "div",
                  {
                    style: {
                      fontSize: "16px",
                      fontFamily: "Pretendard SemiBold",
                      color: "#1F2937",
                      lineHeight: 1.4
                    },
                    children: name
                  }
                ),
                jsx(
                  "div",
                  {
                    style: {
                      fontSize: "16px",
                      fontFamily: "Pretendard Regular",
                      color: "#000000",
                      lineHeight: 1
                    },
                    children: phone
                  }
                )
              ]
            )
          ]
        ),
        // right icons
        jsx(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "row",
              gap: "12px",
              alignItems: "center",
              height: "100%",
              marginBottom: "4px",
              opacity: "50%"
            }
          },
          [
            jsx(
              motion.button,
              {
                onClick: handleCall,
                style: {
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                },
                whileHover: { scale: 1.1 },
                whileTap: { scale: 0.9 },
                children: callIcon
                  ? jsx("img", {
                      src: callIcon,
                      alt: "통화",
                      style: { width: "18px", height: "18px", objectFit: "contain" }
                    })
                  : jsx("span", { style: { fontSize: "16px" }, children: "📞" })
              }
            ),
            jsx(
              motion.button,
              {
                onClick: handleSMS,
                style: {
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                },
                whileHover: { scale: 1.1 },
                whileTap: { scale: 0.9 },
                children: smsIcon
                  ? jsx("img", {
                      src: smsIcon,
                      alt: "문자",
                      style: { width: "18px", height: "18px", objectFit: "contain" }
                    })
                  : jsx("span", { style: { fontSize: "16px" }, children: "💬" })
              }
            )
          ]
        )
      ]
    }
  );
}

function ContactComplete(props) {
  const { pageId = "demo", callIcon = "", smsIcon = "", style = {} } = props || {};
  
  // reference.js 패턴: React 훅을 직접 import했으므로 바로 사용 가능
  // 더 이상 런타임 확인이나 Proxy 패턴 불필요
  // 폰트 로딩 보장 (Pretendard 등)
  useEffect(() => {
    try {
      typography && typeof typography.ensure === "function" && typography.ensure();
    } catch (_) {}
  }, []);


  const [viewState, setViewState] = useState("selection"); // "closed" | "selection" | "groom" | "bride"
  const [contactInfo, setContactInfo] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!pageId) {
      setIsLoading(false);
      return;
    }
    const cacheKey = `contact_${pageId}`;
    const cached = contactCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setContactInfo(cached.data);
      setError(null);
      setIsLoading(false);
      return;
    }
    fetchContactInfo();
    schedulePreload(pageId);
  }, [pageId]);

  const fetchContactInfo = useCallback(async () => {
    if (!pageId) {
      setIsLoading(false);
      return;
    }
    setError(null);
    const cacheKey = `contact_${pageId}`;
    const cached = contactCache.get(cacheKey);
    if (!cached || Date.now() - cached.timestamp >= CACHE_DURATION) {
      setIsLoading(true);
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const url = `${PROXY_BASE_URL}/api/contacts?pageId=${pageId}`;
      const response = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" }, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      if (result && result.success) {
        if (result.data && result.data.length > 0) {
          const contactData = result.data[0];
          setContactInfo(contactData);
          contactCache.set(cacheKey, { data: contactData, timestamp: Date.now() });
        } else {
          throw new Error(`페이지 ID "${pageId}"에 해당하는 연락처 정보를 찾을 수 없습니다.`);
        }
      } else {
        throw new Error(result && result.error ? result.error : "연락처 정보를 불러오는데 실패했습니다.");
      }
    } catch (err) {
      if (err && err.name === "AbortError") {
        setError("연결 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.");
      } else {
        setError((err && err.message) || "연락처 정보를 불러오는데 실패했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  const processedContacts = useMemo(() => {
    if (!contactInfo) return { groom: [], bride: [] };
    return {
      groom: [
        { label: "신랑", name: contactInfo.groom_name, phone: normalizePhoneNumber(contactInfo.groom_phone) },
        { label: "혼주", name: contactInfo.groom_father_name, phone: normalizePhoneNumber(contactInfo.groom_father_phone) },
        { label: "혼주", name: contactInfo.groom_mother_name, phone: normalizePhoneNumber(contactInfo.groom_mother_phone) },
      ].filter((c) => c.name && c.phone),
      bride: [
        { label: "신부", name: contactInfo.bride_name, phone: normalizePhoneNumber(contactInfo.bride_phone) },
        { label: "혼주", name: contactInfo.bride_father_name, phone: normalizePhoneNumber(contactInfo.bride_father_phone) },
        { label: "혼주", name: contactInfo.bride_mother_name, phone: normalizePhoneNumber(contactInfo.bride_mother_phone) },
      ].filter((c) => c.name && c.phone),
    };
  }, [contactInfo]);

  const closeModal = () => setViewState("closed");
  const goBack = () => setViewState("selection");
  const showGroomContacts = () => setViewState("groom");
  const showBrideContacts = () => setViewState("bride");

  const makeCall = React.useCallback((phone) => {
    const clean = (phone || "").replace(/\D/g, "");
    if (typeof window !== "undefined") window.open(`tel:${clean}`, "_self");
  }, []);
  const sendSMS = React.useCallback((phone) => {
    const clean = (phone || "").replace(/\D/g, "");
    if (typeof window !== "undefined") window.open(`sms:${clean}`, "_self");
  }, []);

  const retry = () => {
    contactCache.delete(`contact_${pageId}`);
    fetchContactInfo();
  };

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      AnimatePresence,
      null,
      true &&
        React.createElement(
          motion.div,
          {
            layout: true,
            transition: { layout: { type: "ease", duration: 0.1 } },
            style: {
              backgroundColor: "white",
              borderRadius: "10px",
              padding: "20px",
              width: "280px",
              minWidth: "280px",
              maxWidth: "280px",
              maxHeight: "80vh",
              overflow: "auto",
              position: "relative",
              boxSizing: "border-box",
              transformOrigin: "center center",
              ...(style || {}),
            },
          },
          // 헤더
          React.createElement(
            "div",
            { style: { margin: "-20px -20px 20px -20px", backgroundColor: "#121212", borderRadius: "0px 0px 0 0", paddingTop: "20px", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" } },
            React.createElement(
              "h2",
              { style: { fontSize: "14px", fontFamily: "Pretendard SemiBold", color: "#FFFFFF", margin: 0, flex: 1, textAlign: "center" } },
              "축하 연락하기"
            )
          ),
          // 로딩 상태
          isLoading
            ? React.createElement(
                motion.div,
                { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 }, style: { textAlign: "center", padding: "40px", color: "#6B7280" } },
                React.createElement("div", { style: { fontSize: "12px" } }, "연락처 불러오는 중")
              )
            : null,
          // 에러 상태
          error && !isLoading
            ? React.createElement(
                "div",
                { style: { textAlign: "center", padding: "40px", color: "#EF4444" } },
                React.createElement("div", { style: { marginBottom: "15px" } }, "⚠️"),
                React.createElement("div", { style: { marginBottom: "20px", fontSize: "14px" } }, error),
                React.createElement(
                  motion.button,
                  {
                    onClick: retry,
                    style: { backgroundColor: "#EF4444", color: "white", border: "none", borderRadius: "5px", padding: "10px 20px", cursor: "pointer", fontSize: "14px" },
                    whileHover: { scale: 1.05 },
                    whileTap: { scale: 0.95 },
                  },
                  "다시 시도"
                )
              )
            : null,
          // 컨텐츠
          contactInfo && !error
            ? React.createElement(
                React.Fragment,
                null,
                // 선택 화면
                viewState === "selection"
                  ? React.createElement(
                      motion.div,
                      { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 }, style: { display: "flex", justifyContent: "center", gap: "30px", alignItems: "center", margin: "0px 0" } },
                      React.createElement(
                        motion.button,
                        {
                          layout: false,
                          onClick: showGroomContacts,
                          style: { width: "90px", height: "90px", backgroundColor: "#EDEDED", border: "none", borderRadius: "50%", fontSize: "16px", fontFamily: "Pretendard SemiBold", color: "#1F2937", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0, aspectRatio: "1 / 1", justifyContent: "center" },
                          whileHover: { scale: 1.05 },
                          whileTap: { scale: 0.95 },
                        },
                        "신랑측"
                      ),
                      React.createElement(
                        motion.button,
                        {
                          layout: false,
                          onClick: showBrideContacts,
                          style: { width: "90px", height: "90px", backgroundColor: "#EDEDED", border: "none", borderRadius: "50%", fontSize: "16px", fontFamily: "Pretendard SemiBold", color: "#1F2937", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0, aspectRatio: "1 / 1", justifyContent: "center" },
                          whileHover: { scale: 1.05 },
                          whileTap: { scale: 0.95 },
                        },
                        "신부측"
                      )
                    )
                  : null,
                // 신랑측
                viewState === "groom"
                  ? React.createElement(
                      motion.div,
                      { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 }, style: { display: "flex", flexDirection: "column", height: "100%" } },
                      React.createElement(
                        "div",
                        { style: { flex: 1 } },
                        React.createElement(ContactList, { contacts: processedContacts.groom, onCall: makeCall, onSMS: sendSMS, callIcon, smsIcon })
                      ),
                      React.createElement(
                        "div",
                        { style: { height: "0px", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "12px", marginBottom: "12px", cursor: "pointer" }, onClick: goBack },
                        React.createElement("span", { style: { fontFamily: "Pretendard Regular", fontSize: "14px", color: "#8c8c8c" } }, "뒤로가기")
                      )
                    )
                  : null,
                // 신부측
                viewState === "bride"
                  ? React.createElement(
                      motion.div,
                      { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 }, style: { display: "flex", flexDirection: "column", height: "100%" } },
                      React.createElement(
                        "div",
                        { style: { flex: 1 } },
                        React.createElement(ContactList, { contacts: processedContacts.bride, onCall: makeCall, onSMS: sendSMS, callIcon, smsIcon })
                      ),
                      React.createElement(
                        "div",
                        { style: { height: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "12px", cursor: "pointer" }, onClick: goBack },
                        React.createElement("span", { style: { fontFamily: "Pretendard Regular", lineHeight: 1.4, fontSize: "14px", color: "#8c8c8c" } }, "뒤로가기")
                      )
                    )
                  : null
              )
            : null
        )
    )
  );
}

ContactComplete.displayName = "ContactComplete";
export default ContactComplete;


