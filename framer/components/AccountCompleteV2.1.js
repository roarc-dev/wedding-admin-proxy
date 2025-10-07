// v0.0.6
// AccountComplete.js – Account.tsx 기능을 React.createElement 기반 JS로 변환
// - 브라우저 ESM
// - JSX/TS 미사용 (createElement)
// - Framer/React 전역 런타임에서 동작
// - typography.js를 통해 폰트 로딩 보장
// - 브라우저에서 CSS transition 폴백으로 애니메이션 구현

import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=73ec350103c71ae8190673accafe44f1";

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app";

async function getAccountInfoByPageId(pageId) {
  const response = await fetch(`${PROXY_BASE_URL}/api/contacts?action=getByPageId&pageId=${encodeURIComponent(pageId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const result = await response.json();
  if (result && result.success) {
    return result.data;
  }
  throw new Error((result && result.error) || "계좌 정보를 가져올 수 없습니다");
}

function AccountComplete(props) {
  const { pageId = "default", style } = props || {};

  // 런타임 환경에서만 React/Framer를 참조하도록 지연 해결 (Framer 최적화 단계에서 오류 방지)
  const g = (typeof globalThis !== "undefined" && globalThis) || (typeof window !== "undefined" ? window : {});
  const ReactLocal = (g && (g.React || (g.Framer && g.Framer.React))) || null;
  if (!ReactLocal) {
    return null;
  }
  const React = ReactLocal;
  const { useState, useEffect, useRef } = ReactLocal;

  // framer-motion 환경 감지
  const framerNS = (g && g.Framer) || {};
  let motion = null;
  let AnimatePresence = null;

  if (framerNS && framerNS.motion) {
    motion = framerNS.motion;
    AnimatePresence = framerNS.AnimatePresence;
  } else if (g.motion) {
    motion = g.motion;
    AnimatePresence = g.AnimatePresence;
  }

  // motion이 없으면 CSS transition을 사용하는 폴백 컴포넌트 생성
  const useMotionFallback = !motion || !motion.div;

  if (useMotionFallback) {
    // CSS transition을 사용하는 폴백
    const factory = (tag) => React.forwardRef((props, ref) => {
      const { animate, initial, exit, transition, whileInView, viewport, ...cleanProps } = props || {};
      
      // 인라인 스타일에 transition 추가
      const enhancedStyle = {
        ...cleanProps.style,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      };

      return React.createElement(tag, { ...cleanProps, ref, style: enhancedStyle }, props && props.children);
    });

    motion = { 
      div: factory("div"), 
      button: factory("button"), 
      svg: factory("svg") 
    };
    AnimatePresence = (props) => React.createElement(React.Fragment, null, props.children);
  }

  const [groomViewState, setGroomViewState] = useState("closed");
  const [brideViewState, setBrideViewState] = useState("closed");
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [showCopyMessage, setShowCopyMessage] = useState(false);

  // 스크롤 애니메이션을 위한 visibility 상태
  const [titleVisible, setTitleVisible] = useState(false);
  const [accountsVisible, setAccountsVisible] = useState(false);
  const [brideVisible, setBrideVisible] = useState(false);

  const titleRef = useRef(null);
  const accountsRef = useRef(null);
  const brideRef = useRef(null);

  // 폰트 로딩 보장
  useEffect(() => {
    try { typography && typeof typography.ensure === "function" && typography.ensure(); } catch (_) {}
  }, []);

  // IntersectionObserver를 사용한 스크롤 애니메이션 (폴백용)
  useEffect(() => {
    if (!useMotionFallback) return;

    const observerOptions = {
      threshold: 0.3,
      rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target === titleRef.current) {
            setTimeout(() => setTitleVisible(true), 0);
          } else if (entry.target === accountsRef.current) {
            setTimeout(() => setAccountsVisible(true), 150);
          } else if (entry.target === brideRef.current) {
            setTimeout(() => setBrideVisible(true), 300);
          }
        }
      });
    }, observerOptions);

    if (titleRef.current) observer.observe(titleRef.current);
    if (accountsRef.current) observer.observe(accountsRef.current);
    if (brideRef.current) observer.observe(brideRef.current);

    return () => observer.disconnect();
  }, [useMotionFallback, accountInfo]);

  // 계좌 정보 로드
  const loadAccountInfo = async () => {
    try {
      setLoading(true); setError("");
      const data = await getAccountInfoByPageId(pageId);
      if (data && data.length > 0) {
        setAccountInfo(data[0]);
      } else {
        setError("계좌 정보가 없습니다");
      }
    } catch (e) {
      setError((e && e.message) || "알 수 없는 오류가 발생했습니다");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAccountInfo(); }, [pageId]);

  // 복사
  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(type);
      setShowCopyMessage(true);
      setTimeout(() => setShowCopyMessage(false), 2000);
    } catch (_) {
      setCopyMessage("복사에 실패했습니다");
      setShowCopyMessage(true);
      setTimeout(() => setShowCopyMessage(false), 2000);
    }
  };

  const copyTriple = (bank, account, name) => {
    if (!bank || !account || !name) return;
    copyToClipboard(`${bank} ${account} ${name}`, "복사되었습니다");
  };

  // 공통 텍스트 스타일
  const titleText = React.createElement("div", {
    style: {
      width: "100%",
      height: 20,
      fontFamily: "Pretendard SemiBold",
      fontSize: 22,
      lineHeight: "0.7em",
      color: "#000000",
      textAlign: "center",
    }
  }, "마음 전하는 곳");

  const subText = React.createElement("div", {
    style: {
      width: "100%",
      fontFamily: "Pretendard Regular",
      fontSize: 15,
      lineHeight: "1.8em",
      color: "#8c8c8c",
      textAlign: "center",
      whiteSpace: "pre-wrap",
    }
  }, "참석이 어려우신 분들을 위해 기재했습니다.\n너그러운 마음으로 양해 부탁드립니다.");

  // 로딩/에러/없음 상태
  if (loading || error || !accountInfo) {
    const message = loading ? "로딩 중..." : (error || "계좌 정보 없음");
    return React.createElement("div", { style: { marginTop: 80, marginBottom: 80, display: "flex", justifyContent: "center" } },
      React.createElement("div", { style: { width: "100%", maxWidth: 378, height: 54, background: "#EBEBEB", display: "flex", justifyContent: "center", alignItems: "center", ...(style || {}) } },
        React.createElement("div", { style: { color: "black", fontSize: 14, fontFamily: "Pretendard SemiBold" } }, message)
      )
    );
  }

  // 버튼 컴포넌트들
  const AccountItem = ({ label, name, account, bank, onCopy, isLast }) => React.createElement("div", {
    style: {
      alignSelf: "stretch",
      height: 54,
      paddingBottom: 15,
      borderBottom: isLast ? "none" : "1px #F5F5F5 solid",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "flex-start",
      gap: 5,
      display: "flex",
    }
  },
    React.createElement("div", { style: { color: "#707070", fontSize: 14, fontFamily: "Pretendard SemiBold", wordWrap: "break-word" } }, label),
    React.createElement("div", { style: { alignSelf: "stretch", justifyContent: "space-between", alignItems: "flex-start", display: "inline-flex" } },
      React.createElement("div", { style: { justifyContent: "flex-start", alignItems: "center", gap: 5, display: "flex" } },
        React.createElement("div", { style: { color: "black", fontSize: 14, fontFamily: "Pretendard SemiBold", wordWrap: "break-word" } }, name),
        React.createElement("div", { style: { color: "black", fontSize: 14, fontFamily: "Pretendard Regular", wordWrap: "break-word" } }, account),
        React.createElement("div", { style: { color: "black", fontSize: 14, fontFamily: "Pretendard Regular", wordWrap: "break-word" } }, bank)
      ),
      React.createElement("div", { style: { justifyContent: "flex-start", alignItems: "center", gap: 5, display: "flex", cursor: "pointer" }, onClick: onCopy },
        React.createElement("svg", { width: 12, height: 14, viewBox: "0 0 12 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
          React.createElement("rect", { x: 1, y: 1, width: 7.35989, height: 9.41763, stroke: "#7F7F7F" }),
          React.createElement("path", { d: "M3.7998 13.0001H10.9997V3.73438", stroke: "#7F7F7F" })
        ),
        React.createElement("div", { style: { color: "#8C8C8C", fontSize: 14, fontFamily: "Pretendard Regular", wordWrap: "break-word" } }, "복사")
      )
    )
  );

  const ExpandSection = ({ title, accounts }) => {
    const isOpen = accounts.open === true;
    const [rotation, setRotation] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);
    const [currentHeight, setCurrentHeight] = useState(54);
    const contentRef = useRef(null);

    useEffect(() => {
      setRotation(isOpen ? 180 : 0);
    }, [isOpen]);

    // 컨텐츠 높이 측정 (초기 마운트 시)
    useEffect(() => {
      if (contentRef.current) {
        const measured = contentRef.current.scrollHeight;
        setContentHeight(measured);
      }
    }, [accountInfo]);

    // 높이 애니메이션을 위한 상태 업데이트
    useEffect(() => {
      if (isOpen) {
        // 열릴 때: 현재 높이를 54로 설정 후, 다음 프레임에 전체 높이로 변경
        setCurrentHeight(54);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setCurrentHeight(54 + contentHeight);
          });
        });
      } else {
        // 닫힐 때: 현재 높이를 전체 높이로 설정 후, 다음 프레임에 54로 변경
        setCurrentHeight(54 + contentHeight);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setCurrentHeight(54);
          });
        });
      }
    }, [isOpen, contentHeight]);

    const header = React.createElement("div", {
      style: { 
        alignSelf: "stretch", 
        height: 54, 
        minHeight: 54, 
        maxHeight: 54, 
        background: "#EBEBEB", 
        justifyContent: "center", 
        alignItems: "center", 
        gap: 10, 
        display: "inline-flex", 
        cursor: "pointer", 
        flexShrink: 0 
      },
      onClick: accounts.onToggle
    },
      React.createElement("div", { 
        style: { 
          color: "black", 
          fontSize: 14, 
          fontFamily: "Pretendard SemiBold", 
          wordWrap: "break-word" 
        } 
      }, title),
      React.createElement("svg", { 
        width: 15, 
        height: 8, 
        viewBox: "0 0 15 8", 
        fill: "none", 
        xmlns: "http://www.w3.org/2000/svg",
        style: {
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: "center"
        }
      },
        React.createElement("g", { id: "Group 2117912660" },
          React.createElement("path", { 
            id: "Vector 1121", 
            d: "M1.5 1L7.5 6.5L13.5 1", 
            stroke: "black", 
            strokeWidth: 1.5 
          })
        )
      )
    );

    const list = React.createElement("div", {
      ref: contentRef,
      style: { 
        alignSelf: "stretch", 
        padding: "15px 15px 0px 15px", 
        flexDirection: "column", 
        justifyContent: "flex-start", 
        alignItems: "flex-start", 
        gap: 10, 
        display: "flex", 
        boxSizing: "border-box",
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }, accounts.items());

    return React.createElement("div", {
      style: { 
        width: "100%", 
        maxWidth: 378, 
        background: "white", 
        overflow: "hidden", 
        flexDirection: "column", 
        justifyContent: "flex-start", 
        alignItems: "center", 
        display: "inline-flex", 
        boxSizing: "border-box",
        height: currentHeight,
        transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }, header, list);
  };

  const groomSection = React.createElement(ExpandSection, {
    title: "신랑측 계좌번호",
    accounts: {
      open: groomViewState === "open",
      onToggle: () => setGroomViewState(groomViewState === "closed" ? "open" : "closed"),
      items: () => {
        const list = [];
        if (accountInfo.groom_name && accountInfo.groom_account && accountInfo.groom_bank) {
          list.push(React.createElement(AccountItem, { key: "groom", label: "신랑", name: accountInfo.groom_name, account: accountInfo.groom_account, bank: accountInfo.groom_bank, onCopy: () => copyTriple(accountInfo.groom_bank, accountInfo.groom_account, accountInfo.groom_name), isLast: false }));
        }
        if (accountInfo.groom_father_name && accountInfo.groom_father_account && accountInfo.groom_father_bank) {
          list.push(React.createElement(AccountItem, { key: "groom_father", label: "혼주", name: accountInfo.groom_father_name, account: accountInfo.groom_father_account, bank: accountInfo.groom_father_bank, onCopy: () => copyTriple(accountInfo.groom_father_bank, accountInfo.groom_father_account, accountInfo.groom_father_name), isLast: false }));
        }
        if (accountInfo.groom_mother_name && accountInfo.groom_mother_account && accountInfo.groom_mother_bank) {
          list.push(React.createElement(AccountItem, { key: "groom_mother", label: "혼주", name: accountInfo.groom_mother_name, account: accountInfo.groom_mother_account, bank: accountInfo.groom_mother_bank, onCopy: () => copyTriple(accountInfo.groom_mother_bank, accountInfo.groom_mother_account, accountInfo.groom_mother_name), isLast: true }));
        }
        return list;
      }
    }
  });

  const brideSection = React.createElement(ExpandSection, {
    title: "신부측 계좌번호",
    accounts: {
      open: brideViewState === "open",
      onToggle: () => setBrideViewState(brideViewState === "closed" ? "open" : "closed"),
      items: () => {
        const list = [];
        if (accountInfo.bride_name && accountInfo.bride_account && accountInfo.bride_bank) {
          list.push(React.createElement(AccountItem, { key: "bride", label: "신부", name: accountInfo.bride_name, account: accountInfo.bride_account, bank: accountInfo.bride_bank, onCopy: () => copyTriple(accountInfo.bride_bank, accountInfo.bride_account, accountInfo.bride_name), isLast: false }));
        }
        if (accountInfo.bride_father_name && accountInfo.bride_father_account && accountInfo.bride_father_bank) {
          list.push(React.createElement(AccountItem, { key: "bride_father", label: "혼주", name: accountInfo.bride_father_name, account: accountInfo.bride_father_account, bank: accountInfo.bride_father_bank, onCopy: () => copyTriple(accountInfo.bride_father_bank, accountInfo.bride_father_account, accountInfo.bride_father_name), isLast: false }));
        }
        if (accountInfo.bride_mother_name && accountInfo.bride_mother_account && accountInfo.bride_mother_bank) {
          list.push(React.createElement(AccountItem, { key: "bride_mother", label: "혼주", name: accountInfo.bride_mother_name, account: accountInfo.bride_mother_account, bank: accountInfo.bride_mother_bank, onCopy: () => copyTriple(accountInfo.bride_mother_bank, accountInfo.bride_mother_account, accountInfo.bride_mother_name), isLast: true }));
        }
        return list;
      }
    }
  });

  // 복사 토스트
  const toast = showCopyMessage ? React.createElement("div", {
    style: { 
      position: "absolute", 
      top: "50%", 
      left: "25%", 
      transform: "translate(-50%, -50%)", 
      width: "80%", 
      maxWidth: 200, 
      height: 40, 
      background: "#FFFFFF", 
      borderRadius: 5, 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)", 
      zIndex: 1000, 
      pointerEvents: "none",
      opacity: showCopyMessage ? 1 : 0,
      scale: showCopyMessage ? 1 : 0.8,
      transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }, React.createElement("div", { 
    style: { 
      color: "#000000", 
      fontSize: 14, 
      fontFamily: "Pretendard Regular", 
      textAlign: "center" 
    } 
  }, copyMessage)) : null;

  // 스크롤 애니메이션용 스타일 (폴백용)
  const getScrollAnimStyle = (isVisible) => useMotionFallback ? {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
    transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
  } : {};

  return React.createElement("div", { style: { marginTop: 80, marginBottom: 80, display: "flex", justifyContent: "center" } },
    React.createElement("div", { style: { width: "100%", display: "flex", flexDirection: "column", gap: 10, ...(style || {}) } },
      // 안내 텍스트 박스
      React.createElement(useMotionFallback ? "div" : motion.div, { 
        ref: titleRef,
        style: { 
          width: "100%", 
          paddingBottom: 30, 
          display: "flex", 
          flexDirection: "column", 
          gap: 20, 
          boxSizing: "border-box", 
          alignItems: "center",
          ...getScrollAnimStyle(titleVisible)
        }, 
        ...(useMotionFallback ? {} : {
          initial: { opacity: 0, y: 16 },
          whileInView: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0 },
          viewport: { once: true, amount: 0.3 }
        })
      }, titleText, subText),

      // 계좌 버튼 컨테이너 88%
      React.createElement(useMotionFallback ? "div" : motion.div, { 
        ref: accountsRef,
        style: { 
          width: "88%", 
          display: "flex", 
          flexDirection: "column", 
          gap: 10, 
          alignSelf: "center",
          ...getScrollAnimStyle(accountsVisible)
        }, 
        ...(useMotionFallback ? {} : {
          initial: { opacity: 0, y: 16 },
          whileInView: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.15 },
          viewport: { once: true, amount: 0.3 }
        })
      },
        groomSection,
        React.createElement(useMotionFallback ? "div" : motion.div, {
          ref: brideRef,
          style: getScrollAnimStyle(brideVisible),
          ...(useMotionFallback ? {} : {
            initial: { opacity: 0, y: 16 },
            whileInView: { opacity: 1, y: 0 },
            transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.3 },
            viewport: { once: true, amount: 0.3 }
          })
        }, brideSection)
      ),

      toast
    )
  );
}

AccountComplete.displayName = "AccountComplete";
export default AccountComplete;