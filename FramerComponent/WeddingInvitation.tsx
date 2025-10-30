import React, { useEffect, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

function renderBoldSegments(
    text: string,
    baseStyle?: React.CSSProperties
): JSX.Element[] {
    const out: JSX.Element[] = []
    let last = 0
    let key = 0
    const re = /\*([^*]+)\*/g
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
        const start = m.index
        const end = start + m[0].length
        if (start > last) {
            const chunk = text.slice(last, start)
            if (chunk)
                out.push(
                    <span key={`nb-${key++}`} style={baseStyle}>
                        {chunk}
                    </span>
                )
        }
        const boldText = m[1]
        out.push(
            <span
                key={`b-${key++}`}
                style={{
                    ...(baseStyle || {}),
                    fontFamily: "Pretendard SemiBold",
                }}
            >
                {boldText}
            </span>
        )
        last = end
    }
    if (last < text.length) {
        const rest = text.slice(last)
        if (rest)
            out.push(
                <span key={`nb-${key++}`} style={baseStyle}>
                    {rest}
                </span>
            )
    }
    return out
}

function renderInvitationSegments(text: string): JSX.Element[] {
    const lines = (text || "").split("\n")
    const rendered: JSX.Element[] = []
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const parts: JSX.Element[] = []
        let lastIndex = 0
        let keySeq = 0
        const regex = /\{([^}]*)\}/g
        let match: RegExpExecArray | null
        while ((match = regex.exec(line)) !== null) {
            const start = match.index
            const end = start + match[0].length
            if (start > lastIndex) {
                const chunk = line.slice(lastIndex, start)
                if (chunk)
                    parts.push(
                        <span key={`t-${i}-${keySeq++}`}>
                            {renderBoldSegments(chunk)}
                        </span>
                    )
            }
            const inner = match[1]
            if (inner)
                parts.push(
                    <span
                        key={`q-${i}-${keySeq++}`}
                        style={{
                            fontSize: 14,
                            lineHeight: "1em",
                            color: "#6e6e6e",
                        }}
                    >
                        {renderBoldSegments(inner, {
                            fontSize: 14,
                            lineHeight: "1em",
                            color: "#6e6e6e",
                        })}
                    </span>
                )
            lastIndex = end
        }
        if (lastIndex < line.length) {
            const rest = line.slice(lastIndex)
            if (rest)
                parts.push(
                    <span key={`t-${i}-${keySeq++}`}>
                        {renderBoldSegments(rest)}
                    </span>
                )
        }
        rendered.push(
            <span key={`line-${i}`}>
                {parts}
                {i !== lines.length - 1 && <br />}
            </span>
        )
    }
    return rendered
}

function ChrysanthemumIcon() {
    return (
        <div
            style={{
                width: 13,
                height: 19,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="20"
                viewBox="0 0 13 20"
                fill="none"
            >
                <path
                    d="M8.13164 1.0899C8.27511 0.760965 8.52941 0.404781 8.89141 0.522519C9.37558 0.6834 9.59449 1.15577 9.66973 1.68268C9.89531 1.75563 9.99814 2.01813 10.0174 2.31158C10.229 2.09849 10.4358 1.93762 10.6404 1.85162C10.852 1.76379 11.2472 1.71843 11.4188 1.90143C11.7126 2.20801 11.4463 2.93957 11.2889 3.31158C11.5476 3.17333 11.8016 3.07789 12.0271 3.04791C12.279 3.01987 12.6975 3.12835 12.785 3.35455C12.8879 3.6406 12.6692 4.10757 12.4979 4.3692C12.6622 4.4215 12.9417 4.58788 12.991 4.77838C13.0715 5.1503 12.6158 5.6257 12.3289 5.85943C12.5133 6.20282 12.3054 6.49529 11.9314 6.73541C12.2043 7.62814 12.3261 8.56591 11.8328 9.00689C11.4026 8.96195 11.0141 8.75024 10.6854 8.3858C10.5087 9.37846 9.71434 8.87405 9.20879 8.39361C9.08635 8.77305 8.90331 9.12311 8.59551 9.27643C8.36285 9.1007 8.1841 8.89651 8.04766 8.61236C7.86841 8.87682 7.59335 9.15184 7.29961 9.05475C6.13161 11.374 5.21645 13.5711 4.51738 15.8467C4.64714 15.6993 4.78105 15.5601 4.91973 15.4317C4.97571 15.3364 5.08425 15.1911 5.13848 15.1182C5.70524 14.3518 6.37492 13.482 7.15508 12.9268C7.52417 12.6501 7.93391 12.417 8.35723 12.2188C8.38508 12.2058 8.42496 12.2054 8.45293 12.2256C8.51416 12.2556 8.5426 12.3292 8.50762 12.3946L8.31719 12.8184C8.93116 12.3214 9.7448 12.1685 10.3797 12.4395C10.4005 12.4397 10.4146 12.4526 10.4285 12.46C10.4546 12.4899 10.4753 12.5331 10.4822 12.5704C10.4891 12.6207 10.468 12.6654 10.4471 12.6934C10.428 12.7158 10.4216 12.7381 10.4285 12.753C10.4355 12.781 10.4759 12.8184 10.5301 12.8389C11.1248 13.0595 11.6844 13.3869 12.2039 13.8038C12.2179 13.8187 12.2251 13.8337 12.2391 13.8467C12.253 13.8766 12.2529 13.9144 12.2459 13.9424C12.2388 13.9796 12.2175 14.0076 12.1844 14.0225C11.5967 14.3664 10.9599 14.5547 10.4002 14.5547C10.5103 14.665 10.6049 14.8037 10.6609 14.9942C10.6662 15.0297 10.6728 15.0602 10.6658 15.0958C10.6465 15.1833 10.5787 15.2483 10.5037 15.2559H10.4402L8.92363 14.9424L8.93828 15.1026L8.93047 15.1407C8.92346 15.1704 8.91135 15.1912 8.89043 15.2061C8.86258 15.2209 8.84139 15.2204 8.81524 15.2129L8.61113 15.1631C7.74348 14.9295 7.0517 14.7967 6.15606 14.9874C5.53607 15.4061 4.74301 16.1078 4.21758 16.8809C3.98195 17.7357 3.77429 18.6052 3.59453 19.5001C3.41789 19.4496 3.34921 19.4632 3.16387 19.4053C3.32378 17.9507 3.61474 16.4362 4.01934 14.9346C4.03998 14.1363 3.92715 13.3055 3.7791 12.6866C3.25256 11.8996 2.66415 11.4899 1.87871 11.0225L1.69414 10.9122C1.6749 10.8972 1.66028 10.877 1.64629 10.8546C1.63931 10.8247 1.64699 10.7969 1.66094 10.7745L1.67461 10.7442L1.78984 10.6358L0.485157 9.75104C0.471172 9.73612 0.452098 9.72112 0.445118 9.70807C0.389194 9.64077 0.381665 9.54721 0.423634 9.46686C0.444571 9.44447 0.464067 9.42194 0.491993 9.40143C0.65634 9.30618 0.813922 9.26862 0.969532 9.26861C0.560309 8.86109 0.212243 8.26118 0.00761836 7.57525C-0.00630065 7.54546 0.00056894 7.51036 0.0144543 7.48053C0.0266994 7.45249 0.0548249 7.42258 0.0828137 7.4151C0.0949872 7.40766 0.115656 7.40728 0.136525 7.40729C0.778518 7.48019 1.40178 7.65575 1.96856 7.92682C2.02974 7.95483 2.0773 7.96227 2.10527 7.94732C2.11909 7.93239 2.12578 7.91162 2.12578 7.88189C2.13104 7.83893 2.1455 7.80144 2.18047 7.77154C2.20673 7.7437 2.24878 7.72857 2.28887 7.72857C2.30965 7.72865 2.32371 7.7358 2.34453 7.74322C2.97253 8.01242 3.47094 8.7216 3.60039 9.52545L3.73125 9.08014C3.75053 9.01476 3.81947 8.9773 3.88067 8.99225C3.90864 9.00721 3.94301 9.03561 3.95 9.06549C4.13368 9.51789 4.27746 9.99267 4.38067 10.46C4.5776 11.4286 4.51712 12.5474 4.43535 13.5245C5.02805 11.6658 5.7898 9.8626 6.6834 8.25396C6.64679 8.0852 6.63418 7.90435 6.64141 7.72076C6.43499 7.61234 6.381 7.32587 6.40899 7.03424C6.16934 7.20248 5.93623 7.31847 5.71758 7.36334C5.49192 7.41381 5.10321 7.37137 4.95977 7.15826C4.74786 6.83305 5.04871 6.2589 5.27422 5.90045C5.24042 5.88056 5.21022 5.86126 5.1834 5.84186C4.96039 5.89966 4.75449 5.92755 4.57012 5.90924C4.31122 5.88867 3.91406 5.70508 3.87383 5.46393C3.81817 5.16485 4.11928 4.74863 4.33086 4.52252C4.17351 4.43471 3.92797 4.21579 3.9207 4.01959C3.90567 3.74787 4.1754 3.47883 4.44707 3.28424C4.14649 2.58832 4.00703 1.89122 4.34649 1.44928C4.77664 1.41193 5.19286 1.53712 5.58281 1.836C5.583 0.821311 6.45133 1.15585 7.03203 1.53717C7.09326 1.13527 7.21033 0.748652 7.4832 0.543027C7.74353 0.668191 7.95511 0.836021 8.13164 1.0899Z"
                    fill="black"
                />
            </svg>
        </div>
    )
}

interface WeddingData {
    invitationText: string
    groomFatherName: string
    groomMotherName: string
    groomName: string
    brideFatherName: string
    brideMotherName: string
    brideName: string
    showGroomFatherChrysanthemum: boolean
    showGroomMotherChrysanthemum: boolean
    showBrideFatherChrysanthemum: boolean
    showBrideMotherChrysanthemum: boolean
    sonLabel: string
    daughterLabel: string
}

interface InviteNameProps {
    pageId?: string
    style?: React.CSSProperties
}

export default function WeddingInvitationProxy(props: InviteNameProps) {
    const { pageId = "default", style } = props

    const [weddingData, setWeddingData] = useState<WeddingData>({
        invitationText: `저희 두 사람이 하나 되는 약속의 시간에\n마음을 담아 소중한 분들을 모십니다.\n귀한 걸음으로 축복해 주시면 감사하겠습니다.`,
        groomFatherName: "김일번",
        groomMotherName: "김이번",
        groomName: "김삼번",
        brideFatherName: "김사번",
        brideMotherName: "김오번",
        brideName: "김육번",
        showGroomFatherChrysanthemum: false,
        showGroomMotherChrysanthemum: false,
        showBrideFatherChrysanthemum: false,
        showBrideMotherChrysanthemum: false,
        sonLabel: "아들",
        daughterLabel: "딸",
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        async function loadInvite() {
            setLoading(true)
            setError(null)
            try {
                const response = await fetch(
                    `${PROXY_BASE_URL}/api/invite?pageId=${encodeURIComponent(pageId)}`,
                    {
                        method: "GET",
                        headers: { "Content-Type": "application/json" },
                    }
                )
                if (!response.ok) {
                    const text = await response.text()
                    throw new Error(`HTTP ${response.status}: ${text}`)
                }
                const result = await response.json()
                if (mounted && result.success && result.data) {
                    const d = result.data
                    setWeddingData({
                        invitationText: d.invitation_text || "",
                        groomFatherName: d.groom_father_name || "",
                        groomMotherName: d.groom_mother_name || "",
                        groomName: d.groom_name || "",
                        brideFatherName: d.bride_father_name || "",
                        brideMotherName: d.bride_mother_name || "",
                        brideName: d.bride_name || "",
                        showGroomFatherChrysanthemum:
                            !!d.show_groom_father_chrysanthemum,
                        showGroomMotherChrysanthemum:
                            !!d.show_groom_mother_chrysanthemum,
                        showBrideFatherChrysanthemum:
                            !!d.show_bride_father_chrysanthemum,
                        showBrideMotherChrysanthemum:
                            !!d.show_bride_mother_chrysanthemum,
                        sonLabel: d.son_label || "아들",
                        daughterLabel: d.daughter_label || "딸",
                    })
                }
            } catch (e: any) {
                if (mounted)
                    setError(
                        e?.message || "초대장 데이터를 불러오지 못했습니다"
                    )
            } finally {
                if (mounted) setLoading(false)
            }
        }
        loadInvite()
        return () => {
            mounted = false
        }
    }, [pageId])

    const dotNeeded = (a: string, b: string) => !!(a && b)

    return (
        <div
            style={{
                width: "100%",
                paddingBottom: 30,
                background: "transparent",
                overflow: "hidden",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                gap: 10,
                display: "inline-flex",
                ...style,
            }}
        >
            <div
                style={{
                    alignSelf: "stretch",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 30,
                    display: "flex",
                }}
            >
                {/* 초대글 */}
                <div
                    style={{
                        alignSelf: "stretch",
                        textAlign: "center",
                        color: "black",
                        fontSize: 16,
                        fontFamily: "Pretendard Regular",
                        lineHeight: "32px",
                        wordWrap: "break-word",
                    }}
                >
                    {renderInvitationSegments(weddingData.invitationText)}
                </div>

                {/* 이름 영역 */}
                <div
                    style={{
                        width: "fit-content",
                        whiteSpace: "nowrap",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "flex-start",
                        gap: 20,
                    }}
                >
                    {/* 좌측 부모/아들·딸 컬럼 */}
                    <div
                        style={{
                            width: "100%",
                            display: "inline-flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                        }}
                    >
                        {/* 신랑 부모 라인 */}
                        <div
                            style={{
                                display: "inline-flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: 4,
                            }}
                        >
                            <div
                                style={{
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                                    gap: 4,
                                    display: "flex",
                                }}
                            >
                                {weddingData.showGroomFatherChrysanthemum && (
                                    <ChrysanthemumIcon />
                                )}
                                <div
                                    style={{
                                        color: "black",
                                        fontSize: 18,
                                        fontFamily: "Pretendard Regular",
                                        lineHeight: "32px",
                                        wordWrap: "break-word",
                                    }}
                                >
                                    {weddingData.groomFatherName || ""}
                                </div>
                                {dotNeeded(
                                    weddingData.groomFatherName,
                                    weddingData.groomMotherName
                                ) && (
                                    <div
                                        style={{
                                            color: "black",
                                            fontSize: 18,
                                            fontFamily: "Pretendard Regular",
                                            lineHeight: "32px",
                                            wordWrap: "break-word",
                                        }}
                                    >
                                        ·
                                    </div>
                                )}
                                {weddingData.showGroomMotherChrysanthemum && (
                                    <ChrysanthemumIcon />
                                )}
                                <div
                                    style={{
                                        color: "black",
                                        fontSize: 18,
                                        fontFamily: "Pretendard Regular",
                                        lineHeight: "32px",
                                        wordWrap: "break-word",
                                    }}
                                >
                                    {weddingData.groomMotherName || ""}
                                </div>
                            </div>
                            <div
                                style={{
                                    color: "black",
                                    fontSize: 18,
                                    fontFamily: "Pretendard Regular",
                                    lineHeight: "32px",
                                    wordWrap: "break-word",
                                }}
                            >
                                의
                            </div>
                            <div
                                style={{
                                    color: "black",
                                    fontSize: 18,
                                    fontFamily: "Pretendard Regular",
                                    lineHeight: "32px",
                                    wordWrap: "break-word",
                                }}
                            >
                                {weddingData.sonLabel || "아들"}
                            </div>
                        </div>
                        {/* 신부 부모 라인 */}
                        <div
                            style={{
                                display: "inline-flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: 4,
                            }}
                        >
                            <div
                                style={{
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                                    gap: 4,
                                    display: "flex",
                                }}
                            >
                                {weddingData.showBrideFatherChrysanthemum && (
                                    <ChrysanthemumIcon />
                                )}
                                <div
                                    style={{
                                        color: "black",
                                        fontSize: 18,
                                        fontFamily: "Pretendard Regular",
                                        lineHeight: "32px",
                                        wordWrap: "break-word",
                                    }}
                                >
                                    {weddingData.brideFatherName || ""}
                                </div>
                                {dotNeeded(
                                    weddingData.brideFatherName,
                                    weddingData.brideMotherName
                                ) && (
                                    <div
                                        style={{
                                            color: "black",
                                            fontSize: 18,
                                            fontFamily: "Pretendard Regular",
                                            lineHeight: "32px",
                                            wordWrap: "break-word",
                                        }}
                                    >
                                        ·
                                    </div>
                                )}
                                {weddingData.showBrideMotherChrysanthemum && (
                                    <ChrysanthemumIcon />
                                )}
                                <div
                                    style={{
                                        color: "black",
                                        fontSize: 18,
                                        fontFamily: "Pretendard Regular",
                                        lineHeight: "32px",
                                        wordWrap: "break-word",
                                    }}
                                >
                                    {weddingData.brideMotherName || ""}
                                </div>
                            </div>
                            <div
                                style={{
                                    color: "black",
                                    fontSize: 18,
                                    fontFamily: "Pretendard Regular",
                                    lineHeight: "32px",
                                    wordWrap: "break-word",
                                }}
                            >
                                의
                            </div>
                            <div
                                style={{
                                    color: "black",
                                    fontSize: 18,
                                    fontFamily: "Pretendard Regular",
                                    lineHeight: "32px",
                                    wordWrap: "break-word",
                                }}
                            >
                                {weddingData.daughterLabel || "딸"}
                            </div>
                        </div>
                    </div>

                    {/* 우측 이름 컬럼 */}
                    <div
                        style={{
                            width: "100%",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                            display: "inline-flex",
                        }}
                    >
                        <div
                            style={{
                                alignSelf: "stretch",
                                color: "black",
                                fontSize: 18,
                                fontFamily: "Pretendard SemiBold",
                                lineHeight: "32px",
                                wordWrap: "break-word",
                            }}
                        >
                            {weddingData.groomName || ""}
                        </div>
                        <div
                            style={{
                                alignSelf: "stretch",
                                color: "black",
                                fontSize: 18,
                                fontFamily: "Pretendard SemiBold",
                                lineHeight: "32px",
                                wordWrap: "break-word",
                            }}
                        >
                            {weddingData.brideName || ""}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(WeddingInvitationProxy, {
    pageId: {
        type: ControlType.String,
        title: "page_id",
        defaultValue: "default",
        placeholder: "예: default",
    },
})
