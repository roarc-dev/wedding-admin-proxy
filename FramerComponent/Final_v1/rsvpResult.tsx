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
    style?: React.CSSProperties
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
        style,
    } = props

    // 고정 색상 값들
    const showOnlyAttending = false
    const backgroundColor = "transparent"
    const cardBackgroundColor = "white"
    const headerColor = "#333333"
    const textColor = "#333333"
    const borderColor = "#e0e0e0"
    const accentColor = "#0f0f0f"
    const groomSideColor = "#4a90e2"
    const brideSideColor = "#e24a90"

    const [attendees, setAttendees] = useState<RSVPAttendee[]>([])
    const [filteredAttendees, setFilteredAttendees] = useState<RSVPAttendee[]>(
        []
    )
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [activeTab, setActiveTab] = useState("statistics")
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)
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

            console.log("Sending request to:", url)
            console.log("Request body:", JSON.stringify(requestBody, null, 2))

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            })

            console.log("Response status:", response.status)
            console.log(
                "Response headers:",
                Object.fromEntries(response.headers.entries())
            )

            if (!response.ok) {
                const errorText = await response.text()
                console.error("Error response:", errorText)
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }

            const result = await response.json()
            console.log("Response result:", result)

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

    // 드롭다운 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (!target.closest("[data-filter-dropdown]")) {
                setShowFilterDropdown(false)
            }
        }

        if (showFilterDropdown) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [showFilterDropdown])

    const containerStyle = {
        ...style,
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "24px",
        backgroundColor: backgroundColor,
        borderRadius: "0px",
        fontFamily: "Pretendard Regular",
    }

    // 통계 탭 렌더링
    const renderStatisticsTab = () => (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "0",
            }}
        >
            {/* 참석 여부 박스 */}
            <div
                style={{
                    backgroundColor: cardBackgroundColor,
                    padding: "24px",
                    width: "100%",
                }}
            >
                <h3
                    style={{
                        fontSize: "14px",
                        color: headerColor,
                        marginBottom: "12px",
                        textAlign: "center",
                        fontFamily: "Pretendard SemiBold",
                    }}
                >
                    참석 여부
                </h3>
                <div
                    style={{
                        width: "100%",
                        height: "1px",
                        backgroundColor: borderColor,
                        marginBottom: "16px",
                    }}
                />

                {/* 참석가능, 신랑측, 신부측을 한 줄로 */}
                <div style={{ display: "flex", gap: "6px" }}>
                    <div
                        style={{
                            flex: "1",
                            padding: "0 12px",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#666666",
                                marginBottom: "8px",
                                fontFamily: "Pretendard SemiBold",
                            }}
                        >
                            참석가능
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                color: headerColor,
                                fontFamily: "Pretendard SemiBold",
                            }}
                        >
                            {summary.attending}
                        </div>
                    </div>
                    <div
                        style={{
                            flex: "1",
                            padding: "0 12px",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#999999",
                                marginBottom: "8px",
                                fontFamily: "Pretendard Regular",
                            }}
                        >
                            신랑측
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                color: groomSideColor,
                                fontFamily: "Pretendard SemiBold",
                            }}
                        >
                            {summary.groomSideAttending}
                        </div>
                    </div>
                    <div
                        style={{
                            flex: "1",
                            padding: "0 12px",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#999999",
                                marginBottom: "8px",
                                fontFamily: "Pretendard Regular",
                            }}
                        >
                            신부측
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                color: brideSideColor,
                                fontFamily: "Pretendard SemiBold",
                            }}
                        >
                            {summary.brideSideAttending}
                        </div>
                    </div>
                </div>
            </div>

            {/* 식사 여부 박스 */}
            <div
                style={{
                    backgroundColor: cardBackgroundColor,
                    padding: "24px",
                    width: "100%",
                }}
            >
                <h3
                    style={{
                        fontSize: "14px",
                        color: headerColor,
                        marginBottom: "12px",
                        textAlign: "center",
                        fontFamily: "Pretendard SemiBold",
                    }}
                >
                    식사 여부
                </h3>
                <div
                    style={{
                        width: "100%",
                        height: "1px",
                        backgroundColor: borderColor,
                        marginBottom: "16px",
                    }}
                />

                {/* 총 식사 인원, 신랑측, 신부측을 한 줄로 */}
                <div style={{ display: "flex", gap: "6px" }}>
                    <div
                        style={{
                            flex: "1",
                            padding: "0 12px",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#666666",
                                marginBottom: "8px",
                                fontFamily: "Pretendard SemiBold",
                            }}
                        >
                            식사 인원
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                color: headerColor,
                                fontFamily: "Pretendard SemiBold",
                            }}
                        >
                            {summary.mealCount}
                        </div>
                    </div>
                    <div
                        style={{
                            flex: "1",
                            padding: "0 12px",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#999999",
                                marginBottom: "6px",
                                fontFamily: "Pretendard Regular",
                            }}
                        >
                            신랑측
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                color: groomSideColor,
                                fontFamily: "Pretendard SemiBold",
                            }}
                        >
                            {summary.groomMealCount}
                        </div>
                    </div>
                    <div
                        style={{
                            flex: "1",
                            padding: "0 12px",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#999999",
                                marginBottom: "6px",
                                fontFamily: "Pretendard Regular",
                            }}
                        >
                            신부측
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                color: brideSideColor,
                                fontFamily: "Pretendard SemiBold",
                            }}
                        >
                            {summary.brideMealCount}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    // 목록 탭 렌더링
    const renderListTab = () => (
        <div>
            {/* 검색 및 필터 */}
            <div
                style={{
                    display: "flex",
                    gap: "6px",
                    alignItems: "center",
                    marginBottom: "12px",
                }}
            >
                <div
                    data-filter-dropdown
                    style={{
                        position: "relative",
                        backgroundColor: "#E0E0E0",
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        minWidth: "95px",
                        height: "36px",
                        cursor: "pointer",
                    }}
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                    <span
                        style={{
                            fontSize: "12px",
                            color: "#333333",
                            fontFamily: "Pretendard Regular",
                        }}
                    >
                        {filterType === "all"
                            ? "전체"
                            : filterType === "groomSide"
                              ? "신랑측"
                              : filterType === "brideSide"
                                ? "신부측"
                                : filterType === "mealYes"
                                  ? "식사 가능"
                                  : filterType === "mealNo"
                                    ? "식사 불가"
                                    : "전체"}
                    </span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="11"
                        height="6"
                        viewBox="0 0 11 6"
                        fill="none"
                        style={{
                            transform: showFilterDropdown
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                            transition: "transform 0.2s",
                        }}
                    >
                        <path d="M1 1L5.69565 5L10 1" stroke="#333333" />
                    </svg>

                    {/* 드롭다운 메뉴 */}
                    {showFilterDropdown && (
                        <div
                            style={{
                                position: "absolute",
                                top: "100%",
                                left: "0",
                                right: "0",
                                backgroundColor: "white",
                                border: "1px solid #E0E0E0",
                                borderRadius: "4px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                zIndex: 1000,
                                marginTop: "4px",
                            }}
                        >
                            <div
                                style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    backgroundColor:
                                        filterType === "all"
                                            ? "#F5F5F5"
                                            : "transparent",
                                    fontSize: "12px",
                                    fontFamily: "Pretendard Regular",
                                    color: "#333333",
                                }}
                                onClick={() => {
                                    setFilterType("all")
                                    setShowFilterDropdown(false)
                                }}
                            >
                                전체
                            </div>
                            <div
                                style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    backgroundColor:
                                        filterType === "groomSide"
                                            ? "#F5F5F5"
                                            : "transparent",
                                    fontSize: "12px",
                                    fontFamily: "Pretendard Regular",
                                    color: "#333333",
                                }}
                                onClick={() => {
                                    setFilterType("groomSide")
                                    setShowFilterDropdown(false)
                                }}
                            >
                                신랑측
                            </div>
                            <div
                                style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    backgroundColor:
                                        filterType === "brideSide"
                                            ? "#F5F5F5"
                                            : "transparent",
                                    fontSize: "12px",
                                    fontFamily: "Pretendard Regular",
                                    color: "#333333",
                                }}
                                onClick={() => {
                                    setFilterType("brideSide")
                                    setShowFilterDropdown(false)
                                }}
                            >
                                신부측
                            </div>
                            <div
                                style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    backgroundColor:
                                        filterType === "mealYes"
                                            ? "#F5F5F5"
                                            : "transparent",
                                    fontSize: "12px",
                                    fontFamily: "Pretendard Regular",
                                    color: "#333333",
                                }}
                                onClick={() => {
                                    setFilterType("mealYes")
                                    setShowFilterDropdown(false)
                                }}
                            >
                                식사 가능
                            </div>
                            <div
                                style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    backgroundColor:
                                        filterType === "mealNo"
                                            ? "#F5F5F5"
                                            : "transparent",
                                    fontSize: "12px",
                                    fontFamily: "Pretendard Regular",
                                    color: "#333333",
                                }}
                                onClick={() => {
                                    setFilterType("mealNo")
                                    setShowFilterDropdown(false)
                                }}
                            >
                                식사 불가
                            </div>
                        </div>
                    )}
                </div>
                <div
                    style={{
                        flex: "1",
                        height: "36px",
                        padding: "10px 16px",
                        backgroundColor: "#F5F5F5",
                        border: "1px solid #E0E0E0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "6px",
                        position: "relative",
                    }}
                >
                    <div style={{ position: "relative", width: "100%" }}>
                        <input
                            type="text"
                            placeholder=""
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%",
                                height: "100%",
                                border: "none",
                                outline: "none",
                                backgroundColor: "transparent",
                                fontSize: "16px",
                                color: "transparent",
                                fontFamily: "Pretendard Regular",
                                WebkitTextSizeAdjust: "100%",
                            }}
                            inputMode="search"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                        />
                        {/* 시각적으로 보이는 텍스트 레이어 */}
                        <div
                            style={{
                                position: "absolute",
                                top: "0",
                                left: "0",
                                right: "0",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                fontSize: "14px",
                                fontFamily: "Pretendard Regular",
                                color: searchTerm ? "#333333" : "#9CA3AF",
                                pointerEvents: "none",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                            }}
                        >
                            {searchTerm || "이름 또는 연락처로 검색"}
                        </div>
                    </div>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        viewBox="0 0 13 13"
                        fill="none"
                    >
                        <path
                            d="M8.5 8.25L12 11.75"
                            stroke="#9CA3AF"
                            strokeLinecap="round"
                        />
                        <circle cx="5" cy="5.25" r="4.5" stroke="#9CA3AF" />
                    </svg>
                </div>
            </div>

            {/* CSV 다운로드 버튼 */}
            <div
                style={{
                    padding: "6px 0",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: "32px",
                }}
            >
                <button
                    onClick={downloadCSV}
                    disabled={isLoading || filteredAttendees.length === 0}
                    style={{
                        backgroundColor: "transparent",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        cursor:
                            isLoading || filteredAttendees.length === 0
                                ? "not-allowed"
                                : "pointer",
                        border: "none",
                        opacity:
                            isLoading || filteredAttendees.length === 0
                                ? 0.5
                                : 1,
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="14"
                        viewBox="0 0 12 14"
                        fill="none"
                    >
                        <path
                            d="M11.4961 6.32031V11.0625C11.4961 12.7266 10.5664 13.6484 8.90235 13.6484H3.09766C1.43359 13.6484 0.503906 12.7266 0.503906 11.0625V6.32031C0.503906 4.65625 1.43359 3.72656 3.09766 3.72656H4.21485V4.85156H3.09766C2.16016 4.85156 1.62891 5.38281 1.62891 6.32031V11.0625C1.62891 12 2.16016 12.5234 3.09766 12.5234H8.90235C9.83985 12.5234 10.3711 12 10.3711 11.0625V6.32031C10.3711 5.38281 9.83985 4.85156 8.90235 4.85156H7.77735V3.72656H8.90235C10.5664 3.72656 11.4961 4.65625 11.4961 6.32031Z"
                            fill="#333333"
                        />
                        <path
                            d="M5.99608 0.351562C5.6992 0.351562 5.44139 0.601562 5.44139 0.890622V6.98438L5.53514 8.76562C5.55077 9.01562 5.74608 9.2266 5.99608 9.2266C6.25389 9.2266 6.4492 9.01562 6.46483 8.76562L6.55858 6.98438V0.890622C6.55858 0.601562 6.30077 0.351562 5.99608 0.351562ZM3.92578 6.47656C3.6367 6.47656 3.42578 6.67969 3.42578 6.96875C3.42578 7.11719 3.48045 7.22656 3.58983 7.33594L5.59764 9.25C5.73828 9.3906 5.85545 9.4375 5.99608 9.4375C6.14451 9.4375 6.2617 9.3906 6.40233 9.25L8.41015 7.33594C8.51171 7.22656 8.5742 7.11719 8.5742 6.96875C8.5742 6.67969 8.35546 6.47656 8.0664 6.47656C7.92578 6.47656 7.78514 6.53125 7.68358 6.64062L6.82421 7.57812L5.99608 8.46094L5.17577 7.57812L4.30858 6.64062C4.21483 6.53125 4.06639 6.47656 3.92578 6.47656Z"
                            fill="#333333"
                        />
                    </svg>
                    <span
                        style={{
                            color: "#333333",
                            fontSize: "12px",
                            fontFamily: "Pretendard SemiBold",
                        }}
                    >
                        CSV 다운로드
                    </span>
                </button>
            </div>

            {/* 명단 리스트 */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                }}
            >
                {currentItems.map((attendee, index) => (
                    <div
                        key={index}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            padding: "8px 0",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "9px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "2px",
                                    }}
                                >
                                    <span
                                        style={{
                                            color: "black",
                                            fontSize: "14px",
                                            fontFamily: "Pretendard SemiBold",
                                        }}
                                    >
                                        {attendee.guest_name}
                                    </span>
                                    {attendee.guest_count &&
                                        attendee.guest_count > 1 && (
                                            <span
                                                style={{
                                                    color: "#8B8B8B",
                                                    fontSize: "14px",
                                                    fontFamily:
                                                        "Pretendard Regular",
                                                }}
                                            >
                                                외 {attendee.guest_count - 1}명
                                            </span>
                                        )}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-end",
                                        gap: "4px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "2px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                color:
                                                    attendee.relation_type ===
                                                    "참석"
                                                        ? "black"
                                                        : "#9B9B9B",
                                                fontSize: "12px",
                                                fontFamily:
                                                    "Pretendard Regular",
                                            }}
                                        >
                                            {attendee.relation_type === "참석"
                                                ? "참석가능"
                                                : "참석불가"}
                                        </span>
                                        <div
                                            style={{
                                                width: "12px",
                                                height: "12px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            {attendee.relation_type ===
                                            "참석" ? (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="13"
                                                    height="13"
                                                    viewBox="0 0 13 13"
                                                    fill="none"
                                                >
                                                    <circle
                                                        cx="6.5"
                                                        cy="6.5"
                                                        r="6"
                                                        fill="#010307"
                                                    />
                                                    <path
                                                        d="M3 6.5L5.5 9L10 4.5"
                                                        stroke="white"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="13"
                                                    height="13"
                                                    viewBox="0 0 13 13"
                                                    fill="none"
                                                >
                                                    <circle
                                                        cx="6.5"
                                                        cy="6.5"
                                                        r="6"
                                                        fill="#969696"
                                                    />
                                                    <path
                                                        d="M4.5 9L9 4.5"
                                                        stroke="white"
                                                    />
                                                    <path
                                                        d="M4.5 4.5L9 9"
                                                        stroke="white"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                style={{
                                    width: "100%",
                                    height: "0.5px",
                                    backgroundColor: "#C9C9C9",
                                }}
                            />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                <span
                                    style={{
                                        color: "#939393",
                                        fontSize: "12px",
                                        fontFamily: "Pretendard Regular",
                                    }}
                                >
                                    {attendee.phone_number}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                <div
                                    style={{
                                        height: "21px",
                                        padding: "4px 6px",
                                        backgroundColor:
                                            attendee.guest_type === "신랑측"
                                                ? groomSideColor
                                                : brideSideColor,
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: "10px",
                                    }}
                                >
                                    <span
                                        style={{
                                            color: "#ffffff",
                                            fontSize: "10px",
                                            fontFamily: "Pretendard Regular",
                                        }}
                                    >
                                        {attendee.guest_type === "신랑측"
                                            ? "신랑"
                                            : "신부"}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        height: "21px",
                                        padding: "4px 6px",
                                        backgroundColor:
                                            attendee.meal_time === "식사 가능"
                                                ? "#f1f1f1"
                                                : "#F1F1F1",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: "10px",
                                    }}
                                >
                                    <span
                                        style={{
                                            color:
                                                attendee.meal_time ===
                                                "식사 가능"
                                                    ? "#505050"
                                                    : "#9D9D9D",
                                            fontSize: "10px",
                                            fontFamily: "Pretendard Regular",
                                        }}
                                    >
                                        {attendee.meal_time === "식사 가능"
                                            ? "식사 가능"
                                            : "식사 불가"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "24px",
                        marginBottom: "16px",
                    }}
                >
                    {/* 이전 페이지 버튼 */}
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{
                            backgroundColor: "transparent",
                            border: "none",
                            cursor:
                                currentPage === 1 ? "not-allowed" : "pointer",
                            opacity: currentPage === 1 ? 0.3 : 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                        }}
                    >
                        <svg
                            width="8"
                            height="12"
                            viewBox="0 0 8 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M7.41 10.59L2.83 6L7.41 1.41L6 0L0 6L6 12L7.41 10.59Z"
                                fill="#999999"
                            />
                        </svg>
                    </button>

                    {/* 페이지 번호들 */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                style={{
                                    backgroundColor: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "32px",
                                    height: "32px",
                                    fontFamily:
                                        currentPage === page
                                            ? "Pretendard SemiBold"
                                            : "Pretendard Regular",
                                    fontSize: "12px",
                                    color:
                                        currentPage === page
                                            ? "#000000"
                                            : "#999999",
                                }}
                            >
                                {page}
                            </button>
                        )
                    )}

                    {/* 다음 페이지 버튼 */}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                            backgroundColor: "transparent",
                            border: "none",
                            cursor:
                                currentPage === totalPages
                                    ? "not-allowed"
                                    : "pointer",
                            opacity: currentPage === totalPages ? 0.3 : 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                        }}
                    >
                        <svg
                            width="8"
                            height="12"
                            viewBox="0 0 8 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M0.59 1.41L5.17 6L0.59 10.59L2 12L8 6L2 0L0.59 1.41Z"
                                fill="#999999"
                            />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    )

    return (
        <div style={containerStyle}>
            {/* 헤더 */}
            <div style={{ marginBottom: "24px" }}>
                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginBottom: "16px",
                    }}
                ></div>

                {/* 탭 네비게이션 */}
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                    }}
                >
                    <button
                        onClick={() => setActiveTab("statistics")}
                        style={{
                            flex: "1 1 0",
                            height: "44px",
                            paddingLeft: "16px",
                            paddingRight: "16px",
                            backgroundColor:
                                activeTab === "statistics"
                                    ? "#333333"
                                    : "#F8F8F8",
                            color:
                                activeTab === "statistics"
                                    ? "white"
                                    : "#C2C2C2",
                            border: "none",
                            fontSize: "12px",
                            fontFamily: "Pretendard SemiBold",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        통계
                    </button>
                    <button
                        onClick={() => setActiveTab("list")}
                        style={{
                            flex: "1 1 0",
                            height: "44px",
                            paddingLeft: "16px",
                            paddingRight: "16px",
                            backgroundColor:
                                activeTab === "list" ? "#333333" : "#F8F8F8",
                            color: activeTab === "list" ? "white" : "#C2C2C2",
                            border: "none",
                            fontSize: "12px",
                            fontFamily: "Pretendard SemiBold",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        명단 보기
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

            {/* 탭 콘텐츠 */}
            <div
                style={{
                    backgroundColor: "transparent",
                    padding: "0",
                }}
            >
                {activeTab === "statistics"
                    ? renderStatisticsTab()
                    : renderListTab()}
            </div>

            {/* 새로고침 버튼 */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: "12px",
                }}
            >
                <button
                    onClick={loadAttendees}
                    disabled={isLoading || !pageId.trim()}
                    style={{
                        backgroundColor: "transparent",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        cursor:
                            isLoading || !pageId.trim()
                                ? "not-allowed"
                                : "pointer",
                        opacity: isLoading || !pageId.trim() ? 0.5 : 1,
                    }}
                >
                    <svg
                        width="12"
                        height="15"
                        viewBox="0 0 12 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <g clipPath="url(#clip0_1238_21)">
                            <path
                                d="M5.45312 13.2188C8.46875 13.2188 10.9062 10.7734 10.9062 7.75781C10.9062 7.44531 10.6484 7.19531 10.3438 7.19531C10.0391 7.19531 9.78125 7.44531 9.78125 7.75781C9.78125 10.1484 7.84375 12.0781 5.45312 12.0781C3.0625 12.0781 1.125 10.1484 1.125 7.75781C1.125 5.36719 3.0625 3.42969 5.45312 3.42969C5.96094 3.42969 6.44531 3.50781 6.89844 3.67188C7.25781 3.8125 7.6875 3.60938 7.6875 3.16406C7.6875 2.79688 7.41406 2.67969 7.23438 2.61719C6.67969 2.41406 6.07812 2.3125 5.45312 2.3125C2.4375 2.3125 0 4.75 0 7.76562C0 10.7734 2.4375 13.2188 5.45312 13.2188ZM7.01562 3.07031L4.89844 5.14844C4.78906 5.25 4.74219 5.39844 4.74219 5.53906C4.74219 5.85938 4.98438 6.10156 5.28906 6.10156C5.46875 6.10156 5.59375 6.03906 5.69531 5.94531L8.16406 3.47656C8.27344 3.36719 8.32812 3.23438 8.32812 3.07031C8.32812 2.92188 8.26562 2.77344 8.16406 2.67188L5.69531 0.171875C5.59375 0.0703125 5.46094 0 5.28906 0C4.98438 0 4.74219 0.257812 4.74219 0.578125C4.74219 0.726562 4.78906 0.875 4.89062 0.976562L7.01562 3.07031Z"
                                fill="#999999"
                                fillOpacity="0.85"
                            />
                        </g>
                        <defs>
                            <clipPath id="clip0_1238_21">
                                <rect
                                    width="11.3125"
                                    height="14.6016"
                                    fill="white"
                                />
                            </clipPath>
                        </defs>
                    </svg>
                    <span
                        style={{
                            color: "#999999",
                            fontSize: "12px",
                            fontFamily: "Pretendard SemiBold",
                        }}
                    >
                        {isLoading ? "로딩중..." : "새로고침"}
                    </span>
                </button>
            </div>

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
                            아직 등록된 응답이 없습니다.
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
})
