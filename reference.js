import { jsx } from "react/jsx-runtime";
import { addPropertyControls, ControlType } from "framer";
import { useScroll, useMotionValue, useMotionValueEvent, animate, MotionConfig, motion } from "framer-motion";
import { useState, useRef, useMemo, useEffect } from "react";
import "../../../node_modules/@firebase/analytics/dist/esm/index.esm2017.js";
import "../../../node_modules/firebase/app/dist/esm/index.esm.js";
import { useCurrentUser } from "../../../hooks/useCurrentUser.js";
import "../../../node_modules/@29cm/snowplow/dist/esm/core/snowplow.js";
import "../../../node_modules/swr/core/dist/index.js";
import "../../../config/index.js";
import "../../../node_modules/vite-plugin-node-polyfills/shims/buffer/dist/index.js";
import "../../../node_modules/js-cookie/dist/js.cookie.js";
import "../../../apis/preuser/PreuserApiService.js";
import "../../../apis/user-segment/CategoryFirstOrderApiService.js";
import "../../../node_modules/swr/mutation/dist/index.js";
import { useEffectOnce } from "../../../hooks/react/useEffectOnce.js";
import "../../../hooks/stores/content/content.store.js";
import "../../../hooks/stores/dialog/dialog.store.js";
import "../../../hooks/stores/global-layout/global-layout.store.js";
import "../../../hooks/stores/toast/toast.store.js";
import "../../@shared/providers/ThemeProvider/ThemeProvider.js";
import "../../@shared/providers/BreakpointProvider/BreakpointProvider.js";
import "../../../hooks/stores/bottom-sheet/bottom-sheet.store.js";
import "react-dom";
import "../Dialog/Dialog.module.css.js";
import "../../../containers/DialogContainer/DialogContainer.emitter.js";
import "../../../utils/redirectLogin.js";
import "../../../utils/event-properties/source.js";
import { mergeRefs } from "../../../utils/react/mergeRefs.js";
import { ComponentName } from "../../../styles/ComponentName.js";
import { createWithStyle } from "../../../styles/createWithStyle.js";
import { css } from "../../../styles/css.js";
import { typographyCSS } from "../../../styles/typography.js";
import { useTrackClickTabBarContentEvent } from "../TabBar/TabBar.hooks.event.js";
import { useTabBarContext } from "../TabBar/TabBarContext.js";
import { TabBarItem } from "./TabBarItem.js";
import { filterVisibleTabItems, toRGBA } from "./TabBarV2.utils.js";
import { playHaptic } from "../../../utils/playHaptic.js";
import { useTabBarSegments } from "./useTabBarSegments.js";
import useMeasure from "../../../node_modules/react-use/esm/useMeasure.js";
const {
  classNames,
  withStyle
} = createWithStyle(ComponentName.TabBar, {
  wrapper: css`
    & {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `,
  container: css`
    & {
      ${typographyCSS(14, 700, 1.3)}
      letter-spacing: 0.02;
      position: relative;
      display: flex;
      gap: 10px;
      height: 50px;
      width: 100%;
      overflow: auto;

      /* Hide scrollbar for IE, Edge and Firefox */
      -ms-overflow-style: none;
      scrollbar-width: none;

      @media (min-width: 540px) {
        ${typographyCSS(16, 700, 1.4)}
      }
    }

    /* Hide scrollbar for Chrome, Safari and Opera */
    &::-webkit-scrollbar {
      display: none;
    }
  `,
  containerSmTypography: css`
    ${typographyCSS(14, 700, 1.3)}
  `
});
const transition = {
  type: "spring",
  bounce: 0
};
const TabBarV2 = withStyle(({
  style,
  theme,
  fadeInOut,
  items,
  padding = 0,
  isMixed = false,
  paddingTop = padding,
  paddingRight = padding,
  paddingBottom = padding,
  paddingLeft = padding,
  toggleMaxWidth = false,
  maxWidth = 1114,
  tabBarHeight = 50,
  useSmallTypography = false
}) => {
  const {
    selectedIndex,
    onSelectedIndexChange
  } = useTabBarContext();
  const [isInitialTabReady, setIsInitialTabReady] = useState(false);
  const {
    scrollY
  } = useScroll();
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const sectionElementsRef = useRef();
  const [ref, {
    width: tabBarWidth
  }] = useMeasure();
  const {
    segmentState,
    isLoading: isSegmentLoading
  } = useTabBarSegments(items);
  const {
    logged
  } = useCurrentUser();
  const visibleItems = useMemo(() => {
    if (isSegmentLoading) {
      return [];
    }
    return filterVisibleTabItems(items, segmentState, logged);
  }, [items, segmentState, isSegmentLoading, logged]);
  const initialBackgroundColor = backgroundColorByTheme[theme];
  const initialTextColor = textColorByTheme[theme];
  const position = useMotionValue("relative");
  const backgroundColor = useMotionValue(toRGBA(initialBackgroundColor, fadeInOut ? 0 : 1));
  const {
    trackClickTabBarContentEvent
  } = useTrackClickTabBarContentEvent();
  const uniqueId = useMemo(() => visibleItems.map((item) => item.sectionId).join("-"), [visibleItems]);
  useEffect(() => {
    backgroundColor.set(toRGBA(initialBackgroundColor, fadeInOut ? 0 : 1));
  }, [initialBackgroundColor, fadeInOut]);
  useEffectOnce(() => {
    const [hash] = window.location.hash.split("?");
    const initialItemIndex = visibleItems.findIndex((item) => `#${item.sectionId}` === hash);
    if (initialItemIndex < 0) {
      setIsInitialTabReady(true);
      return;
    }
    const handleLayoutDone = () => {
      setIsInitialTabReady(true);
      requestAnimationFrame(() => {
        selectItem(initialItemIndex, {
          tabBarAnimation: false
        });
        scrollToSectionByIndex(initialItemIndex);
      });
    };
    setTimeout(() => {
      handleLayoutDone();
    }, 500);
    window.addEventListener("layoutDone", handleLayoutDone);
    return () => {
      window.removeEventListener("layoutDone", handleLayoutDone);
    };
  });
  useEffect(() => {
    if (!isInitialTabReady || isSegmentLoading) {
      return;
    }
    if (sectionElementsRef.current !== void 0) {
      return;
    }
    sectionElementsRef.current = visibleItems.map((item) => document.getElementById(item.sectionId));
  }, [isInitialTabReady, isSegmentLoading]);
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (wrapperRef.current === null) {
      return;
    }
    const top = getAbsoluteOffsetTop(wrapperRef.current);
    const isPassed = latest >= top;
    const opacity = fadeInOut ? clamp((latest - top) / tabBarHeight, 0, 1) : 1;
    backgroundColor.set(toRGBA(initialBackgroundColor, opacity));
    position.set(isPassed ? "fixed" : "relative");
  });
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!isInitialTabReady) {
      return;
    }
    const clientHeight = (document.documentElement.clientHeight ?? 0) * 0.3;
    const elementOffsetTops = [...(sectionElementsRef.current ?? []).map((element) => element ? getAbsoluteOffsetTop(element) : 0), Infinity];
    const foundIndex = Math.max(-1, elementOffsetTops.findIndex((offsetY) => latest + tabBarHeight + clientHeight <= offsetY) - 1);
    if (foundIndex !== selectedIndex) {
      selectItem(foundIndex);
    }
  });
  const getItemIdForIndex = (index) => `tab-bar__${uniqueId}__${index}`;
  const selectItem = (index, {
    tabBarAnimation = true
  } = {}) => {
    onSelectedIndexChange(index);
    focusTabByIndex(index, tabBarAnimation);
  };
  const scrollToSectionByIndex = (index) => {
    var _a;
    const element = ((_a = sectionElementsRef.current) == null ? void 0 : _a[index]) ?? void 0;
    if (element !== void 0) {
      window.scrollTo({
        top: getAbsoluteOffsetTop(element) - tabBarHeight
      });
    }
  };
  const focusTabByIndex = (index, withAnimation) => {
    const itemElement = document.getElementById(getItemIdForIndex(index));
    const containerElement = containerRef.current;
    if (itemElement === null || containerElement === null) {
      return;
    }
    const centerPosition = itemElement.offsetLeft - containerElement.offsetWidth / 2 + itemElement.offsetWidth / 2;
    if (!withAnimation) {
      containerElement.scrollTo({
        left: centerPosition
      });
      return;
    }
    animate(containerElement.scrollLeft, centerPosition, {
      ...transition,
      onUpdate: (latest) => {
        containerElement.scrollTo({
          left: latest
        });
      }
    });
  };
  const handleClick = (index, item) => () => {
    playHaptic("rigid");
    scrollToSectionByIndex(index);
    trackClickTabBarContentEvent(index + 1, item);
  };
  const tabBarPadding = isMixed ? `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px` : `${padding}px`;
  const tabBarMaxWidth = toggleMaxWidth ? `${maxWidth}px` : void 0;
  return /* @__PURE__ */ jsx(MotionConfig, { transition, children: /* @__PURE__ */ jsx("div", { ref: mergeRefs([wrapperRef, ref]), style: {
    height: tabBarHeight
  }, children: /* @__PURE__ */ jsx(motion.div, { className: classNames.wrapper, style: {
    ...style,
    width: tabBarWidth || "100%",
    height: tabBarHeight,
    position,
    zIndex: 10,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor
  }, children: /* @__PURE__ */ jsx(motion.div, { className: `${classNames.container} ${useSmallTypography ? classNames.containerSmTypography : ""}`, ref: containerRef, layout: true, layoutRoot: true, style: {
    padding: tabBarPadding,
    maxWidth: tabBarMaxWidth,
    backgroundColor
  }, children: visibleItems.map((item, index) => /* @__PURE__ */ jsx(
    TabBarItem,
    {
      id: getItemIdForIndex(index),
      layoutId: uniqueId,
      item,
      selected: Math.max(0, selectedIndex) === index,
      color: initialTextColor,
      onClick: handleClick(index, item)
    },
    index
  )) }) }) }) });
});
const backgroundColorByTheme = {
  default: "rgb(0,0,0)",
  negative: "rgb(255, 255, 255)"
};
const textColorByTheme = {
  default: "rgb(255, 255, 255)",
  negative: "rgb(0,0,0)"
};
const getAbsoluteOffsetTop = (element) => {
  return Math.round(element.getBoundingClientRect().top + window.scrollY);
};
const clamp = (value, lower, upper) => {
  return Math.min(upper, Math.max(lower, value));
};
addPropertyControls(TabBarV2, {
  theme: {
    type: ControlType.Enum,
    title: "�뚮쭏",
    options: ["default", "negative"],
    optionTitles: ["湲곕낯", "諛섏쟾"],
    defaultValue: "default",
    displaySegmentedControl: true
  },
  fadeInOut: {
    type: ControlType.Boolean,
    title: "諛곌꼍�� �섏씠�� ��/�꾩썐",
    description: "�쒖꽦�� �� ��컮媛� �곷떒�� 遺숈� �곹깭濡� �ㅽ겕濡ㅻ릺硫� 諛곌꼍�됱쓽 �щ챸�꾧� �쒖꽌�� 利앷컧�⑸땲��.",
    defaultValue: false
  },
  items: {
    title: "��",
    type: ControlType.Array,
    control: {
      type: ControlType.Object,
      controls: {
        label: {
          title: "�� �대쫫",
          type: ControlType.String,
          defaultValue: "��"
        },
        sectionId: {
          title: "�ㅽ겕濡� �뱀뀡 ID",
          type: ControlType.String
        },
        segment: {
          title: "�멸렇癒쇳듃",
          type: ControlType.Array,
          description: "�멸렇癒쇳듃 議곌굔�� 留욌뒗 ��쭔 �쒖떆�⑸땲��.",
          control: {
            type: ControlType.Object,
            controls: {
              type: {
                type: ControlType.Enum,
                title: "����",
                options: ["login", "guest", "newBuyer", "categoryNewBuyer"],
                optionTitles: ["濡쒓렇��", "誘몃줈洹몄씤", "�앹븷 泥リ뎄留�", "移댄뀒怨좊━ 泥リ뎄留�"],
                defaultValue: ""
              },
              groupId: {
                hidden: ({
                  type
                }) => type !== "categoryNewBuyer",
                type: ControlType.String,
                title: "洹몃９ ID",
                description: "categoryNewBuyer ���낆씪 �� �ъ슜�� 洹몃９ ID",
                defaultValue: ""
              }
            }
          }
        }
      }
    },
    defaultValue: [{
      label: "Chapter 1",
      sectionId: "chapter1",
      segment: [{
        type: ""
      }]
    }, {
      label: "Chapter 2",
      sectionId: "chapter2",
      segment: [{
        type: ""
      }]
    }, {
      label: "Chapter 3",
      sectionId: "chapter3",
      segment: [{
        type: ""
      }]
    }]
  },
  padding: {
    type: ControlType.FusedNumber,
    title: "Padding",
    defaultValue: 0,
    toggleKey: "isMixed",
    toggleTitles: ["All", "Individual"],
    valueKeys: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"],
    valueLabels: ["T", "R", "B", "L"],
    min: 0
  },
  toggleMaxWidth: {
    type: ControlType.Boolean,
    title: "MaxWidth",
    enabledTitle: "SET",
    disabledTitle: "UNSET",
    defaultValue: false
  },
  maxWidth: {
    type: ControlType.Number,
    defaultValue: 1114,
    min: 50,
    unit: "px",
    step: 1,
    displayStepper: true,
    hidden(props) {
      return props.toggleMaxWidth === false;
    }
  }
});
export {
  TabBarV2
};