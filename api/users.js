// 최소 동작 테스트 버전
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      message: "Users API is working!",
      data: []
    });
  }

  res.status(405).json({ 
    success: false, 
    error: "Method Not Allowed" 
  });
} 