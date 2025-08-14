import { Client } from '@notionhq/client'

// Notion 클라이언트 초기화
const notion = new Client({
  auth: process.env.NOTION_TOKEN || 'ntn_t73493868708Mnzt4jWFDtkuocY0Yhyv5UtUt17Pa2d07b'
})

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    const { pageId = '18d1b60ebe7680f4a212da4ba8cc8131' } = req.query

    console.log('Notion 페이지 조회 시작:', pageId)

    // 1. 페이지 기본 정보 조회
    const pageInfo = await notion.pages.retrieve({
      page_id: pageId
    })

    console.log('페이지 정보 조회 완료:', pageInfo.id)

    // 2. 페이지 내용 (블록) 조회
    const blocks = await notion.blocks.children.list({
      block_id: pageId
    })

    console.log('블록 조회 완료:', blocks.results.length, '개 블록')

    // 3. 페이지가 데이터베이스인 경우 데이터베이스 항목 조회
    let databaseItems = null
    if (pageInfo.object === 'database') {
      databaseItems = await notion.databases.query({
        database_id: pageId
      })
      console.log('데이터베이스 항목 조회 완료:', databaseItems.results.length, '개 항목')
    }

    return res.json({
      success: true,
      data: {
        pageInfo,
        blocks: blocks.results,
        databaseItems: databaseItems?.results || null,
        totalBlocks: blocks.results.length,
        hasDatabase: pageInfo.object === 'database'
      }
    })

  } catch (error) {
    console.error('Notion API 오류:', error)
    
    // 권한 오류인 경우
    if (error.code === 'unauthorized') {
      return res.status(401).json({
        success: false,
        error: 'Notion 페이지에 접근 권한이 없습니다. 페이지를 Integration과 공유해주세요.'
      })
    }

    // 페이지를 찾을 수 없는 경우
    if (error.code === 'object_not_found') {
      return res.status(404).json({
        success: false,
        error: 'Notion 페이지를 찾을 수 없습니다.'
      })
    }

    return res.status(500).json({
      success: false,
      error: 'Notion API 호출 중 오류가 발생했습니다: ' + error.message
    })
  }
} 