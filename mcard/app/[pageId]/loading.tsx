/**
 * 로딩 UI - 페이지 로드 중 표시
 */
export default function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <div style={{ fontSize: '14px', color: '#666' }}>
        로딩 중...
      </div>
    </div>
  )
}







