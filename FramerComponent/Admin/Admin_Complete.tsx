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

// 무료 음원 데이터
const FREE_BGM_LIST = [
    { id: '1', name: '01', url: 'https://cdn.roarc.kr/bgm/free/01.m4a' },
    { id: '2', name: '02', url: 'https://cdn.roarc.kr/bgm/free/02.m4a' },
    { id: '3', name: '03', url: 'https://cdn.roarc.kr/bgm/free/03.m4a' },
    { id: '4', name: '04', url: 'https://cdn.roarc.kr/bgm/free/04.m4a' },
    { id: '5', name: '05', url: 'https://cdn.roarc.kr/bgm/free/05.m4a' },
    { id: '6', name: '06', url: 'https://cdn.roarc.kr/bgm/free/06.m4a' },
    { id: '7', name: '07', url: 'https://cdn.roarc.kr/bgm/free/07.m4a' },
    { id: '8', name: '08', url: 'https://cdn.roarc.kr/bgm/free/08.m4a' },
    { id: '9', name: '09', url: 'https://cdn.roarc.kr/bgm/free/09.m4a' },
    { id: '10', name: '10', url: 'https://cdn.roarc.kr/bgm/free/10.m4a' },
]

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

// 이미지 압축 함수
async function compressImage(
    file: File,
    maxSizeKB = 1024,
    quality = 0.8
): Promise<File> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            
            if (ctx) {
                ctx.drawImage(img, 0, 0)
                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        })
                        resolve(compressedFile)
                    } else {
                        reject(new Error('압축 실패'))
                    }
                }, file.type, quality)
            } else {
                reject(new Error('Canvas context 없음'))
            }
        }
        
        img.onerror = () => reject(new Error('이미지 로드 실패'))
        img.src = URL.createObjectURL(file)
    })
}

// 오디오 압축 함수
async function compressAudio(
    file: File,
    maxSizeKB = 5120, // 5MB
    onProgress?: (progress: number) => void
): Promise<File> {
    return new Promise((resolve, reject) => {
        try {
            // 간단한 파일 크기 체크만 수행
            const fileSizeKB = file.size / 1024
            if (fileSizeKB <= maxSizeKB) {
                resolve(file)
                return
            }
            
            // 실제 압축은 서버에서 처리하거나 별도 라이브러리 필요
            // 현재는 원본 파일 반환
            resolve(file)
        } catch (error) {
            reject(error)
        }
    })
}

// Types
interface ImageInfo {
    id: string
    filename: string
    public_url: string
    original_name: string
    display_order?: number
    file_size?: number
}

interface ContactInfo {
    id?: string
    page_id: string
    groom_name: string
    groom_phone: string
    groom_account: string
    groom_bank: string
    groom_father_name: string
    groom_father_phone: string
    groom_father_account: string
    groom_father_bank: string
    groom_mother_name: string
    groom_mother_phone: string
    groom_mother_account: string
    groom_mother_bank: string
    bride_name: string
    bride_phone: string
    bride_account: string
    bride_bank: string
    bride_father_name: string
    bride_father_phone: string
    bride_father_account: string
    bride_father_bank: string
    bride_mother_name: string
    bride_mother_phone: string
    bride_mother_account: string
    bride_mother_bank: string
    created_at?: string
    updated_at?: string
}

// ======= API SERVICE FUNCTIONS =======
// 모든 API 호출 로직을 여기에 집중

class ApiService {
    private static getAuthToken(): string | null {
        if (typeof localStorage === "undefined") return null
        try {
            return localStorage.getItem("admin_session")
        } catch {
            return null
        }
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

    // 초대글 관련
    static async getInviteData(pageId: string) {
        return this.request(`/api/invite?pageId=${pageId}`)
    }

    static async saveInviteData(pageId: string, inviteData: any) {
        return this.request('/api/invite', {
            method: 'POST',
            body: JSON.stringify({
                pageId,
                ...inviteData,
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

    static async deleteImage(imageId: string, fileName: string) {
        return this.request('/api/images', {
            method: 'POST',
            body: JSON.stringify({
                action: 'delete',
                imageId,
                fileName,
            }),
        })
    }

    static async updateImageOrder(imageId: string, newOrder: number) {
        return this.request('/api/images', {
            method: 'POST',
            body: JSON.stringify({
                action: 'updateOrder',
                imageId,
                newOrder,
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

    static async deleteContact(id: string) {
        return this.request('/api/contacts', {
            method: 'POST',
            body: JSON.stringify({
                action: 'delete',
                id,
            }),
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

type TextAreaBaseProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    invalid?: boolean
}

const TextAreaBase = React.forwardRef<HTMLTextAreaElement, TextAreaBaseProps>(function TextAreaBase(
    { style, invalid, ...props },
    ref
) {
    return (
        <textarea
            ref={ref}
            {...props}
            style={{
                width: "100%",
                minHeight: 120,
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
                resize: "vertical",
                ...style
            }}
        />
    )
})

type SelectBaseProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
    invalid?: boolean
}

const SelectBase = React.forwardRef<HTMLSelectElement, SelectBaseProps>(function SelectBase(
    { style, invalid, children, ...props },
    ref
) {
    return (
        <select
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
                appearance: "none",
                ...style
            }}
        >
            {children}
        </select>
    )
})

type ButtonBaseProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "default" | "danger" | "ghost"
    fullWidth?: boolean
}

const ButtonBase: React.FC<ButtonBaseProps> = ({
    variant = "default",
    fullWidth,
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
            case "ghost":
                return {
                    background: "transparent",
                    color: theme.color.text,
                    borderColor: theme.color.border,
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
                width: fullWidth ? "100%" : undefined,
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
    const [pageSettings, setPageSettings] = useState<any>({
        groomName: "",
        groom_name_en: "",
        brideName: "",
        bride_name_en: "",
        wedding_date: "",
        wedding_hour: "14",
        wedding_minute: "00",
        venue_name: "",
        venue_address: "",
        photo_section_image_url: "",
        photo_section_image_path: "",
        photo_section_location: "",
        photo_section_overlay_position: "bottom",
        photo_section_overlay_color: "#ffffff",
        photo_section_locale: "en",
        highlight_shape: "circle",
        highlight_color: "#e0e0e0",
        highlight_text_color: "black",
        gallery_type: "thumbnail",
        bgm_url: "",
        bgm_type: "",
        bgm_autoplay: false,
    })
    const [loading, setLoading] = useState(false)

    const loadSettings = useCallback(async () => {
        if (!pageId) return
        
        setLoading(true)
        try {
            const result = await ApiService.getPageSettings(pageId)
            if (result.success) {
                setPageSettings((prev: any) => ({ ...prev, ...result.data }))
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
                setPageSettings((prev: any) => ({ ...prev, ...settings }))
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

function useInviteData(pageId: string) {
    const [inviteData, setInviteData] = useState<any>({
        groomName: "",
        brideName: "",
        wedding_date: "",
        invitation_message: "",
        groom_father: "",
        groom_mother: "",
        bride_father: "",
        bride_mother: "",
    })
    const [loading, setLoading] = useState(false)

    const loadInviteData = useCallback(async () => {
        if (!pageId) return
        
        setLoading(true)
        try {
            const result = await ApiService.getInviteData(pageId)
            if (result.success) {
                setInviteData((prev: any) => ({ ...prev, ...result.data }))
            }
        } catch (error) {
            console.error('Failed to load invite data:', error)
        } finally {
            setLoading(false)
        }
    }, [pageId])

    const saveInviteData = useCallback(async (data: any) => {
        if (!pageId) return false
        
        try {
            const result = await ApiService.saveInviteData(pageId, data)
            if (result.success) {
                setInviteData((prev: any) => ({ ...prev, ...data }))
                return true
            }
            return false
        } catch (error) {
            console.error('Failed to save invite data:', error)
            return false
        }
    }, [pageId])

    useEffect(() => {
        loadInviteData()
    }, [loadInviteData])

    return {
        inviteData,
        loading,
        saveInviteData,
        refreshInviteData: loadInviteData,
    }
}

function useImages(pageId: string) {
    const [images, setImages] = useState<ImageInfo[]>([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    const loadImages = useCallback(async () => {
        if (!pageId) return
        
        setLoading(true)
        try {
            const result = await ApiService.getImages(pageId)
            if (result.success) {
                setImages(result.images || [])
            }
        } catch (error) {
            console.error('Failed to load images:', error)
        } finally {
            setLoading(false)
        }
    }, [pageId])

    const uploadImage = useCallback(async (file: File) => {
        if (!pageId) return false
        
        setUploading(true)
        try {
            // 이미지 압축
            const compressedFile = await compressImage(file)
            
            // R2 업로드
            const uploadResult = await ApiService.uploadToR2(compressedFile, pageId)
            
            // 메타데이터 저장
            const order = images.length + 1
            const metaResult = await ApiService.saveImageMeta(
                pageId,
                compressedFile.name,
                order,
                uploadResult.publicUrl,
                compressedFile.size
            )
            
            if (metaResult.success) {
                // 이미지 목록 새로고침
                await loadImages()
                return true
            }
            return false
        } catch (error) {
            console.error('Failed to upload image:', error)
            return false
        } finally {
            setUploading(false)
        }
    }, [pageId, images.length, loadImages])

    const deleteImage = useCallback(async (imageId: string, fileName: string) => {
        try {
            const result = await ApiService.deleteImage(imageId, fileName)
            if (result.success) {
                await loadImages()
                return true
            }
            return false
        } catch (error) {
            console.error('Failed to delete image:', error)
            return false
        }
    }, [loadImages])

    useEffect(() => {
        loadImages()
    }, [loadImages])

    return {
        images,
        loading,
        uploading,
        uploadImage,
        deleteImage,
        refreshImages: loadImages,
    }
}

function useContacts(pageId: string) {
    const [contacts, setContacts] = useState<ContactInfo[]>([])
    const [selectedContact, setSelectedContact] = useState<ContactInfo | null>(null)
    const [loading, setLoading] = useState(false)

    const loadContacts = useCallback(async () => {
        if (!pageId) return
        
        setLoading(true)
        try {
            const result = await ApiService.getContacts(pageId)
            if (result.success) {
                setContacts(result.contacts || [])
                if (result.contacts && result.contacts.length > 0) {
                    setSelectedContact(result.contacts[0])
                }
            }
        } catch (error) {
            console.error('Failed to load contacts:', error)
        } finally {
            setLoading(false)
        }
    }, [pageId])

    const saveContact = useCallback(async (contactData: ContactInfo) => {
        try {
            const result = await ApiService.saveContact({
                ...contactData,
                page_id: pageId,
            })
            if (result.success) {
                await loadContacts()
                return true
            }
            return false
        } catch (error) {
            console.error('Failed to save contact:', error)
            return false
        }
    }, [pageId, loadContacts])

    const deleteContact = useCallback(async (id: string) => {
        try {
            const result = await ApiService.deleteContact(id)
            if (result.success) {
                await loadContacts()
                return true
            }
            return false
        } catch (error) {
            console.error('Failed to delete contact:', error)
            return false
        }
    }, [loadContacts])

    useEffect(() => {
        loadContacts()
    }, [loadContacts])

    return {
        contacts,
        selectedContact,
        setSelectedContact,
        loading,
        saveContact,
        deleteContact,
        refreshContacts: loadContacts,
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
                        fullWidth
                    >
                        {isLoggingIn ? "로그인 중..." : "로그인"}
                    </ButtonBase>
                </form>
            </Card>
        </div>
    )
}

function AdminHeader({ currentUser, onLogout, groomName, brideName }: {
    currentUser: any
    onLogout: () => void
    groomName?: string
    brideName?: string
}) {
    const displayName = groomName && brideName 
        ? `${groomName}♥${brideName}` 
        : "신랑♥신부"

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
                    {displayName}
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

function NotificationBar({ success, error }: {
    success: string | null
    error: string | null
}) {
    return (
        <AnimatePresence>
            {success && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    style={{
                        padding: "12px 16px",
                        backgroundColor: "#f5f5f5",
                        color: "#000000",
                        fontSize: "14px",
                        textAlign: "center",
                        borderBottom: "1px solid #e0e0e0",
                    }}
                >
                    {success}
                </motion.div>
            )}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    style={{
                        padding: "12px 16px",
                        backgroundColor: "#f5f5f5",
                        color: "#666666",
                        fontSize: "14px",
                        textAlign: "center",
                        borderBottom: "1px solid #e0e0e0",
                    }}
                >
                    {error}
                </motion.div>
            )}
        </AnimatePresence>
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
    
    // 알림 상태
    const [success, setSuccess] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    
    // 데이터 훅들
    const { pageSettings, saveSettings } = usePageSettings(currentPageId)
    const { inviteData, saveInviteData } = useInviteData(currentPageId)
    const { images, uploading, uploadImage, deleteImage } = useImages(currentPageId)
    const { contacts, selectedContact, setSelectedContact, saveContact } = useContacts(currentPageId)
    
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

    // 알림 메시지 자동 숨김
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [success])

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000)
            return () => clearTimeout(timer)
        }
    }, [error])

    // BGM 관련 핸들러
    const handleAudioUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            setSuccess("음원 업로드 중...")
            
            // 기존 커스텀 BGM 삭제
            if (pageSettings.bgm_url && pageSettings.bgm_type === 'custom') {
                await ApiService.deleteFromR2(pageSettings.bgm_url)
            }

            // 오디오 압축
            const compressedFile = await compressAudio(file)
            
            // R2 업로드
            const audioKey = `bgm/${currentPageId}/${Date.now()}-${slugifyName(compressedFile.name)}`
            const uploadResult = await ApiService.uploadToR2(compressedFile, currentPageId, audioKey)
            
            // 설정 저장
            await saveSettings({
                bgm_url: uploadResult.publicUrl,
                bgm_type: 'custom',
                bgm_autoplay: true
            })
            
            setSuccess("음원이 성공적으로 업로드되었습니다")
        } catch (error) {
            setError("음원 업로드에 실패했습니다")
            console.error('BGM upload failed:', error)
        }
    }, [currentPageId, pageSettings.bgm_url, pageSettings.bgm_type, saveSettings])

    const handleFreeBgmSelect = useCallback(async (bgmUrl: string) => {
        try {
            // 기존 커스텀 BGM 삭제
            if (pageSettings.bgm_url && pageSettings.bgm_type === 'custom') {
                await ApiService.deleteFromR2(pageSettings.bgm_url)
            }

            await saveSettings({
                bgm_url: bgmUrl,
                bgm_type: 'free',
                bgm_autoplay: true
            })
            
            setSuccess("무료 음원이 설정되었습니다")
        } catch (error) {
            setError("음원 설정에 실패했습니다")
            console.error('BGM setting failed:', error)
        }
    }, [pageSettings.bgm_url, pageSettings.bgm_type, saveSettings])

    // 연락처 불러오기 핸들러
    const handleImportFromInvite = useCallback(() => {
        if (selectedContact && inviteData.groomName && inviteData.brideName) {
            const updatedContact = {
                ...selectedContact,
                groom_name: inviteData.groomName,
                bride_name: inviteData.brideName,
            }
            setSelectedContact(updatedContact as ContactInfo)
            setSuccess("초대글에서 이름을 불러왔습니다")
        }
    }, [selectedContact, inviteData.groomName, inviteData.brideName])

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
            <NotificationBar success={success} error={error} />
            
            <AdminHeader
                currentUser={auth.currentUser}
                onLogout={auth.logout}
                groomName={inviteData.groomName || pageSettings.groomName}
                brideName={inviteData.brideName || pageSettings.brideName}
            />
            
            <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <div style={{ flex: 1, padding: theme.space(4), gap: theme.space(4), display: "flex", flexDirection: "column" }}>
                {activeTab === "basic" && (
                    <>
                        {/* 성함 섹션 */}
                        <Section
                            title="성함"
                            isOpen={openSections.name}
                            onToggle={() => toggleSection("name")}
                        >
                            <FormField label="신랑 한글 성함" required>
                                <InputBase
                                    type="text"
                                    value={inviteData.groomName || ""}
                                    onChange={(e) => saveInviteData({ groomName: e.target.value })}
                                    placeholder="신랑 이름을 입력하세요"
                                />
                            </FormField>
                            
                            <FormField label="신랑 영문 성함">
                                <InputBase
                                    type="text"
                                    value={pageSettings.groom_name_en || ""}
                                    onChange={(e) => saveSettings({ groom_name_en: e.target.value })}
                                    placeholder="신랑 영문 이름을 입력하세요"
                                />
                            </FormField>
                            
                            <FormField label="신부 한글 성함" required>
                                <InputBase
                                    type="text"
                                    value={inviteData.brideName || ""}
                                    onChange={(e) => saveInviteData({ brideName: e.target.value })}
                                    placeholder="신부 이름을 입력하세요"
                                />
                            </FormField>

                            <FormField label="신부 영문 성함">
                                <InputBase
                                    type="text"
                                    value={pageSettings.bride_name_en || ""}
                                    onChange={(e) => saveSettings({ bride_name_en: e.target.value })}
                                    placeholder="신부 영문 이름을 입력하세요"
                                />
                            </FormField>
                        </Section>

                        {/* 메인 사진 섹션 */}
                        <Section
                            title="메인 사진"
                            isOpen={openSections.photo}
                            onToggle={() => toggleSection("photo")}
                        >
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
                                                    setSuccess("사진 업로드 중...")
                                                    const compressedFile = await compressImage(file)
                                                    const result = await ApiService.uploadToR2(compressedFile, currentPageId)
                                                    await saveSettings({ photo_section_image_url: result.publicUrl })
                                                    setSuccess("사진이 성공적으로 업로드되었습니다")
                                                } catch (error) {
                                                    setError("사진 업로드에 실패했습니다")
                                                }
                                            }
                                        }
                                        input.click()
                                    }}
                                >
                                    사진 업로드
                                </ButtonBase>
                            </FormField>

                            <FormField label="예식 일시">
                                <InputBase
                                    type="date"
                                    value={pageSettings.wedding_date || ""}
                                    onChange={(e) => saveSettings({ wedding_date: e.target.value })}
                                />
                            </FormField>

                            <div style={{ display: "flex", gap: theme.space(2) }}>
                                <FormField label="시간" style={{ flex: 1 }}>
                                    <SelectBase
                                        value={pageSettings.wedding_hour || "14"}
                                        onChange={(e) => saveSettings({ wedding_hour: e.target.value })}
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i.toString().padStart(2, '0')}>
                                                {i.toString().padStart(2, '0')}시
                                            </option>
                                        ))}
                                    </SelectBase>
                                </FormField>
                                
                                <FormField label="분" style={{ flex: 1 }}>
                                    <SelectBase
                                        value={pageSettings.wedding_minute || "00"}
                                        onChange={(e) => saveSettings({ wedding_minute: e.target.value })}
                                    >
                                        {Array.from({ length: 60 }, (_, i) => (
                                            <option key={i} value={i.toString().padStart(2, '0')}>
                                                {i.toString().padStart(2, '0')}분
                                            </option>
                                        ))}
                                    </SelectBase>
                                </FormField>
                            </div>

                            <FormField label="식장 이름">
                                <InputBase
                                    type="text"
                                    value={pageSettings.venue_name || ""}
                                    onChange={(e) => saveSettings({ venue_name: e.target.value })}
                                    placeholder="식장 이름을 입력하세요"
                                />
                            </FormField>

                            <FormField label="식장 주소">
                                <InputBase
                                    type="text"
                                    value={pageSettings.venue_address || ""}
                                    onChange={(e) => saveSettings({ venue_address: e.target.value })}
                                    placeholder="식장 주소를 입력하세요"
                                />
                            </FormField>

                            <FormField label="사진 위 장소명">
                                <InputBase
                                    type="text"
                                    value={pageSettings.photo_section_location || ""}
                                    onChange={(e) => saveSettings({ photo_section_location: e.target.value })}
                                    placeholder="사진 위에 표시될 장소명을 입력하세요"
                                />
                            </FormField>
                        </Section>

                        {/* 초대글 섹션 */}
                        <Section
                            title="초대글"
                            isOpen={openSections.invite}
                            onToggle={() => toggleSection("invite")}
                        >
                            <FormField label="신랑 아버지">
                                <InputBase
                                    type="text"
                                    value={inviteData.groom_father || ""}
                                    onChange={(e) => saveInviteData({ groom_father: e.target.value })}
                                    placeholder="신랑 아버지 성함을 입력하세요"
                                />
                            </FormField>

                            <FormField label="신랑 어머니">
                                <InputBase
                                    type="text"
                                    value={inviteData.groom_mother || ""}
                                    onChange={(e) => saveInviteData({ groom_mother: e.target.value })}
                                    placeholder="신랑 어머니 성함을 입력하세요"
                                />
                            </FormField>

                            <FormField label="신부 아버지">
                                <InputBase
                                    type="text"
                                    value={inviteData.bride_father || ""}
                                    onChange={(e) => saveInviteData({ bride_father: e.target.value })}
                                    placeholder="신부 아버지 성함을 입력하세요"
                                />
                            </FormField>

                            <FormField label="신부 어머니">
                                <InputBase
                                    type="text"
                                    value={inviteData.bride_mother || ""}
                                    onChange={(e) => saveInviteData({ bride_mother: e.target.value })}
                                    placeholder="신부 어머니 성함을 입력하세요"
                                />
                            </FormField>

                            <FormField label="초대 메시지">
                                <TextAreaBase
                                    value={inviteData.invitation_message || ""}
                                    onChange={(e) => saveInviteData({ invitation_message: e.target.value })}
                                    placeholder="초대 메시지를 입력하세요"
                                    style={{ minHeight: 120 }}
                                />
                            </FormField>
                        </Section>

                        {/* 연락처 섹션 */}
                        <Section
                            title="연락처"
                            isOpen={openSections.contacts}
                            onToggle={() => toggleSection("contacts")}
                        >
                            {inviteData.groomName && inviteData.brideName && (
                                <div style={{ marginBottom: theme.space(4) }}>
                                    <ButtonBase
                                        onClick={handleImportFromInvite}
                                        variant="ghost"
                                        fullWidth
                                        style={{
                                            backgroundColor: "#f5f5f5",
                                            borderColor: "#d1d5db",
                                        }}
                                    >
                                        초대글에서 입력한 이름 불러오기
                                    </ButtonBase>
                                </div>
                            )}

                            {selectedContact && (
                                <div style={{ display: "flex", flexDirection: "column", gap: theme.space(3) }}>
                                    <FormField label="신랑 이름">
                                        <InputBase
                                            type="text"
                                            value={selectedContact.groom_name || ""}
                                            onChange={(e) => setSelectedContact(prev => prev ? { ...prev, groom_name: e.target.value } : null)}
                                            placeholder="신랑 이름을 입력하세요"
                                        />
                                    </FormField>
                                    
                                    <FormField label="신랑 연락처">
                                        <InputBase
                                            type="tel"
                                            value={selectedContact.groom_phone || ""}
                                            onChange={(e) => setSelectedContact(prev => prev ? { ...prev, groom_phone: e.target.value } : null)}
                                            placeholder="신랑 연락처를 입력하세요"
                                        />
                                    </FormField>

                                    <FormField label="신부 이름">
                                        <InputBase
                                            type="text"
                                            value={selectedContact.bride_name || ""}
                                            onChange={(e) => setSelectedContact(prev => prev ? { ...prev, bride_name: e.target.value } : null)}
                                            placeholder="신부 이름을 입력하세요"
                                        />
                                    </FormField>
                                    
                                    <FormField label="신부 연락처">
                                        <InputBase
                                            type="tel"
                                            value={selectedContact.bride_phone || ""}
                                            onChange={(e) => setSelectedContact(prev => prev ? { ...prev, bride_phone: e.target.value } : null)}
                                            placeholder="신부 연락처를 입력하세요"
                                        />
                                    </FormField>

                                    <ButtonBase
                                        onClick={async () => {
                                            const success = await saveContact(selectedContact)
                                            if (success) {
                                                setSuccess("연락처가 저장되었습니다")
                                            } else {
                                                setError("연락처 저장에 실패했습니다")
                                            }
                                        }}
                                        variant="primary"
                                        fullWidth
                                    >
                                        연락처 저장
                                    </ButtonBase>
                                </div>
                            )}
                        </Section>

                        {/* 계좌번호 섹션 */}
                        <Section
                            title="계좌번호"
                            isOpen={openSections.account}
                            onToggle={() => toggleSection("account")}
                        >
                            {inviteData.groomName && inviteData.brideName && (
                                <div style={{ marginBottom: theme.space(4) }}>
                                    <ButtonBase
                                        onClick={handleImportFromInvite}
                                        variant="ghost"
                                        fullWidth
                                        style={{
                                            backgroundColor: "#f5f5f5",
                                            borderColor: "#d1d5db",
                                        }}
                                    >
                                        초대글에서 입력한 이름 불러오기
                                    </ButtonBase>
                                </div>
                            )}

                            {selectedContact && (
                                <div style={{ display: "flex", flexDirection: "column", gap: theme.space(3) }}>
                                    <FormField label="신랑 계좌번호">
                                        <InputBase
                                            type="text"
                                            value={selectedContact.groom_account || ""}
                                            onChange={(e) => setSelectedContact(prev => prev ? { ...prev, groom_account: e.target.value } : null)}
                                            placeholder="신랑 계좌번호를 입력하세요"
                                        />
                                    </FormField>
                                    
                                    <FormField label="신랑 은행명">
                                        <InputBase
                                            type="text"
                                            value={selectedContact.groom_bank || ""}
                                            onChange={(e) => setSelectedContact(prev => prev ? { ...prev, groom_bank: e.target.value } : null)}
                                            placeholder="신랑 은행명을 입력하세요"
                                        />
                                    </FormField>

                                    <FormField label="신부 계좌번호">
                                        <InputBase
                                            type="text"
                                            value={selectedContact.bride_account || ""}
                                            onChange={(e) => setSelectedContact(prev => prev ? { ...prev, bride_account: e.target.value } : null)}
                                            placeholder="신부 계좌번호를 입력하세요"
                                        />
                                    </FormField>
                                    
                                    <FormField label="신부 은행명">
                                        <InputBase
                                            type="text"
                                            value={selectedContact.bride_bank || ""}
                                            onChange={(e) => setSelectedContact(prev => prev ? { ...prev, bride_bank: e.target.value } : null)}
                                            placeholder="신부 은행명을 입력하세요"
                                        />
                                    </FormField>

                                    <ButtonBase
                                        onClick={async () => {
                                            const success = await saveContact(selectedContact)
                                            if (success) {
                                                setSuccess("계좌정보가 저장되었습니다")
                                            } else {
                                                setError("계좌정보 저장에 실패했습니다")
                                            }
                                        }}
                                        variant="primary"
                                        fullWidth
                                    >
                                        계좌정보 저장
                                    </ButtonBase>
                                </div>
                            )}
                        </Section>

                        {/* 배경음악 섹션 */}
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
                                                input.accept = "audio/*,.mp3,.m4a,.aac,.wav"
                                                input.onchange = handleAudioUpload
                                                input.click()
                                            }}
                                        >
                                            직접 업로드
                                        </ButtonBase>
                                    </div>
                                </FormField>

                                <FormField label="무료 음원 선택">
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: theme.space(2) }}>
                                        {FREE_BGM_LIST.map((bgm) => (
                                            <ButtonBase
                                                key={bgm.id}
                                                onClick={() => handleFreeBgmSelect(bgm.url)}
                                                variant={pageSettings.bgm_url === bgm.url ? "primary" : "default"}
                                                style={{ fontSize: "12px" }}
                                            >
                                                음원 {bgm.name}
                                            </ButtonBase>
                                        ))}
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
                                        <br />
                                        자동 재생: {pageSettings.bgm_autoplay ? '켜짐' : '꺼짐'}
                                    </div>
                                )}
                            </div>
                        </Section>
                    </>
                )}

                {activeTab === "gallery" && (
                    <Section title="갤러리 관리" isOpen={true}>
                        <div style={{ display: "flex", flexDirection: "column", gap: theme.space(4) }}>
                            <FormField label="사진 업로드">
                                <ButtonBase
                                    onClick={() => {
                                        const input = document.createElement("input")
                                        input.type = "file"
                                        input.accept = "image/*"
                                        input.multiple = true
                                        input.onchange = async (e) => {
                                            const files = Array.from((e.target as HTMLInputElement).files || [])
                                            if (files.length > 0) {
                                                setSuccess(`${files.length}개 사진 업로드 중...`)
                                                let successCount = 0
                                                
                                                for (const file of files) {
                                                    try {
                                                        const success = await uploadImage(file)
                                                        if (success) successCount++
                                                    } catch (error) {
                                                        console.error('Image upload failed:', error)
                                                    }
                                                }
                                                
                                                setSuccess(`${successCount}개 사진이 업로드되었습니다`)
                                            }
                                        }
                                        input.click()
                                    }}
                                    disabled={uploading}
                                    fullWidth
                                >
                                    {uploading ? "업로드 중..." : "사진 추가"}
                                </ButtonBase>
                            </FormField>

                            {images.length > 0 ? (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: theme.space(2) }}>
                                    {images.map((image, index) => (
                                        <div key={image.id} style={{ 
                                            position: "relative",
                                            aspectRatio: "1",
                                            border: `1px solid ${theme.color.border}`,
                                            borderRadius: theme.radius.sm,
                                            overflow: "hidden"
                                        }}>
                                            <img
                                                src={image.public_url}
                                                alt={image.original_name}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover"
                                                }}
                                            />
                                            <div style={{
                                                position: "absolute",
                                                top: 4,
                                                right: 4,
                                                background: "rgba(0,0,0,0.7)",
                                                borderRadius: "50%",
                                                width: 24,
                                                height: 24,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                cursor: "pointer"
                                            }}
                                            onClick={async () => {
                                                const success = await deleteImage(image.id, image.filename)
                                                if (success) {
                                                    setSuccess("사진이 삭제되었습니다")
                                                } else {
                                                    setError("사진 삭제에 실패했습니다")
                                                }
                                            }}
                                            >
                                                <span style={{ color: "white", fontSize: "12px" }}>×</span>
                                            </div>
                                            <div style={{
                                                position: "absolute",
                                                top: 4,
                                                left: 4,
                                                background: "rgba(0,0,0,0.7)",
                                                color: "white",
                                                fontSize: "10px",
                                                padding: "2px 6px",
                                                borderRadius: 2
                                            }}>
                                                {index + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ 
                                    textAlign: "center", 
                                    padding: theme.space(8),
                                    color: theme.color.muted 
                                }}>
                                    업로드된 사진이 없습니다
                                </div>
                            )}
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







