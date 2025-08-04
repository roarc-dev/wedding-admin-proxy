import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

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

type ViewState = "closed" | "groom" | "bride"

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 378
 * @framerIntrinsicHeight 54
 */
export default function AccountBtn(props: AccountBtnProps) {
    const { pageId = "default", style } = props

    const [viewState, setViewState] = useState<ViewState>("closed")
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [copyMessage, setCopyMessage] = useState("")
    const [showCopyMessage, setShowCopyMessage] = useState(false)

    // 계좌 정보 로드
    const loadAccountInfo = async () => {
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
            setError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다")
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
            setCopyMessage(`${type} 계좌 정보가 복사되었습니다`)
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
            copyToClipboard(text, "신랑")
        }
    }

    const copyGroomFatherAccount = () => {
        if (accountInfo) {
            const text = `${accountInfo.groom_father_bank} ${accountInfo.groom_father_account} ${accountInfo.groom_father_name}`
            copyToClipboard(text, "신랑 아버지")
        }
    }

    const copyGroomMotherAccount = () => {
        if (accountInfo) {
            const text = `${accountInfo.groom_mother_bank} ${accountInfo.groom_mother_account} ${accountInfo.groom_mother_name}`
            copyToClipboard(text, "신랑 어머니")
        }
    }

    const copyBrideAccount = () => {
        if (accountInfo) {
            const text = `${accountInfo.bride_bank} ${accountInfo.bride_account} ${accountInfo.bride_name}`
            copyToClipboard(text, "신부")
        }
    }

    const copyBrideFatherAccount = () => {
        if (accountInfo) {
            const text = `${accountInfo.bride_father_bank} ${accountInfo.bride_father_account} ${accountInfo.bride_father_name}`
            copyToClipboard(text, "신부 아버지")
        }
    }

    const copyBrideMotherAccount = () => {
        if (accountInfo) {
            const text = `${accountInfo.bride_mother_bank} ${accountInfo.bride_mother_account} ${accountInfo.bride_mother_name}`
            copyToClipboard(text, "신부 어머니")
        }
    }

    // 토글 함수
    const toggleView = () => {
        setViewState(viewState === "closed" ? "groom" : "closed")
    }

    // 신랑측/신부측 전환
    const showGroomAccounts = () => {
        setViewState("groom")
    }

    const showBrideAccounts = () => {
        setViewState("bride")
    }

    // 로딩 상태
    if (loading) {
        return (
            <div style={{
                width: 378,
                height: 54,
                background: '#EBEBEB',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                ...style
            }}>
                <div style={{
                    color: 'black',
                    fontSize: 14,
                    fontFamily: 'Pretendard',
                    fontWeight: '600'
                }}>
                    로딩 중...
                </div>
            </div>
        )
    }

    // 에러 상태
    if (error) {
        return (
            <div style={{
                width: 378,
                height: 54,
                background: '#EBEBEB',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                ...style
            }}>
                <div style={{
                    color: 'black',
                    fontSize: 14,
                    fontFamily: 'Pretendard',
                    fontWeight: '600'
                }}>
                    계좌 정보 없음
                </div>
            </div>
        )
    }

    // 계좌 정보가 없는 경우
    if (!accountInfo) {
        return (
            <div style={{
                width: 378,
                height: 54,
                background: '#EBEBEB',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                ...style
            }}>
                <div style={{
                    color: 'black',
                    fontSize: 14,
                    fontFamily: 'Pretendard',
                    fontWeight: '600'
                }}>
                    계좌 정보 없음
                </div>
            </div>
        )
    }

    // 닫힌 상태
    if (viewState === "closed") {
        return (
            <div style={{
                width: 378,
                background: '#EBEBEB',
                overflow: 'hidden',
                justifyContent: 'center',
                alignItems: 'flex-start',
                gap: 10,
                display: 'inline-flex',
                cursor: 'pointer',
                ...style
            }} onClick={toggleView}>
                <div style={{
                    flex: '1 1 0',
                    height: 54,
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 10,
                    display: 'flex'
                }}>
                    <div style={{
                        color: 'black',
                        fontSize: 14,
                        fontFamily: 'Pretendard',
                        fontWeight: '600',
                        wordWrap: 'break-word'
                    }}>
                        신랑측에게
                    </div>
                    <div style={{ width: 14, height: 8 }} />
                    <div style={{
                        width: 12,
                        height: 5.50,
                        outline: '1.50px black solid',
                        outlineOffset: '-0.75px'
                    }} />
                </div>
            </div>
        )
    }

    // 열린 상태
    return (
        <div style={{
            width: 378,
            background: 'white',
            overflow: 'hidden',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            display: 'inline-flex',
            ...style
        }}>
            {/* 헤더 */}
            <div style={{
                alignSelf: 'stretch',
                height: 54,
                background: '#EBEBEB',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10,
                display: 'inline-flex',
                cursor: 'pointer'
            }} onClick={toggleView}>
                <div style={{
                    color: 'black',
                    fontSize: 14,
                    fontFamily: 'Pretendard',
                    fontWeight: '600',
                    wordWrap: 'break-word'
                }}>
                    {viewState === "groom" ? "신랑측에게" : "신부측에게"}
                </div>
                <div style={{ width: 14, height: 8 }} />
                <div style={{
                    width: 12,
                    height: 5.50,
                    outline: '1.50px black solid',
                    outlineOffset: '-0.75px',
                    transform: 'rotate(180deg)'
                }} />
            </div>

            {/* 탭 버튼 */}
            <div style={{
                alignSelf: 'stretch',
                display: 'flex',
                borderBottom: '1px solid #F5F5F5'
            }}>
                <div style={{
                    flex: 1,
                    padding: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: viewState === "groom" ? '#F0F0F0' : 'transparent',
                    color: viewState === "groom" ? 'black' : '#707070',
                    fontSize: 14,
                    fontFamily: 'Pretendard',
                    fontWeight: '600'
                }} onClick={showGroomAccounts}>
                    신랑측
                </div>
                <div style={{
                    flex: 1,
                    padding: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: viewState === "bride" ? '#F0F0F0' : 'transparent',
                    color: viewState === "bride" ? 'black' : '#707070',
                    fontSize: 14,
                    fontFamily: 'Pretendard',
                    fontWeight: '600'
                }} onClick={showBrideAccounts}>
                    신부측
                </div>
            </div>

            {/* 계좌 정보 목록 */}
            <div style={{
                alignSelf: 'stretch',
                paddingTop: 20,
                paddingLeft: 20,
                paddingRight: 20,
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                gap: 16,
                display: 'flex'
            }}>
                {viewState === "groom" ? (
                    <>
                        {/* 신랑 */}
                        <AccountItem
                            label="신랑"
                            name={accountInfo.groom_name}
                            account={accountInfo.groom_account}
                            bank={accountInfo.groom_bank}
                            onCopy={copyGroomAccount}
                        />
                        {/* 신랑 아버지 */}
                        <AccountItem
                            label="혼주"
                            name={accountInfo.groom_father_name}
                            account={accountInfo.groom_father_account}
                            bank={accountInfo.groom_father_bank}
                            onCopy={copyGroomFatherAccount}
                        />
                        {/* 신랑 어머니 */}
                        <AccountItem
                            label="혼주"
                            name={accountInfo.groom_mother_name}
                            account={accountInfo.groom_mother_account}
                            bank={accountInfo.groom_mother_bank}
                            onCopy={copyGroomMotherAccount}
                        />
                    </>
                ) : (
                    <>
                        {/* 신부 */}
                        <AccountItem
                            label="신부"
                            name={accountInfo.bride_name}
                            account={accountInfo.bride_account}
                            bank={accountInfo.bride_bank}
                            onCopy={copyBrideAccount}
                        />
                        {/* 신부 아버지 */}
                        <AccountItem
                            label="혼주"
                            name={accountInfo.bride_father_name}
                            account={accountInfo.bride_father_account}
                            bank={accountInfo.bride_father_bank}
                            onCopy={copyBrideFatherAccount}
                        />
                        {/* 신부 어머니 */}
                        <AccountItem
                            label="혼주"
                            name={accountInfo.bride_mother_name}
                            account={accountInfo.bride_mother_account}
                            bank={accountInfo.bride_mother_bank}
                            onCopy={copyBrideMotherAccount}
                        />
                    </>
                )}
            </div>

            {/* 복사 메시지 */}
            <AnimatePresence>
                {showCopyMessage && (
                    <motion.div
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 120,
                            height: 50,
                            background: 'white',
                            borderRadius: 10,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.05)',
                            zIndex: 1000
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div style={{
                            color: 'black',
                            fontSize: 12,
                            fontFamily: 'Pretendard',
                            fontWeight: '500',
                            textAlign: 'center'
                        }}>
                            {copyMessage}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// 계좌 아이템 컴포넌트
interface AccountItemProps {
    label: string
    name: string
    account: string
    bank: string
    onCopy: () => void
}

const AccountItem = React.memo(function AccountItem({
    label,
    name,
    account,
    bank,
    onCopy
}: AccountItemProps) {
    return (
        <div style={{
            alignSelf: 'stretch',
            height: 54,
            paddingBottom: 20,
            borderBottom: '1px #F5F5F5 solid',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: 5,
            display: 'flex'
        }}>
            <div style={{
                color: '#707070',
                fontSize: 14,
                fontFamily: 'Pretendard',
                fontWeight: '600',
                wordWrap: 'break-word'
            }}>
                {label}
            </div>
            <div style={{
                alignSelf: 'stretch',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                display: 'inline-flex'
            }}>
                <div style={{
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: 10,
                    display: 'flex'
                }}>
                    <div style={{
                        color: 'black',
                        fontSize: 14,
                        fontFamily: 'Pretendard',
                        fontWeight: '600',
                        wordWrap: 'break-word'
                    }}>
                        {name}
                    </div>
                    <div style={{
                        color: 'black',
                        fontSize: 14,
                        fontFamily: 'Pretendard',
                        fontWeight: '400',
                        wordWrap: 'break-word'
                    }}>
                        {account}
                    </div>
                    <div style={{
                        color: 'black',
                        fontSize: 14,
                        fontFamily: 'Pretendard',
                        fontWeight: '400',
                        wordWrap: 'break-word'
                    }}>
                        {bank}
                    </div>
                </div>
                <div style={{
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: 5,
                    display: 'flex',
                    cursor: 'pointer'
                }} onClick={onCopy}>
                    <div style={{
                        width: 7.36,
                        height: 9.42,
                        outline: '1px #7F7F7F solid',
                        outlineOffset: '-0.50px'
                    }} />
                    <div style={{
                        width: 7.20,
                        height: 9.27,
                        outline: '1px #7F7F7F solid',
                        outlineOffset: '-0.50px'
                    }} />
                    <div style={{
                        color: '#8C8C8C',
                        fontSize: 14,
                        fontFamily: 'Pretendard',
                        fontWeight: '400',
                        wordWrap: 'break-word'
                    }}>
                        복사
                    </div>
                </div>
            </div>
        </div>
    )
})

// 기본 props 설정
AccountBtn.defaultProps = {
    pageId: "default",
}

// Property Controls 정의
addPropertyControls(AccountBtn, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        description: "계좌 정보와 연결할 페이지 식별자",
        defaultValue: "default",
    },
})
