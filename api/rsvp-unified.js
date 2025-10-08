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
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        @import url('https://cdn.roarc.kr/fonts/typography.css');
        
        body {
            margin: 0;
            padding: 0;
            background-color: #EBEBEB;
            font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, 'Apple Color Emoji', 'Segoe UI Emoji';
        }
        
        .container {
            width: 430px;
            height: 100vh;
            margin: 0 auto;
            background-color: #EBEBEB;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .content-wrapper {
            width: 100%;
            height: fit-content;
            margin-top: 40px;
            margin-bottom: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .header-text {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            margin-bottom: 0px;
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
            display: flex;
            flex-direction: column;
            align-items: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="content-wrapper">
            <div class="header-text">
                <h1 class="rsvp-title">RSVP</h1>
                <p class="rsvp-subtitle">결과페이지</p>
            </div>
            <div id="root"></div>
        </div>
    </div>

    <script type="text/babel">
        const { useState, useEffect } = React;

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

                    const response = await fetch(url, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(requestBody),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(\`HTTP \${response.status}: \${errorText}\`);
                    }

                    const result = await response.json();

                    if (result.success) {
                        setAttendees(result.data);
                        setFilteredAttendees(result.data);
                        calculateSummary(result.data);
                    } else {
                        throw new Error(result.error || "데이터를 가져올 수 없습니다");
                    }
                } catch (error) {
                    console.error("데이터 로드 에러:", error);
                    setError(\`데이터 로드 실패: \${error.message}\`);
                } finally {
                    setIsLoading(false);
                }
            };

            // 요약 통계 계산
            const calculateSummary = (data) => {
                const attendingData = data.filter(
                    (item) => item.relation_type === "참석"
                );
                const groomData = data.filter((item) => item.guest_type === "신랑측");
                const brideData = data.filter((item) => item.guest_type === "신부측");
                const groomAttendingData = attendingData.filter(
                    (item) => item.guest_type === "신랑측"
                );
                const brideAttendingData = attendingData.filter(
                    (item) => item.guest_type === "신부측"
                );

                const stats = {
                    total: data.length,
                    attending: attendingData.length,
                    notAttending: data.filter((item) => item.relation_type === "미참석").length,
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
                    mealYes: data.filter((item) => item.meal_time === "식사 가능").length,
                    mealNo: data.filter((item) => item.meal_time === "식사 불가").length,
                    mealCount: attendingData
                        .filter((item) => item.meal_time === "식사 가능")
                        .reduce((sum, item) => sum + (item.guest_count || 0), 0),
                };
                setSummary(stats);
            };

            // 컴포넌트 마운트 시 데이터 로드
            useEffect(() => {
                if (pageId.trim()) {
                    loadAttendees();
                }
            }, [pageId, showOnlyAttending]);

            const containerStyle = {
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "24px",
                backgroundColor: backgroundColor,
                borderRadius: "0px",
                fontFamily: "Pretendard Regular",
            };

            // 통계 탭 렌더링
            const renderStatisticsTab = () => (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "0" }}>
                    {/* 참석 여부 박스 */}
                    <div style={{ backgroundColor: cardBackgroundColor, padding: "24px", width: "100%" }}>
                        <h3 style={{ fontSize: "14px", color: headerColor, marginBottom: "12px", textAlign: "center", fontFamily: "Pretendard SemiBold" }}>
                            참석 여부
                        </h3>
                        <div style={{ width: "100%", height: "1px", backgroundColor: borderColor, marginBottom: "16px" }} />
                        <div style={{ display: "flex", gap: "6px" }}>
                            <div style={{ flex: "1", padding: "0 12px", textAlign: "center" }}>
                                <div style={{ fontSize: "12px", color: "#666666", marginBottom: "8px", fontFamily: "Pretendard SemiBold" }}>
                                    참석가능
                                </div>
                                <div style={{ fontSize: "16px", color: headerColor, fontFamily: "Pretendard SemiBold" }}>
                                    {summary.attending}
                                </div>
                            </div>
                            <div style={{ flex: "1", padding: "0 12px", textAlign: "center" }}>
                                <div style={{ fontSize: "12px", color: "#999999", marginBottom: "8px", fontFamily: "Pretendard Regular" }}>
                                    신랑측
                                </div>
                                <div style={{ fontSize: "16px", color: groomSideColor, fontFamily: "Pretendard SemiBold" }}>
                                    {summary.groomSideAttending}
                                </div>
                            </div>
                            <div style={{ flex: "1", padding: "0 12px", textAlign: "center" }}>
                                <div style={{ fontSize: "12px", color: "#999999", marginBottom: "8px", fontFamily: "Pretendard Regular" }}>
                                    신부측
                                </div>
                                <div style={{ fontSize: "16px", color: brideSideColor, fontFamily: "Pretendard SemiBold" }}>
                                    {summary.brideSideAttending}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 식사 여부 박스 */}
                    <div style={{ backgroundColor: cardBackgroundColor, padding: "24px", width: "100%" }}>
                        <h3 style={{ fontSize: "14px", color: headerColor, marginBottom: "12px", textAlign: "center", fontFamily: "Pretendard SemiBold" }}>
                            식사 여부
                        </h3>
                        <div style={{ width: "100%", height: "1px", backgroundColor: borderColor, marginBottom: "16px" }} />
                        <div style={{ display: "flex", gap: "6px" }}>
                            <div style={{ flex: "1", padding: "0 12px", textAlign: "center" }}>
                                <div style={{ fontSize: "12px", color: "#666666", marginBottom: "8px", fontFamily: "Pretendard SemiBold" }}>
                                    식사 인원
                                </div>
                                <div style={{ fontSize: "16px", color: headerColor, fontFamily: "Pretendard SemiBold" }}>
                                    {summary.mealCount}
                                </div>
                            </div>
                            <div style={{ flex: "1", padding: "0 12px", textAlign: "center" }}>
                                <div style={{ fontSize: "12px", color: "#999999", marginBottom: "6px", fontFamily: "Pretendard Regular" }}>
                                    신랑측
                                </div>
                                <div style={{ fontSize: "16px", color: groomSideColor, fontFamily: "Pretendard SemiBold" }}>
                                    {summary.groomMealCount}
                                </div>
                            </div>
                            <div style={{ flex: "1", padding: "0 12px", textAlign: "center" }}>
                                <div style={{ fontSize: "12px", color: "#999999", marginBottom: "6px", fontFamily: "Pretendard Regular" }}>
                                    신부측
                                </div>
                                <div style={{ fontSize: "16px", color: brideSideColor, fontFamily: "Pretendard SemiBold" }}>
                                    {summary.brideMealCount}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );

            return (
                <div style={containerStyle}>
                    {/* 탭 네비게이션 */}
                    <div style={{ width: "100%", display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
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
                                backgroundColor: activeTab === "list" ? "#333333" : "#F8F8F8",
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

                    {/* 에러 메시지 */}
                    {error && (
                        <div style={{ padding: "12px", backgroundColor: "#fef2f2", color: "#dc2626", borderRadius: "0px", marginBottom: "16px", fontFamily: "Pretendard Regular" }}>
                            {error}
                        </div>
                    )}

                    {/* 탭 콘텐츠 */}
                    <div style={{ backgroundColor: "transparent", padding: "0" }}>
                        {activeTab === "statistics" ? renderStatisticsTab() : (
                            <div style={{ textAlign: "center", padding: "48px 24px", color: "#6b7280" }}>
                                <div style={{ fontSize: "18px", marginBottom: "8px", fontFamily: "Pretendard SemiBold" }}>
                                    명단 보기 기능은 웹 버전에서 이용 가능합니다.
                                </div>
                                <p style={{ fontSize: "14px", fontFamily: "Pretendard Regular" }}>
                                    통계 탭에서 참석 현황을 확인하세요.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 새로고침 버튼 */}
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
                            <span style={{ color: "#999999", fontSize: "12px", fontFamily: "Pretendard SemiBold" }}>
                                {isLoading ? "로딩중..." : "새로고침"}
                            </span>
                        </button>
                    </div>

                    {/* 데이터 없음 메시지 */}
                    {!error && !isLoading && attendees.length === 0 && pageId.trim() && (
                        <div style={{ textAlign: "center", padding: "48px 24px", color: "#6b7280" }}>
                            <div style={{ fontSize: "18px", marginBottom: "8px", fontFamily: "Pretendard SemiBold" }}>
                                응답이 없습니다
                            </div>
                            <p style={{ fontSize: "14px", fontFamily: "Pretendard Regular" }}>
                                아직 등록된 응답이 없습니다.
                            </p>
                        </div>
                    )}

                    {/* 페이지 ID 미설정 메시지 */}
                    {!pageId.trim() && (
                        <div style={{ textAlign: "center", padding: "48px 24px", color: "#6b7280" }}>
                            <div style={{ fontSize: "18px", marginBottom: "8px", fontFamily: "Pretendard SemiBold" }}>
                                페이지 ID를 설정해주세요
                            </div>
                            <p style={{ fontSize: "14px", fontFamily: "Pretendard Regular" }}>
                                페이지 ID가 필요합니다.
                            </p>
                        </div>
                    )}
                </div>
            );
        }

        // 컴포넌트 렌더링
        ReactDOM.render(
            React.createElement(RSVPAttendeeList, { pageId: "${pageId}" }),
            document.getElementById('root')
        );
    </script>
</body>
</html>`;
}

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

        // HTML 페이지 생성
        if (action === 'generateHTML') {
            if (!pageId) {
                return res.status(400).json({ error: 'pageId is required' });
            }

            const htmlContent = generateRSVPHTML(pageId);
            const publicUrl = `https://mcard.roarc.kr/rsvp/${pageId}`;

            console.log(`RSVP page generated for pageId: ${pageId}`);
            console.log(`Public URL: ${publicUrl}`);

            return res.status(200).json({
                success: true,
                message: 'RSVP page generated successfully',
                url: publicUrl,
                pageId: pageId,
                html: htmlContent
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
