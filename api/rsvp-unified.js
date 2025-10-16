const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 초기화
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);


// RSVP HTML 페이지 생성 함수
function generateRSVPHTML(pageId) {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RSVP 결과 - ${pageId}</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');

        @font-face {
            font-family: "P22 Late November";
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: url("https://cdn.roarc.kr/fonts/P22-LateNovember/6f9032835db3c6c496b1c0384815d38e.woff2") format("woff2");
        }

        body {
            margin: 0;
            padding: 0;
            background-color: #EBEBEB;
            font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, 'Apple Color Emoji', 'Segoe UI Emoji';
            width: 100vw;
            min-height: 100vh;
        }

        .full-width-container {
            width: 100vw;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            background-color: #EBEBEB;
        }

        .content-wrapper {
            width: 100%;
            max-width: 430px;
            height: fit-content;
            margin-top: 40px;
            margin-bottom: 40px;
            display: flex;
            align-items: center;
        }

        .header-text {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            margin-bottom: 0px;
            width: 100%;
            max-width: 430px;
        }

        .rsvp-title {
            font-family: 'P22 Late November', 'Pretendard Variable', Pretendard, serif;
            font-size: 25px;
            line-height: 0.7em;
            color: black;
            margin: 0;
        }

        .rsvp-subtitle {
            font-family: 'Pretendard Variable', Pretendard, sans-serif;
            font-weight: 400;
            color: #8c8c8c;
            font-size: 15px;
            margin: 0;
        }

        #root {
            width: 100%;
            max-width: 430px;
            margin: 0 auto;
            padding: 24px;
            background-color: transparent;
            border-radius: 0px;
            font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji";
            height: fit-content;
            flex-direction: column;
            align-items: center;
        }
    </style>
</head>
<body>
    <div class="full-width-container">
        <div class="content-wrapper">
            <div id="root"></div>
            <script type="text/babel">
        const { useState, useEffect, useMemo } = React;

        // Typography 폰트 모듈 로딩
        let typography = null;
        const typographyScript = document.createElement('script');
        typographyScript.type = 'module';
        typographyScript.textContent = \`
            import typographyModule from "https://cdn.roarc.kr/fonts/typography.js?v=27c65dba30928cbbce6839678016d9ac";
            window.__typography = typographyModule;
        \`;
        document.head.appendChild(typographyScript);

        // RSVPAttendeeList 컴포넌트
        function RSVPAttendeeList({ pageId }) {
            const [attendees, setAttendees] = useState([]);
            const [filteredAttendees, setFilteredAttendees] = useState([]);
            const [isLoading, setIsLoading] = useState(false);
            const [error, setError] = useState("");
            const [searchTerm, setSearchTerm] = useState("");
            const [filterType, setFilterType] = useState("all");
            const [currentPage, setCurrentPage] = useState(1);
            const [itemsPerPage] = useState(10);
            const [activeTab, setActiveTab] = useState("statistics");
            const [showFilterDropdown, setShowFilterDropdown] = useState(false);
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
            });

            // 고정 색상 값들
            const showOnlyAttending = false;
            const backgroundColor = "transparent";
            const cardBackgroundColor = "white";
            const headerColor = "#333333";
            const textColor = "#333333";
            const borderColor = "#e0e0e0";
            const accentColor = "#0f0f0f";
            const groomSideColor = "#4a90e2";
            const brideSideColor = "#e24a90";

            // Typography 폰트 로딩
            useEffect(() => {
                const checkTypography = setInterval(() => {
                    if (window.__typography) {
                        typography = window.__typography;
                        if (typography && typeof typography.ensure === "function") {
                            typography.ensure();
                        }
                        clearInterval(checkTypography);
                    }
                }, 100);

                return () => clearInterval(checkTypography);
            }, []);

            // P22 폰트 스택을 안전하게 가져오기
            const p22FontFamily = useMemo(() => {
                try {
                    return (
                        typography?.helpers?.stacks?.p22 ||
                        '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
                    );
                } catch {
                    return '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"';
                }
            }, []);

            // Pretendard 폰트 스택들
            const pretendardRegular = useMemo(() => {
                try {
                    return typography?.helpers?.stacks?.body || '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"';
                } catch {
                    return '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"';
                }
            }, []);

            const pretendardSemiBold = useMemo(() => {
                try {
                    return typography?.helpers?.stacks?.heading || '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"';
                } catch {
                    return '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"';
                }
            }, []);

            // 데이터 로드 함수
            const loadAttendees = async () => {
                if (!pageId.trim()) {
                    setError("페이지 ID를 입력해주세요.");
                    return;
                }

                setIsLoading(true);
                setError("");

                try {
                    const url = "https://wedding-admin-proxy.vercel.app/api/rsvp-unified";
                    const requestBody = {
                        action: "getByPageId",
                        pageId: pageId.trim(),
                        showOnlyAttending: showOnlyAttending,
                    };

                    console.log("Sending request to:", url);
                    console.log("Request body:", JSON.stringify(requestBody, null, 2));

                    const response = await fetch(url, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(requestBody),
                    });

                    console.log("Response status:", response.status);
                    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error("Error response:", errorText);
                        throw new Error("HTTP " + response.status + ": " + errorText);
                    }

                    const result = await response.json();
                    console.log("Response result:", result);

                    if (result.success) {
                        setAttendees(result.data);
                        setFilteredAttendees(result.data);
                        calculateSummary(result.data);
                    } else {
                        throw new Error(result.error || "데이터를 가져올 수 없습니다");
                    }
                } catch (error) {
                    console.error("데이터 로드 에러:", error);
                    setError("데이터 로드 실패: " + error.message);
                } finally {
                    setIsLoading(false);
                }
            };

            // 요약 통계 계산
            const calculateSummary = (data) => {
                const attendingData = data.filter((item) => item.relation_type === "참석");
                const groomData = data.filter((item) => item.guest_type === "신랑측");
                const brideData = data.filter((item) => item.guest_type === "신부측");
                const groomAttendingData = attendingData.filter((item) => item.guest_type === "신랑측");
                const brideAttendingData = attendingData.filter((item) => item.guest_type === "신부측");

                const stats = {
                    total: data.length,
                    attending: attendingData.length,
                    notAttending: data.filter((item) => item.relation_type === "미참석").length,
                    groomSide: groomData.length,
                    brideSide: brideData.length,
                    groomSideAttending: groomAttendingData.length,
                    brideSideAttending: brideAttendingData.length,
                    totalGuests: attendingData.reduce((sum, item) => sum + (item.guest_count || 0), 0),
                    groomMealCount: groomAttendingData
                        .filter((item) => item.meal_time === "식사 가능")
                        .reduce((sum, item) => sum + (item.guest_count || 0), 0),
                    brideMealCount: brideAttendingData
                        .filter((item) => item.meal_time === "식사 가능")
                        .reduce((sum, item) => sum + (item.guest_count || 0), 0),
                    mealYes: data.filter((item) => item.meal_time === "식사 가능").length,
                    mealNo: data.filter((item) => item.meal_time === "식사 불가").length,
                    mealCount: attendingData
                        .filter((item) => item.meal_time === "식사 가능")
                        .reduce((sum, item) => sum + (item.guest_count || 0), 0),
                };
                setSummary(stats);
            };

            // 검색 및 필터링 적용
            const applyFilters = () => {
                let filtered = [...attendees];

                if (searchTerm.trim()) {
                    filtered = filtered.filter((item) =>
                        (item.guest_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.phone_number || "").includes(searchTerm)
                    );
                }

                if (filterType !== "all") {
                    filtered = filtered.filter((item) => {
                        switch (filterType) {
                            case "attending": return item.relation_type === "참석";
                            case "notAttending": return item.relation_type === "미참석";
                            case "groomSide": return item.guest_type === "신랑측";
                            case "brideSide": return item.guest_type === "신부측";
                            case "mealYes": return item.meal_time === "식사 가능";
                            case "mealNo": return item.meal_time === "식사 불가";
                            default: return true;
                        }
                    });
                }

                setFilteredAttendees(filtered);
                setCurrentPage(1);
            };

            // CSV 다운로드 함수
            const downloadCSV = () => {
                if (filteredAttendees.length === 0) return;

                const headers = [
                    "성함", "신랑측/신부측", "참석여부", "인원", "식사여부",
                    "연락처", "개인정보동의", "페이지ID", "등록일시"
                ];

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
                ]);

                const csvContent = [headers, ...csvData]
                    .map((row) => row.map((cell) => String(cell)).join(","))
                    .join("\\n");

                const BOM = "\\uFEFF";
                const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);

                const fileName = "rsvp_" + (pageId || "data") + "_" + new Date().toISOString().split("T")[0] + ".csv";
                link.setAttribute("download", fileName);

                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            // 날짜 포맷팅 함수
            const formatDate = (dateString) => {
                if (!dateString) return "";
                const date = new Date(dateString);
                return date.toLocaleDateString("ko-KR", {
                    year: "numeric", month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit"
                });
            };

            // 페이지네이션 계산
            const totalPages = Math.ceil(filteredAttendees.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const currentItems = filteredAttendees.slice(startIndex, endIndex);

            // 페이지 변경 함수
            const handlePageChange = (page) => {
                setCurrentPage(page);
            };

            // 컴포넌트 마운트 시 데이터 로드
            useEffect(() => {
                if (pageId.trim()) {
                    loadAttendees();
                }
            }, [pageId, showOnlyAttending]);

            // 검색/필터 변경 시 적용
            useEffect(() => {
                applyFilters();
            }, [searchTerm, filterType, attendees]);

            // 드롭다운 외부 클릭 시 닫기
            useEffect(() => {
                const handleClickOutside = (event) => {
                    const target = event.target;
                    if (!target.closest(".filter-dropdown-container")) {
                        setShowFilterDropdown(false);
                    }
                };

                if (showFilterDropdown) {
                    document.addEventListener("mousedown", handleClickOutside);
                }

                return () => {
                    document.removeEventListener("mousedown", handleClickOutside);
                };
            }, [showFilterDropdown]);


            // 통계 탭 렌더링
            const renderStatisticsTab = () => (
                React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" } },
                    React.createElement("div", { style: { backgroundColor: cardBackgroundColor, padding: "24px" } },
                        React.createElement("h3", { style: { fontSize: "14px", color: headerColor, marginBottom: "12px", textAlign: "center", fontFamily: pretendardSemiBold } }, "참석 여부"),
                        React.createElement("div", { style: { width: "100%", height: "1px", backgroundColor: borderColor, marginBottom: "16px" } }),
                        React.createElement("div", { style: { display: "flex", gap: "6px" } },
                            React.createElement("div", { style: { flex: "1", padding: "0 12px", textAlign: "center" } },
                                React.createElement("div", { style: { fontSize: "12px", color: "#666666", marginBottom: "8px", fontFamily: pretendardSemiBold } }, "참석가능"),
                                React.createElement("div", { style: { fontSize: "16px", color: headerColor, fontFamily: pretendardSemiBold } }, summary.attending)
                            ),
                            React.createElement("div", { style: { flex: "1", padding: "0 12px", textAlign: "center" } },
                                React.createElement("div", { style: { fontSize: "12px", color: "#999999", marginBottom: "8px", fontFamily: "Pretendard Regular" } }, "신랑측"),
                                React.createElement("div", { style: { fontSize: "16px", color: groomSideColor, fontFamily: pretendardSemiBold } }, summary.groomSideAttending)
                            ),
                            React.createElement("div", { style: { flex: "1", padding: "0 12px", textAlign: "center" } },
                                React.createElement("div", { style: { fontSize: "12px", color: "#999999", marginBottom: "8px", fontFamily: "Pretendard Regular" } }, "신부측"),
                                React.createElement("div", { style: { fontSize: "16px", color: brideSideColor, fontFamily: pretendardSemiBold } }, summary.brideSideAttending)
                            )
                        )
                    ),
                    React.createElement("div", { style: { backgroundColor: cardBackgroundColor, padding: "24px" } },
                        React.createElement("h3", { style: { fontSize: "14px", color: headerColor, marginBottom: "12px", textAlign: "center", fontFamily: pretendardSemiBold } }, "식사 여부"),
                        React.createElement("div", { style: { width: "100%", height: "1px", backgroundColor: borderColor, marginBottom: "16px" } }),
                        React.createElement("div", { style: { display: "flex", gap: "6px" } },
                            React.createElement("div", { style: { flex: "1", padding: "0 12px", textAlign: "center" } },
                                React.createElement("div", { style: { fontSize: "12px", color: "#666666", marginBottom: "8px", fontFamily: pretendardSemiBold } }, "식사 인원"),
                                React.createElement("div", { style: { fontSize: "16px", color: headerColor, fontFamily: pretendardSemiBold } }, summary.mealCount)
                            ),
                            React.createElement("div", { style: { flex: "1", padding: "0 12px", textAlign: "center" } },
                                React.createElement("div", { style: { fontSize: "12px", color: "#999999", marginBottom: "6px", fontFamily: "Pretendard Regular" } }, "신랑측"),
                                React.createElement("div", { style: { fontSize: "16px", color: groomSideColor, fontFamily: pretendardSemiBold } }, summary.groomMealCount)
                            ),
                            React.createElement("div", { style: { flex: "1", padding: "0 12px", textAlign: "center" } },
                                React.createElement("div", { style: { fontSize: "12px", color: "#999999", marginBottom: "6px", fontFamily: "Pretendard Regular" } }, "신부측"),
                                React.createElement("div", { style: { fontSize: "16px", color: brideSideColor, fontFamily: pretendardSemiBold } }, summary.brideMealCount)
                            )
                        )
                    )
                )
            );

            // 목록 탭은 JSX를 사용하므로 그대로 유지
            const renderListTab = () => (
                <div>
                    {/* 검색 및 필터 */}
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "12px" }}>
                        <div
                            className="filter-dropdown-container"
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
                            <span style={{ fontSize: "12px", color: "#333333", fontFamily: "Pretendard Regular" }}>
                                {filterType === "all" ? "전체" :
                                 filterType === "groomSide" ? "신랑측" :
                                 filterType === "brideSide" ? "신부측" :
                                 filterType === "mealYes" ? "식사 가능" :
                                 filterType === "mealNo" ? "식사 불가" : "전체"}
                            </span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="11"
                                height="6"
                                viewBox="0 0 11 6"
                                fill="none"
                                style={{
                                    transform: showFilterDropdown ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s",
                                }}
                            >
                                <path d="M1 1L5.69565 5L10 1" stroke="#333333" />
                            </svg>

                            {showFilterDropdown && (
                                <div style={{
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
                                }}>
                                    <div style={{
                                        padding: "8px 12px",
                                        cursor: "pointer",
                                        backgroundColor: filterType === "all" ? "#F5F5F5" : "transparent",
                                        fontSize: "12px",
                                        fontFamily: pretendardRegular,
                                        color: "#333333",
                                    }} onClick={() => { setFilterType("all"); setShowFilterDropdown(false); }}>
                                        전체
                                    </div>
                                    <div style={{
                                        padding: "8px 12px",
                                        cursor: "pointer",
                                        backgroundColor: filterType === "groomSide" ? "#F5F5F5" : "transparent",
                                        fontSize: "12px",
                                        fontFamily: pretendardRegular,
                                        color: "#333333",
                                    }} onClick={() => { setFilterType("groomSide"); setShowFilterDropdown(false); }}>
                                        신랑측
                                    </div>
                                    <div style={{
                                        padding: "8px 12px",
                                        cursor: "pointer",
                                        backgroundColor: filterType === "brideSide" ? "#F5F5F5" : "transparent",
                                        fontSize: "12px",
                                        fontFamily: pretendardRegular,
                                        color: "#333333",
                                    }} onClick={() => { setFilterType("brideSide"); setShowFilterDropdown(false); }}>
                                        신부측
                                    </div>
                                    <div style={{
                                        padding: "8px 12px",
                                        cursor: "pointer",
                                        backgroundColor: filterType === "mealYes" ? "#F5F5F5" : "transparent",
                                        fontSize: "12px",
                                        fontFamily: pretendardRegular,
                                        color: "#333333",
                                    }} onClick={() => { setFilterType("mealYes"); setShowFilterDropdown(false); }}>
                                        식사 가능
                                    </div>
                                    <div style={{
                                        padding: "8px 12px",
                                        cursor: "pointer",
                                        backgroundColor: filterType === "mealNo" ? "#F5F5F5" : "transparent",
                                        fontSize: "12px",
                                        fontFamily: pretendardRegular,
                                        color: "#333333",
                                    }} onClick={() => { setFilterType("mealNo"); setShowFilterDropdown(false); }}>
                                        식사 불가
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{
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
                        }}>
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
                                        fontFamily: pretendardRegular,
                                        WebkitTextSizeAdjust: "100%",
                                    }}
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck="false"
                                />
                                <div style={{
                                    position: "absolute",
                                    top: "0",
                                    left: "0",
                                    right: "0",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    fontSize: "14px",
                                    fontFamily: pretendardRegular,
                                    color: searchTerm ? "#333333" : "#9CA3AF",
                                    pointerEvents: "none",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                }}>
                                    {searchTerm || "이름 또는 연락처로 검색"}
                                </div>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
                                <path d="M8.5 8.25L12 11.75" stroke="#9CA3AF" strokeLinecap="round" />
                                <circle cx="5" cy="5.25" r="4.5" stroke="#9CA3AF" />
                            </svg>
                        </div>
                    </div>

                    {/* CSV 다운로드 버튼 */}
                    <div style={{ padding: "6px 0", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "32px" }}>
                        <button
                            onClick={downloadCSV}
                            disabled={isLoading || filteredAttendees.length === 0}
                            style={{
                                backgroundColor: "transparent",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 16px",
                                cursor: isLoading || filteredAttendees.length === 0 ? "not-allowed" : "pointer",
                                border: "none",
                                opacity: isLoading || filteredAttendees.length === 0 ? 0.5 : 1,
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="14" viewBox="0 0 12 14" fill="none">
                                <path d="M11.4961 6.32031V11.0625C11.4961 12.7266 10.5664 13.6484 8.90235 13.6484H3.09766C1.43359 13.6484 0.503906 12.7266 0.503906 11.0625V6.32031C0.503906 4.65625 1.43359 3.72656 3.09766 3.72656H4.21485V4.85156H3.09766C2.16016 4.85156 1.62891 5.38281 1.62891 6.32031V11.0625C1.62891 12 2.16016 12.5234 3.09766 12.5234H8.90235C9.83985 12.5234 10.3711 12 10.3711 11.0625V6.32031C10.3711 5.38281 9.83985 4.85156 8.90235 4.85156H7.77735V3.72656H8.90235C10.5664 3.72656 11.4961 4.65625 11.4961 6.32031Z" fill="#333333" />
                                <path d="M5.99608 0.351562C5.6992 0.351562 5.44139 0.601562 5.44139 0.890622V6.98438L5.53514 8.76562C5.55077 9.01562 5.74608 9.2266 5.99608 9.2266C6.25389 9.2266 6.4492 9.01562 6.46483 8.76562L6.55858 6.98438V0.890622C6.55858 0.601562 6.30077 0.351562 5.99608 0.351562ZM3.92578 6.47656C3.6367 6.47656 3.42578 6.67969 3.42578 6.96875C3.42578 7.11719 3.48045 7.22656 3.58983 7.33594L5.59764 9.25C5.73828 9.3906 5.85545 9.4375 5.99608 9.4375C6.14451 9.4375 6.2617 9.3906 6.40233 9.25L8.41015 7.33594C8.51171 7.22656 8.5742 7.11719 8.5742 6.96875C8.5742 6.67969 8.35546 6.47656 8.0664 6.47656C7.92578 6.47656 7.78514 6.53125 7.68358 6.64062L6.82421 7.57812L5.99608 8.46094L5.17577 7.57812L4.30858 6.64062C4.21483 6.53125 4.06639 6.47656 3.92578 6.47656Z" fill="#333333" />
                            </svg>
                            <span style={{ color: "#333333", fontSize: "12px", fontFamily: pretendardSemiBold }}>
                                CSV 다운로드
                            </span>
                        </button>
                    </div>

                    {/* 명단 리스트 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {currentItems.map((attendee, index) => (
                            <div key={index} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "8px 0" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                                            <span style={{ color: "black", fontSize: "14px", fontFamily: pretendardSemiBold }}>
                                                {attendee.guest_name}
                                            </span>
                                            {attendee.guest_count && attendee.guest_count > 1 && (
                                                <span style={{ color: "#8B8B8B", fontSize: "14px", fontFamily: "Pretendard Regular" }}>
                                                    외 {attendee.guest_count - 1}명
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "flex-end", gap: "4px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                                                <span style={{
                                                    color: attendee.relation_type === "참석" ? "black" : "#9B9B9B",
                                                    fontSize: "12px",
                                                    fontFamily: "Pretendard Regular"
                                                }}>
                                                    {attendee.relation_type === "참석" ? "참석가능" : "참석불가"}
                                                </span>
                                                <div style={{ width: "12px", height: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    {attendee.relation_type === "참석" ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
                                                            <circle cx="6.5" cy="6.5" r="6" fill="#010307" />
                                                            <path d="M3 6.5L5.5 9L10 4.5" stroke="white" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
                                                            <circle cx="6.5" cy="6.5" r="6" fill="#969696" />
                                                            <path d="M4.5 9L9 4.5" stroke="white" />
                                                            <path d="M4.5 4.5L9 9" stroke="white" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ width: "100%", height: "0.5px", backgroundColor: "#C9C9C9" }} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <span style={{ color: "#939393", fontSize: "12px", fontFamily: "Pretendard Regular" }}>
                                            {attendee.phone_number}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <div style={{
                                            height: "21px",
                                            padding: "4px 6px",
                                            backgroundColor: attendee.guest_type === "신랑측" ? groomSideColor : brideSideColor,
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            gap: "10px",
                                        }}>
                                            <span style={{ color: "#ffffff", fontSize: "10px", fontFamily: "Pretendard Regular" }}>
                                                {attendee.guest_type === "신랑측" ? "신랑" : "신부"}
                                            </span>
                                        </div>
                                        <div style={{
                                            height: "21px",
                                            padding: "4px 6px",
                                            backgroundColor: attendee.meal_time === "식사 가능" ? "#f1f1f1" : "#F1F1F1",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            gap: "10px",
                                        }}>
                                            <span style={{
                                                color: attendee.meal_time === "식사 가능" ? "#505050" : "#9D9D9D",
                                                fontSize: "10px",
                                                fontFamily: "Pretendard Regular"
                                            }}>
                                                {attendee.meal_time === "식사 가능" ? "식사 가능" : "식사 불가"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 페이지네이션 */}
                    {totalPages > 1 && (
                        <div style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "8px",
                            marginTop: "24px",
                            marginBottom: "16px",
                        }}>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{
                                    backgroundColor: "transparent",
                                    border: "none",
                                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                    opacity: currentPage === 1 ? 0.3 : 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "32px",
                                    height: "32px",
                                }}
                            >
                                <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7.41 10.59L2.83 6L7.41 1.41L6 0L0 6L6 12L7.41 10.59Z" fill="#999999" />
                                </svg>
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                                        fontFamily: currentPage === page ? "Pretendard SemiBold" : "Pretendard Regular",
                                        fontSize: "12px",
                                        color: currentPage === page ? "#000000" : "#999999",
                                    }}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                style={{
                                    backgroundColor: "transparent",
                                    border: "none",
                                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                                    opacity: currentPage === totalPages ? 0.3 : 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "32px",
                                    height: "32px",
                                }}
                            >
                                <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M0.59 1.41L5.17 6L0.59 10.59L2 12L8 6L2 0L0.59 1.41Z" fill="#999999" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            );

            return (
                <div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", marginBottom: "20px", width: "100%" }}>
                        <h1 style={{ fontFamily: p22FontFamily, fontSize: "25px", lineHeight: "0.7em", color: "black", margin: 0 }}>RSVP</h1>
                        <p style={{ fontFamily: pretendardRegular, fontWeight: 400, color: "#8c8c8c", fontSize: "15px", margin: 0 }}>결과 페이지</p>
                    </div>

                    <div style={{ width: "100%", maxWidth: "430px", display: "flex", justifyContent: "flex-start", alignItems: "center", margin-bottom: "20px" }}>
                        <button
                            onClick={() => setActiveTab("statistics")}
                            style={{
                                flex: "1 1 0",
                                height: "44px",
                                paddingLeft: "16px",
                                paddingRight: "16px",
                                backgroundColor: activeTab === "statistics" ? "#333333" : "#F8F8F8",
                                color: activeTab === "statistics" ? "white" : "#C2C2C2",
                                border: "none",
                                fontSize: "12px",
                                fontFamily: pretendardSemiBold,
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
                                backgroundColor: activeTab === "list" ? "#333333" : "#F8F8F8",
                                color: activeTab === "list" ? "white" : "#C2C2C2",
                                border: "none",
                                fontSize: "12px",
                                fontFamily: pretendardSemiBold,
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

                    {error && (
                        <div style={{ padding: "12px", backgroundColor: "#fef2f2", color: "#dc2626", borderRadius: "0px", marginBottom: "16px", fontFamily: "Pretendard Regular" }}>
                            {error}
                        </div>
                    )}

                    <div style={{ backgroundColor: "transparent", padding: "0" }}>
                        {activeTab === "statistics" ? renderStatisticsTab() : renderListTab()}
                    </div>

                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "12px" }}>
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
                                cursor: isLoading || !pageId.trim() ? "not-allowed" : "pointer",
                                opacity: isLoading || !pageId.trim() ? 0.5 : 1,
                            }}
                        >
                            <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clipPath="url(#clip0_1238_21)">
                                    <path d="M5.45312 13.2188C8.46875 13.2188 10.9062 10.7734 10.9062 7.75781C10.9062 7.44531 10.6484 7.19531 10.3438 7.19531C10.0391 7.19531 9.78125 7.44531 9.78125 7.75781C9.78125 10.1484 7.84375 12.0781 5.45312 12.0781C3.0625 12.0781 1.125 10.1484 1.125 7.75781C1.125 5.36719 3.0625 3.42969 5.45312 3.42969C5.96094 3.42969 6.44531 3.50781 6.89844 3.67188C7.25781 3.8125 7.6875 3.60938 7.6875 3.16406C7.6875 2.79688 7.41406 2.67969 7.23438 2.61719C6.67969 2.41406 6.07812 2.3125 5.45312 2.3125C2.4375 2.3125 0 4.75 0 7.76562C0 10.7734 2.4375 13.2188 5.45312 13.2188ZM7.01562 3.07031L4.89844 5.14844C4.78906 5.25 4.74219 5.39844 4.74219 5.53906C4.74219 5.85938 4.98438 6.10156 5.28906 6.10156C5.46875 6.10156 5.59375 6.03906 5.69531 5.94531L8.16406 3.47656C8.27344 3.36719 8.32812 3.23438 8.32812 3.07031C8.32812 2.92188 8.26562 2.77344 8.16406 2.67188L5.69531 0.171875C5.59375 0.0703125 5.46094 0 5.28906 0C4.98438 0 4.74219 0.257812 4.74219 0.578125C4.74219 0.726562 4.78906 0.875 4.89062 0.976562L7.01562 3.07031Z" fill="#999999" fillOpacity="0.85" />
                                </g>
                                <defs>
                                    <clipPath id="clip0_1238_21">
                                        <rect width="11.3125" height="14.6016" fill="white" />
                                    </clipPath>
                                </defs>
                            </svg>
                            <span style={{ color: "#999999", fontSize: "12px", fontFamily: pretendardSemiBold }}>
                                {isLoading ? "로딩중..." : "새로고침"}
                            </span>
                        </button>
                    </div>

                    {!error && !isLoading && attendees.length === 0 && pageId.trim() && (
                        <div style={{ textAlign: "center", padding: "48px 24px", color: "#6b7280" }}>
                            <div style={{ fontSize: "18px", marginBottom: "8px", fontFamily: pretendardSemiBold }}>
                                응답이 없습니다
                            </div>
                            <p style={{ fontSize: "14px", fontFamily: "Pretendard Regular" }}>
                                아직 등록된 응답이 없습니다.
                            </p>
                        </div>
                    )}

                    {!pageId.trim() && (
                        <div style={{ textAlign: "center", padding: "48px 24px", color: "#6b7280" }}>
                            <div style={{ fontSize: "18px", marginBottom: "8px", fontFamily: pretendardSemiBold }}>
                                페이지 ID를 설정해주세요
                            </div>
                            <p style={{ fontSize: "14px", fontFamily: pretendardRegular }}>
                                페이지 ID가 필요합니다.
                            </p>
                        </div>
                    )}

                    <div
                        style={{
                            width: "100%",
                            height: "108px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: "120px",
                            paddingTop: "40px",
                            paddingBottom: "30px",
                            gap: "10px",
                        }}
                    >
                        <div
                            style={{
                                overflow: "hidden",
                                display: "inline-flex",
                                flexDirection: "column",
                                alignItems: "center",
                                opacity: 0.3,
                                gap: "10px",
                            }}
                        >
                            <div>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="57"
                                    height="13"
                                    viewBox="0 0 57 13"
                                    fill="none"
                                >
                                    <path
                                        d="M20.0771 0.908438C19.2193 0.322116 18.1965 0.0300293 17.0106 0.0300293C15.4195 0.0300293 14.045 0.57984 12.8913 1.67731C11.7355 2.77693 11.1587 4.38556 11.1587 6.50534C11.1587 7.92067 11.4375 9.11909 11.995 10.0941C12.5525 11.0713 13.2709 11.7994 14.1479 12.2783C15.025 12.7573 15.9556 12.9957 16.9399 12.9957C17.9863 12.9957 18.947 12.7358 19.824 12.2118C20.7011 11.6899 21.398 10.9339 21.9126 9.9481C22.4273 8.9623 22.6846 7.80469 22.6846 6.47527C22.6846 5.3241 22.4637 4.25455 22.0241 3.26661C21.5824 2.28082 20.9327 1.49261 20.0749 0.908438H20.0771ZM19.5774 9.24795C19.4595 10.0898 19.1936 10.7943 18.7797 11.3634C18.3659 11.9326 17.7612 12.2182 16.9677 12.2182C15.7648 12.2182 14.9842 11.7028 14.6261 10.6719C14.268 9.64098 14.09 8.29007 14.09 6.61702C14.09 5.25967 14.1715 4.15576 14.3323 3.30312C14.4932 2.45263 14.7784 1.82121 15.1836 1.41315C15.5889 1.00723 16.1529 0.8032 16.8777 0.8032C18.012 0.8032 18.7754 1.26925 19.1679 2.2035C19.5603 3.13775 19.7576 4.52731 19.7576 6.37218C19.7576 7.44603 19.6975 8.40605 19.5817 9.2458L19.5774 9.24795Z"
                                        fill="black"
                                    />
                                    <path
                                        d="M34.9243 11.5696C34.8171 11.7221 34.6756 11.7973 34.4954 11.7973C34.3003 11.7973 34.1481 11.7458 34.043 11.6405C33.9358 11.5353 33.8607 11.4021 33.8114 11.241C33.7621 11.08 33.7299 10.9082 33.7149 10.7277C33.6977 10.5473 33.6892 10.382 33.6892 10.2295V3.98827C33.6892 3.20866 33.5626 2.56435 33.3096 2.05105C33.0566 1.53775 32.7263 1.12969 32.3189 0.826863C31.9115 0.524038 31.4376 0.309268 30.8994 0.184702C30.3611 0.0622832 29.8143 0 29.2611 0C28.8858 0 28.4441 0.0322155 27.9401 0.0987941C27.4341 0.165373 26.958 0.287791 26.5099 0.468198C26.0617 0.648605 25.6821 0.899885 25.3712 1.22419C25.3519 1.24352 25.3369 1.27144 25.3197 1.29291C25.3069 1.3058 25.2897 1.31439 25.279 1.32728C24.9059 1.71601 24.61 2.40757 24.715 2.92087C24.9059 3.85941 25.9909 3.81646 26.5849 3.44705C27.3183 2.98959 26.8723 2.41186 26.8851 1.78688C26.8916 1.52057 26.8937 1.20056 27.3633 0.936396C27.3955 0.92351 27.4191 0.908476 27.4534 0.89559C27.6807 0.809682 27.9316 0.749546 28.1996 0.710888C28.4677 0.672229 28.725 0.6529 28.9694 0.6529C29.4734 0.6529 29.8658 0.762433 30.1445 0.981498C30.4212 1.20056 30.6249 1.46688 30.7557 1.78044C30.8865 2.094 30.9637 2.41616 30.9873 2.74905C31.013 3.08195 31.0237 3.36115 31.0237 3.5888V4.41567C31.0237 4.58748 30.9036 4.74856 30.6678 4.90105C30.4319 5.05353 30.0931 5.24253 29.6535 5.47019C29.2461 5.68066 28.7571 5.90832 28.1867 6.1553C27.6163 6.40229 27.0695 6.70082 26.5485 7.05304C26.0252 7.40526 25.5814 7.82621 25.2147 8.32018C24.848 8.81415 24.6636 9.40262 24.6636 10.0877C24.6636 10.5817 24.7408 11.0091 24.8973 11.3699C25.0517 11.7307 25.2597 12.0293 25.5213 12.2676C25.7829 12.506 26.0788 12.68 26.4134 12.7938C26.7479 12.9077 27.0931 12.9656 27.4534 12.9656C28.2189 12.9656 28.8794 12.8132 29.4348 12.5103C29.9902 12.2075 30.552 11.7801 31.1224 11.2282C31.3025 11.7973 31.5663 12.2311 31.9179 12.5254C32.2675 12.8196 32.7542 12.9678 33.3739 12.9678C33.717 12.9678 34.0172 12.8969 34.2789 12.7552C34.5405 12.6113 34.7571 12.4523 34.9265 12.2698C35.098 12.0894 35.231 11.909 35.3296 11.7286C35.4282 11.5482 35.4926 11.4107 35.5247 11.3162L35.2052 11.1165C35.1237 11.269 35.0294 11.4215 34.9243 11.5718V11.5696ZM31.0216 10.4228C30.7278 10.7857 30.3804 11.0907 29.9816 11.3377C29.5806 11.5868 29.1539 11.7092 28.6971 11.7092C28.4677 11.7092 28.2682 11.647 28.0967 11.5224C27.9251 11.3978 27.7815 11.2368 27.6678 11.0349C27.5542 10.8351 27.4684 10.6161 27.4105 10.3777C27.3526 10.1393 27.3247 9.89659 27.3247 9.64746C27.3247 8.97952 27.4298 8.44045 27.6421 8.03024C27.8544 7.62003 28.131 7.2721 28.4741 6.98431C28.8172 6.69867 29.2075 6.44524 29.6492 6.22617C30.0888 6.00711 30.5455 5.75368 31.0194 5.46804V10.4206L31.0216 10.4228Z"
                                        fill="black"
                                    />
                                    <path
                                        d="M55.3281 10.9855C55.133 11.1852 54.8992 11.3699 54.6312 11.5417C54.3631 11.7136 54.0608 11.851 53.7263 11.9562C53.3917 12.0615 53.0294 12.113 52.6391 12.113C51.7084 12.113 50.9708 11.6341 50.4261 10.6741C49.8793 9.71405 49.607 8.34167 49.607 6.55693C49.607 5.83531 49.6563 5.12227 49.7549 4.41997C49.8514 3.71768 50.0187 3.09055 50.2567 2.53859C50.4926 1.98878 50.8035 1.54206 51.1874 1.20057C51.569 0.85909 52.0472 0.687274 52.6176 0.687274C52.7635 0.687274 52.9157 0.706604 53.0701 0.743114C53.2202 0.779625 53.3596 0.826875 53.4882 0.882715C53.812 1.11681 53.9278 1.45615 53.9321 1.69669C53.945 2.32167 53.499 2.8994 54.2323 3.35686C54.8285 3.72841 55.9114 3.77137 56.1022 2.83068C56.2073 2.31738 55.9114 1.62367 55.5382 1.23708C55.4182 1.11037 55.2595 0.979361 55.1008 0.852647C55.0257 0.790364 54.9485 0.732376 54.8671 0.678684C54.8542 0.670093 54.837 0.655059 54.8242 0.646468C54.8242 0.646468 54.8242 0.648616 54.822 0.650763C54.7255 0.58848 54.6333 0.521902 54.5283 0.472505C54.1852 0.311427 53.8356 0.197599 53.4754 0.131021C53.1173 0.064442 52.8321 0.0322266 52.6198 0.0322266C51.7878 0.0322266 51.0137 0.201895 50.2953 0.545526C49.5769 0.88701 48.9529 1.35736 48.4233 1.95656C47.8936 2.55577 47.4733 3.26666 47.1624 4.09352C46.8536 4.92039 46.6992 5.80739 46.6992 6.75882C46.6992 7.76609 46.8407 8.65308 47.1281 9.42411C47.4133 10.193 47.7971 10.8437 48.2775 11.3764C48.7578 11.909 49.3175 12.3128 49.9522 12.5877C50.5891 12.8626 51.2646 13 51.9829 13C52.7013 13 53.4582 12.8153 54.2087 12.4438C54.9593 12.0744 55.5961 11.4902 56.1172 10.6912L55.8492 10.4056C55.7034 10.5968 55.5318 10.79 55.3345 10.9898L55.3281 10.9855Z"
                                        fill="black"
                                    />
                                    <path
                                        d="M10.1143 0.927777C10.1143 0.927777 10.1101 0.923482 10.1079 0.921334C10.1058 0.917039 10.1036 0.912743 10.1015 0.908448C10.0993 0.908448 10.0972 0.9063 10.095 0.9063C9.95995 0.708712 9.80127 0.549782 9.61256 0.431659C9.41743 0.30924 9.20943 0.227628 8.98856 0.188969C8.76983 0.150311 8.57684 0.130981 8.41387 0.130981C7.72982 0.130981 7.09724 0.377967 6.51826 0.871937C5.93929 1.36591 5.45466 2.07894 5.06224 3.0089C5.04509 2.51493 5.00864 2.01666 4.95288 1.51195C4.89498 1.00939 4.81779 0.547635 4.71915 0.130981C4.45754 0.264139 4.1659 0.388705 3.83782 0.500385C3.51188 0.614213 3.17736 0.715155 2.83426 0.798915C2.49116 0.884823 2.14807 0.959993 1.80711 1.02657C1.46402 1.09315 1.15309 1.14469 0.876465 1.18335V1.69665C1.35037 1.69665 1.74064 1.80189 2.05157 2.01022C2.36036 2.21854 2.5169 2.69318 2.5169 3.43414V10.7578C2.5169 11.1379 2.47615 11.4322 2.39467 11.6405C2.31318 11.851 2.19953 12.0099 2.05157 12.1259C1.90575 12.2397 1.73421 12.3106 1.53693 12.3406C1.34179 12.3686 1.12092 12.3836 0.876465 12.3836V12.8969H6.82061V12.3836C6.57616 12.3836 6.35744 12.3686 6.16015 12.3406C5.96502 12.3127 5.79347 12.2418 5.64551 12.128C5.49969 12.0142 5.3839 11.8531 5.30241 11.6448C5.22093 11.4365 5.18018 11.1422 5.18018 10.7642V5.67634C5.18018 5.25968 5.24451 4.79148 5.37532 4.26959C5.50613 3.7477 5.6884 3.26018 5.92642 2.80487C6.1623 2.34955 6.43034 1.96726 6.7327 1.6537C7.03505 1.34014 7.3567 1.18335 7.69766 1.18335C7.78557 1.18335 7.86492 1.19839 7.93997 1.22201C8.05147 1.26282 8.10937 1.35517 8.09436 1.4647C8.07292 1.62363 7.75341 2.15626 8.48678 2.61157C9.08291 2.98312 10.1658 3.02608 10.3567 2.08753C10.4124 1.80833 10.3502 1.47974 10.2216 1.17261C10.1894 1.08456 10.1529 1.0008 10.1058 0.927777H10.1143Z"
                                        fill="black"
                                    />
                                    <path
                                        d="M45.8181 0.927777C45.8181 0.927777 45.8138 0.923482 45.8116 0.921334C45.8095 0.917039 45.8073 0.912743 45.8052 0.908448C45.8031 0.908448 45.8009 0.9063 45.7988 0.9063C45.6637 0.708712 45.505 0.549782 45.3163 0.431659C45.1211 0.30924 44.9131 0.227628 44.6923 0.188969C44.4714 0.150311 44.2806 0.130981 44.1176 0.130981C43.4335 0.130981 42.801 0.377967 42.222 0.871937C41.643 1.36591 41.1584 2.07894 40.766 3.0089C40.7488 2.51493 40.7124 2.01666 40.6566 1.51195C40.5987 1.00939 40.5215 0.547635 40.425 0.130981C40.1634 0.264139 39.8696 0.388705 39.5437 0.500385C39.2177 0.614213 38.8832 0.715155 38.5423 0.798915C38.1992 0.884823 37.8561 0.959993 37.5151 1.02657C37.172 1.09315 36.8632 1.14469 36.5845 1.18335V1.69665C37.0584 1.69665 37.4486 1.80189 37.7596 2.01022C38.0684 2.21854 38.2249 2.69318 38.2249 3.43414V10.7578C38.2249 11.1379 38.1842 11.4322 38.1027 11.6405C38.0212 11.851 37.9075 12.0099 37.7596 12.1259C37.6138 12.2397 37.4422 12.3106 37.2449 12.3406C37.0498 12.3686 36.8289 12.3836 36.5845 12.3836V12.8969H42.5286V12.3836C42.2842 12.3836 42.0633 12.3686 41.8682 12.3406C41.673 12.3127 41.5015 12.2418 41.3535 12.128C41.2077 12.0142 41.0919 11.8531 41.0126 11.6448C40.9311 11.4365 40.8903 11.1422 40.8903 10.7642V5.67634C40.8903 5.25968 40.9547 4.79148 41.0855 4.26959C41.2163 3.7477 41.4007 3.26018 41.6366 2.80487C41.8725 2.34955 42.1426 1.96726 42.4428 1.6537C42.7452 1.34014 43.0669 1.18335 43.4078 1.18335C43.4957 1.18335 43.5751 1.19839 43.6501 1.22201C43.7616 1.26282 43.8195 1.35517 43.8045 1.4647C43.7831 1.62363 43.4636 2.15626 44.1969 2.61157C44.7909 2.98312 45.876 3.02608 46.0668 2.08753C46.1226 1.80833 46.0604 1.47974 45.9317 1.17261C45.8996 1.08456 45.8631 1.0008 45.8159 0.927777H45.8181Z"
                                        fill="black"
                                    />
                                </svg>
                            </div>
                        </div>
                        <span
                            style={{
                                color: "#BABABA",
                                fontSize: "12px",
                                fontFamily: p22FontFamily,
                                wordWrap: "break-word",
                            }}
                        >
                            © roarc. all rights reserved.
                        </span>
                    </div>
                </div>
            );
        }

            // React 18의 createRoot를 사용하여 렌더링
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(RSVPAttendeeList, { pageId: "${pageId}" }));
            </script>
        </div>
    </div>
</body>
</html>`;
}

// generateRSVPHTML는 user-management.js에서 관리됩니다

// 메인 핸들러 함수
module.exports = async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { action, pageId, showOnlyAttending, ...rsvpData } = req.body;

        // RSVP 데이터 조회
        if (action === 'getByPageId') {
            if (!pageId) {
                return res.status(400).json({ success: false, error: '페이지 ID가 필요합니다' });
            }

            let query = supabase.from('rsvp_responses').select('*').eq('page_id', pageId);

            if (showOnlyAttending) {
                query = query.eq('relation_type', '참석');
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase query error:', error);
                return res.status(500).json({
                    success: false,
                    error: '데이터 조회 중 오류가 발생했습니다'
                });
            }

            return res.status(200).json({
                success: true,
                data: data || []
            });
        }

        // RSVP 응답 저장
        if (action === 'submit') {
            const { data, error } = await supabase
                .from('rsvp_responses')
                .insert([rsvpData]);

            if (error) {
                console.error('Supabase insert error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'RSVP 응답 저장 중 오류가 발생했습니다'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'RSVP 응답이 성공적으로 저장되었습니다'
            });
        }

               return res.status(400).json({
                   success: false,
                   error: 'Invalid action'
               });

    } catch (error) {
        console.error('RSVP handler error:', error);
        return res.status(500).json({
            success: false,
            error: '서버 오류가 발생했습니다',
            details: error.message
        });
    }
};
