// AccountComplete.js — Framer용 계좌 안내 컴포넌트 (브라우저 ESM)
// - JSX Runtime 사용 (reference.js 패턴)
// - React 훅 직접 import
// - motion 환경 주입/전역/폴백 순서 유지

import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import typography from "https://cdn.roarc.kr/fonts/typography.js?v=73ec350103c71ae8190673accafe44f1";

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

const renderFragment = (...children) =>
  createElement(Fragment, null, ...children);

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

  const AnimatePresence =
    injected.AnimatePresence || framerNS.AnimatePresence || fallbackAnimatePresence;

  const MotionConfigComponent =
    injected.MotionConfig || framerNS.MotionConfig || fallbackMotionConfig;

  return {
    motion: { div: motionDiv, button: motionButton, svg: motionSvg },
    AnimatePresence,
    MotionConfig: MotionConfigComponent,
  };
};

// === 데이터 로더 ==============================================================
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app";

async function getAccountInfoByPageId(pageId) {
  const response = await fetch(
    `${PROXY_BASE_URL}/api/contacts?action=getByPageId&pageId=${encodeURIComponent(pageId)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const result = await response.json();
  if (result && result.success) {
    return result.data;
  }
  throw new Error((result && result.error) || "계좌 정보를 가져올 수 없습니다");
}

// === 컴포넌트 =================================================================
function AccountComplete(props = {}) {
  const { pageId = "default", style, __motion, __AnimatePresence, __MotionConfig } =
    props || {};

  const { motion, AnimatePresence, MotionConfig: MotionConfigComponent } = useMemo(
    () =>
      resolveMotionEnv({
        motion: __motion,
        AnimatePresence: __AnimatePresence,
        MotionConfig: __MotionConfig,
      }),
    [__motion, __AnimatePresence, __MotionConfig]
  );

  useEffect(() => {
    try {
      typography &&
        typeof typography.ensure === "function" &&
        typography.ensure();
    } catch (_) {}
  }, []);

  const [groomViewState, setGroomViewState] = useState("closed");
  const [brideViewState, setBrideViewState] = useState("closed");
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [showCopyMessage, setShowCopyMessage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getAccountInfoByPageId(pageId);
        if (!cancelled) {
          if (data && data.length > 0) {
            setAccountInfo(data[0]);
          } else {
            setError("계좌 정보가 없습니다");
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError((e && e.message) || "알 수 없는 오류가 발생했습니다");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  const copyToClipboard = async (text, type) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyMessage("복사에 실패했습니다");
      setShowCopyMessage(true);
      setTimeout(() => setShowCopyMessage(false), 2000);
      return;
    }
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

  const titleText = jsx("div", {
    style: {
      width: "100%",
      height: 20,
      fontFamily: "Pretendard SemiBold",
      fontSize: 22,
      lineHeight: "0.7em",
      color: "#000000",
      textAlign: "center",
    },
    children: "마음 전하는 곳",
  });

  const subText = jsx("div", {
    style: {
      width: "100%",
      fontFamily: "Pretendard Regular",
      fontSize: 15,
      lineHeight: "1.8em",
      color: "#8c8c8c",
      textAlign: "center",
      whiteSpace: "pre-wrap",
    },
    children: "참석이 어려우신 분들을 위해 기재했습니다.\n너그러운 마음으로 양해 부탁드립니다.",
  });

  if (loading || error || !accountInfo) {
    const message = loading ? "로딩 중..." : error || "계좌 정보 없음";
    return createElement(
      "div",
      { style: { marginTop: 80, marginBottom: 80, display: "flex", justifyContent: "center" } },
      createElement(
        "div",
        {
          style: {
            width: "100%",
            maxWidth: 378,
            height: 54,
            background: "#EBEBEB",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            ...(style || {}),
          },
        },
        createElement(
          "div",
          { style: { color: "black", fontSize: 14, fontFamily: "Pretendard SemiBold" } },
          message
        )
      )
    );
  }

  const AccountItem = ({ label, name, account, bank, onCopy, isLast }) =>
    createElement(
      "div",
      {
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
        },
      },
      createElement(
        "div",
        { style: { color: "#707070", fontSize: 14, fontFamily: "Pretendard SemiBold", wordWrap: "break-word" } },
        label
      ),
      createElement(
        "div",
        {
          style: {
            alignSelf: "stretch",
            justifyContent: "space-between",
            alignItems: "flex-start",
            display: "inline-flex",
          },
        },
        createElement(
          "div",
          { style: { justifyContent: "flex-start", alignItems: "center", gap: 5, display: "flex" } },
          createElement(
            "div",
            { style: { color: "black", fontSize: 14, fontFamily: "Pretendard SemiBold", wordWrap: "break-word" } },
            name
          ),
          createElement(
            "div",
            { style: { color: "black", fontSize: 14, fontFamily: "Pretendard Regular", wordWrap: "break-word" } },
            account
          ),
          createElement(
            "div",
            { style: { color: "black", fontSize: 14, fontFamily: "Pretendard Regular", wordWrap: "break-word" } },
            bank
          )
        ),
        createElement(
          "div",
          {
            style: {
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 5,
              display: "flex",
              cursor: "pointer",
            },
            onClick: onCopy,
          },
          createElement(
            "svg",
            { width: 12, height: 14, viewBox: "0 0 12 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
            createElement("rect", { x: 1, y: 1, width: 7.35989, height: 9.41763, stroke: "#7F7F7F" }),
            createElement("path", { d: "M3.7998 13.0001H10.9997V3.73438", stroke: "#7F7F7F" })
          ),
          createElement(
            "div",
            { style: { color: "#8C8C8C", fontSize: 14, fontFamily: "Pretendard Regular", wordWrap: "break-word" } },
            "복사"
          )
        )
      )
    );

  const ExpandSection = ({ title, accounts }) => {
    const isOpen = accounts.open === true;
    const header = createElement(
      "div",
      {
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
          flexShrink: 0,
        },
        onClick: accounts.onToggle,
      },
      createElement(
        "div",
        { style: { color: "black", fontSize: 14, fontFamily: "Pretendard SemiBold", wordWrap: "break-word" } },
        title
      ),
      createElement(
        "div",
        {
          style: {
            width: 12,
            height: 7,
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
          },
        },
        createElement(
          "svg",
          {
            width: 12,
            height: 7,
            viewBox: "0 0 12 7",
            fill: "none",
            xmlns: "http://www.w3.org/2000/svg",
            style: {
              transform: isOpen ? "scaleY(-1)" : "scaleY(1)",
              transition: "transform 0.2s",
            },
          },
          createElement("path", {
            d: "M1 1L6 6L11 1",
            stroke: "black",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round",
          })
        )
      )
    );

    return createElement(
      "div",
      { style: { alignSelf: "stretch", flexDirection: "column", display: "flex" } },
      header,
      isOpen &&
        createElement(
          "div",
          { style: { alignSelf: "stretch", flexDirection: "column", display: "flex" } },
          accounts.items.map((account, index) =>
            createElement(AccountItem, {
              key: account.id || index,
              label: account.label,
              name: account.name,
              account: account.account,
              bank: account.bank,
              onCopy: () => copyTriple(account.bank, account.account, account.name),
              isLast: index === accounts.items.length - 1,
            })
          )
        )
    );
  };

  const groomAccount = accountInfo.groomAccount || {};
  const brideAccount = accountInfo.brideAccount || {};

  const groomItems = [
    {
      id: "groom-father",
      label: accountInfo.groomFatherName || "신랑측 부",
      name: accountInfo.groomFatherName || "신랑측 부",
      account: accountInfo.groomFatherAccount || "",
      bank: accountInfo.groomFatherBank || "",
    },
    {
      id: "groom-mother",
      label: accountInfo.groomMotherName || "신랑측 모",
      name: accountInfo.groomMotherName || "신랑측 모",
      account: accountInfo.groomMotherAccount || "",
      bank: accountInfo.groomMotherBank || "",
    },
  ];

  const brideItems = [
    {
      id: "bride-father",
      label: accountInfo.brideFatherName || "신부측 부",
      name: accountInfo.brideFatherName || "신부측 부",
      account: accountInfo.brideFatherAccount || "",
      bank: accountInfo.brideFatherBank || "",
    },
    {
      id: "bride-mother",
      label: accountInfo.brideMotherName || "신부측 모",
      name: accountInfo.brideMotherName || "신부측 모",
      account: accountInfo.brideMotherAccount || "",
      bank: accountInfo.brideMotherBank || "",
    },
  ];

  const groomAccounts = {
    items: groomItems,
    open: groomViewState === "open",
    onToggle: () => setGroomViewState(groomViewState === "open" ? "closed" : "open"),
  };

  const brideAccounts = {
    items: brideItems,
    open: brideViewState === "open",
    onToggle: () => setBrideViewState(brideViewState === "open" ? "closed" : "open"),
  };

  return createElement(
    "div",
    {
      style: {
        width: "100%",
        height: "fit-content",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        ...(style || {}),
      },
    },
    createElement(
      "div",
      { style: { width: "100%", display: "flex", flexDirection: "column", gap: 8 } },
      titleText,
      subText
    ),
    createElement(ExpandSection, { title: "신랑측", accounts: groomAccounts }),
    createElement(ExpandSection, { title: "신부측", accounts: brideAccounts }),
    showCopyMessage &&
      createElement(
        "div",
        {
          style: {
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "14px",
            zIndex: 9999,
          },
        },
        copyMessage
      )
  );
}

AccountComplete.displayName = "AccountComplete";
export default AccountComplete;
