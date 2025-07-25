import React, { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query"

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 280
 * @framerIntrinsicHeight 50
 */

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

// React Query Client 설정 (최적화)
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5분
            gcTime: 15 * 60 * 1000, // 15분 (구 cacheTime)
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: true,
            retry: 2,
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
    },
})

// 고급 캐싱 시스템 (React Query와 병행)
const contactCache = new Map()
const CACHE_DURATION = 15 * 60 * 1000 // 15분으로 연장
const STALE_WHILE_REVALIDATE = 5 * 60 * 1000 // 5분 후 백그라운드 갱신
const PRELOAD_DELAY = 50 // 50ms 후 프리로딩 시작
const MAX_RETRIES = 2 // 최대 재시도 횟수

// 요청 최적화 옵션
const FETCH_OPTIONS = {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Cache-Control": "public, max-age=60"
    },
    keepalive: true, // 연결 재사용
}

// React Query용 데이터 fetcher
const fetchContactData = async (pageId: string): Promise<ContactInfo> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
        const response = await fetchWithRetry(`${PROXY_BASE_URL}/api/contacts?pageId=${pageId}`, {
            ...FETCH_OPTIONS,
            signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const result = await response.json()

        if (result.success && result.data?.length > 0) {
            return result.data[0]
        }

        throw new Error(`페이지 ID "${pageId}"에 해당하는 연락처 정보를 찾을 수 없습니다.`)
    } catch (error) {
        clearTimeout(timeoutId)
        throw error
    }
}

// 프리로딩 함수 (React Query 활용)
const preloadContactInfo = async (pageId: string) => {
    if (!pageId) return

    try {
        await queryClient.prefetchQuery({
            queryKey: ['contacts', pageId],
            queryFn: () => fetchContactData(pageId),
            staleTime: STALE_WHILE_REVALIDATE,
        })
        console.log(`✅ Preloaded contact data for pageId: ${pageId}`)
    } catch (error) {
        console.log(`⚠️ Preload failed for pageId: ${pageId}`)
    }
}

// 글로벌 프리로딩 스케줄러
const schedulePreload = (pageId: string) => {
    setTimeout(() => preloadContactInfo(pageId), PRELOAD_DELAY)
}

// Stale-While-Revalidate 전략 구현
const shouldRevalidate = (cached: any): boolean => {
    return Date.now() - cached.timestamp > STALE_WHILE_REVALIDATE
}

// 재시도 로직 구현
const fetchWithRetry = async (url: string, options: RequestInit, maxRetries: number = MAX_RETRIES): Promise<Response> => {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options)
            if (response.ok) {
                return response
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        } catch (error) {
            lastError = error as Error
            
            // 마지막 시도가 아니면 지수 백오프로 재시도
            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 5000) // 최대 5초
                await new Promise(resolve => setTimeout(resolve, delay))
                console.log(`🔄 Retrying request (attempt ${attempt + 2}/${maxRetries + 1})`)
            }
        }
    }
    
    throw lastError
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

// React Query를 사용한 최적화된 컴포넌트
function WeddingContactInner(props: WeddingContactProps) {
    const { pageId = "demo", callIcon = "", smsIcon = "", style = {} } = props

    const [viewState, setViewState] = useState<ViewState>("selection")
    
    // React Query로 데이터 관리
    const {
        data: contactInfo,
        error,
        isLoading,
        isFetching,
        refetch
    } = useQuery({
        queryKey: ['contacts', pageId],
        queryFn: () => fetchContactData(pageId),
        enabled: !!pageId,
        staleTime: 5 * 60 * 1000, // 5분
        gcTime: 15 * 60 * 1000, // 15분
        retry: 2,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    })

    // 프리로딩 스케줄링
    useEffect(() => {
        if (pageId) {
            schedulePreload(pageId)
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
            ].filter((contact) => contact.name && contact.phone),
            bride: [
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
        refetch()
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
                                duration: 0.2,
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
                                <div style={{ fontSize: "14px" }}>
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
                                    {error instanceof Error ? error.message : String(error)}
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

// QueryClientProvider로 래핑된 메인 컴포넌트
export default function WeddingContact(props: WeddingContactProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <WeddingContactInner {...props} />
        </QueryClientProvider>
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
