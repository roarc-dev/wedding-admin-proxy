import React, { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 280
 * @framerIntrinsicHeight 50
 */


// 전화번호 형식 변환 함수 (어떤 형식이든 010-1234-5678 형식으로 변환)
const formatPhoneNumber = (phone: string): string => {
    if (!phone) return ""

    // 모든 구분자 제거 (하이픈, 점, 공백 등)
    const cleaned = phone.replace(/[\s.\-()]/g, "")

    // 11자리 전화번호 (대부분의 휴대폰 번호)
    if (cleaned.length === 11 && cleaned.startsWith("010")) {
        return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 7)}-${cleaned.substring(7)}`
    }

    // 10자리 전화번호 (일부 지역번호 또는 특수번호)
    if (cleaned.length === 10) {
        if (cleaned.startsWith("02")) {
            // 서울 지역번호
            return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 6)}-${cleaned.substring(6)}`
        } else {
            // 기타 지역번호나 특수번호
            return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`
        }
    }

    // 8자리 전화번호 (일부 지역번호)
    if (cleaned.length === 8) {
        return `${cleaned.substring(0, 4)}-${cleaned.substring(4)}`
    }

    // 그 외의 경우 원래 형식 유지 (잘못된 형식일 수 있음)
    return phone
}

interface ContactInfo {
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
}

interface WeddingContactLocalProps {
    contactInfo?: ContactInfo
    callIcon?: string
    smsIcon?: string
    style?: React.CSSProperties
}

type ViewState = "closed" | "selection" | "groom" | "bride"

export default function WeddingContactLocal(props: WeddingContactLocalProps) {
    const { contactInfo: propContactInfo, callIcon = "", smsIcon = "", style = {} } = props

    const [viewState, setViewState] = useState<ViewState>("selection")

    const defaultContactInfo: ContactInfo = {
        groom_name: "김신랑",
        groom_phone: "010-1234-5678",
        groom_father_name: "김아버지",
        groom_father_phone: "010-1111-2222",
        groom_mother_name: "김어머니",
        groom_mother_phone: "010-3333-4444",
        bride_name: "박신부",
        bride_phone: "010-5678-9012",
        bride_father_name: "박아버지",
        bride_father_phone: "010-5555-6666",
        bride_mother_name: "박어머니",
        bride_mother_phone: "010-7777-8888",
    }

    const contactInfo = propContactInfo || defaultContactInfo

    // 연락처 데이터 메모이제이션
    const processedContacts = useMemo(() => {
        if (!contactInfo) return { groom: [], bride: [] }

        return {
            groom: [
                {
                    label: "신랑",
                    name: contactInfo.groom_name,
                    phone: formatPhoneNumber(contactInfo.groom_phone),
                },
                {
                    label: "혼주",
                    name: contactInfo.groom_father_name,
                    phone: formatPhoneNumber(contactInfo.groom_father_phone),
                },
                {
                    label: "혼주",
                    name: contactInfo.groom_mother_name,
                    phone: formatPhoneNumber(contactInfo.groom_mother_phone),
                },
            ].filter((contact) => contact.name && contact.phone),
            bride: [
                {
                    label: "신부",
                    name: contactInfo.bride_name,
                    phone: formatPhoneNumber(contactInfo.bride_phone),
                },
                {
                    label: "혼주",
                    name: contactInfo.bride_father_name,
                    phone: formatPhoneNumber(contactInfo.bride_father_phone),
                },
                {
                    label: "혼주",
                    name: contactInfo.bride_mother_name,
                    phone: formatPhoneNumber(contactInfo.bride_mother_phone),
                },
            ].filter((contact) => contact.name && contact.phone),
        }
    }, [contactInfo])

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

    // 전화 걸기 (최적화)
    const makeCall = useCallback((phone: string) => {
        const cleanPhone = phone.replace(/-/g, "")
        window.open(`tel:${cleanPhone}`, "_self")
    }, [])

    // 문자 보내기 (최적화)
    const sendSMS = useCallback((phone: string) => {
        const cleanPhone = phone.replace(/-/g, "")
        window.open(`sms:${cleanPhone}`, "_self")
    }, [])


    return (
        <>
            {/* 모달 컨테이너 */}
            <AnimatePresence>
                {true && (
                    <motion.div
                        layout
                        transition={{
                            layout: {
                                type: "ease",
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

                        {/* 컨텐츠 영역 */}
                        {contactInfo && (
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
                                            layout={false} // ← 이 속성 추가!
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
                                                flexShrink: 0,
                                                aspectRatio: "1 / 1",
                                                justifyContent: "center",
                                            }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            신랑측
                                        </motion.button>

                                        <motion.button
                                            layout={false} // ← 이 속성 추가!
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
                                                flexShrink: 0,
                                                aspectRatio: "1 / 1",
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
                                                contacts={
                                                    processedContacts.groom
                                                }
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
                                                contacts={
                                                    processedContacts.bride
                                                }
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

// 연락처 리스트 컴포넌트 (최적화)
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

const ContactList = React.memo(function ContactList({
    contacts,
    onCall,
    onSMS,
    callIcon,
    smsIcon,
}: ContactListProps) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "0px",
            }}
        >
            {contacts.map((contact, index) => (
                <ContactItem
                    key={`${contact.name}-${contact.phone}-${index}`}
                    label={contact.label}
                    name={contact.name}
                    phone={contact.phone}
                    onCall={onCall}
                    onSMS={onSMS}
                    showBorder={index < contacts.length - 1}
                    callIcon={callIcon}
                    smsIcon={smsIcon}
                />
            ))}
        </div>
    )
})

// 연락처 아이템 컴포넌트 (최적화)
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

const ContactItem = React.memo(function ContactItem({
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

    // 콜백 최적화
    const handleCall = useCallback(() => onCall(phone), [onCall, phone])
    const handleSMS = useCallback(() => onSMS(phone), [onSMS, phone])

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
                    onClick={handleCall}
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
                    onClick={handleSMS}
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
})

// Property Controls
addPropertyControls(WeddingContactLocal, {
    contactInfo: {
        type: ControlType.Object,
        title: "연락처 정보",
        controls: {
            groom_name: {
                type: ControlType.String,
                title: "신랑 이름",
                defaultValue: "김신랑",
            },
            groom_phone: {
                type: ControlType.String,
                title: "신랑 전화번호",
                defaultValue: "010-1234-5678",
            },
            groom_father_name: {
                type: ControlType.String,
                title: "신랑 아버지 이름",
                defaultValue: "김아버지",
            },
            groom_father_phone: {
                type: ControlType.String,
                title: "신랑 아버지 전화번호",
                defaultValue: "010-1111-2222",
            },
            groom_mother_name: {
                type: ControlType.String,
                title: "신랑 어머니 이름",
                defaultValue: "김어머니",
            },
            groom_mother_phone: {
                type: ControlType.String,
                title: "신랑 어머니 전화번호",
                defaultValue: "010-3333-4444",
            },
            bride_name: {
                type: ControlType.String,
                title: "신부 이름",
                defaultValue: "박신부",
            },
            bride_phone: {
                type: ControlType.String,
                title: "신부 전화번호",
                defaultValue: "010-5678-9012",
            },
            bride_father_name: {
                type: ControlType.String,
                title: "신부 아버지 이름",
                defaultValue: "박아버지",
            },
            bride_father_phone: {
                type: ControlType.String,
                title: "신부 아버지 전화번호",
                defaultValue: "010-5555-6666",
            },
            bride_mother_name: {
                type: ControlType.String,
                title: "신부 어머니 이름",
                defaultValue: "박어머니",
            },
            bride_mother_phone: {
                type: ControlType.String,
                title: "신부 어머니 전화번호",
                defaultValue: "010-7777-8888",
            },
        },
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
