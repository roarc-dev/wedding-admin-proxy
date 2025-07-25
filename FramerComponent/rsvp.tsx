import React, { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

// 타입 정의
interface RSVPAttendee {
    guest_name?: string
    guest_type?: "신랑측" | "신부측"
    relation_type?: "참석" | "미참석"
    guest_count?: number
    meal_time?: "식사 가능" | "식사 불가"
    phone_number?: string
    consent_personal_info?: boolean
    page_id?: string
    created_at?: string
}

interface RSVPProps {
    pageId?: string
    showOnlyAttending?: boolean
    style?: React.CSSProperties
    backgroundColor?: string
    cardBackgroundColor?: string
    headerColor?: string
    textColor?: string
    borderColor?: string
    accentColor?: string
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 1000
 */
// 프록시 서버 URL (GalleryThumb.tsx 참고)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

export default function RSVPAttendeeList(props: RSVPProps) {
    const {
        pageId = "",
        showOnlyAttending = false,
        style,
        backgroundColor = "#f9fafb",
        cardBackgroundColor = "#ffffff",
        headerColor = "#1f2937",
        textColor = "#374151",
        borderColor = "#e5e7eb",
        accentColor = "#3b82f6",
    } = props

    const [attendees, setAttendees] = useState<RSVPAttendee[]>([])
    const [filteredAttendees, setFilteredAttendees] = useState<RSVPAttendee[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [summary, setSummary] = useState({
        total: 0,
        attending: 0,
        notAttending: 0,
        groomSide: 0,
        brideSide: 0,
        groomSideAttending: 0,
        brideSideAttending: 0,
        totalGuests: 0,
        groomMealCount: 0,
        brideMealCount: 0,
        mealCount: 0,
        mealYes: 0,
        mealNo: 0,
    })

    // 데이터 로드 함수
    const loadAttendees = async () => {
        if (!pageId.trim()) {
            setError("페이지 ID를 입력해주세요.")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const url = `${PROXY_BASE_URL}/api/rsvp`
            
            const requestBody = {
                action: "getByPageId",
                pageId: pageId.trim(),
                showOnlyAttending: showOnlyAttending,
            }
            
            console.log('Sending request to:', url)
            console.log('Request body:', JSON.stringify(requestBody, null, 2))

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            })

            console.log('Response status:', response.status)
            console.log('Response headers:', Object.fromEntries(response.headers.entries()))

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Error response:', errorText)
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }

            const result = await response.json()
            console.log('Response result:', result)
            
            if (result.success) {
                setAttendees(result.data)
                setFilteredAttendees(result.data)
                calculateSummary(result.data)
            } else {
                throw new Error(result.error || "데이터를 가져올 수 없습니다")
            }
        } catch (error: any) {
            console.error("데이터 로드 에러:", error)
            setError(`데이터 로드 실패: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    // 요약 통계 계산
    const calculateSummary = (data: RSVPAttendee[]) => {
        const attendingData = data.filter(
            (item) => item.relation_type === "참석"
        )
        const groomData = data.filter((item) => item.guest_type === "신랑측")
        const brideData = data.filter((item) => item.guest_type === "신부측")
        const groomAttendingData = attendingData.filter(
            (item) => item.guest_type === "신랑측"
        )
        const brideAttendingData = attendingData.filter(
            (item) => item.guest_type === "신부측"
        )

        const stats = {
            total: data.length,
            attending: attendingData.length,
            notAttending: data.filter((item) => item.relation_type === "미참석")
                .length,
            groomSide: groomData.length,
            brideSide: brideData.length,
            groomSideAttending: groomAttendingData.length,
            brideSideAttending: brideAttendingData.length,
            totalGuests: attendingData.reduce(
                (sum, item) => sum + (item.guest_count || 0),
                0
            ),
            groomMealCount: groomAttendingData
                .filter((item) => item.meal_time === "식사 가능")
                .reduce((sum, item) => sum + (item.guest_count || 0), 0),
            brideMealCount: brideAttendingData
                .filter((item) => item.meal_time === "식사 가능")
                .reduce((sum, item) => sum + (item.guest_count || 0), 0),
            mealYes: data.filter((item) => item.meal_time === "식사 가능")
                .length,
            mealNo: data.filter((item) => item.meal_time === "식사 불가")
                .length,
            mealCount: attendingData
                .filter((item) => item.meal_time === "식사 가능")
                .reduce((sum, item) => sum + (item.guest_count || 0), 0),
        }
        setSummary(stats)
    }

    // 검색 및 필터링 적용
    const applyFilters = () => {
        let filtered = [...attendees]

        // 검색어 필터링
        if (searchTerm.trim()) {
            filtered = filtered.filter(
                (item) =>
                    (item.guest_name || "")
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    (item.phone_number || "").includes(searchTerm)
            )
        }

        // 타입 필터링
        if (filterType !== "all") {
            filtered = filtered.filter((item) => {
                switch (filterType) {
                    case "attending":
                        return item.relation_type === "참석"
                    case "notAttending":
                        return item.relation_type === "미참석"
                    case "groomSide":
                        return item.guest_type === "신랑측"
                    case "brideSide":
                        return item.guest_type === "신부측"
                    case "mealYes":
                        return item.meal_time === "식사 가능"
                    case "mealNo":
                        return item.meal_time === "식사 불가"
                    default:
                        return true
                }
            })
        }

        setFilteredAttendees(filtered)
        setCurrentPage(1)
    }

    // CSV 다운로드 함수
    const downloadCSV = () => {
        if (filteredAttendees.length === 0) return

        const headers = [
            "성함",
            "신랑측/신부측",
            "참석여부",
            "인원",
            "식사여부",
            "연락처",
            "개인정보동의",
            "페이지ID",
            "등록일시",
        ]

        const csvData = filteredAttendees.map((attendee) => [
            attendee.guest_name || "",
            attendee.guest_type || "",
            attendee.relation_type || "",
            attendee.guest_count || "",
            attendee.meal_time || "",
            attendee.phone_number || "",
            attendee.consent_personal_info ? "동의" : "미동의",
            attendee.page_id || "",
            formatDate(attendee.created_at),
        ])

        const csvContent = [headers, ...csvData]
            .map((row) => row.map((cell) => `"${cell}"`).join(","))
            .join("\n")

        const BOM = "\uFEFF"
        const blob = new Blob([BOM + csvContent], {
            type: "text/csv;charset=utf-8;",
        })

        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)

        const fileName = `rsvp_${pageId || "data"}_${new Date().toISOString().split("T")[0]}.csv`
        link.setAttribute("download", fileName)

        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // 날짜 포맷팅 함수
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return ""
        const date = new Date(dateString)
        return date.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    // 페이지네이션 계산
    const totalPages = Math.ceil(filteredAttendees.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentItems = filteredAttendees.slice(startIndex, endIndex)

    // 페이지 변경 함수
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        if (pageId.trim()) {
            loadAttendees()
        }
    }, [pageId, showOnlyAttending])

    // 검색/필터 변경 시 적용
    useEffect(() => {
        applyFilters()
    }, [searchTerm, filterType, attendees])

    const containerStyle = {
        ...style,
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "24px",
        backgroundColor: backgroundColor,
        borderRadius: "0px",
        minHeight: "600px",
        fontFamily: "Pretendard Regular",
    }

    return (
        <div style={containerStyle}>
            {/* 헤더 */}
            <div style={{ marginBottom: "16px" }}>
                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        onClick={loadAttendees}
                        disabled={isLoading || !pageId.trim()}
                        style={{
                            padding: "8px 16px",
                            backgroundColor:
                                isLoading || !pageId.trim()
                                    ? "#9ca3af"
                                    : "#4b5563",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "0px",
                            fontSize: "14px",
                            fontFamily: "Pretendard Regular",
                            cursor:
                                isLoading || !pageId.trim()
                                    ? "not-allowed"
                                    : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#clip0_1238_21)">
                                <path d="M5.45312 13.2188C8.46875 13.2188 10.9062 10.7734 10.9062 7.75781C10.9062 7.44531 10.6484 7.19531 10.3438 7.19531C10.0391 7.19531 9.78125 7.44531 9.78125 7.75781C9.78125 10.1484 7.84375 12.0781 5.45312 12.0781C3.0625 12.0781 1.125 10.1484 1.125 7.75781C1.125 5.36719 3.0625 3.42969 5.45312 3.42969C5.96094 3.42969 6.44531 3.50781 6.89844 3.67188C7.25781 3.8125 7.6875 3.60938 7.6875 3.16406C7.6875 2.79688 7.41406 2.67969 7.23438 2.61719C6.67969 2.41406 6.07812 2.3125 5.45312 2.3125C2.4375 2.3125 0 4.75 0 7.76562C0 10.7734 2.4375 13.2188 5.45312 13.2188ZM7.01562 3.07031L4.89844 5.14844C4.78906 5.25 4.74219 5.39844 4.74219 5.53906C4.74219 5.85938 4.98438 6.10156 5.28906 6.10156C5.46875 6.10156 5.59375 6.03906 5.69531 5.94531L8.16406 3.47656C8.27344 3.36719 8.32812 3.23438 8.32812 3.07031C8.32812 2.92188 8.26562 2.77344 8.16406 2.67188L5.69531 0.171875C5.59375 0.0703125 5.46094 0 5.28906 0C4.98438 0 4.74219 0.257812 4.74219 0.578125C4.74219 0.726562 4.78906 0.875 4.89062 0.976562L7.01562 3.07031Z" fill="white" fillOpacity="0.85"/>
                            </g>
                            <defs>
                                <clipPath id="clip0_1238_21">
                                    <rect width="11.3125" height="14.6016" fill="white"/>
                                </clipPath>
                            </defs>
                        </svg>
                        {isLoading ? "로딩중..." : "새로고침"}
                    </button>
                    <button
                        onClick={downloadCSV}
                        disabled={isLoading || filteredAttendees.length === 0}
                        style={{
                            padding: "8px 16px",
                            backgroundColor:
                                isLoading || filteredAttendees.length === 0
                                    ? "#9ca3af"
                                    : "#6b7280",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "0px",
                            fontSize: "14px",
                            fontFamily: "Pretendard Regular",
                            cursor:
                                isLoading || filteredAttendees.length === 0
                                    ? "not-allowed"
                                    : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#clip0_1238_11)">
                                <path d="M10.9922 7.19531V11.9375C10.9922 13.6016 10.0625 14.5234 8.39844 14.5234H2.59375C0.929688 14.5234 0 13.6016 0 11.9375V7.19531C0 5.53125 0.929688 4.60156 2.59375 4.60156H3.71094V5.72656H2.59375C1.65625 5.72656 1.125 6.25781 1.125 7.19531V11.9375C1.125 12.875 1.65625 13.3984 2.59375 13.3984H8.39844C9.33594 13.3984 9.86719 12.875 9.86719 11.9375V7.19531C9.86719 6.25781 9.33594 5.72656 8.39844 5.72656H7.27344V4.60156H8.39844C10.0625 4.60156 10.9922 5.53125 10.9922 7.19531Z" fill="white" fillOpacity="0.85"/>
                                <path d="M5.49218 1.22656C5.1953 1.22656 4.93749 1.47656 4.93749 1.76562V7.85938L5.03124 9.64062C5.04687 9.89062 5.24218 10.1016 5.49218 10.1016C5.74999 10.1016 5.9453 9.89062 5.96093 9.64062L6.05468 7.85938V1.76562C6.05468 1.47656 5.79687 1.22656 5.49218 1.22656ZM3.42188 7.35156C3.1328 7.35156 2.92188 7.55469 2.92188 7.84375C2.92188 7.99219 2.97655 8.10156 3.08593 8.21094L5.09374 10.125C5.23438 10.2656 5.35155 10.3125 5.49218 10.3125C5.64061 10.3125 5.7578 10.2656 5.89843 10.125L7.90625 8.21094C8.00781 8.10156 8.0703 7.99219 8.0703 7.84375C8.0703 7.55469 7.85156 7.35156 7.5625 7.35156C7.42188 7.35156 7.28124 7.40625 7.17968 7.51562L6.32031 8.45312L5.49218 9.33594L4.67187 8.45312L3.80468 7.51562C3.71093 7.40625 3.56249 7.35156 3.42188 7.35156Z" fill="white" fillOpacity="0.85"/>
                            </g>
                            <defs>
                                <clipPath id="clip0_1238_11">
                                    <rect width="11.3984" height="15.7578" fill="white"/>
                                </clipPath>
                            </defs>
                        </svg>
                        CSV 다운로드
                    </button>
                </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
                <div
                    style={{
                        padding: "12px",
                        backgroundColor: "#fef2f2",
                        color: "#dc2626",
                        borderRadius: "0px",
                        marginBottom: "16px",
                        fontFamily: "Pretendard Regular",
                    }}
                >
                    {error}
                </div>
            )}

            {/* 메인 통계 카드 */}
            {!error && attendees.length > 0 && (
                <>
                    {/* 총 참석자와 총 식사 인원을 같은 행으로 */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "16px",
                            marginBottom: "32px",
                        }}
                    >
                        <div
                            style={{
                                padding: "24px",
                                backgroundColor: cardBackgroundColor,
                                borderRadius: "0px",
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: textColor,
                                    marginBottom: "8px",
                                    fontFamily: "Pretendard SemiBold",
                                }}
                            >
                                총 참석자
                            </div>
                            <div
                                style={{
                                    fontSize: "32px",
                                    fontFamily: "Pretendard SemiBold",
                                    color: headerColor,
                                }}
                            >
                                {summary.totalGuests}
                            </div>
                        </div>
                        <div
                            style={{
                                padding: "24px",
                                backgroundColor: cardBackgroundColor,
                                borderRadius: "0px",
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: textColor,
                                    marginBottom: "8px",
                                    fontFamily: "Pretendard SemiBold",
                                }}
                            >
                                총 식사 인원
                            </div>
                            <div
                                style={{
                                    fontSize: "32px",
                                    fontFamily: "Pretendard SemiBold",
                                    color: headerColor,
                                }}
                            >
                                {summary.mealCount}
                            </div>
                        </div>
                    </div>

                    {/* 신랑측/신부측 세부 통계 - 개선된 구조 */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "32px",
                            marginBottom: "16px",
                        }}
                    >
                        {/* 신랑측 */}
                        <div>
                            <h3
                                style={{
                                    fontSize: "16px",
                                    fontFamily: "Pretendard SemiBold",
                                    color: headerColor,
                                    marginBottom: "16px",
                                    textAlign: "center",
                                }}
                            >
                                신랑측
                            </h3>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "12px",
                                }}
                            >
                                <div style={{ textAlign: "center" }}>
                                    <div
                                        style={{
                                            fontSize: "12px",
                                            color: textColor,
                                            marginBottom: "4px",
                                            fontFamily: "Pretendard Regular",
                                        }}
                                    >
                                        참석자
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "20px",
                                            fontFamily: "Pretendard SemiBold",
                                            color: "#1e40af",
                                        }}
                                    >
                                        {attendees
                                            .filter(
                                                (item) =>
                                                    item.guest_type === "신랑측" &&
                                                    item.relation_type === "참석"
                                            )
                                            .reduce(
                                                (sum, item) =>
                                                    sum + (item.guest_count || 0),
                                                0
                                            )}
                                    </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div
                                        style={{
                                            fontSize: "12px",
                                            color: textColor,
                                            marginBottom: "4px",
                                        }}
                                    >
                                        식사 인원
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "20px",
                                            fontFamily: "Pretendard SemiBold",
                                            color: "#1e40af",
                                        }}
                                    >
                                        {summary.groomMealCount}
                                    </div>
                                </div>
                            </div>
                            {/* 구분선 */}
                            <div
                                style={{
                                    width: "100%",
                                    height: "1px",
                                    backgroundColor: "#e0e0e0",
                                    margin: "12px 0",
                                }}
                            />
                        </div>

                        {/* 신부측 */}
                        <div>
                            <h3
                                style={{
                                    fontSize: "16px",
                                    fontFamily: "Pretendard SemiBold",
                                    color: headerColor,
                                    marginBottom: "16px",
                                    textAlign: "center",
                                }}
                            >
                                신부측
                            </h3>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "12px",
                                }}
                            >
                                <div style={{ textAlign: "center" }}>
                                    <div
                                        style={{
                                            fontSize: "12px",
                                            color: textColor,
                                            marginBottom: "4px",
                                        }}
                                    >
                                        참석자
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "20px",
                                            fontFamily: "Pretendard SemiBold",
                                            color: "#be185d",
                                        }}
                                    >
                                        {attendees
                                            .filter(
                                                (item) =>
                                                    item.guest_type === "신부측" &&
                                                    item.relation_type === "참석"
                                            )
                                            .reduce(
                                                (sum, item) =>
                                                    sum + (item.guest_count || 0),
                                                0
                                            )}
                                    </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div
                                        style={{
                                            fontSize: "12px",
                                            color: textColor,
                                            marginBottom: "4px",
                                        }}
                                    >
                                        식사 인원
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "20px",
                                            fontFamily: "Pretendard SemiBold",
                                            color: "#be185d",
                                        }}
                                    >
                                        {summary.brideMealCount}
                                    </div>
                                </div>
                            </div>
                            {/* 구분선 */}
                            <div
                                style={{
                                    width: "100%",
                                    height: "1px",
                                    backgroundColor: "#e0e0e0",
                                    margin: "12px 0",
                                }}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* 검색 및 필터 */}
            {!error && attendees.length > 0 && (
                <div
                    style={{
                        padding: "20px",
                        backgroundColor: cardBackgroundColor,
                        borderRadius: "0px",
                        marginBottom: "16px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <div
                            style={{
                                flex: "1",
                                minWidth: "140px",
                                position: "relative",
                            }}
                        >
                            <input
                                type="text"
                                placeholder="이름 또는 연락처로 검색"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    borderRadius: "0px",
                                    fontSize: "16px",
                                    fontFamily: "Pretendard Regular",
                                    outline: "none",
                                    backgroundColor: backgroundColor,
                                    color: textColor,
                                    border: "1px solid #e5e7eb",
                                }}
                            />
                        </div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            style={{
                                padding: "8px 12px",
                                borderRadius: "0px",
                                fontSize: "14px",
                                fontFamily: "Pretendard Regular",
                                outline: "none",
                                backgroundColor: "#e3e3e3",
                                color: textColor,
                                minWidth: "120px",
                                border: "none",
                            }}
                        >
                            <option value="all">전체</option>
                            <option value="attending">참석</option>
                            <option value="notAttending">미참석</option>
                            <option value="groomSide">신랑측</option>
                            <option value="brideSide">신부측</option>
                            <option value="mealYes">식사 가능</option>
                            <option value="mealNo">식사 불가</option>
                        </select>
                    </div>
                </div>
            )}

            {/* 테이블 */}
            {!error && !isLoading && filteredAttendees.length > 0 && (
                <>
                    <div
                        style={{
                            backgroundColor: cardBackgroundColor,
                            borderRadius: "0px",
                            overflow: "hidden",
                        }}
                    >
                        <div style={{ overflowX: "auto" }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                }}
                            >
                                <thead>
                                    <tr style={{ backgroundColor: "#f3f4f6" }}>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "center",
                                                fontSize: "12px",
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                                color: "#374151",
                                                minWidth: "80px",
                                            }}
                                        >
                                            성함
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "center",
                                                fontSize: "12px",
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                                color: "#374151",
                                                minWidth: "60px",
                                            }}
                                        >
                                            구분
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "center",
                                                fontSize: "12px",
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                                color: "#374151",
                                                minWidth: "60px",
                                            }}
                                        >
                                            참석
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "center",
                                                fontSize: "12px",
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                                color: "#374151",
                                                minWidth: "60px",
                                            }}
                                        >
                                            식사
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "center",
                                                fontSize: "12px",
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                                color: "#374151",
                                                minWidth: "50px",
                                            }}
                                        >
                                            인원
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "center",
                                                fontSize: "12px",
                                                fontFamily:
                                                    "Pretendard SemiBold",
                                                color: "#374151",
                                                minWidth: "100px",
                                            }}
                                        >
                                            연락처
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((attendee, index) => (
                                        <tr
                                            key={index}
                                            style={{
                                                borderTop: `1px solid ${borderColor}`,
                                            }}
                                        >
                                            <td
                                                style={{
                                                    padding: "12px 8px",
                                                    fontSize: "14px",
                                                    textAlign: "center",
                                                    fontFamily:
                                                        "Pretendard SemiBold",
                                                    color: headerColor,
                                                }}
                                            >
                                                {attendee.guest_name}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "12px 8px",
                                                    textAlign: "center",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        padding: "4px 8px",
                                                        fontSize: "11px",
                                                        fontFamily:
                                                            "Pretendard SemiBold",
                                                        borderRadius: "0px",
                                                        backgroundColor:
                                                            "#f3f4f6",
                                                        color: "#374151",
                                                        whiteSpace: "nowrap",
                                                        display: "inline-block",
                                                    }}
                                                >
                                                    {attendee.guest_type ===
                                                    "신랑측"
                                                        ? "신랑"
                                                        : "신부"}
                                                </span>
                                            </td>
                                            <td
                                                style={{
                                                    padding: "12px 8px",
                                                    textAlign: "center",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        padding: "4px 8px",
                                                        fontSize: "11px",
                                                        fontFamily:
                                                            "Pretendard SemiBold",
                                                        borderRadius: "0px",
                                                        backgroundColor:
                                                            attendee.relation_type ===
                                                            "참석"
                                                                ? "#374151"
                                                                : "#e5e7eb",
                                                        color:
                                                            attendee.relation_type ===
                                                            "참석"
                                                                ? "#ffffff"
                                                                : "#6b7280",
                                                        whiteSpace: "nowrap",
                                                        display: "inline-block",
                                                    }}
                                                >
                                                    {attendee.relation_type ===
                                                    "참석"
                                                        ? "O"
                                                        : "X"}
                                                </span>
                                            </td>
                                            <td
                                                style={{
                                                    padding: "12px 8px",
                                                    textAlign: "center",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        padding: "4px 8px",
                                                        fontSize: "11px",
                                                        fontFamily:
                                                            "Pretendard SemiBold",
                                                        borderRadius: "0px",
                                                        backgroundColor:
                                                            attendee.meal_time ===
                                                            "식사 가능"
                                                                ? "#374151"
                                                                : "#e5e7eb",
                                                        color:
                                                            attendee.meal_time ===
                                                            "식사 가능"
                                                                ? "#ffffff"
                                                                : "#6b7280",
                                                        whiteSpace: "nowrap",
                                                        display: "inline-block",
                                                    }}
                                                >
                                                    {attendee.meal_time ===
                                                    "식사 가능"
                                                        ? "O"
                                                        : "X"}
                                                </span>
                                            </td>
                                            <td
                                                style={{
                                                    padding: "12px 8px",
                                                    fontSize: "14px",
                                                    fontFamily:
                                                        "Pretendard Regular",
                                                    color: textColor,
                                                    textAlign: "center",
                                                }}
                                            >
                                                {attendee.guest_count}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "12px 8px",
                                                    fontSize: "13px",
                                                    fontFamily:
                                                        "Pretendard Regular",
                                                    color: textColor,
                                                }}
                                            >
                                                {attendee.phone_number}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 페이지네이션 */}
                    {totalPages > 1 && (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "8px",
                                marginTop: "16px",
                            }}
                        >
                            <button
                                onClick={() =>
                                    handlePageChange(currentPage - 1)
                                }
                                disabled={currentPage === 1}
                                style={{
                                    padding: "8px 12px",
                                    backgroundColor:
                                        currentPage === 1
                                            ? "#e5e7eb"
                                            : "#4b5563",
                                    color:
                                        currentPage === 1
                                            ? "#9ca3af"
                                            : "#ffffff",
                                    border: "none",
                                    borderRadius: "0px",
                                    fontSize: "14px",
                                    fontFamily: "Pretendard Regular",
                                    cursor:
                                        currentPage === 1
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            >
                                이전
                            </button>

                            {Array.from(
                                { length: totalPages },
                                (_, i) => i + 1
                            ).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    style={{
                                        padding: "8px 12px",
                                        backgroundColor:
                                            currentPage === page
                                                ? "#374151"
                                                : cardBackgroundColor,
                                        color:
                                            currentPage === page
                                                ? "#ffffff"
                                                : textColor,
                                        borderRadius: "0px",
                                        fontSize: "14px",
                                        fontFamily: "Pretendard Regular",
                                        cursor: "pointer",
                                        border: "none",
                                    }}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() =>
                                    handlePageChange(currentPage + 1)
                                }
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: "8px 12px",
                                    backgroundColor:
                                        currentPage === totalPages
                                            ? "#e5e7eb"
                                            : "#4b5563",
                                    color:
                                        currentPage === totalPages
                                            ? "#9ca3af"
                                            : "#ffffff",
                                    border: "none",
                                    borderRadius: "0px",
                                    fontSize: "14px",
                                    fontFamily: "Pretendard Regular",
                                    cursor:
                                        currentPage === totalPages
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            >
                                다음
                            </button>
                        </div>
                    )}

                    {/* 페이지 정보 */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "16px",
                            backgroundColor: cardBackgroundColor,
                            borderRadius: "0px",
                            marginTop: "16px",
                            fontSize: "14px",
                            fontFamily: "Pretendard Regular",
                            color: textColor,
                            flexWrap: "wrap",
                            gap: "8px",
                        }}
                    >
                        <div>
                            전체 {filteredAttendees.length}개 중{" "}
                            {startIndex + 1}-
                            {Math.min(endIndex, filteredAttendees.length)}개
                            표시
                        </div>
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#9ca3af",
                                fontFamily: "Pretendard Regular",
                            }}
                        >
                            총 응답: {summary.total}개
                        </div>
                    </div>
                </>
            )}

            {/* 검색 결과 없음 */}
            {!error &&
                !isLoading &&
                filteredAttendees.length === 0 &&
                attendees.length > 0 && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "48px 24px",
                            backgroundColor: cardBackgroundColor,
                            borderRadius: "0px",
                            color: "#6b7280",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "18px",
                                marginBottom: "8px",
                                fontFamily: "Pretendard SemiBold",
                            }}
                        >
                            검색 결과가 없습니다
                        </div>
                        <p
                            style={{
                                fontSize: "14px",
                                fontFamily: "Pretendard Regular",
                            }}
                        >
                            검색어나 필터 조건을 변경해보세요.
                        </p>
                    </div>
                )}

            {/* 데이터 없음 메시지 */}
            {!error &&
                !isLoading &&
                attendees.length === 0 &&
                pageId.trim() && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "48px 24px",
                            color: "#6b7280",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "18px",
                                marginBottom: "8px",
                                fontFamily: "Pretendard SemiBold",
                            }}
                        >
                            {showOnlyAttending
                                ? "참석자가 없습니다"
                                : "응답이 없습니다"}
                        </div>
                        <p
                            style={{
                                fontSize: "14px",
                                fontFamily: "Pretendard Regular",
                            }}
                        >
                            아직 등록된 {showOnlyAttending ? "참석자" : "응답"}
                            가 없습니다.
                        </p>
                    </div>
                )}

            {/* 페이지 ID 미설정 메시지 */}
            {!pageId.trim() && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "48px 24px",
                        color: "#6b7280",
                    }}
                >
                    <div
                        style={{
                            fontSize: "18px",
                            marginBottom: "8px",
                            fontFamily: "Pretendard SemiBold",
                        }}
                    >
                        페이지 ID를 설정해주세요
                    </div>
                    <p
                        style={{
                            fontSize: "14px",
                            fontFamily: "Pretendard Regular",
                        }}
                    >
                        Property Panel에서 페이지 ID를 입력하여 데이터를
                        불러오세요.
                    </p>
                </div>
            )}
        </div>
    )
}

addPropertyControls(RSVPAttendeeList, {
    pageId: {
        type: ControlType.String,
        title: "페이지 ID",
        defaultValue: "",
        placeholder: "예: wedding-main, anniversary-2024",
    },
    showOnlyAttending: {
        type: ControlType.Boolean,
        title: "참석자만 표시",
        defaultValue: false,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "배경색",
        defaultValue: "#f9fafb",
    },
    cardBackgroundColor: {
        type: ControlType.Color,
        title: "카드 배경색",
        defaultValue: "#ffffff",
    },
    headerColor: {
        type: ControlType.Color,
        title: "헤더 색상",
        defaultValue: "#1f2937",
    },
    textColor: {
        type: ControlType.Color,
        title: "텍스트 색상",
        defaultValue: "#374151",
    },
    borderColor: {
        type: ControlType.Color,
        title: "테두리 색상",
        defaultValue: "#e5e7eb",
    },
    accentColor: {
        type: ControlType.Color,
        title: "강조 색상",
        defaultValue: "#3b82f6",
    },
})
