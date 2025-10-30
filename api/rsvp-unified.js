const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 초기화
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

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
