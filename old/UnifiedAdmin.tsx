import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// 프록시 서버 URL (고정된 Production URL)
const PROXY_BASE_URL = "https://wedding-admin-proxy.vercel.app"

// 세션 토큰 관리
function getAuthToken() {
    return localStorage.getItem("admin_session")
}

function setAuthToken(token) {
    localStorage.setItem("admin_session", token)
}

function removeAuthToken() {
    localStorage.removeItem("admin_session")
}

// 인증 관련 함수들
async function authenticateAdmin(username, password) {
    console.log("Login attempt:", {
        username,
        url: `${PROXY_BASE_URL}/api/user-management`,
    })

    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/user-management`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: "login",
                username,
                password,
            }),
        })

        console.log("Response status:", response.status)
        console.log("Response headers:", response.headers)

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        console.log("Response data:", result)

        if (result.success) {
            setAuthToken(result.token)
            return {
                success: true,
                user: result.user,
            }
        } else {
            return {
                success: false,
                error: result.error,
            }
        }
    } catch (error) {
        console.error("Login error details:", error)
        return {
            success: false,
            error: `네트워크 오류: ${error.message}`,
        }
    }
}

function generateSessionToken(user) {
    return btoa(
        JSON.stringify({
            userId: user.id,
            username: user.username,
            expires: Date.now() + 24 * 60 * 60 * 1000,
        })
    )
}

function validateSessionToken(token) {
    try {
        const data = JSON.parse(atob(token))
        return Date.now() < data.expires ? data : null
    } catch {
        return null
    }
}

// 이미지 관련 함수들
async function getAllPages() {
    try {
        const response = await fetch(
            `${PROXY_BASE_URL}/api/images?action=getAllPages`,
            {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            }
        )

        const result = await response.json()
        return result.success ? result.data : []
    } catch (error) {
        console.error("Get pages error:", error)
        return []
    }
}

async function getImagesByPageId(pageId) {
    try {
        const response = await fetch(
            `${PROXY_BASE_URL}/api/images?action=getByPageId&pageId=${pageId}`,
            {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            }
        )

        const result = await response.json()
        return result.success ? result.data : []
    } catch (error) {
        console.error("Get images error:", error)
        return []
    }
}

// 이미지 삭제 함수
async function deleteImage(imageId, fileName) {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/images`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({
                imageId,
                fileName,
            }),
        })

        return await response.json()
    } catch (error) {
        console.error("Delete image error:", error)
        return {
            success: false,
            error: "이미지 삭제 중 오류가 발생했습니다",
        }
    }
}

// Supabase display_order 업데이트 함수
async function updateImageOrder(imageId, newOrder) {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/images`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({
                imageId,
                newOrder,
            }),
        })

        return await response.json()
    } catch (error) {
        console.error("Update image order error:", error)
        return {
            success: false,
            error: "이미지 순서 업데이트 중 오류가 발생했습니다",
        }
    }
}

// 연락처 관련 함수들
async function getAllContacts(pageId = null) {
    try {
        let url = `${PROXY_BASE_URL}/api/contacts`
        if (pageId) {
            url += `?pageId=${pageId}`
        }

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
        })

        const result = await response.json()
        return result.success ? result.data : []
    } catch (error) {
        console.error("Get contacts error:", error)
        return []
    }
}

async function saveContact(contactData) {
    try {
        const isUpdate = !!contactData.id
        const method = isUpdate ? "PUT" : "POST"

        const response = await fetch(`${PROXY_BASE_URL}/api/contacts`, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify(contactData),
        })

        return await response.json()
    } catch (error) {
        console.error("Save contact error:", error)
        return {
            success: false,
            error: "연락처 저장 중 오류가 발생했습니다",
        }
    }
}

async function deleteContact(id) {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/contacts`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({ id }),
        })

        return await response.json()
    } catch (error) {
        console.error("Delete contact error:", error)
        return {
            success: false,
            error: "연락처 삭제 중 오류가 발생했습니다",
        }
    }
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

// presigned URL 관련 함수들
async function getPresignedUrl(fileName, pageId) {
    try {
        const requestBody = {
            action: "getPresignedUrl",
            fileName,
            pageId,
        }
        
        // 디버깅을 위한 로그 추가
        console.log('=== getPresignedUrl Debug ===')
        console.log('requestBody:', requestBody)
        console.log('PROXY_BASE_URL:', PROXY_BASE_URL)
        console.log('============================')

        const response = await fetch(`${PROXY_BASE_URL}/api/images`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify(requestBody),
        })

        console.log('Response status:', response.status)
        console.log('Response headers:', response.headers)

        const result = await response.json()
        console.log('Response result:', result)
        
        if (!result.success) throw new Error(result.error)
        return result
    } catch (error) {
        console.error("Get presigned URL error:", error)
        throw new Error("presigned URL 요청 실패: " + error.message)
    }
}

async function uploadToPresignedUrl(url, file) {
    try {
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": file.type,
            },
            body: file,
        })

        if (!response.ok) {
            throw new Error(`Storage 업로드 실패: ${response.status}`)
        }
    } catch (error) {
        console.error("Upload to presigned URL error:", error)
        throw new Error("파일 업로드 실패: " + error.message)
    }
}

async function saveImageMeta(pageId, fileName, order, storagePath, fileSize) {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/images`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({
                action: "saveMeta",
                pageId,
                fileName,
                displayOrder: order,
                storagePath,
                fileSize,
            }),
        })

        const result = await response.json()
        if (!result.success) throw new Error(result.error)
        return result.data
    } catch (error) {
        console.error("Save image meta error:", error)
        throw new Error("메타데이터 저장 실패: " + error.message)
    }
}

export default function UnifiedWeddingAdmin(props) {
    const { maxSizeKB = 1024, style } = props

    // 공통 상태
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [currentUser, setCurrentUser] = useState(null)
    const [loginForm, setLoginForm] = useState({ username: "", password: "" })
    const [loginError, setLoginError] = useState("")
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const [currentTab, setCurrentTab] = useState("basic") // "basic", "photo", "images", "contacts", "calendar", "map"
    const [currentPageId, setCurrentPageId] = useState("")
    const [allPages, setAllPages] = useState([])
    const [showPageSelector, setShowPageSelector] = useState(false)

    // 이미지 관련 상태
    const [existingImages, setExistingImages] = useState([])
    const [showImageManager, setShowImageManager] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [uploadSuccess, setUploadSuccess] = useState(0)

    // 연락처 관련 상태
    const [contactList, setContactList] = useState([])
    const [selectedContact, setSelectedContact] = useState(null)
    const [isEditingContact, setIsEditingContact] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    // 페이지 설정 관련 상태
    const [pageSettings, setPageSettings] = useState({
        groom_name_kr: "",
        groom_name_en: "",
        bride_name_kr: "",
        bride_name_en: "",
        wedding_date: "",
        wedding_hour: "14",
        wedding_minute: "00",
        venue_name: "",
        venue_address: "",
        photo_section_image_url: "",
        photo_section_overlay_position: "bottom",
        photo_section_overlay_color: "#ffffff",
    })
    const [settingsLoading, setSettingsLoading] = useState(false)

    const initialContactData = {
        page_id: "",
        groom_name: "",
        groom_phone: "",
        groom_father_name: "",
        groom_father_phone: "",
        groom_mother_name: "",
        groom_mother_phone: "",
        bride_name: "",
        bride_phone: "",
        bride_father_name: "",
        bride_father_phone: "",
        bride_mother_name: "",
        bride_mother_phone: "",
    }

    // 이미지 순서 변경 관련 함수들 (컴포넌트 내부로 이동)
    const handleReorderImages = async (fromIndex, toIndex) => {
        try {
            const newImages = [...existingImages]
            const [movedImage] = newImages.splice(fromIndex, 1)
            newImages.splice(toIndex, 0, movedImage)

            // 모든 이미지의 순서 업데이트
            const updatePromises = newImages.map((img, idx) =>
                updateImageOrder(img.id, idx + 1)
            )

            const results = await Promise.all(updatePromises)

            // 모든 업데이트가 성공했는지 확인
            const allSuccess = results.every((result) => result.success)

            if (allSuccess) {
                setExistingImages(newImages)
            } else {
                throw new Error("일부 이미지 순서 업데이트가 실패했습니다")
            }
        } catch (err) {
            console.error("순서 변경 실패:", err)
            alert("순서 변경에 실패했습니다: " + err.message)
        }
    }

    const moveImageUp = (index) => {
        if (index > 0) handleReorderImages(index, index - 1)
    }

    const moveImageDown = (index) => {
        if (index < existingImages.length - 1)
            handleReorderImages(index, index + 1)
    }

    const moveImageToPosition = (fromIndex, toPosition) => {
        if (
            toPosition >= 1 &&
            toPosition <= existingImages.length &&
            toPosition !== fromIndex + 1
        ) {
            handleReorderImages(fromIndex, toPosition - 1)
        }
    }

    const handleDeleteImage = async (imageId, fileName) => {
        if (!confirm("정말로 이 이미지를 삭제하시겠습니까?")) return

        try {
            const result = await deleteImage(imageId, fileName)

            if (result.success) {
                loadExistingImages()
                loadAllPages()
            } else {
                alert("이미지 삭제에 실패했습니다: " + result.error)
            }
        } catch (err) {
            console.error("이미지 삭제 실패:", err)
            alert("이미지 삭제에 실패했습니다: " + err.message)
        }
    }

    // 세션 확인
    useEffect(() => {
        const token = localStorage.getItem("admin_session")
        if (token) {
            const tokenData = validateSessionToken(token)
            if (tokenData) {
                setIsAuthenticated(true)
                setCurrentUser({ username: tokenData.username })
                loadAllPages()
                loadContactList()
            } else {
                localStorage.removeItem("admin_session")
            }
        }
    }, [])

    // 로그인/로그아웃
    const handleLogin = async (e) => {
        e.preventDefault()
        setIsLoggingIn(true)
        setLoginError("")

        const result = await authenticateAdmin(
            loginForm.username,
            loginForm.password
        )
        if (result.success) {
            localStorage.setItem(
                "admin_session",
                generateSessionToken(result.user)
            )
            setIsAuthenticated(true)
            setCurrentUser(result.user)
            setLoginForm({ username: "", password: "" })
            loadAllPages()
            loadContactList()
            loadPageSettings()
        } else {
            setLoginError(result.error)
        }
        setIsLoggingIn(false)
    }

    const handleLogout = () => {
        removeAuthToken()
        setIsAuthenticated(false)
        setCurrentUser(null)
        setCurrentPageId("")
        setAllPages([])
        setExistingImages([])
        setContactList([])
    }

    // 데이터 로드
    const loadAllPages = async () => {
        const pages = await getAllPages()
        setAllPages(pages)
    }

    const loadExistingImages = async () => {
        if (currentPageId) {
            const images = await getImagesByPageId(currentPageId)
            setExistingImages(images)
        }
    }

    const loadContactList = async () => {
        setLoading(true)
        try {
            const contacts = await getAllContacts(currentPageId)
            setContactList(contacts)
        } catch (err) {
            setError("연락처 목록을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const loadPageSettings = async () => {
        if (!currentPageId) return

        setSettingsLoading(true)
        try {
            const response = await fetch(
                `${PROXY_BASE_URL}/api/page-settings?pageId=${currentPageId}`,
                {
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                }
            )

            const result = await response.json()
            if (result.success) {
                setPageSettings(result.data)
            }
        } catch (err) {
            console.error("페이지 설정 로드 실패:", err)
        } finally {
            setSettingsLoading(false)
        }
    }

    const savePageSettings = async () => {
        if (!currentPageId) return

        setSettingsLoading(true)
        try {
            const response = await fetch(
                `${PROXY_BASE_URL}/api/page-settings`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                    body: JSON.stringify({
                        pageId: currentPageId,
                        settings: pageSettings,
                    }),
                }
            )

            const result = await response.json()
            if (result.success) {
                setSuccess("설정이 저장되었습니다.")
            } else {
                setError("설정 저장에 실패했습니다.")
            }
        } catch (err) {
            setError("설정 저장 중 오류가 발생했습니다.")
        } finally {
            setSettingsLoading(false)
        }
    }

    // 포토섹션 메인 이미지 업로드 (presigned URL 방식)
    const handlePhotoSectionImageUpload = async (event) => {
        const file = event.target.files?.[0]
        if (!file || !currentPageId) return

        setSettingsLoading(true)
        try {
            // 1. presigned URL 요청
            const { signedUrl, path } = await getPresignedUrl(
                `photosection_${file.name}`,
                currentPageId
            )
            
            // 2. 파일을 직접 Storage에 업로드
            await uploadToPresignedUrl(signedUrl, file)
            
            // 3. 공개 URL 생성 (Supabase Storage 공개 URL 패턴)
            const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'}/storage/v1/object/public/images/${path}`
            
            // 4. 페이지 설정에 URL 저장
            setPageSettings({
                ...pageSettings,
                photo_section_image_url: publicUrl,
            })
            
            setSuccess("메인 사진이 업로드되었습니다.")
        } catch (error) {
            console.error("Photo section image upload error:", error)
            setError("메인 사진 업로드 중 오류가 발생했습니다: " + error.message)
        } finally {
            setSettingsLoading(false)
        }
    }

    useEffect(() => {
        if (currentPageId && showImageManager) loadExistingImages()
    }, [currentPageId, showImageManager])

    // 이미지 업로드 (presigned URL 방식)
    const handleFileSelect = async (event) => {
        if (!currentPageId) return alert("페이지 ID를 설정하세요")

        const files = Array.from(event.target.files)
        setUploading(true)
        setProgress(0)
        setUploadSuccess(0)

        try {
            let completed = 0
            
            // 병렬 업로드 (presigned URL 방식)
            await Promise.all(
                files.map(async (file, i) => {
                    try {
                        // 1. presigned URL 요청
                        const { signedUrl, path, originalName } = await getPresignedUrl(
                            file.name, 
                            currentPageId
                        )
                        
                        // 2. 파일을 직접 Storage에 업로드
                        await uploadToPresignedUrl(signedUrl, file)
                        
                        // 3. DB에 메타데이터 저장
                        await saveImageMeta(
                            currentPageId,
                            originalName,
                            existingImages.length + i + 1,
                            path,
                            file.size
                        )
                        
                        completed++
                        setProgress(Math.round((completed / files.length) * 100))
                    } catch (error) {
                        console.error(`파일 ${file.name} 업로드 실패:`, error)
                        // 개별 파일 실패시에도 다른 파일은 계속 업로드
                        completed++
                        setProgress(Math.round((completed / files.length) * 100))
                        throw error
                    }
                })
            )

            setUploading(false)
            setProgress(100)
            setUploadSuccess(files.length)
            loadExistingImages()
            loadAllPages()
            setTimeout(() => setUploadSuccess(0), 3000)
        } catch (error) {
            console.error("Upload error:", error)
            alert("업로드 중 오류가 발생했습니다: " + error.message)
            setUploading(false)
            setProgress(0)
        }
    }

    // 연락처 관리
    const handleAddContact = () => {
        setSelectedContact({ ...initialContactData, page_id: currentPageId })
        setIsEditingContact(true)
    }

    const handleEditContact = (contact) => {
        setSelectedContact(contact)
        setIsEditingContact(true)
    }

    const handleDeleteContact = async (id) => {
        if (!confirm("정말로 이 연락처를 삭제하시겠습니까?")) return

        setLoading(true)
        try {
            const result = await deleteContact(id)

            if (result.success) {
                setSuccess("연락처가 성공적으로 삭제되었습니다.")
                loadContactList()
            } else {
                setError("삭제에 실패했습니다: " + result.error)
            }
        } catch (err) {
            setError("삭제에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handleSaveContact = async () => {
        if (!selectedContact) return

        if (!selectedContact.page_id.trim()) {
            setError("페이지 ID는 필수입니다.")
            return
        }
        if (selectedContact.page_id !== currentPageId) {
            setError("현재 선택된 페이지와 연락처의 페이지 ID가 다릅니다.")
            return
        }

        setLoading(true)
        try {
            const result = await saveContact(selectedContact)

            if (result.success) {
                setSuccess(
                    selectedContact.id
                        ? "연락처가 성공적으로 수정되었습니다."
                        : "연락처가 성공적으로 추가되었습니다."
                )
                setIsEditingContact(false)
                setSelectedContact(null)
                loadContactList()
            } else {
                setError(`저장에 실패했습니다: ${result.error}`)
            }
        } catch (err) {
            setError(`저장에 실패했습니다: ${err?.message || err}`)
        } finally {
            setLoading(false)
        }
    }

    const handleContactInputChange = (field, value) => {
        if (selectedContact) {
            // page_id는 직접 수정 불가
            if (field === "page_id") return
            setSelectedContact({ ...selectedContact, [field]: value })
        }
    }

    // pageId 변경 시 연락처 목록 및 설정 자동 갱신
    useEffect(() => {
        if (isAuthenticated && currentPageId) {
            loadContactList()
            loadPageSettings()
        }
    }, [currentPageId])

    // 알림 메시지 자동 제거
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null)
                setSuccess(null)
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [error, success])

    // 로그인 화면
    if (!isAuthenticated) {
        return (
            <div
                style={{
                    ...style,
                    padding: "40px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        backgroundColor: "white",
                        padding: "40px",
                        borderRadius: "12px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        maxWidth: "400px",
                        width: "100%",
                    }}
                >
                    <div style={{ textAlign: "center", marginBottom: "30px" }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                            🔐
                        </div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "24px",
                                color: "#1a237e",
                            }}
                        >
                            웨딩 통합 관리자
                        </h2>
                        <p
                            style={{
                                margin: "8px 0 0",
                                fontSize: "14px",
                                color: "#666",
                            }}
                        >
                            이미지 업로드 및 연락처 관리
                        </p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: "20px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "6px",
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                }}
                            >
                                아이디
                            </label>
                            <input
                                type="text"
                                value={loginForm.username}
                                onChange={(e) =>
                                    setLoginForm((prev) => ({
                                        ...prev,
                                        username: e.target.value,
                                    }))
                                }
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    border: "2px solid #e0e0e0",
                                    borderRadius: "8px",
                                    boxSizing: "border-box",
                                    fontSize: "16px",
                                    touchAction: "manipulation",
                                }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "6px",
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                }}
                            >
                                비밀번호
                            </label>
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={(e) =>
                                    setLoginForm((prev) => ({
                                        ...prev,
                                        password: e.target.value,
                                    }))
                                }
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    border: "2px solid #e0e0e0",
                                    borderRadius: "8px",
                                    boxSizing: "border-box",
                                    fontSize: "16px",
                                    touchAction: "manipulation",
                                }}
                                required
                            />
                        </div>

                        {loginError && (
                            <div
                                style={{
                                    padding: "12px",
                                    backgroundColor: "#ffebee",
                                    color: "#c62828",
                                    borderRadius: "6px",
                                    marginBottom: "20px",
                                    textAlign: "center",
                                }}
                            >
                                {loginError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            style={{
                                width: "100%",
                                padding: "14px",
                                backgroundColor: "#1a237e",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "16px",
                                fontWeight: "bold",
                                cursor: "pointer",
                                touchAction: "manipulation",
                            }}
                        >
                            {isLoggingIn ? "로그인 중..." : "로그인"}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    // 관리자 화면
    return (
        <div
            style={{
                ...style,
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                padding: "20px",
                touchAction: "manipulation",
            }}
        >
            {/* 헤더 */}
            <div
                style={{
                    padding: "16px",
                    backgroundColor: "#1a237e",
                    color: "white",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div>
                    <h2 style={{ margin: 0, fontSize: "16px" }}>
                        🛠️ 웨딩 통합 관리자 (프록시 연동)
                    </h2>
                    <div
                        style={{
                            fontSize: "12px",
                            opacity: 0.8,
                            marginTop: "4px",
                        }}
                    >
                        {currentUser?.name || currentUser?.username}님 | 현재
                        페이지: {currentPageId || "미설정"}
                    </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        onClick={() => setShowPageSelector(!showPageSelector)}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: showPageSelector
                                ? "#ff5722"
                                : "#4caf50",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            touchAction: "manipulation",
                        }}
                    >
                        {showPageSelector ? "페이지 닫기" : "페이지 관리"}
                    </button>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#f44336",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            touchAction: "manipulation",
                        }}
                    >
                        로그아웃
                    </button>
                </div>
            </div>

            {/* 페이지 선택 */}
            <AnimatePresence>
                {showPageSelector && (
                    <motion.div
                        style={{
                            border: "2px solid #1a237e",
                            borderRadius: "8px",
                            padding: "20px",
                            backgroundColor: "#f3f4f6",
                        }}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "15px",
                            }}
                        >
                            <h3 style={{ margin: 0 }}>페이지 ID 관리</h3>
                            <button
                                onClick={() => {
                                    const newPageId =
                                        prompt("새 페이지 ID를 입력하세요:")
                                    if (newPageId?.trim()) {
                                        setCurrentPageId(newPageId.trim())
                                        setShowPageSelector(false)
                                    }
                                }}
                                style={{
                                    padding: "6px 12px",
                                    backgroundColor: "#4caf50",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    touchAction: "manipulation",
                                }}
                            >
                                + 새 페이지
                            </button>
                        </div>

                        <div
                            style={{
                                padding: "12px",
                                backgroundColor: currentPageId
                                    ? "#e8f5e8"
                                    : "#fff3cd",
                                borderRadius: "6px",
                                marginBottom: "15px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                }}
                            >
                                <strong>현재 페이지:</strong>
                                <input
                                    type="text"
                                    value={currentPageId}
                                    onChange={(e) =>
                                        setCurrentPageId(e.target.value)
                                    }
                                    placeholder="페이지 ID 입력"
                                    style={{
                                        flex: 1,
                                        padding: "8px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                        fontSize: "16px",
                                        touchAction: "manipulation",
                                    }}
                                />
                                <button
                                    onClick={() => setCurrentPageId("")}
                                    style={{
                                        padding: "6px 10px",
                                        backgroundColor: "#f44336",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "12px",
                                        touchAction: "manipulation",
                                    }}
                                >
                                    초기화
                                </button>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fill, minmax(250px, 1fr))",
                                gap: "10px",
                            }}
                        >
                            {allPages.map((page) => (
                                <div
                                    key={page.page_id}
                                    style={{
                                        padding: "12px",
                                        backgroundColor: "white",
                                        borderRadius: "6px",
                                        border:
                                            currentPageId === page.page_id
                                                ? "2px solid #4caf50"
                                                : "1px solid #ddd",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontWeight: "bold",
                                                    color:
                                                        currentPageId ===
                                                        page.page_id
                                                            ? "#4caf50"
                                                            : "#333",
                                                }}
                                            >
                                                {page.page_id}{" "}
                                                {currentPageId ===
                                                    page.page_id && "✓"}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#666",
                                                }}
                                            >
                                                이미지 {page.image_count}개
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setCurrentPageId(page.page_id)
                                            setShowPageSelector(false)
                                        }}
                                        disabled={
                                            currentPageId === page.page_id
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "6px",
                                            backgroundColor:
                                                currentPageId === page.page_id
                                                    ? "#4caf50"
                                                    : "#2196f3",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                            touchAction: "manipulation",
                                        }}
                                    >
                                        {currentPageId === page.page_id
                                            ? "선택됨"
                                            : "선택"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 탭 메뉴 */}
            <div
                style={{
                    display: "flex",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "8px",
                    padding: "4px",
                    gap: "2px",
                    flexWrap: "wrap",
                }}
            >
                <button
                    onClick={() => setCurrentTab("basic")}
                    style={{
                        flex: "1 1 calc(33.333% - 4px)",
                        minWidth: "100px",
                        padding: "10px 8px",
                        backgroundColor:
                            currentTab === "basic" ? "#1a237e" : "transparent",
                        color: currentTab === "basic" ? "white" : "#666",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                        touchAction: "manipulation",
                    }}
                >
                    ⚙️ 기본정보
                </button>
                <button
                    onClick={() => setCurrentTab("photo")}
                    style={{
                        flex: "1 1 calc(33.333% - 4px)",
                        minWidth: "100px",
                        padding: "10px 8px",
                        backgroundColor:
                            currentTab === "photo" ? "#1a237e" : "transparent",
                        color: currentTab === "photo" ? "white" : "#666",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                        touchAction: "manipulation",
                    }}
                >
                    🖼️ 포토섹션
                </button>
                <button
                    onClick={() => setCurrentTab("images")}
                    style={{
                        flex: "1 1 calc(33.333% - 4px)",
                        minWidth: "100px",
                        padding: "10px 8px",
                        backgroundColor:
                            currentTab === "images" ? "#1a237e" : "transparent",
                        color: currentTab === "images" ? "white" : "#666",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                        touchAction: "manipulation",
                    }}
                >
                    📸 이미지
                </button>
                <button
                    onClick={() => setCurrentTab("contacts")}
                    style={{
                        flex: "1 1 calc(50% - 4px)",
                        minWidth: "120px",
                        padding: "10px 8px",
                        backgroundColor:
                            currentTab === "contacts"
                                ? "#1a237e"
                                : "transparent",
                        color: currentTab === "contacts" ? "white" : "#666",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                        touchAction: "manipulation",
                    }}
                >
                    📞 연락처
                </button>
                <button
                    onClick={() => setCurrentTab("map")}
                    style={{
                        flex: "1 1 calc(50% - 4px)",
                        minWidth: "120px",
                        padding: "10px 8px",
                        backgroundColor:
                            currentTab === "map" ? "#1a237e" : "transparent",
                        color: currentTab === "map" ? "white" : "#666",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                        touchAction: "manipulation",
                    }}
                >
                    🗺️ 지도
                </button>
            </div>

            {/* 알림 메시지 */}
            <AnimatePresence>
                {(error || success) && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            padding: "12px 20px",
                            borderRadius: "6px",
                            backgroundColor: error ? "#fef2f2" : "#f0fdf4",
                            border: `1px solid ${error ? "#fecaca" : "#bbf7d0"}`,
                            color: error ? "#dc2626" : "#16a34a",
                        }}
                    >
                        {error || success}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 기본정보 탭 */}
            {currentTab === "basic" && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                    }}
                >
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "white",
                            borderRadius: "10px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "20px",
                                fontWeight: "600",
                                color: "#1f2937",
                                margin: "0 0 20px 0",
                            }}
                        >
                            기본 정보 설정
                        </h2>

                        {/* 신랑 정보 */}
                        <div style={{ marginBottom: "25px" }}>
                            <h3
                                style={{
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#1f2937",
                                    margin: "0 0 15px 0",
                                }}
                            >
                                👰🏻‍♂️ 신랑 정보
                            </h3>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "15px",
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#374151",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        한글 이름
                                    </label>
                                    <input
                                        type="text"
                                        value={pageSettings.groom_name_kr}
                                        onChange={(e) =>
                                            setPageSettings({
                                                ...pageSettings,
                                                groom_name_kr: e.target.value,
                                            })
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                            boxSizing: "border-box",
                                        }}
                                        placeholder="예: 김태호"
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#374151",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        영문 이름
                                    </label>
                                    <input
                                        type="text"
                                        value={pageSettings.groom_name_en}
                                        onChange={(e) =>
                                            setPageSettings({
                                                ...pageSettings,
                                                groom_name_en: e.target.value,
                                            })
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                            boxSizing: "border-box",
                                        }}
                                        placeholder="예: TAEHO"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 신부 정보 */}
                        <div style={{ marginBottom: "25px" }}>
                            <h3
                                style={{
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#1f2937",
                                    margin: "0 0 15px 0",
                                }}
                            >
                                👰🏻‍♀️ 신부 정보
                            </h3>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "15px",
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#374151",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        한글 이름
                                    </label>
                                    <input
                                        type="text"
                                        value={pageSettings.bride_name_kr}
                                        onChange={(e) =>
                                            setPageSettings({
                                                ...pageSettings,
                                                bride_name_kr: e.target.value,
                                            })
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                            boxSizing: "border-box",
                                        }}
                                        placeholder="예: 박보름"
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#374151",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        영문 이름
                                    </label>
                                    <input
                                        type="text"
                                        value={pageSettings.bride_name_en}
                                        onChange={(e) =>
                                            setPageSettings({
                                                ...pageSettings,
                                                bride_name_en: e.target.value,
                                            })
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                            boxSizing: "border-box",
                                        }}
                                        placeholder="예: BORUM"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 예식 정보 */}
                        <div style={{ marginBottom: "25px" }}>
                            <h3
                                style={{
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#1f2937",
                                    margin: "0 0 15px 0",
                                }}
                            >
                                💒 예식 정보
                            </h3>

                            {/* 예식 날짜 */}
                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#374151",
                                        marginBottom: "5px",
                                    }}
                                >
                                    예식 날짜
                                </label>
                                <input
                                    type="date"
                                    value={pageSettings.wedding_date}
                                    onChange={(e) =>
                                        setPageSettings({
                                            ...pageSettings,
                                            wedding_date: e.target.value,
                                        })
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>

                            {/* 예식 시간 */}
                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#374151",
                                        marginBottom: "5px",
                                    }}
                                >
                                    예식 시간
                                </label>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr auto 1fr",
                                        gap: "10px",
                                        alignItems: "center",
                                    }}
                                >
                                    <select
                                        value={pageSettings.wedding_hour}
                                        onChange={(e) =>
                                            setPageSettings({
                                                ...pageSettings,
                                                wedding_hour: e.target.value,
                                            })
                                        }
                                        style={{
                                            padding: "10px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                        }}
                                    >
                                        {Array.from({ length: 24 }, (_, i) => {
                                            const hour = i
                                                .toString()
                                                .padStart(2, "0")
                                            const displayHour =
                                                i === 0
                                                    ? "12 AM"
                                                    : i === 12
                                                      ? "12 PM"
                                                      : i < 12
                                                        ? `${i} AM`
                                                        : `${i - 12} PM`
                                            return (
                                                <option key={hour} value={hour}>
                                                    {displayHour}
                                                </option>
                                            )
                                        })}
                                    </select>
                                    <span
                                        style={{
                                            fontSize: "14px",
                                            color: "#6b7280",
                                        }}
                                    >
                                        :
                                    </span>
                                    <select
                                        value={pageSettings.wedding_minute}
                                        onChange={(e) =>
                                            setPageSettings({
                                                ...pageSettings,
                                                wedding_minute: e.target.value,
                                            })
                                        }
                                        style={{
                                            padding: "10px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                        }}
                                    >
                                        {[
                                            "00",
                                            "10",
                                            "20",
                                            "30",
                                            "40",
                                            "50",
                                        ].map((minute) => (
                                            <option key={minute} value={minute}>
                                                {minute}분
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* 예식장 정보 */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "15px",
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#374151",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        예식장 이름
                                    </label>
                                    <input
                                        type="text"
                                        value={pageSettings.venue_name}
                                        onChange={(e) =>
                                            setPageSettings({
                                                ...pageSettings,
                                                venue_name: e.target.value,
                                            })
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                            boxSizing: "border-box",
                                        }}
                                        placeholder="예: 더그랜드컨벤션웨딩홀"
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#374151",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        예식장 주소
                                    </label>
                                    <input
                                        type="text"
                                        value={pageSettings.venue_address}
                                        onChange={(e) =>
                                            setPageSettings({
                                                ...pageSettings,
                                                venue_address: e.target.value,
                                            })
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                            boxSizing: "border-box",
                                        }}
                                        placeholder="예: 서울시 강남구 테헤란로 123"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={savePageSettings}
                            disabled={settingsLoading}
                            style={{
                                padding: "12px 24px",
                                backgroundColor: settingsLoading
                                    ? "#9ca3af"
                                    : "#1a237e",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: settingsLoading
                                    ? "not-allowed"
                                    : "pointer",
                                touchAction: "manipulation",
                            }}
                        >
                            {settingsLoading ? "저장 중..." : "기본 정보 저장"}
                        </button>
                    </div>
                </div>
            )}

            {/* 포토섹션 탭 */}
            {currentTab === "photo" && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                    }}
                >
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "white",
                            borderRadius: "10px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "20px",
                                fontWeight: "600",
                                color: "#1f2937",
                                margin: "0 0 20px 0",
                            }}
                        >
                            📸 포토섹션 설정
                        </h2>

                        {/* 자동 생성된 정보 미리보기 */}
                        <div
                            style={{
                                backgroundColor: "#f8fafc",
                                padding: "15px",
                                borderRadius: "8px",
                                marginBottom: "20px",
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#1f2937",
                                    margin: "0 0 10px 0",
                                }}
                            >
                                📋 자동 생성 미리보기
                            </h3>
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: "#6b7280",
                                    lineHeight: "1.6",
                                }}
                            >
                                <div>
                                    <strong>표시 날짜/시간:</strong>{" "}
                                    {(() => {
                                        if (!pageSettings.wedding_date)
                                            return "날짜를 입력해주세요"
                                        const date = new Date(
                                            pageSettings.wedding_date
                                        )
                                        const dayNames = [
                                            "SUN",
                                            "MON",
                                            "TUE",
                                            "WED",
                                            "THU",
                                            "FRI",
                                            "SAT",
                                        ]
                                        const hour = parseInt(
                                            pageSettings.wedding_hour
                                        )
                                        const ampm = hour >= 12 ? "PM" : "AM"
                                        const displayHour =
                                            hour === 0
                                                ? 12
                                                : hour > 12
                                                  ? hour - 12
                                                  : hour
                                        return `${date.getFullYear()}. ${(date.getMonth() + 1).toString().padStart(2, "0")}. ${date.getDate().toString().padStart(2, "0")}. ${dayNames[date.getDay()]}. ${displayHour} ${ampm}`
                                    })()}
                                </div>
                                <div>
                                    <strong>표시 장소:</strong>{" "}
                                    {pageSettings.venue_name ||
                                        "예식장 이름을 입력해주세요"}
                                </div>
                            </div>
                        </div>

                        {/* 메인 사진 업로드 */}
                        <div style={{ marginBottom: "25px" }}>
                            <h3
                                style={{
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#1f2937",
                                    margin: "0 0 15px 0",
                                }}
                            >
                                🖼️ 메인 사진
                            </h3>
                            <div
                                style={{
                                    border: "2px dashed #d1d5db",
                                    borderRadius: "8px",
                                    padding: "30px",
                                    textAlign: "center",
                                    backgroundColor: "#f9fafb",
                                    cursor: "pointer",
                                }}
                                onClick={() =>
                                    document
                                        .getElementById("photoSectionFileInput")
                                        ?.click()
                                }
                            >
                                <input
                                    id="photoSectionFileInput"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoSectionImageUpload}
                                    style={{ display: "none" }}
                                />

                                {pageSettings.photo_section_image_url ? (
                                    <div>
                                        <img
                                            src={
                                                pageSettings.photo_section_image_url
                                            }
                                            alt="메인 사진 미리보기"
                                            style={{
                                                maxWidth: "200px",
                                                maxHeight: "200px",
                                                borderRadius: "8px",
                                                marginBottom: "10px",
                                            }}
                                        />
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                color: "#10b981",
                                                marginBottom: "5px",
                                            }}
                                        >
                                            ✅ 메인 사진이 업로드되었습니다
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#6b7280",
                                            }}
                                        >
                                            다른 사진으로 변경하려면 클릭하세요
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div
                                            style={{
                                                fontSize: "48px",
                                                marginBottom: "10px",
                                            }}
                                        >
                                            📷
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: "500",
                                                color: "#374151",
                                                marginBottom: "5px",
                                            }}
                                        >
                                            메인 사진을 업로드하세요
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                color: "#6b7280",
                                            }}
                                        >
                                            PhotoSection 컴포넌트에 표시될
                                            사진입니다
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 오버레이 설정 */}
                        <div style={{ marginBottom: "25px" }}>
                            <h3
                                style={{
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#1f2937",
                                    margin: "0 0 15px 0",
                                }}
                            >
                                ⚙️ 오버레이 설정
                            </h3>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "15px",
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#374151",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        텍스트 위치
                                    </label>
                                    <select
                                        value={
                                            pageSettings.photo_section_overlay_position
                                        }
                                        onChange={(e) =>
                                            setPageSettings({
                                                ...pageSettings,
                                                photo_section_overlay_position:
                                                    e.target.value,
                                            })
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                        }}
                                    >
                                        <option value="top">상단</option>
                                        <option value="bottom">하단</option>
                                    </select>
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#374151",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        텍스트 색상
                                    </label>
                                    <select
                                        value={
                                            pageSettings.photo_section_overlay_color
                                        }
                                        onChange={(e) =>
                                            setPageSettings({
                                                ...pageSettings,
                                                photo_section_overlay_color:
                                                    e.target.value,
                                            })
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                        }}
                                    >
                                        <option value="#ffffff">흰색</option>
                                        <option value="#000000">검정</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={savePageSettings}
                            disabled={settingsLoading}
                            style={{
                                padding: "12px 24px",
                                backgroundColor: settingsLoading
                                    ? "#9ca3af"
                                    : "#1a237e",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: settingsLoading
                                    ? "not-allowed"
                                    : "pointer",
                                touchAction: "manipulation",
                            }}
                        >
                            {settingsLoading
                                ? "저장 중..."
                                : "포토섹션 설정 저장"}
                        </button>
                    </div>
                </div>
            )}

            {/* 이미지 관리 탭 */}
            {currentTab === "images" && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                    }}
                >
                    {/* 업로드 영역 */}
                    <div
                        style={{
                            border: currentPageId
                                ? "2px dashed #ccc"
                                : "2px dashed #ff5722",
                            borderRadius: "8px",
                            padding: "40px",
                            textAlign: "center",
                            backgroundColor: !currentPageId
                                ? "#ffebee"
                                : "#fafafa",
                            cursor: currentPageId ? "pointer" : "not-allowed",
                        }}
                        onClick={() =>
                            currentPageId &&
                            document.getElementById("fileInput").click()
                        }
                    >
                        <input
                            id="fileInput"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: "none" }}
                            disabled={!currentPageId}
                        />

                        {!currentPageId ? (
                            <div>
                                <div
                                    style={{
                                        fontSize: "48px",
                                        marginBottom: "10px",
                                    }}
                                >
                                    ⚠️
                                </div>
                                <div
                                    style={{
                                        fontSize: "16px",
                                        color: "#f44336",
                                        fontWeight: "bold",
                                    }}
                                >
                                    페이지 ID를 먼저 설정하세요
                                </div>
                            </div>
                        ) : uploading ? (
                            <div>
                                <div
                                    style={{
                                        fontSize: "24px",
                                        marginBottom: "10px",
                                    }}
                                >
                                    ⏳
                                </div>
                                <div>업로드 중... {progress}%</div>
                                <div
                                    style={{
                                        width: "100%",
                                        height: "6px",
                                        backgroundColor: "#e0e0e0",
                                        borderRadius: "3px",
                                        marginTop: "10px",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${progress}%`,
                                            height: "100%",
                                            backgroundColor: "#28a745",
                                            borderRadius: "3px",
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div
                                    style={{
                                        fontSize: "48px",
                                        marginBottom: "10px",
                                    }}
                                >
                                    📸
                                </div>
                                <div
                                    style={{ fontSize: "16px", color: "#666" }}
                                >
                                    이미지를 클릭하여 업로드하세요
                                </div>
                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#4caf50",
                                        marginTop: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    페이지: {currentPageId}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 업로드 성공 메시지 */}
                    <AnimatePresence>
                        {uploadSuccess > 0 && (
                            <motion.div
                                style={{
                                    padding: "15px",
                                    backgroundColor: "#e8f5e8",
                                    color: "#2e7d32",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    textAlign: "center",
                                    border: "2px solid #4caf50",
                                }}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div
                                    style={{
                                        fontWeight: "bold",
                                        marginBottom: "5px",
                                    }}
                                >
                                    ✅ {uploadSuccess}개의 이미지가 성공적으로
                                    업로드되었습니다!
                                </div>
                                <div style={{ fontSize: "12px", opacity: 0.8 }}>
                                    페이지: {currentPageId}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 이미지 관리 토글 */}
                    {currentPageId && (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div style={{ fontSize: "14px", color: "#666" }}>
                                업로드된 이미지: {existingImages.length}개
                            </div>
                            <button
                                onClick={() =>
                                    setShowImageManager(!showImageManager)
                                }
                                style={{
                                    padding: "6px 12px",
                                    backgroundColor: showImageManager
                                        ? "#007AFF"
                                        : "#6c757d",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    touchAction: "manipulation",
                                }}
                            >
                                {showImageManager ? "관리 닫기" : "이미지 관리"}
                            </button>
                        </div>
                    )}

                    {/* 이미지 목록 */}
                    <AnimatePresence>
                        {showImageManager && currentPageId && (
                            <motion.div
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: "8px",
                                    padding: "20px",
                                    backgroundColor: "#fafafa",
                                }}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: "15px",
                                    }}
                                >
                                    <h3 style={{ margin: 0 }}>
                                        이미지 순서 관리
                                    </h3>
                                    <button
                                        onClick={loadExistingImages}
                                        style={{
                                            padding: "4px 8px",
                                            backgroundColor: "#28a745",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                            touchAction: "manipulation",
                                        }}
                                    >
                                        새로고침
                                    </button>
                                </div>

                                {existingImages.length === 0 ? (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            padding: "20px",
                                            color: "#666",
                                        }}
                                    >
                                        업로드된 이미지가 없습니다
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(auto-fill, minmax(140px, 1fr))",
                                            gap: "15px",
                                        }}
                                    >
                                        {existingImages.map((image, index) => (
                                            <motion.div
                                                key={image.id}
                                                style={{
                                                    position: "relative",
                                                    backgroundColor: "white",
                                                    borderRadius: "12px",
                                                    overflow: "hidden",
                                                    border: "2px solid #e0e0e0",
                                                    boxShadow:
                                                        "0 2px 8px rgba(0,0,0,0.1)",
                                                }}
                                                layout
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.8,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                }}
                                                transition={{ duration: 0.3 }}
                                                whileHover={{ scale: 1.05 }}
                                            >
                                                {/* 순서 번호 */}
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        top: "8px",
                                                        left: "8px",
                                                        backgroundColor:
                                                            "rgba(0,0,0,0.8)",
                                                        color: "white",
                                                        width: "24px",
                                                        height: "24px",
                                                        borderRadius: "50%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        fontSize: "12px",
                                                        fontWeight: "bold",
                                                        zIndex: 3,
                                                    }}
                                                >
                                                    {index + 1}
                                                </div>
                                                {/* 삭제 버튼 */}
                                                <button
                                                    onClick={() =>
                                                        handleDeleteImage(
                                                            image.id,
                                                            image.filename
                                                        )
                                                    }
                                                    style={{
                                                        position: "absolute",
                                                        top: "8px",
                                                        right: "8px",
                                                        backgroundColor:
                                                            "rgba(220, 53, 69, 0.9)",
                                                        color: "white",
                                                        border: "none",
                                                        width: "24px",
                                                        height: "24px",
                                                        borderRadius: "50%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        cursor: "pointer",
                                                        zIndex: 3,
                                                        fontSize: "14px",
                                                        touchAction:
                                                            "manipulation",
                                                    }}
                                                >
                                                    ×
                                                </button>

                                                {/* 썸네일 */}
                                                <img
                                                    src={image.public_url}
                                                    alt={image.original_name}
                                                    style={{
                                                        width: "100%",
                                                        height: "120px",
                                                        objectFit: "cover",
                                                    }}
                                                />

                                                {/* 컨트롤 영역 */}
                                                <div
                                                    style={{
                                                        padding: "8px",
                                                        backgroundColor:
                                                            "#f8f9fa",
                                                        borderTop:
                                                            "1px solid #e9ecef",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: "10px",
                                                            color: "#666",
                                                            marginBottom: "8px",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontWeight:
                                                                    "bold",
                                                                marginBottom:
                                                                    "2px",
                                                                overflow:
                                                                    "hidden",
                                                                textOverflow:
                                                                    "ellipsis",
                                                                whiteSpace:
                                                                    "nowrap",
                                                            }}
                                                        >
                                                            {
                                                                image.original_name
                                                            }
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-between",
                                                            alignItems:
                                                                "center",
                                                            gap: "10px",
                                                        }}
                                                    >
                                                        {/* 위로 이동 */}
                                                        <button
                                                            onClick={() =>
                                                                moveImageUp(
                                                                    index
                                                                )
                                                            }
                                                            disabled={
                                                                index === 0
                                                            }
                                                            style={{
                                                                padding:
                                                                    "4px 8px",
                                                                backgroundColor:
                                                                    "#28a745",
                                                                color: "white",
                                                                border: "none",
                                                                borderRadius:
                                                                    "4px",
                                                                cursor: "pointer",
                                                                fontSize:
                                                                    "12px",
                                                                touchAction:
                                                                    "manipulation",
                                                            }}
                                                        >
                                                            ↑
                                                        </button>
                                                        {/* 위치 드롭다운 */}
                                                        <select
                                                            value={index + 1}
                                                            onChange={(e) =>
                                                                moveImageToPosition(
                                                                    index,
                                                                    parseInt(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    "4px 8px",
                                                                border: "1px solid #d1d5db",
                                                                borderRadius:
                                                                    "4px",
                                                                fontSize:
                                                                    "12px",
                                                                touchAction:
                                                                    "manipulation",
                                                            }}
                                                        >
                                                            {existingImages.map(
                                                                (_, i) => (
                                                                    <option
                                                                        key={i}
                                                                        value={
                                                                            i +
                                                                            1
                                                                        }
                                                                    >
                                                                        {i + 1}
                                                                        번째
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                        {/* 아래로 이동 */}
                                                        <button
                                                            onClick={() =>
                                                                moveImageDown(
                                                                    index
                                                                )
                                                            }
                                                            disabled={
                                                                index ===
                                                                existingImages.length -
                                                                    1
                                                            }
                                                            style={{
                                                                padding:
                                                                    "4px 8px",
                                                                backgroundColor:
                                                                    "#28a745",
                                                                color: "white",
                                                                border: "none",
                                                                borderRadius:
                                                                    "4px",
                                                                cursor: "pointer",
                                                                fontSize:
                                                                    "12px",
                                                                touchAction:
                                                                    "manipulation",
                                                            }}
                                                        >
                                                            ↓
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* 연락처 관리 탭 */}
            {currentTab === "contacts" && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                    }}
                >
                    {/* 연락처 헤더 */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "20px",
                            backgroundColor: "white",
                            borderRadius: "10px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "20px",
                                fontWeight: "600",
                                color: "#1f2937",
                                margin: 0,
                            }}
                        >
                            연락처 목록 (
                            {
                                contactList.filter(
                                    (c) => c.page_id === currentPageId
                                ).length
                            }
                            )
                        </h2>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <motion.button
                                onClick={handleAddContact}
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor: "#10b981",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                새 연락처 추가
                            </motion.button>
                            <motion.button
                                onClick={loadContactList}
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor: "#2196f3",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                새로고침
                            </motion.button>
                        </div>
                    </div>

                    {/* 연락처 목록 */}
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "10px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                            overflow: "hidden",
                        }}
                    >
                        {loading ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "40px",
                                    color: "#6b7280",
                                }}
                            >
                                로딩 중...
                            </div>
                        ) : contactList.filter(
                              (c) => c.page_id === currentPageId
                          ).length === 0 ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "40px",
                                    color: "#6b7280",
                                }}
                            >
                                등록된 연락처가 없습니다.
                            </div>
                        ) : (
                            <div style={{ padding: "20px" }}>
                                {contactList
                                    .filter((c) => c.page_id === currentPageId)
                                    .map((contact, index) => (
                                        <motion.div
                                            key={contact.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                padding: "15px",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "8px",
                                                marginBottom: "10px",
                                                backgroundColor: "#fafafa",
                                            }}
                                        >
                                            <div>
                                                <h3
                                                    style={{
                                                        fontSize: "16px",
                                                        fontWeight: "600",
                                                        color: "#1f2937",
                                                        margin: "0 0 5px 0",
                                                    }}
                                                >
                                                    페이지 ID: {contact.page_id}
                                                </h3>
                                                <p
                                                    style={{
                                                        fontSize: "14px",
                                                        color: "#6b7280",
                                                        margin: 0,
                                                    }}
                                                >
                                                    신랑: {contact.groom_name} |
                                                    신부: {contact.bride_name}
                                                </p>
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "10px",
                                                }}
                                            >
                                                <motion.button
                                                    onClick={() =>
                                                        handleEditContact(
                                                            contact
                                                        )
                                                    }
                                                    style={{
                                                        padding: "8px 16px",
                                                        backgroundColor:
                                                            "#3b82f6",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        fontSize: "12px",
                                                        cursor: "pointer",
                                                    }}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    편집
                                                </motion.button>
                                                <motion.button
                                                    onClick={() =>
                                                        handleDeleteContact(
                                                            contact.id
                                                        )
                                                    }
                                                    style={{
                                                        padding: "8px 16px",
                                                        backgroundColor:
                                                            "#ef4444",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        fontSize: "12px",
                                                        cursor: "pointer",
                                                    }}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    삭제
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 연락처 편집 모달 */}
            <AnimatePresence>
                {isEditingContact && selectedContact && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            zIndex: 1000,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "20px",
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            style={{
                                backgroundColor: "white",
                                borderRadius: "10px",
                                padding: "22px 18px 18px 18px",
                                width: "100%",
                                maxWidth: "430px",
                                margin: "0 auto",
                                maxHeight: "80vh",
                                overflow: "auto",
                                boxSizing: "border-box",
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: "24px",
                                    fontWeight: "600",
                                    marginBottom: "20px",
                                    color: "#1f2937",
                                }}
                            >
                                {selectedContact.id
                                    ? "연락처 편집"
                                    : "새 연락처 추가"}
                            </h2>

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "28px",
                                    marginBottom: "20px",
                                }}
                            >
                                {/* 페이지 ID */}
                                <div style={{ marginBottom: "10px" }}>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#374151",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        페이지 ID (현재 선택된 페이지)
                                    </label>
                                    <input
                                        type="text"
                                        value={currentPageId}
                                        disabled
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                            backgroundColor: "#f3f4f6",
                                            color: "#888",
                                        }}
                                    />
                                </div>

                                {/* 신랑측 정보 */}
                                <div
                                    style={{
                                        background: "#f8fafc",
                                        borderRadius: "8px",
                                        padding: "14px 10px 8px 10px",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "#1f2937",
                                            marginBottom: "10px",
                                        }}
                                    >
                                        신랑측 정보
                                    </h3>
                                    <InputField
                                        label="신랑 이름"
                                        value={selectedContact.groom_name}
                                        onChange={(value) =>
                                            handleContactInputChange(
                                                "groom_name",
                                                value
                                            )
                                        }
                                    />
                                    <InputField
                                        label="신랑 전화번호"
                                        value={selectedContact.groom_phone}
                                        onChange={(value) =>
                                            handleContactInputChange(
                                                "groom_phone",
                                                value
                                            )
                                        }
                                    />
                                    <InputField
                                        label="신랑 아버지 이름"
                                        value={
                                            selectedContact.groom_father_name
                                        }
                                        onChange={(value) =>
                                            handleContactInputChange(
                                                "groom_father_name",
                                                value
                                            )
                                        }
                                    />
                                    <InputField
                                        label="신랑 아버지 전화번호"
                                        value={
                                            selectedContact.groom_father_phone
                                        }
                                        onChange={(value) =>
                                            handleContactInputChange(
                                                "groom_father_phone",
                                                value
                                            )
                                        }
                                    />
                                    <InputField
                                        label="신랑 어머니 이름"
                                        value={
                                            selectedContact.groom_mother_name
                                        }
                                        onChange={(value) =>
                                            handleContactInputChange(
                                                "groom_mother_name",
                                                value
                                            )
                                        }
                                    />
                                    <InputField
                                        label="신랑 어머니 전화번호"
                                        value={
                                            selectedContact.groom_mother_phone
                                        }
                                        onChange={(value) =>
                                            handleContactInputChange(
                                                "groom_mother_phone",
                                                value
                                            )
                                        }
                                    />
                                </div>

                                {/* 신부측 정보 */}
                                <div
                                    style={{
                                        background: "#f8fafc",
                                        borderRadius: "8px",
                                        padding: "14px 10px 8px 10px",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "#1f2937",
                                            marginBottom: "10px",
                                        }}
                                    >
                                        신부측 정보
                                    </h3>
                                    <InputField
                                        label="신부 이름"
                                        value={selectedContact.bride_name}
                                        onChange={(value) =>
                                            handleContactInputChange(
                                                "bride_name",
                                                value
                                            )
                                        }
                                    />
                                    <InputField
                                        label="신부 전화번호"
                                        value={selectedContact.bride_phone}
                                        onChange={(value) =>
                                            handleContactInputChange(
                                                "bride_phone",
                                                value
                                            )
                                        }
                                    />
                                    <InputField
                                        label="신부 아버지 이름"
                                        value={
                                            selectedContact.bride_father_name
                                        }
                                        onChange={(value) =>
                                            handleContactInputChange(
                                                "bride_father_name",
                                                value
                                            )
                                        }
                                    />
                                    <InputField
                                        label="신부 아버지 전화번호"
                                        value={
                                            selectedContact.bride_father_phone
                                        }
                                        onChange={(value) =>
                                            handleContactInputChange(
                                                "bride_father_phone",
                                                value
                                            )
                                        }
                                    />
                                    <InputField
                                        label="신부 어머니 이름"
                                        value={
                                            selectedContact.bride_mother_name
                                        }
                                        onChange={(value) =>
                                            handleContactInputChange(
                                                "bride_mother_name",
                                                value
                                            )
                                        }
                                    />
                                    <InputField
                                        label="신부 어머니 전화번호"
                                        value={
                                            selectedContact.bride_mother_phone
                                        }
                                        onChange={(value) =>
                                            handleContactInputChange(
                                                "bride_mother_phone",
                                                value
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            {/* 버튼 */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: "10px",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <motion.button
                                    onClick={() => {
                                        setIsEditingContact(false)
                                        setSelectedContact(null)
                                    }}
                                    style={{
                                        padding: "10px 20px",
                                        backgroundColor: "#6b7280",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    취소
                                </motion.button>
                                <motion.button
                                    onClick={handleSaveContact}
                                    disabled={loading}
                                    style={{
                                        padding: "10px 20px",
                                        backgroundColor: loading
                                            ? "#9ca3af"
                                            : "#10b981",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        cursor: loading
                                            ? "not-allowed"
                                            : "pointer",
                                    }}
                                    whileHover={!loading ? { scale: 1.05 } : {}}
                                    whileTap={!loading ? { scale: 0.95 } : {}}
                                >
                                    {loading ? "저장 중..." : "저장"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 지도 탭 */}
            {currentTab === "map" && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                    }}
                >
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "white",
                            borderRadius: "10px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "20px",
                                fontWeight: "600",
                                color: "#1f2937",
                                margin: "0 0 20px 0",
                            }}
                        >
                            🗺️ 지도 및 캘린더 설정
                        </h2>

                        {/* 자동 생성된 정보 미리보기 */}
                        <div
                            style={{
                                backgroundColor: "#f8fafc",
                                padding: "15px",
                                borderRadius: "8px",
                                marginBottom: "20px",
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#1f2937",
                                    margin: "0 0 10px 0",
                                }}
                            >
                                📋 자동 생성 미리보기
                            </h3>
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: "#6b7280",
                                    lineHeight: "1.6",
                                }}
                            >
                                <div>
                                    <strong>장소명:</strong>{" "}
                                    {pageSettings.venue_name ||
                                        "예식장 이름을 입력해주세요"}
                                </div>
                                <div>
                                    <strong>캘린더 이벤트명:</strong>{" "}
                                    {(() => {
                                        const groomFirst =
                                            pageSettings.groom_name_kr
                                                ? pageSettings.groom_name_kr.slice(
                                                      -2
                                                  )
                                                : "신랑"
                                        const brideFirst =
                                            pageSettings.bride_name_kr
                                                ? pageSettings.bride_name_kr.slice(
                                                      -2
                                                  )
                                                : "신부"
                                        return `${groomFirst} ♥ ${brideFirst}의 결혼식`
                                    })()}
                                </div>
                                <div>
                                    <strong>캘린더 설명:</strong>{" "}
                                    {(() => {
                                        const groomFirst =
                                            pageSettings.groom_name_kr
                                                ? pageSettings.groom_name_kr.slice(
                                                      -2
                                                  )
                                                : "신랑"
                                        const brideFirst =
                                            pageSettings.bride_name_kr
                                                ? pageSettings.bride_name_kr.slice(
                                                      -2
                                                  )
                                                : "신부"
                                        return `${groomFirst}과 ${brideFirst}의 새로운 출발을 축하해 주세요`
                                    })()}
                                </div>
                                <div>
                                    <strong>예식 일시:</strong>{" "}
                                    {(() => {
                                        if (!pageSettings.wedding_date)
                                            return "날짜를 입력해주세요"
                                        const date = new Date(
                                            pageSettings.wedding_date
                                        )
                                        const hour = parseInt(
                                            pageSettings.wedding_hour
                                        )
                                        const minute =
                                            pageSettings.wedding_minute
                                        const ampm =
                                            hour >= 12 ? "오후" : "오전"
                                        const displayHour =
                                            hour === 0
                                                ? 12
                                                : hour > 12
                                                  ? hour - 12
                                                  : hour
                                        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${ampm} ${displayHour}:${minute}`
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* 정보 안내 */}
                        <div
                            style={{
                                backgroundColor: "#f0f9ff",
                                padding: "15px",
                                borderRadius: "8px",
                                border: "1px solid #e0f2fe",
                                marginBottom: "20px",
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#0369a1",
                                    margin: "0 0 10px 0",
                                }}
                            >
                                ℹ️ 자동 연동 정보
                            </h3>
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: "#0c4a6e",
                                    lineHeight: "1.6",
                                }}
                            >
                                <div>
                                    • <strong>지도 컴포넌트</strong>: 기본정보의
                                    예식장 이름이 자동으로 연동됩니다
                                </div>
                                <div>
                                    • <strong>캘린더 버튼</strong>: 신랑신부
                                    이름(성 제외)과 예식 일시가 자동으로
                                    연동됩니다
                                </div>
                                <div>
                                    • <strong>Calendar 컴포넌트</strong>: 예식
                                    날짜가 자동으로 하이라이트됩니다
                                </div>
                                <div>
                                    • <strong>PhotoSection</strong>: 업로드한
                                    메인 사진과 예식 정보가 자동으로 표시됩니다
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: "15px",
                                backgroundColor: "#f9fafb",
                                borderRadius: "8px",
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "48px",
                                    marginBottom: "10px",
                                }}
                            >
                                ✅
                            </div>
                            <div
                                style={{
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    color: "#374151",
                                    marginBottom: "5px",
                                }}
                            >
                                설정 완료!
                            </div>
                            <div style={{ fontSize: "14px", color: "#6b7280" }}>
                                모든 정보가 기본정보 탭에서 자동으로 연동됩니다
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// 입력 필드 컴포넌트
function InputField({ label, value, onChange }) {
    return (
        <div style={{ marginBottom: "13px", maxWidth: "100%" }}>
            <label
                style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "5px",
                }}
            >
                {label}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: "100%",
                    minWidth: 0,
                    padding: "9px 10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "15px",
                    outline: "none",
                    boxSizing: "border-box",
                }}
            />
        </div>
    )
}

// Property Controls
addPropertyControls(UnifiedWeddingAdmin, {
    maxSizeKB: {
        type: ControlType.Number,
        title: "목표 파일 크기",
        min: 100,
        max: 5000,
        step: 100,
        unit: "KB",
        defaultValue: 1024,
    },
})
