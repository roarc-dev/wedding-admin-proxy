import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"
import { useState, useEffect, useMemo } from "react"
// @ts-ignore
import typography from "https://cdn.roarc.kr/fonts/typography.js"

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

// 페이지 설정 정보 타입 정의
interface PageSettings {
    id?: string
    page_id: string
    wedding_date: string
    wedding_time: string
    groom_name: string
    bride_name: string
    venue_name?: string
    venue_address?: string
    highlight_shape?: "circle" | "heart"
    highlight_color?: string
    highlight_text_color?: string
    type?: string
    cal_txt?: string
    created_at?: string
    updated_at?: string
}

// 캘린더 이벤트 타입 정의
interface CalendarEvent {
    id: string
    page_id: string
    date: string
    title: string
    created_at: string
}

interface CalendarComponentProxyProps {
    pageId: string
}

// 프록시를 통한 안전한 페이지 설정 가져오기
async function getPageSettings(pageId: string): Promise<PageSettings | null> {
    try {
        // invite_cards와 page_settings 데이터를 병렬로 가져오기
        const [inviteResult, pageResult] = await Promise.all([
            getInviteData(pageId),
            fetch(`${PROXY_BASE_URL}/api/page-settings?pageId=${pageId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }),
        ])

        if (!pageResult.ok) {
            throw new Error(
                `HTTP ${pageResult.status}: ${pageResult.statusText}`
            )
        }

        const result = await pageResult.json()

        if (result.success && result.data) {
            // API 응답 형식을 Calendar 컴포넌트에 맞게 변환
            const data = result.data

            // invite_cards 데이터를 우선적으로 사용
            const groom_name =
                inviteResult?.groom_name ||
                data.groom_name_kr ||
                data.groom_name ||
                ""
            const bride_name =
                inviteResult?.bride_name ||
                data.bride_name_kr ||
                data.bride_name ||
                ""

            return {
                id: data.id,
                page_id: data.page_id,
                wedding_date: data.wedding_date,
                wedding_time: `${data.wedding_hour || "14"}:${data.wedding_minute || "00"}`,
                groom_name: groom_name,
                bride_name: bride_name,
                venue_name: data.venue_name || "",
                venue_address: data.venue_address || "",
                highlight_shape: data.highlight_shape || "circle",
                highlight_color: data.highlight_color || "#e0e0e0",
                highlight_text_color: data.highlight_text_color || "black",
                type: data.type || "",
                cal_txt: data.cal_txt || "",
                created_at: data.created_at,
                updated_at: data.updated_at,
            }
        } else {
            console.warn("페이지 설정이 없습니다:", result.error)
            return null
        }
    } catch (error) {
        console.error("페이지 설정 가져오기 실패:", error)
        return null
    }
}

// 프록시를 통한 invite_cards 데이터 가져오기
async function getInviteData(
    pageId: string
): Promise<{ groom_name?: string; bride_name?: string } | null> {
    try {
        const response = await fetch(
            `${PROXY_BASE_URL}/api/invite?pageId=${pageId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        )

        if (!response.ok) {
            console.warn(`Invite API 응답 오류: ${response.status}`)
            return null
        }

        const result = await response.json()

        if (result.success && result.data) {
            return {
                groom_name: result.data.groom_name,
                bride_name: result.data.bride_name,
            }
        } else {
            console.warn("초대장 데이터가 없습니다:", result.error)
            return null
        }
    } catch (error) {
        console.error("초대장 데이터 가져오기 실패:", error)
        return null
    }
}

// 날짜 문자열에서 KST 기준 연/월/일을 추출하는 헬퍼 함수
function extractKSTDateParts(dateString: string): {
    year: number
    month: number
    day: number
} {
    // YYYY-MM-DD 형식에서 직접 파싱하여 타임존 변환 없이 날짜 추출
    const parts = dateString.split("-")
    return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10) - 1, // 0-based month
        day: parseInt(parts[2], 10),
    }
}

// 현재 KST 날짜를 YYYY-MM-DD 형식으로 반환하는 헬퍼 함수
function getCurrentKSTDate(): string {
    // 현재 UTC 시간을 가져와서 KST(UTC+9)로 변환
    const now = new Date()
    const kstOffset = 9 * 60 // KST는 UTC+9 (분 단위)
    const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000)
    
    const year = kstTime.getUTCFullYear()
    const month = String(kstTime.getUTCMonth() + 1).padStart(2, '0')
    const day = String(kstTime.getUTCDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
}

// 프록시를 통한 캘린더 데이터 가져오기
async function getCalendarData(pageId: string): Promise<CalendarEvent[]> {
    try {
        const response = await fetch(
            `${PROXY_BASE_URL}/api/calendar?pageId=${pageId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        )

        if (!response.ok) {
            console.warn(`캘린더 API 응답 오류: ${response.status}`)
            return []
        }

        const result = await response.json()

        if (result.success && result.data) {
            return result.data
        } else {
            console.warn("캘린더 데이터가 없습니다:", result.error)
            return []
        }
    } catch (error) {
        console.error("캘린더 데이터 가져오기 실패:", error)
        return []
    }
}

// 하트 모양 SVG 컴포넌트
const HeartShape: React.FC<{ color: string; size?: number }> = ({
    color,
    size = 16,
}) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size * 0.875} // 16:14 비율 유지
        viewBox="0 0 16 14"
        fill="none"
        style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -45%)", // 약간 위로 이동
            zIndex: 0,
        }}
    >
        <g clipPath="url(#clip0_31_239)">
            <g style={{ mixBlendMode: "multiply" }}>
                <path
                    d="M8.21957 1.47997C8.08957 1.59997 7.99957 1.73997 7.87957 1.85997C7.75957 1.73997 7.66957 1.59997 7.53957 1.47997C3.08957 -2.76003 -2.51043 2.94997 1.21957 7.84997C2.91957 10.08 5.58957 11.84 7.86957 13.43C10.1596 11.83 12.8196 10.08 14.5196 7.84997C18.2596 2.94997 12.6596 -2.76003 8.19957 1.47997H8.21957Z"
                    fill={color}
                />
            </g>
        </g>
        <defs>
            <clipPath id="clip0_31_239">
                <rect width="15.76" height="13.44" fill="white" />
            </clipPath>
        </defs>
    </svg>
)

export default function CalendarComponentProxy({
    pageId = "default",
}: CalendarComponentProxyProps) {
    const [calendarData, setCalendarData] = useState<CalendarEvent[]>([])
    const [pageSettings, setPageSettings] = useState<PageSettings | null>(null)
    const [currentMonth, setCurrentMonth] = useState<string>("")
    const [currentYear, setCurrentYear] = useState<number>(
        new Date().getFullYear()
    )
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // Typography 폰트 로딩
    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                typography.ensure()
            }
        } catch (error) {
            console.warn("[CalendarProxy] Typography loading failed:", error)
        }
    }, [])

    // Pretendard 폰트 스택을 안전하게 가져오기
    const pretendardFontFamily = useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.pretendardVariable ||
                '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    // P22 폰트 스택을 안전하게 가져오기
    const p22FontFamily = useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.p22 ||
                '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    // Goldenbook 폰트 스택을 안전하게 가져오기
    const goldenbookFontFamily = useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.goldenbook ||
                '"Goldenbook", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"Goldenbook", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    // 데이터 로드
    const loadData = async () => {
        try {
            setLoading(true)
            setError("")

            // 페이지 설정과 캘린더 데이터를 병렬로 로드
            const [settings, calendar] = await Promise.all([
                getPageSettings(pageId),
                getCalendarData(pageId),
            ])

            setPageSettings(settings)
            setCalendarData(calendar)

            if (calendar.length > 0) {
                // 캘린더 데이터의 첫 번째 날짜에서 직접 파싱
                const dateParts = extractKSTDateParts(calendar[0].date)
                setCurrentMonth((dateParts.month + 1).toString())
                setCurrentYear(dateParts.year)
            } else if (settings && settings.wedding_date) {
                // 캘린더 데이터가 없으면 웨딩 날짜를 기준으로 월 설정
                const dateParts = extractKSTDateParts(settings.wedding_date)
                setCurrentMonth((dateParts.month + 1).toString())
                setCurrentYear(dateParts.year)
            }
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "데이터를 불러오는 중 오류가 발생했습니다"
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [pageId])

    // D-day 계산 함수 (KST 기준, 날짜만 비교)
    const calculateDday = () => {
        try {
            const weddingDate = pageSettings?.wedding_date
            if (!weddingDate) {
                return "D-00일"
            }

            // 현재 KST 날짜를 YYYY-MM-DD 형식으로 가져오기
            const todayKST = getCurrentKSTDate()
            
            // 오늘 날짜와 웨딩 날짜를 모두 문자열 기반으로 파싱
            const todayParts = extractKSTDateParts(todayKST)
            const targetParts = extractKSTDateParts(weddingDate)

            // 날짜 차이 계산 (날짜만 비교, UTC 기준으로 통일)
            const todayDate = new Date(
                Date.UTC(todayParts.year, todayParts.month, todayParts.day)
            )
            const targetDate = new Date(
                Date.UTC(targetParts.year, targetParts.month, targetParts.day)
            )

            const timeDiff = targetDate.getTime() - todayDate.getTime()
            const dayDiff = Math.round(timeDiff / (1000 * 3600 * 24))

            if (dayDiff > 0) {
                return `D-${dayDiff.toString().padStart(2, "0")}일`
            } else if (dayDiff === 0) {
                return "D-DAY"
            } else {
                return `D+${Math.abs(dayDiff).toString().padStart(2, "0")}일`
            }
        } catch (error) {
            return "D-00일"
        }
    }

    // 날짜와 시간 포맷팅 함수
    const formatDateTime = () => {
        try {
            const weddingDate = pageSettings?.wedding_date
            const weddingTime = pageSettings?.wedding_time

            if (!weddingDate || !weddingTime) {
                return "날짜 정보 없음"
            }

            // 날짜 문자열에서 직접 연/월/일 추출 (시간 무시)
            const dateParts = extractKSTDateParts(weddingDate)
            const [hour, minute] = weddingTime.split(":")
            
            const year = dateParts.year
            const month = dateParts.month + 1 // 1-based month
            const day = dateParts.day
            
            // 요일 계산: 날짜 문자열에서 직접 연/월/일을 추출하여 UTC Date 객체 생성
            // 이렇게 하면 타임존 변환 없이 정확한 요일을 계산할 수 있음
            const dateForDay = new Date(Date.UTC(dateParts.year, dateParts.month, dateParts.day))
            const dayNames = [
                "일요일",
                "월요일",
                "화요일",
                "수요일",
                "목요일",
                "금요일",
                "토요일",
            ]
            const dayName = dayNames[dateForDay.getUTCDay()]

            const hour24 = parseInt(hour)
            const hour12 =
                hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
            const ampm = hour24 < 12 ? "오전" : "오후"

            // 분 정보 처리: 00분이 아닌 경우만 표시
            const minuteValue = parseInt(minute)
            const minuteText = minuteValue !== 0 ? ` ${minuteValue}분` : ""

            return `${year}년 ${month}월 ${day}일 ${dayName} ${ampm} ${hour12}시${minuteText}`
        } catch (error) {
            return "날짜 형식이 올바르지 않습니다"
        }
    }

    const getDaysInMonth = (year: number, month: number) => {
        // UTC 기준으로 해당 월의 마지막 날짜를 구함
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    }

    const getFirstDayOfMonth = (year: number, month: number) => {
        // UTC 기준으로 해당 월의 첫 번째 날의 요일을 구함
        return new Date(Date.UTC(year, month, 1)).getUTCDay()
    }

    const generateCalendar = () => {
        if (!currentMonth)
            return {
                weeks: [],
                days: ["S", "M", "T", "W", "T", "F", "S"],
                maxWeeks: 0,
            }

        const monthIndex = parseInt(currentMonth) - 1 // 숫자 월을 0-based index로 변환
        const daysInMonth = getDaysInMonth(currentYear, monthIndex)
        const firstDay = getFirstDayOfMonth(currentYear, monthIndex)

        const weeks = []
        const dayNames = ["S", "M", "T", "W", "T", "F", "S"]

        // 실제 필요한 주 수 계산
        const totalCells = daysInMonth + firstDay
        const actualWeeks = Math.ceil(totalCells / 7)

        // 각 요일별로 날짜 배열 생성
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const daysForColumn = []

            // 첫 번째 주에서 해당 요일이 시작되는 날짜 계산
            let startDate = dayIndex - firstDay + 1

            // 해당 요일의 모든 날짜 추가 (실제 주 수만큼만)
            let weekCount = 0
            while (weekCount < actualWeeks) {
                if (startDate > 0 && startDate <= daysInMonth) {
                    daysForColumn.push(startDate)
                } else {
                    daysForColumn.push(null) // 빈 날짜는 null로 표시
                }
                startDate += 7
                weekCount++
            }

            weeks.push(daysForColumn)
        }

        return { weeks, days: dayNames, maxWeeks: actualWeeks }
    }

    const isHighlighted = (day: number | null) => {
        if (day === null) return false

        const currentMonthIndex = parseInt(currentMonth) - 1 // 0-based

        // 1. 웨딩 날짜인지 확인
        if (pageSettings?.wedding_date) {
            const dateParts = extractKSTDateParts(pageSettings.wedding_date)
            const isWeddingDay =
                dateParts.day === day &&
                dateParts.month === currentMonthIndex &&
                dateParts.year === currentYear

            if (isWeddingDay) {
                return true
            }
        }

        // 2. 캘린더 이벤트 날짜인지 확인
        const isEventDay = calendarData.some((item) => {
            const dateParts = extractKSTDateParts(item.date)
            const matches =
                dateParts.day === day &&
                dateParts.month === currentMonthIndex &&
                dateParts.year === currentYear

            return matches
        })

        return isEventDay
    }

    const { weeks, days, maxWeeks } = generateCalendar()

    // 달력 끝에서 고정 간격 40px
    const fixedMarginTop = 40

    // 로딩 상태
    if (loading) {
        return (
            <div
                style={{
                    width: "fit-content",
                    height: "fit-content",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "40px",
                }}
            >
                <div
                    style={{
                        fontSize: "16px",
                        fontFamily: pretendardFontFamily,
                        fontWeight: 400,
                        textAlign: "center",
                    }}
                >
                    로딩 중...
                </div>
            </div>
        )
    }

    // 에러 상태
    if (error) {
        return (
            <div
                style={{
                    width: "fit-content",
                    height: "fit-content",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "40px",
                }}
            >
                <div
                    style={{
                        fontSize: "16px",
                        fontFamily: pretendardFontFamily,
                        fontWeight: 400,
                        textAlign: "center",
                        color: "#888",
                    }}
                >
                    정보 없음
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                width: "fit-content",
                height: "fit-content",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            {/* 날짜와 시간 표시 */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
                style={{
                    fontSize: "16px",
                    lineHeight: "1.8em",
                    fontFamily: pretendardFontFamily,
                    fontWeight: 400,
                    textAlign: "center",
                    marginBottom: "20px",
                }}
            >
                {formatDateTime()}
            </motion.div>

            {/* 월 표시 */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
                style={{
                    fontSize: "50px",
                    lineHeight: "1.8em",
                    fontFamily:
                        pageSettings?.type === "papillon"
                            ? p22FontFamily
                            : pageSettings?.type === "eternal"
                              ? goldenbookFontFamily
                              : p22FontFamily,
                    fontWeight: 400,
                    textAlign: "center",
                    marginBottom: "20px",
                }}
            >
                {currentMonth}
            </motion.div>

            {/* 달력 */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
                style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "11px",
                    padding: "0 20px 0 20px",
                    alignItems: "flex-start",
                    justifyContent: "center",
                }}
            >
                {weeks.map((daysInColumn, columnIndex) => (
                    <div
                        key={columnIndex}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textAlign: "center",
                        }}
                    >
                        {/* 요일 헤더 */}
                        <div
                            style={{
                                fontSize: "15px",
                                lineHeight: "2.6em",
                                fontFamily: pretendardFontFamily,
                                fontWeight: 600,
                                marginBottom: "5px",
                            }}
                        >
                            {days[columnIndex]}
                        </div>

                        {/* 날짜들 */}
                        {daysInColumn.map((day, dayIndex) => (
                            <div
                                key={dayIndex}
                                style={{
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "31px",
                                    height: "31px",
                                    marginBottom: "2px",
                                }}
                            >
                                {day !== null ? (
                                    <>
                                        {/* 하이라이트 배경 (원형 또는 하트) */}
                                        {isHighlighted(day) && (
                                            <>
                                                {pageSettings?.highlight_shape ===
                                                "heart" ? (
                                                    <motion.div
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            zIndex: 0,
                                                        }}
                                                        animate={{
                                                            scale: [1, 1.2, 1],
                                                            opacity: [
                                                                1, 0.8, 1,
                                                            ],
                                                        }}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                        }}
                                                    >
                                                        <HeartShape
                                                            color={
                                                                pageSettings?.highlight_color ||
                                                                "#e0e0e0"
                                                            }
                                                            size={28}
                                                        />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            width: "31px",
                                                            height: "31px",
                                                            borderRadius: "50%",
                                                            backgroundColor:
                                                                pageSettings?.highlight_color ||
                                                                "#e0e0e0",
                                                            zIndex: 0,
                                                        }}
                                                        animate={{
                                                            scale: [1, 1.2, 1],
                                                            opacity: [
                                                                1, 0.8, 1,
                                                            ],
                                                        }}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                        }}
                                                    />
                                                )}
                                            </>
                                        )}

                                        {/* 날짜 텍스트 */}
                                        <div
                                            style={{
                                                fontSize: "15px",
                                                lineHeight: "2.6em",
                                                fontFamily:
                                                    pretendardFontFamily,
                                                fontWeight: isHighlighted(day)
                                                    ? 600
                                                    : 400,
                                                color: isHighlighted(day)
                                                    ? pageSettings?.highlight_text_color ||
                                                      "black"
                                                    : "black",
                                                zIndex: 1,
                                                position: "relative",
                                            }}
                                        >
                                            {day}
                                        </div>
                                    </>
                                ) : (
                                    // 빈 공간
                                    <div
                                        style={{
                                            width: "31px",
                                            height: "31px",
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </motion.div>

            {/* 하단 신랑신부 이름과 D-day */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginTop: `${fixedMarginTop}px`,
                }}
            >
                {/* 신랑신부 이름 */}
                <div
                    style={{
                        fontSize: "17px",
                        lineHeight: "1em",
                        fontFamily: pretendardFontFamily,
                        fontWeight: 400,
                        textAlign: "center",
                        marginBottom: "10px",
                    }}
                >
                    {pageSettings?.cal_txt ||
                        `${pageSettings?.groom_name || "신랑"} ♥ ${pageSettings?.bride_name || "신부"}의 결혼식`}
                </div>

                {/* D-day 카운터 */}
                <div
                    style={{
                        fontSize: "17px",
                        lineHeight: "1em",
                        fontFamily: pretendardFontFamily,
                        fontWeight: 600,
                        textAlign: "center",
                    }}
                >
                    {calculateDday()}
                </div>
            </motion.div>
        </div>
    )
}

addPropertyControls(CalendarComponentProxy, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "",
        placeholder: "Enter page ID",
    },
})