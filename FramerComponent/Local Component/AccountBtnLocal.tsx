import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// 계좌 정보 타입 정의
interface AccountInfo {
    groom_name: string
    groom_account: string
    groom_bank: string
    groom_father_name: string
    groom_father_account: string
    groom_father_bank: string
    groom_mother_name: string
    groom_mother_account: string
    groom_mother_bank: string
    bride_name: string
    bride_account: string
    bride_bank: string
    bride_father_name: string
    bride_father_account: string
    bride_father_bank: string
    bride_mother_name: string
    bride_mother_account: string
    bride_mother_bank: string
}

interface AccountBtnLocalProps {
    accountInfo?: AccountInfo
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
export default function AccountBtnLocal(props: AccountBtnLocalProps) {
    const { accountInfo: propAccountInfo, style } = props

    const [groomViewState, setGroomViewState] = useState<ViewState>("closed")
    const [brideViewState, setBrideViewState] = useState<ViewState>("closed")
    const [copyMessage, setCopyMessage] = useState("")
    const [showCopyMessage, setShowCopyMessage] = useState(false)

    const defaultAccountInfo: AccountInfo = {
        groom_name: "김신랑",
        groom_account: "123-456-789012",
        groom_bank: "국민은행",
        groom_father_name: "김아버지",
        groom_father_account: "123-456-789013",
        groom_father_bank: "신한은행",
        groom_mother_name: "김어머니",
        groom_mother_account: "123-456-789014",
        groom_mother_bank: "우리은행",
        bride_name: "박신부",
        bride_account: "123-456-789015",
        bride_bank: "하나은행",
        bride_father_name: "박아버지",
        bride_father_account: "123-456-789016",
        bride_father_bank: "기업은행",
        bride_mother_name: "박어머니",
        bride_mother_account: "123-456-789017",
        bride_mother_bank: "카카오뱅크",
    }

    const accountInfo = propAccountInfo || defaultAccountInfo

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


    return (
        <div
            style={{
                width: "100%",
                maxWidth: 378,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                ...style,
            }}
        >
            {/* 신랑측에게 버튼 */}
            <GroomAccountButton
                accountInfo={accountInfo}
                viewState={groomViewState}
                onToggle={toggleGroomView}
                onCopyGroom={copyGroomAccount}
                onCopyGroomFather={copyGroomFatherAccount}
                onCopyGroomMother={copyGroomMotherAccount}
            />

            {/* 신부측에게 버튼 */}
            <BrideAccountButton
                accountInfo={accountInfo}
                viewState={brideViewState}
                onToggle={toggleBrideView}
                onCopyBride={copyBrideAccount}
                onCopyBrideFather={copyBrideFatherAccount}
                onCopyBrideMother={copyBrideMotherAccount}
            />

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
                                fontFamily: "Pretendard Regular",
                                textAlign: "center",
                            }}
                        >
                            {copyMessage}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
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
}

const GroomAccountButton = React.memo(function GroomAccountButton({
    accountInfo,
    viewState,
    onToggle,
    onCopyGroom,
    onCopyGroomFather,
    onCopyGroomMother,
}: GroomAccountButtonProps) {
    const isOpen = viewState === "open"

    return (
        <motion.div
            style={{
                width: "100%",
                maxWidth: 378,
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
                        fontFamily: "Pretendard SemiBold",
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
                        duration: 0.3,
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
}

const BrideAccountButton = React.memo(function BrideAccountButton({
    accountInfo,
    viewState,
    onToggle,
    onCopyBride,
    onCopyBrideFather,
    onCopyBrideMother,
}: BrideAccountButtonProps) {
    const isOpen = viewState === "open"

    return (
        <motion.div
            style={{
                width: "100%",
                maxWidth: 378,
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
                        fontFamily: "Pretendard SemiBold",
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
                        duration: 0.3,
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
}

const AccountItem = React.memo(function AccountItem({
    label,
    name,
    account,
    bank,
    onCopy,
    isLast,
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
                    fontFamily: "Pretendard SemiBold",
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
                            fontFamily: "Pretendard SemiBold",
                            wordWrap: "break-word",
                        }}
                    >
                        {name}
                    </div>
                    <div
                        style={{
                            color: "black",
                            fontSize: 14,
                            fontFamily: "Pretendard Regular",
                            wordWrap: "break-word",
                        }}
                    >
                        {account}
                    </div>
                    <div
                        style={{
                            color: "black",
                            fontSize: 14,
                            fontFamily: "Pretendard Regular",
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
                            fontFamily: "Pretendard Regular",
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

// Property Controls 정의
addPropertyControls(AccountBtnLocal, {
    accountInfo: {
        type: ControlType.Object,
        title: "계좌 정보",
        controls: {
            // 신랑 정보 섹션
            groom_name: {
                type: ControlType.String,
                title: "신랑 이름",
                defaultValue: "김신랑",
            },
            groom_account: {
                type: ControlType.String,
                title: "신랑 계좌번호",
                defaultValue: "123-456-789012",
            },
            groom_bank: {
                type: ControlType.String,
                title: "신랑 은행",
                defaultValue: "국민은행",
            },

            // 신랑 아버지 정보
            groom_father_name: {
                type: ControlType.String,
                title: "신랑 아버지 이름",
                defaultValue: "김아버지",
            },
            groom_father_account: {
                type: ControlType.String,
                title: "신랑 아버지 계좌번호",
                defaultValue: "123-456-789013",
            },
            groom_father_bank: {
                type: ControlType.String,
                title: "신랑 아버지 은행",
                defaultValue: "신한은행",
            },

            // 신랑 어머니 정보
            groom_mother_name: {
                type: ControlType.String,
                title: "신랑 어머니 이름",
                defaultValue: "김어머니",
            },
            groom_mother_account: {
                type: ControlType.String,
                title: "신랑 어머니 계좌번호",
                defaultValue: "123-456-789014",
            },
            groom_mother_bank: {
                type: ControlType.String,
                title: "신랑 어머니 은행",
                defaultValue: "우리은행",
            },

            // 신부 정보 섹션
            bride_name: {
                type: ControlType.String,
                title: "신부 이름",
                defaultValue: "박신부",
            },
            bride_account: {
                type: ControlType.String,
                title: "신부 계좌번호",
                defaultValue: "123-456-789015",
            },
            bride_bank: {
                type: ControlType.String,
                title: "신부 은행",
                defaultValue: "하나은행",
            },

            // 신부 아버지 정보
            bride_father_name: {
                type: ControlType.String,
                title: "신부 아버지 이름",
                defaultValue: "박아버지",
            },
            bride_father_account: {
                type: ControlType.String,
                title: "신부 아버지 계좌번호",
                defaultValue: "123-456-789016",
            },
            bride_father_bank: {
                type: ControlType.String,
                title: "신부 아버지 은행",
                defaultValue: "기업은행",
            },

            // 신부 어머니 정보
            bride_mother_name: {
                type: ControlType.String,
                title: "신부 어머니 이름",
                defaultValue: "박어머니",
            },
            bride_mother_account: {
                type: ControlType.String,
                title: "신부 어머니 계좌번호",
                defaultValue: "123-456-789017",
            },
            bride_mother_bank: {
                type: ControlType.String,
                title: "신부 어머니 은행",
                defaultValue: "카카오뱅크",
            },
        },
    },
})
