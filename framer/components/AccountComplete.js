// AccountComplete.nomod.js — Framer TSX를 대체하는 순수 JS 버전
// - React/Framer 전역 의존 (bare import 제거)
// - 경량 JSX runtime shim 포함
// - motion 구성요소는 주입 → 전역 → 폴백 순으로 해결
// - typography.js URL import 유지

// === JSX runtime shim =========================================================
const __ReactNS = (typeof globalThis !== "undefined" && globalThis.React) || {};
const __createEl = __ReactNS.createElement
  ? __ReactNS.createElement.bind(__ReactNS)
  : (type, props, ...children) => ({ type, props: props || {}, children });
const Fragment = __ReactNS.Fragment || "div";
const jsx  = (type, props) => __createEl(type, props ?? null, props?.children);
const jsxs = jsx;

const { useState, useEffect, useMemo } = __ReactNS;

const createElement = (type, props, ...children) => __createEl(type, props ?? null, ...children);

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

// === 데이터 로더 ==============================================================
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

// === 컴포넌트 =================================================================
function AccountComplete(props) {
  const {
    pageId = "default",
    style,
    __motion,
    __AnimatePresence,
    __MotionConfig,
  } = props || {};

  if (typeof useState !== "function" || typeof useEffect !== "function") {
    return null;
  }

  const { motion, AnimatePresence, MotionConfig: MotionConfigComponent } =
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

  useEffect(() => {
    try {
      typography && typeof typography.ensure === "function" && typography.ensure();
    } catch (_) {}
  }, []);

  const [groomViewState, setGroomViewState] = useState("closed"); // "closed" | "open"
  const [brideViewState, setBrideViewState] = useState("closed");
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [showCopyMessage, setShowCopyMessage] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getAccountInfoByPageId(pageId);
        if (data && data.length > 0) {
          setAccountInfo(data[0]);
        } else {
          setError("계좌 정보가 없습니다");
        }
      } catch (e) {
        setError((e && e.message) || "알 수 없는 오류가 발생했습니다");
      } finally {
        setLoading(false);
      }
    })();
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
        motion.svg,
        {
          width: 15,
          height: 8,
          viewBox: "0 0 15 8",
          fill: "none",
          xmlns: "http://www.w3.org/2000/svg",
          animate: { rotate: isOpen ? 180 : 0 },
          transition: { duration: 0, ease: "easeInOut" },
        },
        createElement(
          "g",
          { id: "Group 2117912660" },
          createElement("path", { id: "Vector 1121", d: "M1.5 1L7.5 6.5L13.5 1", stroke: "black", strokeWidth: 1.5 })
        )
      )
    );

    const list = isOpen
      ? createElement(
          motion.div,
          {
            style: {
              alignSelf: "stretch",
              padding: "15px 15px 0px 15px",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              gap: 10,
              display: "flex",
              boxSizing: "border-box",
            },
            initial: { opacity: 0, y: -10 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -10 },
            transition: { duration: 0.2, ease: "easeOut" },
          },
          accounts.items()
        )
      : null;

    return createElement(
      motion.div,
      {
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
        },
        initial: false,
        animate: { height: isOpen ? "auto" : 54 },
        transition: { duration: 0.3, ease: "easeInOut" },
      },
      header,
      createElement(
        AnimatePresence,
        null,
        isOpen
          ? createElement(
              motion.div,
              {
                style: {
                  alignSelf: "stretch",
                  padding: "15px 15px 0px 15px",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  gap: 10,
                  display: "flex",
                  boxSizing: "border-box",
                },
                key: "list",
                initial: { opacity: 0, y: -10 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -10 },
                transition: { duration: 0.2, ease: "easeOut" },
              },
              accounts.items()
            )
          : null
      )
    );
  };

  const groomSection = createElement(ExpandSection, {
    title: "신랑측 계좌번호",
    accounts: {
      open: groomViewState === "open",
      onToggle: () => setGroomViewState(groomViewState === "closed" ? "open" : "closed"),
      items: () => {
        const list = [];
        if (accountInfo.groom_name && accountInfo.groom_account && accountInfo.groom_bank) {
          list.push(
            createElement(AccountItem, {
              key: "groom",
              label: "신랑",
              name: accountInfo.groom_name,
              account: accountInfo.groom_account,
              bank: accountInfo.groom_bank,
              onCopy: () => copyTriple(accountInfo.groom_bank, accountInfo.groom_account, accountInfo.groom_name),
              isLast: false,
            })
          );
        }
        if (accountInfo.groom_father_name && accountInfo.groom_father_account && accountInfo.groom_father_bank) {
          list.push(
            createElement(AccountItem, {
              key: "groom-father",
              label: "혼주",
              name: accountInfo.groom_father_name,
              account: accountInfo.groom_father_account,
              bank: accountInfo.groom_father_bank,
              onCopy: () => copyTriple(accountInfo.groom_father_bank, accountInfo.groom_father_account, accountInfo.groom_father_name),
              isLast: false,
            })
          );
        }
        if (accountInfo.groom_mother_name && accountInfo.groom_mother_account && accountInfo.groom_mother_bank) {
          list.push(
            createElement(AccountItem, {
              key: "groom-mother",
              label: "혼주",
              name: accountInfo.groom_mother_name,
              account: accountInfo.groom_mother_account,
              bank: accountInfo.groom_mother_bank,
              onCopy: () => copyTriple(accountInfo.groom_mother_bank, accountInfo.groom_mother_account, accountInfo.groom_mother_name),
              isLast: true,
            })
          );
        }
        return list;
      },
    },
  });

  const brideSection = createElement(ExpandSection, {
    title: "신부측 계좌번호",
    accounts: {
      open: brideViewState === "open",
      onToggle: () => setBrideViewState(brideViewState === "closed" ? "open" : "closed"),
      items: () => {
        const list = [];
        if (accountInfo.bride_name && accountInfo.bride_account && accountInfo.bride_bank) {
          list.push(
            createElement(AccountItem, {
              key: "bride",
              label: "신부",
              name: accountInfo.bride_name,
              account: accountInfo.bride_account,
              bank: accountInfo.bride_bank,
              onCopy: () => copyTriple(accountInfo.bride_bank, accountInfo.bride_account, accountInfo.bride_name),
              isLast: false,
            })
          );
        }
        if (accountInfo.bride_father_name && accountInfo.bride_father_account && accountInfo.bride_father_bank) {
          list.push(
            createElement(AccountItem, {
              key: "bride-father",
              label: "혼주",
              name: accountInfo.bride_father_name,
              account: accountInfo.bride_father_account,
              bank: accountInfo.bride_father_bank,
              onCopy: () => copyTriple(accountInfo.bride_father_bank, accountInfo.bride_father_account, accountInfo.bride_father_name),
              isLast: false,
            })
          );
        }
        if (accountInfo.bride_mother_name && accountInfo.bride_mother_account && accountInfo.bride_mother_bank) {
          list.push(
            createElement(AccountItem, {
              key: "bride-mother",
              label: "혼주",
              name: accountInfo.bride_mother_name,
              account: accountInfo.bride_mother_account,
              bank: accountInfo.bride_mother_bank,
              onCopy: () => copyTriple(accountInfo.bride_mother_bank, accountInfo.bride_mother_account, accountInfo.bride_mother_name),
              isLast: true,
            })
          );
        }
        return list;
      },
    },
  });

  const toast = createElement(
    AnimatePresence,
    null,
    showCopyMessage
      ? createElement(
          motion.div,
          {
            style: {
              position: "fixed",
              bottom: 60,
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "white",
              padding: "12px 20px",
              borderRadius: 999,
              fontSize: 14,
              fontFamily: "Pretendard SemiBold",
              zIndex: 9999,
            },
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: 20 },
            transition: { duration: 0.2 },
          },
          copyMessage
        )
      : null
  );

  return createElement(
    MotionConfigComponent,
    { transition: { duration: 0.3, ease: "easeInOut" } },
    createElement(
      "div",
      {
        style: {
          marginTop: 80,
          marginBottom: 80,
          display: "flex",
          justifyContent: "center",
        },
      },
      createElement(
        "div",
        {
          style: {
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            ...(style || {}),
          },
        },
        createElement(
          motion.div,
          {
            style: {
              width: "100%",
              paddingBottom: 30,
              display: "flex",
              flexDirection: "column",
              gap: 20,
              boxSizing: "border-box",
              alignItems: "center",
            },
            initial: { opacity: 0, y: 16 },
            whileInView: { opacity: 1, y: 0 },
            transition: { duration: 0.5, ease: "easeOut", delay: 0 },
            viewport: { once: true, amount: 0.3 },
          },
          titleText,
          subText
        ),
        createElement(
          motion.div,
          {
            style: {
              width: "88%",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignSelf: "center",
            },
            initial: { opacity: 0, y: 16 },
            whileInView: { opacity: 1, y: 0 },
            transition: { duration: 0.5, ease: "easeOut", delay: 0.15 },
            viewport: { once: true, amount: 0.3 },
          },
          groomSection,
          createElement(
            motion.div,
            {
              initial: { opacity: 0, y: 16 },
              whileInView: { opacity: 1, y: 0 },
              transition: { duration: 0.5, ease: "easeOut", delay: 0.3 },
              viewport: { once: true, amount: 0.3 },
            },
            brideSection
          )
        ),
        toast
      )
    )
  );
}

AccountComplete.displayName = "AccountComplete";
export default AccountComplete;
