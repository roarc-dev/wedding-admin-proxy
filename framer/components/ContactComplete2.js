// ContactComplete.nomod.js — Framer TSX 래퍼에서 URL로 직접 import 가능한 단일 파일
// - bare import (react/jsx-runtime, framer-motion) 제거
// - JSX runtime 간단 shim 사용 (globalThis.React 기반)
// - motion/AnimatePresence/MotionConfig는 props 주입 우선 → 전역(Framer) → 폴백
// - 기타 URL import(typography)는 유지 (브라우저 ESM이 URL import는 지원)

// === JSX runtime shim (react/jsx-runtime 대체) ===============================
const __getReactNS = () => {
  const g = (typeof globalThis !== 'undefined' && globalThis) || (typeof window !== 'undefined' ? window : {});
  return (g.React || (g.Framer && g.Framer.React)) || null;
};
const jsx = (type, props) => {
  const R = __getReactNS();
  if (!R || !R.createElement) return null;
  return R.createElement(type, { ...(props || {}), children: undefined }, props?.children);
};
const jsxs = jsx;
const Fragment = 'div';

// === 외부(허용된 URL) 의존성 ===================================================
import typography from "https://cdn.roarc.kr/fonts/typography.js";

// === 모션 폴백 ================================================================
const fallbackMotionFactory = (tag) => {
  const Component = (props = {}) => {
    const { children, style = {}, whileHover, whileTap, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, ...rest } = props || {};
    // ensure smooth transition in fallback
    const enhancedStyle = {
      ...style,
      transition: style && style.transition ? style.transition : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    const handleMouseEnter = (e) => {
      if (whileHover && typeof whileHover.scale === 'number') {
        const base = style && style.transform ? style.transform : '';
        e.currentTarget.style.transform = `${base} scale(${whileHover.scale})`;
      }
      if (typeof onMouseEnter === 'function') onMouseEnter(e);
    };
    const handleMouseLeave = (e) => {
      if (whileHover && typeof whileHover.scale === 'number') {
        e.currentTarget.style.transform = style && style.transform ? style.transform : '';
      }
      if (typeof onMouseLeave === 'function') onMouseLeave(e);
    };
    const handleMouseDown = (e) => {
      if (whileTap && typeof whileTap.scale === 'number') {
        const base = style && style.transform ? style.transform : '';
        e.currentTarget.style.transform = `${base} scale(${whileTap.scale})`;
      }
      if (typeof onMouseDown === 'function') onMouseDown(e);
    };
    const handleMouseUp = (e) => {
      if (whileTap && typeof whileTap.scale === 'number') {
        // restore hover state if present, otherwise base
        if (whileHover && typeof whileHover.scale === 'number') {
          const base = style && style.transform ? style.transform : '';
          e.currentTarget.style.transform = `${base} scale(${whileHover.scale})`;
        } else {
          e.currentTarget.style.transform = style && style.transform ? style.transform : '';
        }
      }
      if (typeof onMouseUp === 'function') onMouseUp(e);
    };

    if (Array.isArray(children)) {
      return jsxs(tag, { ...rest, style: enhancedStyle, onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, onMouseDown: handleMouseDown, onMouseUp: handleMouseUp, children });
    }
    return jsx(tag, { ...rest, style: enhancedStyle, onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, onMouseDown: handleMouseDown, onMouseUp: handleMouseUp, children });
  };
  Component.displayName = `fallback.motion.${tag}`;
  // mark for detection
  Component.__isFallback = true;
  return Component;
};

const fallbackMotion = {
  div: fallbackMotionFactory("div"),
  button: fallbackMotionFactory("button"),
  svg: fallbackMotionFactory("svg"),
};

const fallbackAnimatePresence = (props = {}) => {
  const { children } = props || {};
  if (Array.isArray(children)) return jsxs(Fragment, { children });
  return jsx(Fragment, { children });
};

const fallbackMotionConfig = ({ children /*, transition*/ }) => jsx(Fragment, { children });

// === 모션 환경 해상도(resolution) =============================================
const resolveMotionEnv = (injected = {}) => {
  const g =
    typeof globalThis !== "undefined"
      ? globalThis
      : typeof window !== "undefined"
        ? window
        : {};
  const framerNS = (g && g.Framer) || {};

  const motionEnv =
    injected.motion ||
    framerNS.motion ||
    g.motion ||
    null;

  const motionDiv    = motionEnv?.div    || fallbackMotion.div;
  const motionButton = motionEnv?.button || fallbackMotion.button;
  const motionSvg    = motionEnv?.svg    || fallbackMotion.svg;

  const useMotionFallback = !!(motionDiv && motionDiv.__isFallback);

  const AnimatePresence =
    injected.AnimatePresence ||
    framerNS.AnimatePresence ||
    fallbackAnimatePresence;

  const MotionConfigComponent =
    injected.MotionConfig ||
    framerNS.MotionConfig ||
    fallbackMotionConfig;

  return {
    motion: { div: motionDiv, button: motionButton, svg: motionSvg },
    AnimatePresence,
    MotionConfig: MotionConfigComponent,
    useMotionFallback,
  };
};

// === 전역 캐시/프리로딩 ========================================================
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app";
const DEFAULT_CALL_ICON_URL = "https://cdn.roarc.kr/framer/ContactIcon/phone.png";
const DEFAULT_SMS_ICON_URL  = "https://cdn.roarc.kr/framer/ContactIcon/sms.png.webp";

const contactCache   = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10분
const PRELOAD_DELAY  = 100;

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

// === 유틸 =====================================================================
// Hooks are resolved at runtime from React/Framer.React inside components to avoid early undefined.

// 전화번호 정규화
function normalizePhoneNumber(input) {
  if (!input) return "";
  const digits = String(input).replace(/\D/g, "");
  if (digits.length === 11) return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`;
  if (digits.length === 10) {
    if (digits.startsWith("02")) return `${digits.slice(0,2)}-${digits.slice(2,6)}-${digits.slice(6)}`;
    return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9 && digits.startsWith("02")) {
    return `${digits.slice(0,2)}-${digits.slice(2,5)}-${digits.slice(5)}`;
  }
  if (digits.length > 7) {
    const head = digits.length - 4 - 3;
    if (head > 0) return `${digits.slice(0, head)}-${digits.slice(head, head + 3)}-${digits.slice(head + 3)}`;
  }
  return digits;
}

// === 프리미티브 ===============================================================
function ContactList({ contacts, onCall, onSMS, callIcon, smsIcon, motion }) {
  const list = Array.isArray(contacts) ? contacts : [];
  const currentMotion = motion || fallbackMotion;
  return jsx("div", {
    style: { display: "flex", flexDirection: "column", gap: "12px", marginTop: "0px" },
    children: list.map((contact, index) =>
      jsx(
        ContactItem,
        {
          label: contact.label,
          name: contact.name,
          phone: contact.phone,
          onCall,
          onSMS,
          showBorder: index < list.length - 1,
          callIcon,
          smsIcon,
          motion: currentMotion,
        },
        `${contact?.name ?? "?"}-${contact?.phone ?? "?"}-${index}`
      )
    ),
  });
}

function ContactItem({ label, name, phone, onCall, onSMS, showBorder = true, callIcon, smsIcon, motion }) {
  if (!name || !phone) return null;
  const currentMotion = motion || fallbackMotion;
  const callImage = callIcon || DEFAULT_CALL_ICON_URL;
  const smsImage  = smsIcon  || DEFAULT_SMS_ICON_URL;

  return jsxs("div", {
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
      jsxs("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          height: "100%",
          gap: 0,
        },
        children: [
          jsx("div", {
            style: {
              fontSize: "14px",
              fontFamily: "Pretendard SemiBold",
              color: "#707070",
              marginBottom: 0,
              lineHeight: 1.4,
            },
            children: label,
          }),
          jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: 0,
            },
            children: [
              jsx("div", {
                style: {
                  fontSize: "16px",
                  fontFamily: "Pretendard SemiBold",
                  color: "#1F2937",
                  lineHeight: 1.4,
                },
                children: name,
              }),
              jsx("div", {
                style: {
                  fontSize: "16px",
                  fontFamily: "Pretendard Regular",
                  color: "#000000",
                  lineHeight: 1,
                },
                children: phone,
              }),
            ],
          }),
        ],
      }),
      jsxs("div", {
        style: {
          display: "flex",
          flexDirection: "row",
          gap: "12px",
          alignItems: "center",
          height: "100%",
          marginBottom: "4px",
          opacity: "50%",
        },
        children: [
          jsx(currentMotion.button, {
            onClick: () => onCall && onCall(phone),
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
            children: jsx("img", {
              src: callImage,
              alt: "통화",
              style: { width: "18px", height: "18px", objectFit: "contain" },
            }),
          }),
          jsx(currentMotion.button, {
            onClick: () => onSMS && onSMS(phone),
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
            children: jsx("img", {
              src: smsImage,
              alt: "문자",
              style: { width: "18px", height: "18px", objectFit: "contain" },
            }),
          }),
        ],
      }),
    ],
  });
}

// === Fallback helpers =======================================================
function FadeBox({ children, duration = 0.3, delay = 0, style = {} }) {
  const R = __getReactNS();
  if (!R || !R.useState || !R.useEffect) {
    // No React yet: render immediately without animation
    return jsx('div', { style, children });
  }
  const [visible, setVisible] = R.useState(false);
  R.useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const s = {
    opacity: visible ? 1 : 0,
    transition: `opacity ${duration}s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s`,
    ...style,
  };
  return jsx('div', { style: s, children });
}

// === Height auto-transition (animates height changes with easing) ==========
function HeightTransition({ children, duration = 0.3, easing = 'cubic-bezier(0.4, 0, 0.2, 1)', style = {} }) {
  const R = __getReactNS();
  if (!R) return jsx('div', { style, children });
  const outerRef = R.useRef(null);
  const innerRef = R.useRef(null);
  const mountedRef = R.useRef(false);

  const measure = () => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const nextH = inner.offsetHeight; // use offsetHeight (layout) for reliability
    // Force a reflow if transitioning from 'auto'
    // Ensure transition is applied only after first paint
    outer.style.height = nextH + 'px';
  };

  R.useLayoutEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    // set initial height immediately to avoid jump
    measure();
    mountedRef.current = true;
  }, []);

  R.useEffect(() => {
    if (!mountedRef.current) return;
    measure();
  });

  R.useEffect(() => {
    const inner = innerRef.current;
    if (!inner || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  const outerStyle = {
    overflow: 'hidden',
    willChange: 'height',
    transition: `height ${duration}s ${easing}`,
    ...style,
  };

  return jsx('div', { ref: (n) => (outerRef.current = n), style: outerStyle, children: jsx('div', { ref: (n) => (innerRef.current = n), children }) });
}

// === 메인 컴포넌트 ============================================================
function ContactComplete(props) {
  const {
    pageId = "demo",
    style = {},
    __motion,
    __AnimatePresence,
    __MotionConfig,
  } = props || {};

  // Resolve React at runtime, and hooks from local React
  const g = (typeof globalThis !== 'undefined' && globalThis) || (typeof window !== 'undefined' ? window : {});
  const ReactLocal = (g.React || (g.Framer && g.Framer.React)) || null;
  if (!ReactLocal) return null;
  const { useState: useStateR, useEffect: useEffectR, useMemo: useMemoR, useCallback: useCallbackR } = ReactLocal;

  useEffectR(() => {
    try {
      typography && typeof typography.ensure === "function" && typography.ensure();
    } catch (_) {}
  }, []);

  const { motion, AnimatePresence, MotionConfig: MotionConfigComponent, useMotionFallback } = useMemoR(
    () => resolveMotionEnv({
      motion: __motion,
      AnimatePresence: __AnimatePresence,
      MotionConfig: __MotionConfig,
    }),
    [__motion, __AnimatePresence, __MotionConfig]
  );

  const [viewState, setViewState]   = useStateR("selection"); // "selection" | "groom" | "bride"
  const [contactInfo, setContactInfo] = useStateR(null);
  const [error, setError]           = useStateR(null);
  const [isLoading, setIsLoading]   = useStateR(true);

  const fetchContactInfo = useCallbackR(async () => {
    if (!pageId) { setIsLoading(false); return; }
    setError(null);
    const cacheKey = `contact_${pageId}`;
    const cached = contactCache.get(cacheKey);
    if (!cached || Date.now() - cached.timestamp >= CACHE_DURATION) setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 8000);
      const url = `${PROXY_BASE_URL}/api/contacts?pageId=${pageId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
      if (err && err.name === "AbortError") setError("연결 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.");
      else setError((err && err.message) || "연락처 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  useEffectR(() => {
    if (!pageId) { setIsLoading(false); return; }
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
  }, [pageId, fetchContactInfo]);

  const processedContacts = useMemoR(() => {
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

  const goBack = () => setViewState("selection");
  const showGroomContacts = () => setViewState("groom");
  const showBrideContacts = () => setViewState("bride");

  const makeCall = useCallbackR((phone) => {
    const clean = (phone || "").replace(/\D/g, "");
    if (typeof window !== "undefined") window.open(`tel:${clean}`, "_self");
  }, []);

  const sendSMS = useCallbackR((phone) => {
    const clean = (phone || "").replace(/\D/g, "");
    if (typeof window !== "undefined") window.open(`sms:${clean}`, "_self");
  }, []);

  const retry = useCallbackR(() => {
    contactCache.delete(`contact_${pageId}`);
    fetchContactInfo();
  }, [pageId, fetchContactInfo]);

  return jsx(MotionConfigComponent, {
    transition: { type: "tween", duration: 0.3, ease: "easeInOut" },
    children: jsx(Fragment, {
      children: jsx(AnimatePresence, {
        children: jsxs(motion.div, {
          layout: true,
          transition: { layout: { type: "tween", ease: "easeInOut", duration: 0.1 } },
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
            ...(useMotionFallback ? { transition: 'transform 0.1s ease-out, height 0.1s ease-out' } : {}),
          },
          children: [
            jsx("div", {
              style: {
                margin: "-20px -20px 20px -20px",
                backgroundColor: "#121212",
                borderRadius: "0px 0px 0 0",
                paddingTop: "20px",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              },
              children: jsx("h2", {
                style: {
                  fontSize: "14px",
                  fontFamily: "Pretendard SemiBold",
                  color: "#FFFFFF",
                  margin: 0,
                  flex: 1,
                  textAlign: "center",
                },
                children: "축하 연락하기",
              }),
            }),
            isLoading
              ? (useMotionFallback
                  ? jsx(FadeBox, { duration: 0.2, style: { textAlign: 'center', padding: '40px', color: '#6B7280' }, children: jsx('div', { style: { fontSize: '12px' }, children: '연락처 불러오는 중' }) })
                  : jsx(motion.div, {
                      initial: { opacity: 0 },
                      animate: { opacity: 1 },
                      exit: { opacity: 0 },
                      transition: { duration: 0.2 },
                      style: { textAlign: 'center', padding: '40px', color: '#6B7280' },
                      children: jsx('div', { style: { fontSize: '12px' }, children: '연락처 불러오는 중' }),
                    })
                )
              : null,
            !isLoading && error
              ? jsxs("div", {
                  style: { textAlign: "center", padding: "40px", color: "#EF4444" },
                  children: [
                    jsx("div", { style: { marginBottom: "15px" }, children: "⚠️" }),
                    jsx("div", { style: { marginBottom: "20px", fontSize: "14px" }, children: error }),
                    jsx(motion.button, {
                      onClick: retry,
                      style: {
                        backgroundColor: "#EF4444",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        padding: "10px 20px",
                        cursor: "pointer",
                        fontSize: "14px",
                      },
                      whileHover: { scale: 1.05 },
                      whileTap: { scale: 0.95 },
                      children: "다시 시도",
                    }),
                  ],
                })
              : null,
            contactInfo && !error
              ? jsx(HeightTransition, {
                  duration: 0.3,
                  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  children:
                    viewState === 'selection'
                      ? (useMotionFallback
                          ? jsxs('div', {
                              style: { display: 'flex', justifyContent: 'center', gap: '30px', alignItems: 'center', margin: '0px 0' },
                              children: [
                                jsx(motion.button, {
                                  layout: false,
                                  onClick: showGroomContacts,
                                  style: {
                                    width: '90px', height: '90px', backgroundColor: '#EDEDED', border: 'none', borderRadius: '50%', fontSize: '16px', fontFamily: 'Pretendard SemiBold', color: '#1F2937', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, aspectRatio: '1 / 1', justifyContent: 'center',
                                  },
                                  whileHover: { scale: 1.05 },
                                  whileTap: { scale: 0.95 },
                                  children: '신랑측',
                                }),
                                jsx(motion.button, {
                                  layout: false,
                                  onClick: showBrideContacts,
                                  style: {
                                    width: '90px', height: '90px', backgroundColor: '#EDEDED', border: 'none', borderRadius: '50%', fontSize: '16px', fontFamily: 'Pretendard SemiBold', color: '#1F2937', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, aspectRatio: '1 / 1', justifyContent: 'center',
                                  },
                                  whileHover: { scale: 1.05 },
                                  whileTap: { scale: 0.95 },
                                  children: '신부측',
                                })
                              ]
                            })
                          : jsxs(motion.div, {
                              initial: { opacity: 0 },
                              animate: { opacity: 1 },
                              exit: { opacity: 0 },
                              transition: { duration: 0.3 },
                              style: { display: 'flex', justifyContent: 'center', gap: '30px', alignItems: 'center', margin: '0px 0' },
                              children: [
                                jsx(motion.button, { layout: false, onClick: showGroomContacts, style: { width: '90px', height: '90px', backgroundColor: '#EDEDED', border: 'none', borderRadius: '50%', fontSize: '16px', fontFamily: 'Pretendard SemiBold', color: '#1F2937', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, aspectRatio: '1 / 1', justifyContent: 'center' }, whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: '신랑측' }),
                                jsx(motion.button, { layout: false, onClick: showBrideContacts, style: { width: '90px', height: '90px', backgroundColor: '#EDEDED', border: 'none', borderRadius: '50%', fontSize: '16px', fontFamily: 'Pretendard SemiBold', color: '#1F2937', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, aspectRatio: '1 / 1', justifyContent: 'center' }, whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: '신부측' })
                              ]
                            })
                        )
                      : viewState === 'groom'
                      ? (useMotionFallback
                          ? jsxs('div', {
                              style: { display: 'flex', flexDirection: 'column', height: '100%' },
                              children: [
                                jsx('div', { style: { flex: 1 }, children: jsx(ContactList, { contacts: processedContacts.groom, onCall: makeCall, onSMS: sendSMS, callIcon: DEFAULT_CALL_ICON_URL, smsIcon: DEFAULT_SMS_ICON_URL, motion }) }),
                                jsx('div', { style: { height: '0px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '12px', marginBottom: '12px', cursor: 'pointer' }, onClick: goBack, children: jsx('span', { style: { fontFamily: 'Pretendard Regular', fontSize: '14px', color: '#8c8c8c' }, children: '뒤로가기' }) })
                              ]
                            })
                          : jsxs(motion.div, {
                              initial: { opacity: 0 },
                              animate: { opacity: 1 },
                              exit: { opacity: 0 },
                              transition: { duration: 0.3 },
                              style: { display: 'flex', flexDirection: 'column', height: '100%' },
                              children: [
                                jsx('div', { style: { flex: 1 }, children: jsx(ContactList, { contacts: processedContacts.groom, onCall: makeCall, onSMS: sendSMS, callIcon: DEFAULT_CALL_ICON_URL, smsIcon: DEFAULT_SMS_ICON_URL, motion }) }),
                                jsx('div', { style: { height: '0px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '12px', marginBottom: '12px', cursor: 'pointer' }, onClick: goBack, children: jsx('span', { style: { fontFamily: 'Pretendard Regular', fontSize: '14px', color: '#8c8c8c' }, children: '뒤로가기' }) })
                              ]
                            })
                        )
                      : viewState === 'bride'
                      ? (useMotionFallback
                          ? jsxs('div', {
                              style: { display: 'flex', flexDirection: 'column', height: '100%' },
                              children: [
                                jsx('div', { style: { flex: 1 }, children: jsx(ContactList, { contacts: processedContacts.bride, onCall: makeCall, onSMS: sendSMS, callIcon: DEFAULT_CALL_ICON_URL, smsIcon: DEFAULT_SMS_ICON_URL, motion }) }),
                                jsx('div', { style: { height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '12px', cursor: 'pointer' }, onClick: goBack, children: jsx('span', { style: { fontFamily: 'Pretendard Regular', lineHeight: 1.4, fontSize: '14px', color: '#8c8c8c' }, children: '뒤로가기' }) })
                              ]
                            })
                          : jsxs(motion.div, {
                              initial: { opacity: 0 },
                              animate: { opacity: 1 },
                              exit: { opacity: 0 },
                              transition: { duration: 0.3 },
                              style: { display: 'flex', flexDirection: 'column', height: '100%' },
                              children: [
                                jsx('div', { style: { flex: 1 }, children: jsx(ContactList, { contacts: processedContacts.bride, onCall: makeCall, onSMS: sendSMS, callIcon: DEFAULT_CALL_ICON_URL, smsIcon: DEFAULT_SMS_ICON_URL, motion }) }),
                                jsx('div', { style: { height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '12px', cursor: 'pointer' }, onClick: goBack, children: jsx('span', { style: { fontFamily: 'Pretendard Regular', lineHeight: 1.4, fontSize: '14px', color: '#8c8c8c' }, children: '뒤로가기' }) })
                              ]
                            })
                        )
                      : null
                })
              : null,
          ],
        }),
      }),
    }),
  });
}

ContactComplete.displayName = "ContactComplete";
export default ContactComplete;