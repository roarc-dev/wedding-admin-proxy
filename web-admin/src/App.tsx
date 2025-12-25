import Admin from "./components/Admin"

function App() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#F5F5F5",
        display: "flex",
        justifyContent: "center",
      }}
    >
      {/* 데스크톱에서도 모바일 뷰(430px) 유지 */}
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          minHeight: "100vh",
          backgroundColor: "#ffffff",
          boxShadow: "0 0 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Admin style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  )
}

export default App
