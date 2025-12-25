/**
 * 컴포넌트 레지스트리 - Final_v1 컴포넌트들을 등록
 * 
 * 각 컴포넌트는 pageId를 받아서 필요한 데이터를 API에서 가져옵니다.
 * 순서는 Supabase의 component_order 필드에서 관리합니다.
 */

// 컴포넌트 타입 정의
export type ComponentType = 
  | 'NameSection'           // 신랑/신부 이름 섹션
  | 'PhotoSectionProxy'     // 메인 사진
  | 'Info'                  // 청첩장 본문
  | 'InviteName'            // 초대 이름
  | 'CalendarProxy'         // 캘린더
  | 'CalendarAddBtn'        // 캘린더 추가 버튼
  | 'LocationUnified'       // 위치/지도
  | 'UnifiedGalleryComplete' // 갤러리
  | 'WeddingContact'        // 연락처
  | 'Account'               // 계좌 정보
  | 'RSVPClient'            // RSVP 폼
  | 'rsvpResult'            // RSVP 결과
  | 'CommentBoard'          // 방명록
  | 'KakaoShare'            // 카카오 공유
  | 'bgm'                   // 배경음악
  // 테마별 컴포넌트
  | 'EternalDateVenue'      // Eternal 테마 - 날짜/장소
  | 'EternalMainPhoto'      // Eternal 테마 - 메인 사진
  | 'EternalNameSection'    // Eternal 테마 - 이름 섹션
  | 'FioreDateVenue'        // Fiore 테마 - 날짜/장소
  | 'FioreNameSection'      // Fiore 테마 - 이름 섹션
  // 텍스트 컴포넌트
  | 'P22TextComplete'       // P22 폰트 텍스트
  | 'GoldenbookTextComplete' // Goldenbook 폰트 텍스트
  | 'PretendardBtnTxt'      // Pretendard 버튼 텍스트

// 기본 컴포넌트 순서 (테마별로 다를 수 있음)
export const DEFAULT_COMPONENT_ORDER: ComponentType[] = [
  'NameSection',
  'PhotoSectionProxy',
  'Info',
  'CalendarProxy',
  'CalendarAddBtn',
  'LocationUnified',
  'UnifiedGalleryComplete',
  'WeddingContact',
  'Account',
  'RSVPClient',
  'CommentBoard',
  'KakaoShare',
]

// 컴포넌트 메타데이터
export interface ComponentMeta {
  type: ComponentType
  displayName: string
  description: string
  isRequired?: boolean
  defaultVisible?: boolean
}

export const COMPONENT_REGISTRY: Record<ComponentType, ComponentMeta> = {
  NameSection: {
    type: 'NameSection',
    displayName: '이름 섹션',
    description: '신랑/신부 이름 표시',
    isRequired: true,
    defaultVisible: true,
  },
  PhotoSectionProxy: {
    type: 'PhotoSectionProxy',
    displayName: '메인 사진',
    description: '대표 사진 표시',
    defaultVisible: true,
  },
  Info: {
    type: 'Info',
    displayName: '초대 문구',
    description: '청첩장 본문 텍스트',
    defaultVisible: true,
  },
  InviteName: {
    type: 'InviteName',
    displayName: '초대 이름',
    description: '초대하는 분들 이름',
    defaultVisible: true,
  },
  CalendarProxy: {
    type: 'CalendarProxy',
    displayName: '캘린더',
    description: '결혼식 날짜 캘린더',
    defaultVisible: true,
  },
  CalendarAddBtn: {
    type: 'CalendarAddBtn',
    displayName: '캘린더 추가',
    description: '캘린더에 일정 추가 버튼',
    defaultVisible: true,
  },
  LocationUnified: {
    type: 'LocationUnified',
    displayName: '위치',
    description: '결혼식 장소 및 지도',
    defaultVisible: true,
  },
  UnifiedGalleryComplete: {
    type: 'UnifiedGalleryComplete',
    displayName: '갤러리',
    description: '사진 갤러리',
    defaultVisible: true,
  },
  WeddingContact: {
    type: 'WeddingContact',
    displayName: '연락처',
    description: '신랑/신부측 연락처',
    defaultVisible: true,
  },
  Account: {
    type: 'Account',
    displayName: '계좌 정보',
    description: '축의금 계좌 정보',
    defaultVisible: true,
  },
  RSVPClient: {
    type: 'RSVPClient',
    displayName: 'RSVP',
    description: '참석 여부 입력 폼',
    defaultVisible: true,
  },
  rsvpResult: {
    type: 'rsvpResult',
    displayName: 'RSVP 결과',
    description: 'RSVP 집계 결과',
    defaultVisible: false,
  },
  CommentBoard: {
    type: 'CommentBoard',
    displayName: '방명록',
    description: '축하 메시지 방명록',
    defaultVisible: true,
  },
  KakaoShare: {
    type: 'KakaoShare',
    displayName: '카카오 공유',
    description: '카카오톡 공유 버튼',
    defaultVisible: true,
  },
  bgm: {
    type: 'bgm',
    displayName: '배경음악',
    description: '배경 음악 플레이어',
    defaultVisible: false,
  },
  // 테마별 컴포넌트
  EternalDateVenue: {
    type: 'EternalDateVenue',
    displayName: 'Eternal - 날짜/장소',
    description: 'Eternal 테마 날짜 및 장소',
    defaultVisible: false,
  },
  EternalMainPhoto: {
    type: 'EternalMainPhoto',
    displayName: 'Eternal - 메인 사진',
    description: 'Eternal 테마 메인 사진',
    defaultVisible: false,
  },
  EternalNameSection: {
    type: 'EternalNameSection',
    displayName: 'Eternal - 이름',
    description: 'Eternal 테마 이름 섹션',
    defaultVisible: false,
  },
  FioreDateVenue: {
    type: 'FioreDateVenue',
    displayName: 'Fiore - 날짜/장소',
    description: 'Fiore 테마 날짜 및 장소',
    defaultVisible: false,
  },
  FioreNameSection: {
    type: 'FioreNameSection',
    displayName: 'Fiore - 이름',
    description: 'Fiore 테마 이름 섹션',
    defaultVisible: false,
  },
  // 텍스트 컴포넌트
  P22TextComplete: {
    type: 'P22TextComplete',
    displayName: 'P22 텍스트',
    description: 'P22 폰트 텍스트',
    defaultVisible: false,
  },
  GoldenbookTextComplete: {
    type: 'GoldenbookTextComplete',
    displayName: 'Goldenbook 텍스트',
    description: 'Goldenbook 폰트 텍스트',
    defaultVisible: false,
  },
  PretendardBtnTxt: {
    type: 'PretendardBtnTxt',
    displayName: 'Pretendard 버튼',
    description: 'Pretendard 폰트 버튼 텍스트',
    defaultVisible: false,
  },
}







