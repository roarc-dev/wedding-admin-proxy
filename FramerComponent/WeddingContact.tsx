import React, { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 280
 * @framerIntrinsicHeight 50
 */

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

// 글로벌 캐시 및 프리로딩 시스템
const contactCache = new Map()
const CACHE_DURATION = 10 * 60 * 1000 // 10분으로 연장
const PRELOAD_DELAY = 100 // 100ms 후 프리로딩 시작

// 프리로딩 함수 (백그라운드에서 실행)
const preloadContactInfo = async (pageId: string) => {
    if (!pageId) return

    const cacheKey = `contact_${pageId}`
    const cached = contactCache.get(cacheKey)

    // 캐시가 유효하면 프리로딩 불필요
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return
    }

    try {
        console.log(`🚀 Preloading contact data for pageId: ${pageId}`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5초 타임아웃

        const response = await fetch(
            `${PROXY_BASE_URL}/api/contacts?pageId=${pageId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                signal: controller.signal,
            }
        )

        clearTimeout(timeoutId)

        if (response.ok) {
            const result = await response.json()
            if (result.success && result.data?.length > 0) {
                // 백그라운드 캐시 저장
                contactCache.set(cacheKey, {
                    data: result.data[0],
                    timestamp: Date.now(),
                })
                console.log(`✅ Preloaded contact data for pageId: ${pageId}`)
            }
        }
    } catch (error) {
        // 프리로딩 실패는 조용히 처리 (사용자에게 노출하지 않음)
        console.log(`⚠️ Preload failed for pageId: ${pageId}`, error)
    }
}

// 글로벌 프리로딩 스케줄러
const schedulePreload = (pageId: string) => {
    setTimeout(() => preloadContactInfo(pageId), PRELOAD_DELAY)
}

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
        if (cleaned.startsWith("02")) { // 서울 지역번호
            return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 6)}-${cleaned.substring(6)}`
        } else { // 기타 지역번호나 특수번호
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
    const [isLoading, setIsLoading] = useState(true)

    // 즉시 캐시 확인 및 프리로딩 스케줄링
    useEffect(() => {
        if (!pageId) {
            setIsLoading(false)
            return
        }

        // 1. 즉시 캐시 확인
        const cacheKey = `contact_${pageId}`
        const cached = contactCache.get(cacheKey)

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log(`💾 Using cached data for pageId: ${pageId}`)
            setContactInfo(cached.data)
            setError(null)
            setIsLoading(false)
            return
        }

        // 2. 캐시가 없으면 즉시 로딩 시작
        fetchContactInfo()

        // 3. 향후 사용을 위해 백그라운드 프리로딩 스케줄링
        schedulePreload(pageId)
    }, [pageId])

    // 연락처 정보 가져오기 (최적화된 버전)
    const fetchContactInfo = useCallback(async () => {
        if (!pageId) {
            setIsLoading(false)
            return
        }

        setError(null)

        // 로딩 상태는 캐시가 없을 때만 true로 설정
        const cacheKey = `contact_${pageId}`
        const cached = contactCache.get(cacheKey)
        if (!cached || Date.now() - cached.timestamp >= CACHE_DURATION) {
            setIsLoading(true)
        }

        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 8000) // 8초 타임아웃

            const url = `${PROXY_BASE_URL}/api/contacts?pageId=${pageId}`

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`
                )
            }

            const result = await response.json()

            if (result.success) {
                if (result.data && result.data.length > 0) {
                    const contactData = result.data[0]
                    setContactInfo(contactData)

                    // 캐시에 저장
                    contactCache.set(cacheKey, {
                        data: contactData,
                        timestamp: Date.now(),
                    })
                } else {
                    throw new Error(
                        `페이지 ID "${pageId}"에 해당하는 연락처 정보를 찾을 수 없습니다.`
                    )
                }
            } else {
                throw new Error(
                    result.error || "연락처 정보를 불러오는데 실패했습니다."
                )
            }
        } catch (err) {
            console.error("연락처 정보 조회 실패:", err)

            if (err instanceof Error) {
                if (err.name === "AbortError") {
                    setError(
                        "연결 시간이 초과되었습니다. 네트워크 상태를 확인해주세요."
                    )
                } else {
                    setError(err.message)
                }
            } else {
                setError("연락처 정보를 불러오는데 실패했습니다.")
            }
        } finally {
            setIsLoading(false)
        }
    }, [pageId])

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

    // 재시도 함수
    const retry = () => {
        // 캐시 클리어 후 재시도
        contactCache.delete(`contact_${pageId}`)
        fetchContactInfo()
    }

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

                        {/* 로딩 상태 */}
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    textAlign: "center",
                                    padding: "40px",
                                    color: "#6B7280",
                                }}
                            >
                                <div style={{ fontSize: "12px" }}>
                                    연락처 불러오는 중
                                </div>
                            </motion.div>
                        )}

                        {/* 에러 상태 */}
                        {error && !isLoading && (
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
