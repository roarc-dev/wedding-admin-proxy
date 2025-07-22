import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 280
 * @framerIntrinsicHeight 50
 */

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy-git-main-roarcs-projects.vercel.app"

interface ContactInfo {
    id?: string
    page_id: string
    groom_name: string
    groom_phone: string
    groom_father_name: string
    groom_father_phone: string
    groom_mother_name: string
    groom_mother_phone: string
    bride_name: string
    bride_phone: string
    bride_father_name: string
    bride_father_phone: string
    bride_mother_name: string
    bride_mother_phone: string
    created_at?: string
    updated_at?: string
}

interface WeddingContactProps {
    pageId: string
    callIcon?: string
    smsIcon?: string
    style?: React.CSSProperties
}

type ViewState = "closed" | "selection" | "groom" | "bride"

export default function WeddingContact(props: WeddingContactProps) {
    const { pageId = "demo", callIcon = "", smsIcon = "", style = {} } = props

    const [viewState, setViewState] = useState<ViewState>("selection")
    const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)
    const [error, setError] = useState<string | null>(null)

    // 연락처 정보 가져오기
    const fetchContactInfo = useCallback(async () => {
        if (!pageId) return

        setError(null)

        try {
            const response = await fetch(`${PROXY_BASE_URL}/api/contacts?pageId=${pageId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const result = await response.json()
            
            if (result.success) {
                if (result.data && result.data.length > 0) {
                    setContactInfo(result.data[0])
                } else {
                    throw new Error(`페이지 ID "${pageId}"에 해당하는 연락처 정보를 찾을 수 없습니다.`)
                }
            } else {
                throw new Error(result.error || '연락처 정보를 불러오는데 실패했습니다.')
            }
        } catch (err) {
            console.error("연락처 정보 조회 실패:", err)
            setError(
                err instanceof Error
                    ? err.message
                    : "연락처 정보를 불러오는데 실패했습니다."
            )
        }
    }, [pageId])

    // 컴포넌트 마운트 시 연락처 정보 fetch
    useEffect(() => {
        fetchContactInfo()
    }, [fetchContactInfo])

    // 모달 닫기
    const closeModal = () => {
        setViewState("closed")
    }

    // 뒤로가기
    const goBack = () => {
        setViewState("selection")
    }

    // 신랑측 보기
    const showGroomContacts = () => {
        setViewState("groom")
    }

    // 신부측 보기
    const showBrideContacts = () => {
        setViewState("bride")
    }

    // 전화 걸기
    const makeCall = (phone: string) => {
        // 전화번호에서 하이픈 제거
        const cleanPhone = phone.replace(/-/g, "")
        window.open(`tel:${cleanPhone}`, "_self")
    }

    // 문자 보내기
    const sendSMS = (phone: string) => {
        // 전화번호에서 하이픈 제거
        const cleanPhone = phone.replace(/-/g, "")
        window.open(`sms:${cleanPhone}`, "_self")
    }

    // 재시도 함수
    const retry = () => {
        fetchContactInfo()
    }

    return (
        <>
            {/* 모달 컨테이너 */}
            <AnimatePresence>
                {true && (
                    <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            opacity: { duration: 0.1 },
                            layout: {
                                type: "linear",
                                duration: 0.1,
                            },
                        }}
                        style={{
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
                            ...style,
                        }}
                    >
                        {/* 헤더 */}
                        <div
                            style={{
                                margin: "-20px -20px 20px -20px",
                                backgroundColor: "#121212",
                                borderRadius: "0px 0px 0 0",
                                paddingTop: "20px",
                                padding: "14px 20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: "14px",
                                    fontFamily: "Pretendard SemiBold",
                                    color: "#FFFFFF",
                                    margin: 0,
                                    flex: 1,
                                    textAlign: "center",
                                }}
                            >
                                축하 연락하기
                            </h2>
                        </div>

                        {/* 에러 상태 */}
                        {error && (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "40px",
                                    color: "#EF4444",
                                }}
                            >
                                <div style={{ marginBottom: "15px" }}>⚠️</div>
                                <div
                                    style={{
                                        marginBottom: "20px",
                                        fontSize: "14px",
                                    }}
                                >
                                    {error}
                                </div>
                                <motion.button
                                    onClick={retry}
                                    style={{
                                        backgroundColor: "#EF4444",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "5px",
                                        padding: "10px 20px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    다시 시도
                                </motion.button>
                            </div>
                        )}

                        {/* 컨텐츠 영역 */}
                        {contactInfo && !error && (
                            <>
                                {/* 신랑측/신부측 선택 화면 */}
                                {viewState === "selection" && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            gap: "30px",
                                            alignItems: "center",
                                            margin: "0px 0",
                                        }}
                                    >
                                        <motion.button
                                            onClick={showGroomContacts}
                                            style={{
                                                width: "90px",
                                                height: "90px",
                                                backgroundColor: "#EDEDED",
                                                border: "none",
                                                borderRadius: "50%",
                                                fontSize: "16px",
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                                color: "#1F2937",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            신랑측
                                        </motion.button>

                                        <motion.button
                                            onClick={showBrideContacts}
                                            style={{
                                                width: "90px",
                                                height: "90px",
                                                backgroundColor: "#EDEDED",
                                                border: "none",
                                                borderRadius: "50%",
                                                fontSize: "16px",
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                                color: "#1F2937",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            신부측
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* 신랑측 연락처 */}
                                {viewState === "groom" && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            height: "100%",
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <ContactList
                                                contacts={[
                                                    {
                                                        label: "신랑",
                                                        name: contactInfo.groom_name,
                                                        phone: contactInfo.groom_phone,
                                                    },
                                                    {
                                                        label: "혼주",
                                                        name: contactInfo.groom_father_name,
                                                        phone: contactInfo.groom_father_phone,
                                                    },
                                                    {
                                                        label: "혼주",
                                                        name: contactInfo.groom_mother_name,
                                                        phone: contactInfo.groom_mother_phone,
                                                    },
                                                ]}
                                                onCall={makeCall}
                                                onSMS={sendSMS}
                                                callIcon={callIcon}
                                                smsIcon={smsIcon}
                                            />
                                        </div>

                                        {/* 뒤로가기 영역 */}
                                        <div
                                            style={{
                                                height: "0px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                marginTop: "12px",
                                                marginBottom: "12px",
                                                cursor: "pointer",
                                            }}
                                            onClick={goBack}
                                        >
                                            <span
                                                style={{
                                                    fontFamily:
                                                        "Pretendard Regular",
                                                    fontSize: "14px",
                                                    color: "#8c8c8c",
                                                }}
                                            >
                                                뒤로가기
                                            </span>
                                        </div>
                                    </motion.div>
                                )}

                                {/* 신부측 연락처 */}
                                {viewState === "bride" && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            height: "100%",
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <ContactList
                                                contacts={[
                                                    {
                                                        label: "신부",
                                                        name: contactInfo.bride_name,
                                                        phone: contactInfo.bride_phone,
                                                    },
                                                    {
                                                        label: "혼주",
                                                        name: contactInfo.bride_father_name,
                                                        phone: contactInfo.bride_father_phone,
                                                    },
                                                    {
                                                        label: "혼주",
                                                        name: contactInfo.bride_mother_name,
                                                        phone: contactInfo.bride_mother_phone,
                                                    },
                                                ]}
                                                onCall={makeCall}
                                                onSMS={sendSMS}
                                                callIcon={callIcon}
                                                smsIcon={smsIcon}
                                            />
                                        </div>

                                        {/* 뒤로가기 영역 */}
                                        <div
                                            style={{
                                                height: "12px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                marginTop: "12px",
                                                cursor: "pointer",
                                            }}
                                            onClick={goBack}
                                        >
                                            <span
                                                style={{
                                                    fontFamily:
                                                        "Pretendard Regular",
                                                    lineHeight: 1.4,
                                                    fontSize: "14px",
                                                    color: "#8c8c8c",
                                                }}
                                            >
                                                뒤로가기
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

// 연락처 리스트 컴포넌트
interface Contact {
    label: string
    name: string
    phone: string
}

interface ContactListProps {
    contacts: Contact[]
    onCall: (phone: string) => void
    onSMS: (phone: string) => void
    callIcon?: string
    smsIcon?: string
}

function ContactList({
    contacts,
    onCall,
    onSMS,
    callIcon,
    smsIcon,
}: ContactListProps) {
    // 유효한 연락처만 필터링
    const validContacts = contacts.filter(
        (contact) => contact.name && contact.phone
    )

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "0px",
            }}
        >
            {validContacts.map((contact, index) => (
                <ContactItem
                    key={index}
                    label={contact.label}
                    name={contact.name}
                    phone={contact.phone}
                    onCall={onCall}
                    onSMS={onSMS}
                    showBorder={index < validContacts.length - 1}
                    callIcon={callIcon}
                    smsIcon={smsIcon}
                />
            ))}
        </div>
    )
}

// 연락처 아이템 컴포넌트
interface ContactItemProps {
    label: string
    name: string
    phone: string
    onCall: (phone: string) => void
    onSMS: (phone: string) => void
    showBorder?: boolean
    callIcon?: string
    smsIcon?: string
}

function ContactItem({
    label,
    name,
    phone,
    onCall,
    onSMS,
    showBorder = true,
    callIcon,
    smsIcon,
}: ContactItemProps) {
    if (!name || !phone) return null

    return (
        <div
            style={{
                height: "64px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: showBorder ? "1px solid #E5E7EB" : "none",
                padding: 0,
                margin: 0,
            }}
        >
            {/* 왼쪽: label, name, phone 묶음 */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    height: "100%",
                    gap: 0,
                }}
            >
                <div
                    style={{
                        fontSize: "14px",
                        fontFamily: "Pretendard SemiBold",
                        color: "#707070",
                        marginBottom: 0,
                        lineHeight: 1.4,
                    }}
                >
                    {label}
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: 0,
                    }}
                >
                    <div
                        style={{
                            fontSize: "16px",
                            fontFamily: "Pretendard SemiBold",
                            color: "#1F2937",
                            lineHeight: 1.4,
                        }}
                    >
                        {name}
                    </div>
                    <div
                        style={{
                            fontSize: "16px",
                            fontFamily: "Pretendard Regular",
                            color: "#000000",
                            lineHeight: 1,
                        }}
                    >
                        {phone}
                    </div>
                </div>
            </div>
            {/* 오른쪽: 아이콘(전화/문자) */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "12px",
                    alignItems: "center",
                    height: "100%",
                    marginBottom: "4px",
                    opacity: "50%",
                }}
            >
                <motion.button
                    onClick={() => onCall(phone)}
                    style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        border: "none",
                        backgroundColor: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    {callIcon ? (
                        <img
                            src={callIcon}
                            alt="통화"
                            style={{
                                width: "18px",
                                height: "18px",
                                objectFit: "contain",
                            }}
                        />
                    ) : (
                        <span style={{ fontSize: "16px" }}>📞</span>
                    )}
                </motion.button>
                <motion.button
                    onClick={() => onSMS(phone)}
                    style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        border: "none",
                        backgroundColor: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    {smsIcon ? (
                        <img
                            src={smsIcon}
                            alt="문자"
                            style={{
                                width: "18px",
                                height: "18px",
                                objectFit: "contain",
                            }}
                        />
                    ) : (
                        <span style={{ fontSize: "16px" }}>💬</span>
                    )}
                </motion.button>
            </div>
        </div>
    )
}

// Property Controls
addPropertyControls(WeddingContact, {
    pageId: {
        type: ControlType.String,
        title: "페이지 ID",
        defaultValue: "demo",
        description: "각 결혼식 페이지를 구분하는 고유 ID",
    },
    callIcon: {
        type: ControlType.File,
        title: "통화 아이콘",
        allowedFileTypes: ["image/*"],
        description: "통화 버튼에 사용할 아이콘 이미지",
    },
    smsIcon: {
        type: ControlType.File,
        title: "문자 아이콘",
        allowedFileTypes: ["image/*"],
        description: "문자 버튼에 사용할 아이콘 이미지",
    },
})
