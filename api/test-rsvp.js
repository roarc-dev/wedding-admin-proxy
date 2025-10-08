// 간단한 테스트 엔드포인트
export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 환경 변수 확인
        const envCheck = {
            hasSupabaseUrl: !!process.env.SUPABASE_URL,
            hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasR2AccountId: !!process.env.R2_ACCOUNT_ID,
            hasR2AccessKey: !!process.env.R2_ACCESS_KEY_ID,
            hasR2SecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
            bucketName: process.env.R2_BUCKET_NAME || 'roarc-wedding',
        };

        // 간단한 HTML 생성 테스트
        const testPageId = req.body?.pageId || 'test123';
        const testHTML = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>RSVP Test - ${testPageId}</title>
</head>
<body>
    <h1>RSVP Test Page</h1>
    <p>Page ID: ${testPageId}</p>
    <p>Generated at: ${new Date().toISOString()}</p>
</body>
</html>`;

        return res.status(200).json({
            success: true,
            message: 'Test endpoint working',
            envCheck,
            htmlPreview: testHTML.substring(0, 200) + '...',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Test error:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}

