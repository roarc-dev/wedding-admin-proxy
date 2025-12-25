'use client'

import React, { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Typography 폰트 스택 (typography.js에서 가져온 값들)
const FONT_STACKS = {
    pretendardVariable: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    pretendard: 'Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    p22: '"P22 Late November", "Pretendard", -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    goldenbook: '"goldenbook", "Goldenbook", serif',
    sloopScriptPro: '"sloop-script-pro", "Sloop Script Pro", cursive, sans-serif',
}

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

// 프록시를 통한 안전한 계좌 정보 가져오기
async function getAccountInfoByPageId(pageId: string) {
    try {
        const response = await fetch(
            `${PROXY_BASE_URL}/api/contacts?action=getByPageId&pageId=${pageId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        )

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        if (result.success) {
            return result.data
        } else {
            throw new Error(result.error || "계좌 정보를 가져올 수 없습니다")
        }
    } catch (error) {
        console.error("계좌 정보 가져오기 실패:", error)
        throw error
    }
}

// 계좌 정보 타입 정의
interface AccountInfo {
    id?: string
    page_id: string
    groom_name: string
    groom_phone: string
    groom_account: string
    groom_bank: string
    groom_father_name: string
    groom_father_phone: string
    groom_father_account: string
    groom_father_bank: string
    groom_mother_name: string
    groom_mother_phone: string
    groom_mother_account: string
    groom_mother_bank: string
    bride_name: string
    bride_phone: string
    bride_account: string
    bride_bank: string
    bride_father_name: string
    bride_father_phone: string
    bride_father_account: string
    bride_father_bank: string
    bride_mother_name: string
    bride_mother_phone: string
    bride_mother_account: string
    bride_mother_bank: string
    created_at?: string
    updated_at?: string
}

interface AccountBtnProps {
    pageId: string
    style?: React.CSSProperties
}

type ViewState = "closed" | "open"
type SideType = "groom" | "bride"

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 378
 * @framerIntrinsicHeight 300
 */
export default function AccountBtn(props: AccountBtnProps) {
    const { pageId = "default", style } = props

    const [groomViewState, setGroomViewState] = useState<ViewState>("closed")
    const [brideViewState, setBrideViewState] = useState<ViewState>("closed")
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [copyMessage, setCopyMessage] = useState("")
    const [showCopyMessage, setShowCopyMessage] = useState(false)

    // Typography 폰트 로딩 - 페이지 레벨에서 처리됨

    // 폰트 패밀리 설정 (typography.js에서 가져온 폰트 스택 사용)
    const pretendardFontFamily = FONT_STACKS.pretendardVariable

    // 로컬 개발에서는 더미 데이터 사용
    const isDevelopment = process.env.NODE_ENV === 'development'

    // 계좌 정보 로드
    const loadAccountInfo = async () => {
        if (isDevelopment) {
            // 로컬 개발용 더미 데이터
            const dummyAccountInfo: AccountInfo = {
                page_id: 'taehohoho',
                groom_name: '김철수',
                groom_phone: '010-1234-5678',
                groom_account: '123-456-789012',
                groom_bank: '국민은행',
                groom_father_name: '김아빠',
                groom_father_phone: '010-9876-5432',
                groom_father_account: '987-654-321098',
                groom_father_bank: '신한은행',
                groom_mother_name: '김엄마',
                groom_mother_phone: '010-1111-2222',
                groom_mother_account: '111-222-333444',
                groom_mother_bank: '하나은행',
                bride_name: '이영희',
                bride_phone: '010-5555-6666',
                bride_account: '456-789-123456',
                bride_bank: '우리은행',
                bride_father_name: '이아빠',
                bride_father_phone: '010-7777-8888',
                bride_father_account: '777-888-999000',
                bride_father_bank: '농협',
                bride_mother_name: '이엄마',
                bride_mother_phone: '010-3333-4444',
                bride_mother_account: '321-654-987654',
                bride_mother_bank: '하나은행',
            }
            setAccountInfo(dummyAccountInfo)
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError("")
            const data = await getAccountInfoByPageId(pageId)

            if (data && data.length > 0) {
                setAccountInfo(data[0])
            } else {
                setError("계좌 정보가 없습니다")
            }
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "알 수 없는 오류가 발생했습니다"
            )
        } finally {
            setLoading(false)
        }
    }

    // 초기 로드
    useEffect(() => {
        loadAccountInfo()
    }, [pageId])

    // 클립보드 복사 함수
    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopyMessage(`${type}`)
            setShowCopyMessage(true)

            setTimeout(() => {
                setShowCopyMessage(false)
            }, 2000)
        } catch (error) {
            console.error("클립보드 복사 실패:", error)
            setCopyMessage("복사에 실패했습니다")
            setShowCopyMessage(true)

            setTimeout(() => {
                setShowCopyMessage(false)
            }, 2000)
        }
    }

    // 계좌 정보 복사 함수들
    const copyGroomAccount = () => {
        if (accountInfo) {
            const text = `${accountInfo.groom_bank} ${accountInfo.groom_account} ${accountInfo.groom_name}`
            copyToClipboard(text, "복사되었습니다")
        }
    }

    const copyGroomFatherAccount = () => {
        if (accountInfo) {
            const text = `${accountInfo.groom_father_bank} ${accountInfo.groom_father_account} ${accountInfo.groom_father_name}`
            copyToClipboard(text, "복사되었습니다")
        }
    }

    const copyGroomMotherAccount = () => {
        if (accountInfo) {
            const text = `${accountInfo.groom_mother_bank} ${accountInfo.groom_mother_account} ${accountInfo.groom_mother_name}`
            copyToClipboard(text, "복사되었습니다")
        }
    }

    const copyBrideAccount = () => {
        if (accountInfo) {
            const text = `${accountInfo.bride_bank} ${accountInfo.bride_account} ${accountInfo.bride_name}`
            copyToClipboard(text, "복사되었습니다")
        }
    }

    const copyBrideFatherAccount = () => {
        if (accountInfo) {
            const text = `${accountInfo.bride_father_bank} ${accountInfo.bride_father_account} ${accountInfo.bride_father_name}`
            copyToClipboard(text, "복사되었습니다")
        }
    }

    const copyBrideMotherAccount = () => {
        if (accountInfo) {
            const text = `${accountInfo.bride_mother_bank} ${accountInfo.bride_mother_account} ${accountInfo.bride_mother_name}`
            copyToClipboard(text, "복사되었습니다")
        }
    }

    // 토글 함수들
    const toggleGroomView = () => {
        setGroomViewState(groomViewState === "closed" ? "open" : "closed")
    }

    const toggleBrideView = () => {
        setBrideViewState(brideViewState === "closed" ? "open" : "closed")
    }

    // 로딩 상태
    if (loading) {
        return (
            <div
                style={{
                    marginTop: 80,
                    marginBottom: 80,
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: 54,
                        background: "#EBEBEB",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        ...style,
                    }}
                >
                    <div
                        style={{
                            color: "black",
                            fontSize: 14,
                            fontFamily: pretendardFontFamily,
                            fontWeight: 600,
                        }}
                    >
                        로딩 중...
                    </div>
                </div>
            </div>
        )
    }

    // 에러 상태
    if (error) {
        return (
            <div
                style={{
                    marginTop: 80,
                    marginBottom: 80,
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: 54,
                        background: "#EBEBEB",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        ...style,
                    }}
                >
                    <div
                        style={{
                            color: "black",
                            fontSize: 14,
                            fontFamily: pretendardFontFamily,
                            fontWeight: 600,
                        }}
                    >
                        계좌 정보 없음
                    </div>
                </div>
            </div>
        )
    }

    // 계좌 정보가 없는 경우
    if (!accountInfo) {
        return (
            <div
                style={{
                    marginTop: 80,
                    marginBottom: 80,
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: 54,
                        background: "#EBEBEB",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        ...style,
                    }}
                >
                    <div
                        style={{
                            color: "black",
                            fontSize: 14,
                            fontFamily: pretendardFontFamily,
                            fontWeight: 600,
                        }}
                    >
                        계좌 정보 없음
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                marginTop: 0,
                marginBottom: 0,
                paddingTop: 80,
                paddingBottom: 80,
                width: "100%",
                display: "flex",
                justifyContent: "center",
                backgroundColor: "#FAFAFA",
            }}
        >
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    ...style,
                }}
            >
                {/* 안내 텍스트 박스 */}
                <motion.div
                    style={{
                        width: "100%",
                        paddingBottom: 30,
                        display: "flex",
                        flexDirection: "column",
                        gap: 20,
                        boxSizing: "border-box",
                        alignItems: "center",
                    }}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                >
                    <div
                        style={{
                            width: "100%",
                            height: 20,
                            fontFamily: pretendardFontFamily,
                            fontWeight: 600,
                            fontSize: 22,
                            lineHeight: "0.7em",
                            color: "#000000",
                            textAlign: "center",
                        }}
                    >
                        마음 전하는 곳
                    </div>
                    <div
                        style={{
                            width: "100%",
                            fontFamily: pretendardFontFamily,
                            fontWeight: 400,
                            fontSize: 15,
                            lineHeight: "1.8em",
                            color: "#8c8c8c",
                            textAlign: "center",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {`참석이 어려우신 분들을 위해 기재했습니다.\n너그러운 마음으로 양해 부탁드립니다.`}
                    </div>
                </motion.div>
                {/* 계좌 버튼 컨테이너 (가로 88% 고정 비율) */}
                <motion.div
                    style={{
                        width: "88%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        alignSelf: "center",
                    }}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
                    viewport={{ once: true, amount: 0.3 }}
                >
                    {/* 신랑측에게 버튼 */}
                    <GroomAccountButton
                        accountInfo={accountInfo}
                        viewState={groomViewState}
                        onToggle={toggleGroomView}
                        onCopyGroom={copyGroomAccount}
                        onCopyGroomFather={copyGroomFatherAccount}
                        onCopyGroomMother={copyGroomMotherAccount}
                        pretendardFontFamily={pretendardFontFamily}
                    />

                    {/* 신부측에게 버튼 */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.5,
                            ease: "easeOut",
                            delay: 0.3,
                        }}
                        viewport={{ once: true, amount: 0.3 }}
                    >
                        <BrideAccountButton
                            accountInfo={accountInfo}
                            viewState={brideViewState}
                            onToggle={toggleBrideView}
                            onCopyBride={copyBrideAccount}
                            onCopyBrideFather={copyBrideFatherAccount}
                            onCopyBrideMother={copyBrideMotherAccount}
                            pretendardFontFamily={pretendardFontFamily}
                        />
                    </motion.div>
                </motion.div>

                {/* 복사 메시지 */}
                <AnimatePresence>
                    {showCopyMessage && (
                        <motion.div
                            style={{
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
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div
                                style={{
                                    color: "#000000",
                                    fontSize: 14,
                                    fontFamily: pretendardFontFamily,
                                    fontWeight: 400,
                                    textAlign: "center",
                                }}
                            >
                                {copyMessage}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

// 신랑측 계좌 버튼 컴포넌트 (수정됨)
interface GroomAccountButtonProps {
    accountInfo: AccountInfo
    viewState: ViewState
    onToggle: () => void
    onCopyGroom: () => void
    onCopyGroomFather: () => void
    onCopyGroomMother: () => void
    pretendardFontFamily: string
}

const GroomAccountButton = React.memo(function GroomAccountButton({
    accountInfo,
    viewState,
    onToggle,
    onCopyGroom,
    onCopyGroomFather,
    onCopyGroomMother,
    pretendardFontFamily,
}: GroomAccountButtonProps) {
    const isOpen = viewState === "open"

    return (
        <motion.div
            style={{
                width: "100%",
                background: "white",
                overflow: "hidden",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                display: "inline-flex",
                boxSizing: "border-box",
            }}
            initial={false}
            animate={{
                height: isOpen ? "auto" : 54,
            }}
            transition={{
                duration: 0.3,
                ease: "easeInOut",
            }}
        >
            {/* 헤더 */}
            <div
                style={{
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
                }}
                onClick={onToggle}
            >
                <div
                    style={{
                        color: "black",
                        fontSize: 14,
                        fontFamily: pretendardFontFamily,
                        fontWeight: 600,
                        wordWrap: "break-word",
                    }}
                >
                    신랑측 계좌번호
                </div>
                <motion.svg
                    width="15"
                    height="8"
                    viewBox="0 0 15 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    animate={{
                        rotate: isOpen ? 180 : 0,
                    }}
                    transition={{
                        duration: 0,
                        ease: "easeInOut",
                    }}
                >
                    <g id="Group 2117912660">
                        <path
                            id="Vector 1121"
                            d="M1.5 1L7.5 6.5L13.5 1"
                            stroke="black"
                            strokeWidth="1.5"
                        />
                    </g>
                </motion.svg>
            </div>

            {/* 계좌 정보 목록 */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        style={{
                            alignSelf: "stretch",
                            padding: "15px 15px 0px 15px",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                            gap: 10,
                            display: "flex",
                            boxSizing: "border-box",
                        }}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{
                            duration: 0.2,
                            ease: "easeOut",
                        }}
                    >
                        {(() => {
                            const groomAccounts = [
                                {
                                    condition:
                                        accountInfo.groom_name &&
                                        accountInfo.groom_account &&
                                        accountInfo.groom_bank,
                                    component: "groom",
                                },
                                {
                                    condition:
                                        accountInfo.groom_father_name &&
                                        accountInfo.groom_father_account &&
                                        accountInfo.groom_father_bank,
                                    component: "groom_father",
                                },
                                {
                                    condition:
                                        accountInfo.groom_mother_name &&
                                        accountInfo.groom_mother_account &&
                                        accountInfo.groom_mother_bank,
                                    component: "groom_mother",
                                },
                            ]

                            const validAccounts = groomAccounts.filter(
                                (acc) => acc.condition
                            )

                            return validAccounts.map((acc, index) => {
                                const isLast =
                                    index === validAccounts.length - 1

                                if (acc.component === "groom") {
                                    return (
                                        <AccountItem
                                            key="groom"
                                            label="신랑"
                                            name={accountInfo.groom_name}
                                            account={accountInfo.groom_account}
                                            bank={accountInfo.groom_bank}
                                            onCopy={onCopyGroom}
                                            isLast={isLast}
                                            pretendardFontFamily={pretendardFontFamily}
                                        />
                                    )
                                } else if (acc.component === "groom_father") {
                                    return (
                                        <AccountItem
                                            key="groom_father"
                                            label="혼주"
                                            name={accountInfo.groom_father_name}
                                            account={
                                                accountInfo.groom_father_account
                                            }
                                            bank={accountInfo.groom_father_bank}
                                            onCopy={onCopyGroomFather}
                                            isLast={isLast}
                                            pretendardFontFamily={pretendardFontFamily}
                                        />
                                    )
                                } else if (acc.component === "groom_mother") {
                                    return (
                                        <AccountItem
                                            key="groom_mother"
                                            label="혼주"
                                            name={accountInfo.groom_mother_name}
                                            account={
                                                accountInfo.groom_mother_account
                                            }
                                            bank={accountInfo.groom_mother_bank}
                                            onCopy={onCopyGroomMother}
                                            isLast={isLast}
                                            pretendardFontFamily={pretendardFontFamily}
                                        />
                                    )
                                }
                                return null
                            })
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
})

// 신부측 계좌 버튼 컴포넌트 (수정됨)
interface BrideAccountButtonProps {
    accountInfo: AccountInfo
    viewState: ViewState
    onToggle: () => void
    onCopyBride: () => void
    onCopyBrideFather: () => void
    onCopyBrideMother: () => void
    pretendardFontFamily: string
}

const BrideAccountButton = React.memo(function BrideAccountButton({
    accountInfo,
    viewState,
    onToggle,
    onCopyBride,
    onCopyBrideFather,
    onCopyBrideMother,
    pretendardFontFamily,
}: BrideAccountButtonProps) {
    const isOpen = viewState === "open"

    return (
        <motion.div
            style={{
                width: "100%",
                background: "white",
                overflow: "hidden",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                display: "inline-flex",
                boxSizing: "border-box",
            }}
            initial={false}
            animate={{
                height: isOpen ? "auto" : 54,
            }}
            transition={{
                duration: 0.3,
                ease: "easeInOut",
            }}
        >
            {/* 헤더 */}
            <div
                style={{
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
                }}
                onClick={onToggle}
            >
                <div
                    style={{
                        color: "black",
                        fontSize: 14,
                        fontFamily: pretendardFontFamily,
                        fontWeight: 600,
                        wordWrap: "break-word",
                    }}
                >
                    신부측 계좌번호
                </div>
                <motion.svg
                    width="15"
                    height="8"
                    viewBox="0 0 15 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    animate={{
                        rotate: isOpen ? 180 : 0,
                    }}
                    transition={{
                        duration: 0,
                        ease: "easeInOut",
                    }}
                >
                    <g id="Group 2117912660">
                        <path
                            id="Vector 1121"
                            d="M1.5 1L7.5 6.5L13.5 1"
                            stroke="black"
                            strokeWidth="1.5"
                        />
                    </g>
                </motion.svg>
            </div>

            {/* 계좌 정보 목록 */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        style={{
                            alignSelf: "stretch",
                            padding: "15px 15px 0px 15px",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                            gap: 10,
                            display: "flex",
                            boxSizing: "border-box",
                        }}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{
                            duration: 0.2,
                            ease: "easeOut",
                        }}
                    >
                        {(() => {
                            const brideAccounts = [
                                {
                                    condition:
                                        accountInfo.bride_name &&
                                        accountInfo.bride_account &&
                                        accountInfo.bride_bank,
                                    component: "bride",
                                },
                                {
                                    condition:
                                        accountInfo.bride_father_name &&
                                        accountInfo.bride_father_account &&
                                        accountInfo.bride_father_bank,
                                    component: "bride_father",
                                },
                                {
                                    condition:
                                        accountInfo.bride_mother_name &&
                                        accountInfo.bride_mother_account &&
                                        accountInfo.bride_mother_bank,
                                    component: "bride_mother",
                                },
                            ]

                            const validAccounts = brideAccounts.filter(
                                (acc) => acc.condition
                            )

                            return validAccounts.map((acc, index) => {
                                const isLast =
                                    index === validAccounts.length - 1

                                if (acc.component === "bride") {
                                    return (
                                        <AccountItem
                                            key="bride"
                                            label="신부"
                                            name={accountInfo.bride_name}
                                            account={accountInfo.bride_account}
                                            bank={accountInfo.bride_bank}
                                            onCopy={onCopyBride}
                                            isLast={isLast}
                                            pretendardFontFamily={pretendardFontFamily}
                                        />
                                    )
                                } else if (acc.component === "bride_father") {
                                    return (
                                        <AccountItem
                                            key="bride_father"
                                            label="혼주"
                                            name={accountInfo.bride_father_name}
                                            account={
                                                accountInfo.bride_father_account
                                            }
                                            bank={accountInfo.bride_father_bank}
                                            onCopy={onCopyBrideFather}
                                            isLast={isLast}
                                            pretendardFontFamily={pretendardFontFamily}
                                        />
                                    )
                                } else if (acc.component === "bride_mother") {
                                    return (
                                        <AccountItem
                                            key="bride_mother"
                                            label="혼주"
                                            name={accountInfo.bride_mother_name}
                                            account={
                                                accountInfo.bride_mother_account
                                            }
                                            bank={accountInfo.bride_mother_bank}
                                            onCopy={onCopyBrideMother}
                                            isLast={isLast}
                                            pretendardFontFamily={pretendardFontFamily}
                                        />
                                    )
                                }
                                return null
                            })
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
})

// 계좌 아이템 컴포넌트
interface AccountItemProps {
    label: string
    name: string
    account: string
    bank: string
    onCopy: () => void
    isLast: boolean
    pretendardFontFamily: string
}

const AccountItem = React.memo(function AccountItem({
    label,
    name,
    account,
    bank,
    onCopy,
    isLast,
    pretendardFontFamily,
}: AccountItemProps) {
    return (
        <div
            style={{
                alignSelf: "stretch",
                height: 54,
                paddingBottom: 15,
                borderBottom: isLast ? "none" : "1px #F5F5F5 solid",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start",
                gap: 5,
                display: "flex",
            }}
        >
            <div
                style={{
                    color: "#707070",
                    fontSize: 14,
                    fontFamily: pretendardFontFamily,
                    fontWeight: 600,
                    wordWrap: "break-word",
                }}
            >
                {label}
            </div>
            <div
                style={{
                    alignSelf: "stretch",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    display: "inline-flex",
                }}
            >
                <div
                    style={{
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: 5,
                        display: "flex",
                    }}
                >
                    <div
                        style={{
                            color: "black",
                            fontSize: 14,
                            fontFamily: pretendardFontFamily,
                            fontWeight: 600,
                            wordWrap: "break-word",
                        }}
                    >
                        {name}
                    </div>
                    <div
                        style={{
                            color: "black",
                            fontSize: 14,
                            fontFamily: pretendardFontFamily,
                            fontWeight: 400,
                            wordWrap: "break-word",
                        }}
                    >
                        {account}
                    </div>
                    <div
                        style={{
                            color: "black",
                            fontSize: 14,
                            fontFamily: pretendardFontFamily,
                            fontWeight: 400,
                            wordWrap: "break-word",
                        }}
                    >
                        {bank}
                    </div>
                </div>
                <div
                    style={{
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: 5,
                        display: "flex",
                        cursor: "pointer",
                    }}
                    onClick={onCopy}
                >
                    <svg
                        width="12"
                        height="14"
                        viewBox="0 0 12 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect
                            x="1"
                            y="1"
                            width="7.35989"
                            height="9.41763"
                            stroke="#7F7F7F"
                        />
                        <path
                            d="M3.7998 13.0001H10.9997V3.73438"
                            stroke="#7F7F7F"
                        />
                    </svg>
                    <div
                        style={{
                            color: "#8C8C8C",
                            fontSize: 14,
                            fontFamily: pretendardFontFamily,
                            fontWeight: 400,
                            wordWrap: "break-word",
                        }}
                    >
                        복사
                    </div>
                </div>
            </div>
        </div>
    )
})
