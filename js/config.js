// ============================================================
// 설정 파일
// ============================================================
const CONFIG = {
  supabase: {
    url: 'https://hfhbbfmpgqkfefzmfnon.supabase.co',
    anonKey: 'sb_publishable_7ezWGPEXJ7TR9UYb9OgBig_oZLy6aDy',
  },
  telegram: {
    botToken: 'YOUR_TELEGRAM_BOT_TOKEN',
    adminChatId: 'YOUR_ADMIN_CHAT_ID',
  },
  claude: {
    apiKey: 'YOUR_CLAUDE_API_KEY',
    model: 'claude-haiku-20240307',
  },
  emailjs: {
    serviceId: 'YOUR_EMAILJS_SERVICE_ID',
    templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
    publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
  },
  vendor: {
    email: 'vendor@example.com',
    accessToken: 'YOUR_VENDOR_ACCESS_TOKEN',
  },
  app: {
    baseUrl: 'https://bangdw-hash.github.io/business-card',
    schoolName: '아세아항공직업전문학교',
    schoolNameEn: 'ASEA AVIATION COLLEGE',
    defaultAddress: '서울특별시 영등포구 당산로32길 16',
    defaultAddressEn: '16, Dangsan-ro 32-gil, Yeongdeungpo-gu, Seoul, Republic of Korea',
    defaultFax: '02-714-1260',
    emailDomain: '@asea.or.kr',
    addressPresets: [
      '서울특별시 영등포구 당산로32길 16',
    ],
  },

  // 용지 종류 표시명
  PAPER_TYPE_NAMES: {
    standard: '일반지',
    premium:  '프리미엄지 (고급)',
  },

  // 수령 방법 표시명
  DELIVERY_METHOD_NAMES: {
    pickup:   '방문 수령',
    delivery: '우편 배송',
  },

  // 상태 한국어 표시명
  STATUS_NAMES: {
    pending:                '접수대기',
    approved:               '승인됨',
    revision:               '수정요청',
    rejected:               '반려',
    ordered:                '발주완료',
    printing:               '인쇄중',
    delivered_to_admin:     '관리자수령',
    delivered_to_applicant: '전달완료',
  },

  // 명함 앞면 레이아웃 (px, 캔버스 1050×600 기준)
  cardFrontLayout: {
    width: 1050,
    height: 600,
    bgColor: '#f8f7f2',
    accentColor: '#003087',
    accentBar: { x: 0, y: 0, w: 18, h: 600 },
    schoolNameKr: { x: 48, y: 72,  fontSize: 20, color: '#003087', bold: true },
    schoolNameEn: { x: 48, y: 100, fontSize: 12, color: '#6688aa' },
    divider: { x: 48, y: 230, w: 960, color: '#dddddd' },
    fields: {
      name:       { x: 48, y: 270, fontSize: 30, bold: true,  color: '#1a1a1a' },
      position:   { x: 48, y: 318, fontSize: 17, bold: false, color: '#444444' },
      department: { x: 48, y: 344, fontSize: 14, bold: false, color: '#777777' },
      phone:      { x: 48, y: 400, fontSize: 14, bold: false, color: '#333333', label: 'Tel.' },
      mobile:     { x: 48, y: 425, fontSize: 14, bold: false, color: '#333333', label: 'M.' },
      fax:        { x: 48, y: 450, fontSize: 14, bold: false, color: '#333333', label: 'Fax.' },
      email:      { x: 48, y: 475, fontSize: 14, bold: false, color: '#003087', label: 'E.' },
      extension:  { x: 700, y: 400, fontSize: 14, bold: false, color: '#333333', label: 'Ext.' },
      address:    { x: 48, y: 548, fontSize: 11, bold: false, color: '#999999' },
    }
  },

  // 명함 듷면 레이아웃 (영문)
  cardBackLayout: {
    width: 1050,
    height: 600,
    bgColor: '#003087',
    accentColor: '#ffffff',
    accentBar: { x: 0, y: 0, w: 18, h: 600, color: '#ffd700' },
    schoolNameKr: { x: 48, y: 72,  fontSize: 18, color: '#aabbdd', bold: false },
    schoolNameEn: { x: 48, y: 100, fontSize: 14, color: '#ffffff', bold: true },
    divider: { x: 48, y: 230, w: 960, color: '#1a4a8a' },
    fields: {
      nameEn:       { x: 48, y: 270, fontSize: 28, bold: true,  color: '#ffffff' },
      positionEn:   { x: 48, y: 315, fontSize: 16, bold: false, color: '#ccd6f0' },
      departmentEn: { x: 48, y: 340, fontSize: 13, bold: false, color: '#8899cc' },
      phone:        { x: 48, y: 400, fontSize: 13, bold: false, color: '#ffffff', label: 'Tel.' },
      mobile:       { x: 48, y: 423, fontSize: 13, bold: false, color: '#ffffff', label: 'M.' },
      email:        { x: 48, y: 446, fontSize: 13, bold: false, color: '#ffd700', label: 'E.' },
      addressEn:    { x: 48, y: 500, fontSize: 11, bold: false, color: '#8899cc' },
    }
  },

  // invoiceStatusLabels
  invoiceStatusLabels: {
    pending:   '미확인',
    confirmed: '확인완료',
    paid:      '지급완료',
  },
};

// statusLabels 는 STATUS_NAMES 의 별칭
CONFIG.statusLabels = CONFIG.STATUS_NAMES;

// 직급 번역 사전
const POSITION_DICT = {
  '학장':     ['President', 'Dean', 'Chancellor'],
  '부학장':   ['Vice President', 'Vice Dean', 'Deputy President'],
  '처장':     ['Director', 'Head of Department', 'Division Director'],
  '부처장':   ['Deputy Director', 'Assistant Director'],
  '부장':     ['General Manager', 'Department Head', 'Division Manager'],
  '차장':     ['Deputy General Manager', 'Assistant General Manager', 'Senior Manager'],
  '과장':     ['Manager', 'Section Chief', 'Team Manager'],
  '대리':     ['Assistant Manager', 'Deputy Manager', 'Associate Manager'],
  '주임':     ['Senior Staff', 'Supervisor', 'Chief Staff'],
  '사원':     ['Staff', 'Associate', 'Officer'],
  '교수':     ['Professor', 'Instructor'],
  '조교수':   ['Assistant Professor'],
  '부교수':   ['Associate Professor'],
  '겣8임교수': ['Adjunct Professor', 'Part-time Professor'],
  '강사':     ['Lecturer', 'Instructor', 'Trainer'],
  '교육원장': ['Director of Training Center', 'Training Director'],
  '학부장':   ['Department Chair', 'Division Head', 'Head of School'],
  '팀장':     ['Team Leader', 'Team Manager'],
  '실장':     ['Division Head', 'Section Head'],
  '센터장':   ['Center Director', 'Center Head'],
  '원장':     ['Director', 'Dean', 'Principal'],
  '교감':     ['Vice Principal', 'Assistant Principal'],
  '교장':     ['Principal', 'Director'],
};
