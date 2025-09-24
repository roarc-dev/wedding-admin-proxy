import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// ======= UTILITY FUNCTIONS =======
// API 호출 관련 유틸리티들을 상단에 정리

const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

// R2 Key generation utilities
function slugifyName(name: string): string {
    const idx = name.lastIndexOf('.')
    const base = idx >= 0 ? name.slice(0, idx) : name
    const ext = idx >= 0 ? name.slice(idx) : ''
    return base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        + ext.toLowerCase()
}

function makeGalleryKey(pageId: string, file: File): string {
    return `gallery/${pageId}/${Date.now()}-${slugifyName(file.name)}`
}

// Legacy Supabase transform function
function toTransformedUrl(
    publicUrl: string,
    opts: {
        width?: number
        height?: number
        quality?: number
        format?: "webp" | "jpg" | "png"
        resize?: "cover" | "contain" | "fill"
    }
): string {
    if (!publicUrl) return publicUrl
    try {
        const url = new URL(publicUrl)
        const split = url.pathname.split("/storage/v1/object/")
        if (split.length !== 2) return publicUrl
        url.pathname = `/storage/v1/render/image/${split[1]}`
        const params = url.searchParams
        if (opts.width) params.set("width", String(opts.width))
        if (opts.height) params.set("height", String(opts.height))
        if (opts.quality) params.set("quality", String(opts.quality))
        if (opts.format) params.set("format", opts.format)
        if (opts.resize) params.set("resize", opts.resize)
        return url.toString()
    } catch {
        return publicUrl
    }
}

// ======= API SERVICE FUNCTIONS =======
// 모든 API 호출 로직을 여기에 집중

class ApiService {
    private static getAuthToken(): string | null {
        if (typeof localStorage === "undefined") return null
        return localStorage.getItem("admin_session")
    }

    private static async request(endpoint: string, options: RequestInit = {}) {
        const token = this.getAuthToken()
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers as Record<string, string>,
        }
        
        if (token) {
            headers.Authorization = `Bearer ${token}`
        }

        const response = await fetch(`${PROXY_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        })

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`)
        }

        return response.json()
    }

    // 인증 관련
    static async login(username: string, password: string) {
        return this.request('/api/user-management', {
            method: 'POST',
            body: JSON.stringify({
                action: 'login',
                username,
                password,
            }),
        })
    }

    // 페이지 설정 관련
    static async getPageSettings(pageId: string) {
        return this.request(`/api/page-settings?pageId=${pageId}`)
    }

    static async savePageSettings(pageId: string, settings: any) {
        return this.request('/api/page-settings', {
            method: 'POST',
            body: JSON.stringify({
                pageId,
                settings,
            }),
        })
    }

    // 이미지 관련
    static async getImages(pageId: string) {
        return this.request(`/api/images?pageId=${pageId}`)
    }

    static async uploadToR2(file: File, pageId: string, customKey?: string) {
        const key = customKey || makeGalleryKey(pageId, file)
        
        // 1. Get presigned URL
        const presignResponse = await this.request('/api/r2?action=simple', {
            method: 'POST',
            body: JSON.stringify({
                pageId,
                fileName: file.name,
                contentType: file.type,
                key,
            }),
        })

        // 2. Upload to R2
        const uploadResponse = await fetch(presignResponse.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
            },
        })

        if (!uploadResponse.ok) {
            throw new Error('R2 upload failed')
        }

        return {
            key: presignResponse.key,
            publicUrl: presignResponse.publicUrl,
        }
    }

    static async saveImageMeta(pageId: string, fileName: string, order: number, storagePath: string, fileSize: number) {
        return this.request('/api/images', {
            method: 'POST',
            body: JSON.stringify({
                action: 'saveMeta',
                pageId,
                fileName,
                displayOrder: order,
                storagePath,
                fileSize,
            }),
        })
    }

    static async deleteFromR2(publicUrl: string) {
        const url = new URL(publicUrl)
        const key = url.pathname.substring(1)
        
        return this.request('/api/r2?action=delete', {
            method: 'POST',
            body: JSON.stringify({ key }),
        })
    }

    // 연락처 관련
    static async getContacts(pageId: string) {
        return this.request(`/api/contacts?pageId=${pageId}`)
    }

    static async saveContact(contactData: any) {
        return this.request('/api/contacts', {
            method: 'POST',
            body: JSON.stringify(contactData),
        })
    }
}

// ======= UI THEME & PRIMITIVES =======
// 모든 UI 관련 토큰과 컴포넌트들을 여기에 정리

const theme = {
    color: {
        bg: "#ffffff",
        text: "#111827",
        sub: "#374151",
        muted: "#6b7280",
        border: "#e5e7eb",
        overlay: "rgba(0,0,0,0.04)",
        primary: "#111827",
        primaryText: "#ffffff",
        danger: "#ef4444",
        success: "#10b981",
        surface: "#f9fafb",
        sectionColor: "#757575",
        labelColor: "black",
        roarc: {
            white: "var(--White, white)",
            grey600: "var(--roarc-grey-600, #757575)",
            greyBorder: "var(--Grey-Border, #E5E6E8)",
        },
    },
    font: {
        body: "Pretendard Regular",
        bodyBold: "Pretendard SemiBold",
        display: "P22LateNovemberW01-Regular Regular, serif",
    },
    radius: { xs: 0, sm: 2, md: 0, lg: 0, xl: 24, pill: 999 },
    shadow: {
        card: "0 1px 3px rgba(0,0,0,0)",
        pop: "0 8px 24px rgba(0,0,0,0.12)",
    },
    space: (n: number) => n * 4,
    text: {
        xs: 12,
        sm: 14,
        base: 16,
        md: 17,
        lg: 20,
        xl: 24,
        display: 48,
    },
    gap: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
    },
    typography: {
        label: {
            fontFamily: "Pretendard SemiBold",
            fontSize: 14,
            color: "black",
        },
        body: {
            fontFamily: "Pretendard Regular",
            fontSize: 14,
        },
        sectionHeader: {
            fontFamily: "Pretendard Regular",
            fontSize: 14,
            color: "#757575",
        },
    },
    border: {
        width: 1,
        radius: 0
    },
    formSpace: {
        fieldGroupGap: 16,
        fieldLabelGap: 8
    },
} as const

function mergeStyles(...styles: Array<React.CSSProperties | undefined>): React.CSSProperties {
    return Object.assign({}, ...styles)
}

// UI Primitives
type FormFieldProps = {
    label: string
    htmlFor?: string
    helpText?: string
    required?: boolean
    gap?: number
    labelGap?: number
    style?: React.CSSProperties
    labelStyle?: React.CSSProperties
    children: React.ReactNode
}

function FormField({
    label,
    htmlFor,
    helpText,
    required,
    gap,
    labelGap,
    style,
    labelStyle,
    children
}: FormFieldProps) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: labelGap ?? theme.formSpace.fieldLabelGap,
                marginBottom: gap ?? theme.formSpace.fieldGroupGap,
                ...style
            }}
        >
            <label
                htmlFor={htmlFor}
                style={{
                    color: theme.color.text,
                    fontSize: 14,
                    fontFamily: "Pretendard SemiBold",
                    ...labelStyle
                }}
            >
                {label} {required ? <span aria-hidden="true" style={{ color: theme.color.danger }}>*</span> : null}
            </label>
            {children}
            {helpText ? (
                <div style={{ color: theme.color.muted, fontSize: 12, marginTop: 4 }}>{helpText}</div>
            ) : null}
        </div>
    )
}

type InputBaseProps = React.InputHTMLAttributes<HTMLInputElement> & {
    invalid?: boolean
}

const InputBase = React.forwardRef<HTMLInputElement, InputBaseProps>(function InputBase(
    { style, invalid, ...props },
    ref
) {
    return (
        <input
            ref={ref}
            {...props}
            style={{
                width: "100%",
                height: 40,
                padding: "10px 12px",
                borderStyle: "solid",
                borderWidth: theme.border.width,
                borderColor: invalid ? theme.color.danger : theme.color.border,
                borderRadius: theme.border.radius,
                outline: "none",
                background: theme.color.surface,
                color: theme.color.text,
                fontFamily: "Pretendard Regular",
                fontSize: 14,
                ...style
            }}
        />
    )
})

type ButtonBaseProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "default" | "danger"
}

const ButtonBase: React.FC<ButtonBaseProps> = ({
    variant = "default",
    style,
    children,
    ...props
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case "primary":
                return {
                    background: theme.color.primary,
                    color: theme.color.primaryText,
                    borderColor: theme.color.primary,
                }
            case "danger":
                return {
                    background: theme.color.danger,
                    color: theme.color.primaryText,
                    borderColor: theme.color.danger,
                }
            default:
                return {
                    background: theme.color.bg,
                    color: theme.color.text,
                    borderColor: theme.color.border,
                }
        }
    }

    return (
        <button
            {...props}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 40,
                padding: "0 14px",
                borderStyle: "solid",
                borderWidth: theme.border.width,
                borderRadius: theme.border.radius,
                cursor: "pointer",
                fontFamily: "Pretendard Regular",
                fontSize: 14,
                ...getVariantStyles(),
                ...style
            }}
        >
            {children}
        </button>
    )
}

function Card({
    children,
    style,
}: React.PropsWithChildren<{ style?: React.CSSProperties }>) {
    return (
        <div
            style={mergeStyles(
                {
                    background: theme.color.bg,
                    border: `1px solid ${theme.color.border}`,
                    borderRadius: theme.radius.sm,
                    boxShadow: theme.shadow.card,
                    padding: theme.space(5),
                },
                style
            )}
        >
            {children}
        </div>
    )
}

function Section({
    title,
    isOpen = true,
    onToggle,
    children,
    style,
}: React.PropsWithChildren<{
    title: string
    isOpen?: boolean
    onToggle?: () => void
    style?: React.CSSProperties
}>) {
    return (
        <div
            style={mergeStyles({
                background: theme.color.roarc.white,
                border: `0.50px solid ${theme.color.roarc.greyBorder}`,
                borderRadius: theme.radius.md,
                overflow: "hidden",
                ...style,
            })}
        >
            <div
                style={{
                    alignSelf: "stretch",
                    padding: "14px 16px",
                    background: theme.color.roarc.white,
                    overflow: "hidden",
                    borderBottom: isOpen
                        ? `0.50px solid ${theme.color.roarc.greyBorder}`
                        : "none",
                    justifyContent: "center",
                    alignItems: "center",
                    display: "inline-flex",
                    width: "100%",
                    cursor: onToggle ? "pointer" : "default",
                }}
                onClick={onToggle}
            >
                <div
                    style={{
                        flex: "1 1 0",
                        justifyContent: "space-between",
                        alignItems: "center",
                        display: "flex",
                        width: "100%",
                    }}
                >
                    <div
                        style={{
                            color: theme.color.roarc.grey600,
                            fontSize: "16px",
                            fontFamily: "Pretendard Regular",
                            wordWrap: "break-word",
                        }}
                    >
                        {title}
                    </div>

                    {onToggle && (
                        <div
                            style={{
                                width: "32px",
                                height: "32px",
                                padding: "13px 9px",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "10px",
                                display: "inline-flex",
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="8"
                                viewBox="0 0 14 8"
                                fill="none"
                                style={{
                                    transform: `rotate(${isOpen ? 0 : 180}deg)`,
                                    transition: "transform 0.2s ease",
                                }}
                            >
                                <path
                                    d="M13 1.25L7 6.75L1 1.25"
                                    stroke="#757575"
                                    strokeWidth="1.5"
                                />
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            {isOpen && (
                <div
                    style={{
                        padding: theme.space(4),
                        background: theme.color.roarc.white,
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    )
}

// ======= BUSINESS LOGIC HOOKS =======
// 커스텀 훅으로 비즈니스 로직 분리

function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [loginForm, setLoginForm] = useState({ username: "", password: "" })
    const [loginError, setLoginError] = useState("")
    const [isLoggingIn, setIsLoggingIn] = useState(false)

    const login = useCallback(async (username: string, password: string) => {
        setIsLoggingIn(true)
        setLoginError("")
        
        try {
            const result = await ApiService.login(username, password)
            if (result.success && result.token) {
                if (typeof localStorage !== "undefined") {
                    localStorage.setItem("admin_session", result.token)
                }
                setIsAuthenticated(true)
                setCurrentUser(result.user)
                return true
            } else {
                setLoginError(result.error || "로그인에 실패했습니다")
                return false
            }
        } catch (error) {
            setLoginError("로그인 중 오류가 발생했습니다")
            return false
        } finally {
            setIsLoggingIn(false)
        }
    }, [])

    const logout = useCallback(() => {
        if (typeof localStorage !== "undefined") {
            localStorage.removeItem("admin_session")
        }
        setIsAuthenticated(false)
        setCurrentUser(null)
    }, [])

    // 초기 인증 상태 확인
    useEffect(() => {
        if (typeof localStorage !== "undefined") {
            const token = localStorage.getItem("admin_session")
            if (token) {
                // 토큰 유효성 검사 로직 추가 가능
                setIsAuthenticated(true)
            }
        }
    }, [])

    return {
        isAuthenticated,
        currentUser,
        loginForm,
        setLoginForm,
        loginError,
        isLoggingIn,
        login,
        logout,
    }
}

function usePageSettings(pageId: string) {
    const [pageSettings, setPageSettings] = useState<any>({})
    const [loading, setLoading] = useState(false)

    const loadSettings = useCallback(async () => {
        if (!pageId) return
        
        setLoading(true)
        try {
            const result = await ApiService.getPageSettings(pageId)
            if (result.success) {
                setPageSettings(result.data || {})
            }
        } catch (error) {
            console.error('Failed to load page settings:', error)
        } finally {
            setLoading(false)
        }
    }, [pageId])

    const saveSettings = useCallback(async (settings: any) => {
        if (!pageId) return false
        
        try {
            const result = await ApiService.savePageSettings(pageId, settings)
            if (result.success) {
                setPageSettings(prev => ({ ...prev, ...settings }))
                return true
            }
            return false
        } catch (error) {
            console.error('Failed to save page settings:', error)
            return false
        }
    }, [pageId])

    useEffect(() => {
        loadSettings()
    }, [loadSettings])

    return {
        pageSettings,
        loading,
        saveSettings,
        refreshSettings: loadSettings,
    }
}

// ======= UI COMPONENTS =======
// 재사용 가능한 UI 컴포넌트들

function LoginForm({ onLogin, loginForm, setLoginForm, loginError, isLoggingIn }: {
    onLogin: (username: string, password: string) => Promise<boolean>
    loginForm: { username: string; password: string }
    setLoginForm: React.Dispatch<React.SetStateAction<{ username: string; password: string }>>
    loginError: string
    isLoggingIn: boolean
}) {
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onLogin(loginForm.username, loginForm.password)
    }

    return (
        <div
            style={{
                width: "100%",
                maxWidth: "430px",
                minWidth: "375px",
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f5f5f5",
                padding: theme.space(4),
            }}
        >
            <Card style={{ width: "100%", maxWidth: "320px" }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: theme.space(6), textAlign: "center" }}>
                        <h1 style={{
                            fontSize: theme.text.lg,
                            fontFamily: theme.font.bodyBold,
                            color: theme.color.text,
                            margin: 0,
                        }}>
                            관리자 로그인
                        </h1>
                    </div>

                    <FormField label="사용자명" required>
                        <InputBase
                            type="text"
                            value={loginForm.username}
                            onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="사용자명을 입력하세요"
                            required
                        />
                    </FormField>

                    <FormField label="비밀번호" required>
                        <InputBase
                            type="password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="비밀번호를 입력하세요"
                            required
                        />
                    </FormField>

                    {loginError && (
                        <div style={{
                            color: theme.color.danger,
                            fontSize: theme.text.sm,
                            marginBottom: theme.space(4),
                            textAlign: "center",
                        }}>
                            {loginError}
                        </div>
                    )}

                    <ButtonBase
                        type="submit"
                        variant="primary"
                        disabled={isLoggingIn}
                        style={{ width: "100%" }}
                    >
                        {isLoggingIn ? "로그인 중..." : "로그인"}
                    </ButtonBase>
                </form>
            </Card>
        </div>
    )
}

function AdminHeader({ currentUser, onLogout }: {
    currentUser: any
    onLogout: () => void
}) {
    return (
        <div
            style={{
                width: "100%",
                padding: "16px",
                backgroundColor: theme.color.bg,
                borderBottom: `1px solid ${theme.color.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            <div>
                <h1 style={{
                    fontSize: theme.text.lg,
                    fontFamily: theme.font.bodyBold,
                    color: theme.color.text,
                    margin: 0,
                }}>
                    관리자 대시보드
                </h1>
                {currentUser && (
                    <p style={{
                        fontSize: theme.text.sm,
                        color: theme.color.muted,
                        margin: "4px 0 0 0",
                    }}>
                        {currentUser.username}님 환영합니다
                    </p>
                )}
            </div>
            
            <ButtonBase onClick={onLogout} variant="default">
                로그아웃
            </ButtonBase>
        </div>
    )
}

function TabNavigation({ activeTab, onTabChange }: {
    activeTab: "basic" | "gallery"
    onTabChange: (tab: "basic" | "gallery") => void
}) {
    return (
        <div
            style={{
                display: "flex",
                backgroundColor: theme.color.bg,
                borderBottom: `1px solid ${theme.color.border}`,
            }}
        >
            {[
                { key: "basic", label: "기본 정보" },
                { key: "gallery", label: "갤러리" },
            ].map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onTabChange(tab.key as "basic" | "gallery")}
                    style={{
                        flex: 1,
                        padding: "12px 16px",
                        border: "none",
                        background: "transparent",
                        fontSize: theme.text.sm,
                        fontFamily: theme.font.body,
                        color: activeTab === tab.key ? theme.color.primary : theme.color.muted,
                        borderBottom: activeTab === tab.key ? `2px solid ${theme.color.primary}` : "2px solid transparent",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}

// ======= MAIN ADMIN COMPONENT =======
// 메인 Admin 컴포넌트 - 비즈니스 로직과 UI 조합

function AdminMainContent(props: any) {
    const { pageId: propPageId, style } = props
    
    // 인증 관련
    const auth = useAuth()
    
    // 페이지 상태
    const [currentPageId] = useState(propPageId || "default")
    const [activeTab, setActiveTab] = useState<"basic" | "gallery">("basic")
    
    // 페이지 설정
    const { pageSettings, saveSettings } = usePageSettings(currentPageId)
    
    // 아코디언 상태
    const [openSections, setOpenSections] = useState({
        name: true,
        photo: false,
        invite: false,
        transport: false,
        calendar: false,
        images: false,
        contacts: false,
        account: false,
        kakaoShare: false,
        bgm: false,
    })

    const toggleSection = (sectionName: keyof typeof openSections) => {
        setOpenSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }))
    }

    // 로그인되지 않은 경우
    if (!auth.isAuthenticated) {
        return (
            <LoginForm
                onLogin={auth.login}
                loginForm={auth.loginForm}
                setLoginForm={auth.setLoginForm}
                loginError={auth.loginError}
                isLoggingIn={auth.isLoggingIn}
            />
        )
    }

    // 관리자 화면
    return (
        <div
            style={{
                ...style,
                width: "100%",
                maxWidth: "430px",
                minWidth: "375px",
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#f5f5f5",
                overflow: "auto",
            }}
        >
            <AdminHeader
                currentUser={auth.currentUser}
                onLogout={auth.logout}
            />
            
            <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <div style={{ flex: 1, padding: theme.space(4), gap: theme.space(4), display: "flex", flexDirection: "column" }}>
                {activeTab === "basic" && (
                    <>
                        <Section
                            title="성함"
                            isOpen={openSections.name}
                            onToggle={() => toggleSection("name")}
                        >
                            <FormField label="신랑 이름" required>
                                <InputBase
                                    type="text"
                                    value={pageSettings.groom_name || ""}
                                    onChange={(e) => saveSettings({ groom_name: e.target.value })}
                                    placeholder="신랑 이름을 입력하세요"
                                />
                            </FormField>
                            
                            <FormField label="신부 이름" required>
                                <InputBase
                                    type="text"
                                    value={pageSettings.bride_name || ""}
                                    onChange={(e) => saveSettings({ bride_name: e.target.value })}
                                    placeholder="신부 이름을 입력하세요"
                                />
                            </FormField>
                        </Section>

                        <Section
                            title="메인 사진"
                            isOpen={openSections.photo}
                            onToggle={() => toggleSection("photo")}
                        >
                            <FormField label="식장 이름">
                                <InputBase
                                    type="text"
                                    value={pageSettings.venue_name || ""}
                                    onChange={(e) => saveSettings({ venue_name: e.target.value })}
                                    placeholder="식장 이름을 입력하세요"
                                />
                            </FormField>
                            
                            <FormField label="메인 사진 업로드">
                                <ButtonBase
                                    onClick={() => {
                                        const input = document.createElement("input")
                                        input.type = "file"
                                        input.accept = "image/*"
                                        input.onchange = async (e) => {
                                            const file = (e.target as HTMLInputElement).files?.[0]
                                            if (file) {
                                                try {
                                                    const result = await ApiService.uploadToR2(file, currentPageId)
                                                    await saveSettings({ photo_section_image_url: result.publicUrl })
                                                } catch (error) {
                                                    console.error('Upload failed:', error)
                                                }
                                            }
                                        }
                                        input.click()
                                    }}
                                >
                                    사진 업로드
                                </ButtonBase>
                            </FormField>
                        </Section>

                        <Section
                            title="초대글"
                            isOpen={openSections.invite}
                            onToggle={() => toggleSection("invite")}
                        >
                            <FormField label="초대 메시지">
                                <textarea
                                    value={pageSettings.invitation_message || ""}
                                    onChange={(e) => saveSettings({ invitation_message: e.target.value })}
                                    placeholder="초대 메시지를 입력하세요"
                                    style={{
                                        width: "100%",
                                        minHeight: "120px",
                                        padding: "10px 12px",
                                        borderStyle: "solid",
                                        borderWidth: theme.border.width,
                                        borderColor: theme.color.border,
                                        borderRadius: theme.border.radius,
                                        outline: "none",
                                        background: theme.color.surface,
                                        color: theme.color.text,
                                        fontFamily: "Pretendard Regular",
                                        fontSize: 14,
                                        resize: "vertical",
                                    }}
                                />
                            </FormField>
                        </Section>

                        <Section
                            title="연락처"
                            isOpen={openSections.contacts}
                            onToggle={() => toggleSection("contacts")}
                        >
                            <div style={{ display: "flex", flexDirection: "column", gap: theme.space(3) }}>
                                <FormField label="신랑 연락처">
                                    <InputBase
                                        type="tel"
                                        value={pageSettings.groom_phone || ""}
                                        onChange={(e) => saveSettings({ groom_phone: e.target.value })}
                                        placeholder="신랑 연락처를 입력하세요"
                                    />
                                </FormField>
                                
                                <FormField label="신부 연락처">
                                    <InputBase
                                        type="tel"
                                        value={pageSettings.bride_phone || ""}
                                        onChange={(e) => saveSettings({ bride_phone: e.target.value })}
                                        placeholder="신부 연락처를 입력하세요"
                                    />
                                </FormField>
                            </div>
                        </Section>

                        <Section
                            title="배경음악"
                            isOpen={openSections.bgm}
                            onToggle={() => toggleSection("bgm")}
                        >
                            <div style={{ display: "flex", flexDirection: "column", gap: theme.space(3) }}>
                                <FormField label="배경음악 설정">
                                    <div style={{ display: "flex", gap: theme.space(2) }}>
                                        <ButtonBase
                                            onClick={() => {
                                                const input = document.createElement("input")
                                                input.type = "file"
                                                input.accept = "audio/*"
                                                input.onchange = async (e) => {
                                                    const file = (e.target as HTMLInputElement).files?.[0]
                                                    if (file) {
                                                        try {
                                                            const result = await ApiService.uploadToR2(file, currentPageId)
                                                            await saveSettings({ 
                                                                bgm_url: result.publicUrl,
                                                                bgm_type: 'custom'
                                                            })
                                                        } catch (error) {
                                                            console.error('BGM upload failed:', error)
                                                        }
                                                    }
                                                }
                                                input.click()
                                            }}
                                        >
                                            직접 업로드
                                        </ButtonBase>
                                        
                                        <ButtonBase
                                            onClick={async () => {
                                                await saveSettings({
                                                    bgm_url: 'https://cdn.roarc.kr/bgm/free/01.m4a',
                                                    bgm_type: 'free'
                                                })
                                            }}
                                        >
                                            무료 음원 사용
                                        </ButtonBase>
                                    </div>
                                </FormField>
                                
                                {pageSettings.bgm_url && (
                                    <div style={{ 
                                        padding: theme.space(3),
                                        backgroundColor: theme.color.surface,
                                        borderRadius: theme.radius.sm,
                                        fontSize: theme.text.sm,
                                        color: theme.color.muted
                                    }}>
                                        현재 설정된 음악: {pageSettings.bgm_type === 'custom' ? '사용자 업로드' : '무료 음원'}
                                    </div>
                                )}
                            </div>
                        </Section>
                    </>
                )}

                {activeTab === "gallery" && (
                    <Section title="갤러리 관리" isOpen={true}>
                        <div style={{ textAlign: "center", padding: theme.space(8) }}>
                            <p style={{ 
                                color: theme.color.muted,
                                fontSize: theme.text.sm,
                                margin: 0 
                            }}>
                                갤러리 기능은 개발 중입니다.
                            </p>
                        </div>
                    </Section>
                )}
            </div>

            {/* Footer */}
            <div
                style={{
                    width: "100%",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    opacity: 0.3,
                }}
            >
                <span
                    style={{
                        color: "#BABABA",
                        fontSize: 12,
                        fontFamily: "Pretendard Regular",
                    }}
                >
                    © roarc. all rights reserved.
                </span>
            </div>
        </div>
    )
}

// ======= EXPORT COMPONENT =======
export default function Admin(props: any) {
    return <AdminMainContent {...props} />
}

// Framer property controls
addPropertyControls(Admin, {
    pageId: {
        type: ControlType.String,
        title: "Page ID",
        defaultValue: "default",
    },
})







