// =====================================================
// 아세아항공직업전문학교 명함 신청 시스템
// Configuration File - js/config.js
// =====================================================
// IMPORTANT: Replace all placeholder values before deploying
// =====================================================

const CONFIG = {
  // --------------------------------------------------
  // Supabase Configuration
  // --------------------------------------------------
  supabase: {
    url: 'https://YOUR_PROJECT_ID.supabase.co',       // TODO: Replace with your Supabase project URL
    anonKey: 'YOUR_SUPABASE_ANON_KEY',                // TODO: Replace with your Supabase anon key
  },

  // --------------------------------------------------
  // Telegram Bot Configuration
  // --------------------------------------------------
  telegram: {
    botToken: 'YOUR_TELEGRAM_BOT_TOKEN',              // TODO: Replace with your Telegram bot token
    adminChatId: 'YOUR_TELEGRAM_ADMIN_CHAT_ID',       // TODO: Replace with admin chat/group ID
    enabled: false,                                    // Set to true after configuring
  },

  // --------------------------------------------------
  // Claude API (via Supabase Edge Function proxy)
  // --------------------------------------------------
  claude: {
    edgeFunctionUrl: 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/translate-position',
    apiKey: 'YOUR_CLAUDE_API_KEY',                    // TODO: Only used server-side in Edge Function
    enabled: false,                                    // Set to true after configuring Edge Function
  },

  // --------------------------------------------------
  // EmailJS Configuration (optional)
  // --------------------------------------------------
  emailjs: {
    serviceId: 'YOUR_EMAILJS_SERVICE_ID',
    templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
    userId: 'YOUR_EMAILJS_USER_ID',
    enabled: false,                                    // Set to true after configuring
  },

  // --------------------------------------------------
  // Vendor Access Configuration
  // --------------------------------------------------
  vendor: {
    accessToken: 'VENDOR_SECRET_TOKEN_CHANGE_THIS',   // TODO: Change to a secure random token
    email: 'vendor@example.com',                       // TODO: Replace with vendor email
    companyName: '인쇄업체명',                         // TODO: Replace with vendor company name
  },

  // --------------------------------------------------
  // App Configuration
  // --------------------------------------------------
  app: {
    baseUrl: 'https://bangdw-hash.github.io/business-card',
    name: '명함 신청 시스템',
    version: '1.0.0',
  },

  // --------------------------------------------------
  // School Information
  // --------------------------------------------------
  school: {
    nameKr: '아세아항공직업전문학교',
    nameEn: 'ASEA Aviation Vocational School',
    address: '서울특별시 강서구 오쇠로 56',
    addressEn: '56, Osoe-ro, Gangseo-gu, Seoul, Republic of Korea',
    phone: '02-2600-0000',
    website: 'www.asea.ac.kr',
    logoText: 'ASEA',                                  // Used on canvas when no image logo
  },

  // --------------------------------------------------
  // Card Front Layout (1050 x 600 canvas)
  // --------------------------------------------------
  cardFrontLayout: {
    width: 1050,
    height: 600,
    bgColor: '#f5f5f0',
    accentColor: '#003087',
    accentStripeWidth: 10,
    logoArea: { x: 80, y: 60, w: 200, h: 80 },
    schoolName: { x: 80, y: 80, fontSize: 22, color: '#003087', fontFamily: 'Noto Sans KR, sans-serif' },
    schoolNameEn: { x: 80, y: 110, fontSize: 13, color: '#003087', fontFamily: 'Arial, sans-serif' },
    dividerLine: { x: 80, y: 250, w: 890, color: '#003087', thickness: 1.5 },
    fields: {
      name:       { x: 80,  y: 280, fontSize: 30, bold: true,  color: '#1a1a1a', fontFamily: 'Noto Sans KR, sans-serif' },
      position:   { x: 80,  y: 325, fontSize: 18, bold: false, color: '#444',    fontFamily: 'Noto Sans KR, sans-serif' },
      department: { x: 80,  y: 353, fontSize: 15, bold: false, color: '#666',    fontFamily: 'Noto Sans KR, sans-serif' },
      phone:      { x: 80,  y: 415, fontSize: 14, bold: false, color: '#333',    fontFamily: 'Arial, sans-serif', label: 'Tel' },
      mobile:     { x: 80,  y: 440, fontSize: 14, bold: false, color: '#333',    fontFamily: 'Arial, sans-serif', label: 'Mobile' },
      email:      { x: 80,  y: 465, fontSize: 14, bold: false, color: '#333',    fontFamily: 'Arial, sans-serif', label: 'E-mail' },
      extension:  { x: 80,  y: 490, fontSize: 14, bold: false, color: '#333',    fontFamily: 'Arial, sans-serif', label: 'Ext' },
      address:    { x: 80,  y: 540, fontSize: 11, bold: false, color: '#888',    fontFamily: 'Arial, sans-serif' },
    }
  },

  // --------------------------------------------------
  // Card Back Layout (1050 x 600 canvas)
  // --------------------------------------------------
  cardBackLayout: {
    width: 1050,
    height: 600,
    bgColor: '#003087',
    accentColor: '#c9a84c',
    logoArea: { x: 80, y: 60, w: 200, h: 80 },
    schoolNameEn: { x: 80, y: 80, fontSize: 18, color: '#ffffff', fontFamily: 'Arial, sans-serif' },
    schoolNameSub: { x: 80, y: 108, fontSize: 12, color: '#aabcdf', fontFamily: 'Arial, sans-serif' },
    dividerLine: { x: 80, y: 250, w: 890, color: '#c9a84c', thickness: 1.5 },
    fields: {
      nameEn:       { x: 80,  y: 280, fontSize: 28, bold: true,  color: '#ffffff', fontFamily: 'Arial, sans-serif' },
      positionEn:   { x: 80,  y: 322, fontSize: 17, bold: false, color: '#ccd6f6', fontFamily: 'Arial, sans-serif' },
      departmentEn: { x: 80,  y: 348, fontSize: 14, bold: false, color: '#aab8e0', fontFamily: 'Arial, sans-serif' },
      phone:        { x: 80,  y: 410, fontSize: 13, bold: false, color: '#ffffff', fontFamily: 'Arial, sans-serif', label: 'Tel' },
      mobile:       { x: 80,  y: 433, fontSize: 13, bold: false, color: '#ffffff', fontFamily: 'Arial, sans-serif', label: 'Mobile' },
      email:        { x: 80,  y: 456, fontSize: 13, bold: false, color: '#ffffff', fontFamily: 'Arial, sans-serif', label: 'E-mail' },
      addressEn:    { x: 80,  y: 500, fontSize: 11, bold: false, color: '#8899cc', fontFamily: 'Arial, sans-serif' },
    }
  },

  // --------------------------------------------------
  // Position Dictionary (Korean → English suggestions)
  // --------------------------------------------------
  POSITION_DICT: {
    '학장':     ['President', 'Dean', 'Chancellor'],
    '부학장':   ['Vice President', 'Vice Dean'],
    '처장':     ['Director', 'Head of Office', 'Chief Director'],
    '부장':     ['General Manager', 'Director', 'Department Head'],
    '차장':     ['Deputy General Manager', 'Deputy Director', 'Assistant Director'],
    '과장':     ['Manager', 'Section Chief', 'Department Manager'],
    '대리':     ['Assistant Manager', 'Deputy Manager'],
    '주임':     ['Senior Staff', 'Lead Staff', 'Chief Staff'],
    '사원':     ['Staff', 'Associate', 'Officer'],
    '교수':     ['Professor', 'Full Professor'],
    '조교수':   ['Assistant Professor'],
    '부교수':   ['Associate Professor'],
    '겸임교수': ['Adjunct Professor', 'Part-time Professor'],
    '강사':     ['Lecturer', 'Instructor'],
    '교육원장': ['Director of Education Center', 'Head of Training Center'],
    '학부장':   ['Department Chair', 'Dean of Faculty', 'Division Head'],
    '팀장':     ['Team Leader', 'Team Manager'],
    '실장':     ['Section Head', 'Division Manager'],
    '센터장':   ['Center Director', 'Center Head'],
    '교무처장': ['Academic Affairs Director', 'Registrar'],
    '학생처장': ['Dean of Students', 'Student Affairs Director'],
    '행정실장': ['Administrative Director', 'Administrative Manager'],
    '기획처장': ['Planning Director', 'Chief Planning Officer'],
    '총무팀장': ['General Affairs Team Leader'],
    '입학처장': ['Admissions Director'],
    '취업처장': ['Career Services Director'],
    '연구소장': ['Research Institute Director', 'Research Director'],
  },

  // --------------------------------------------------
  // Status name mapping (Korean)
  // --------------------------------------------------
  STATUS_NAMES: {
    pending:               '접수대기',
    approved:              '승인됨',
    revision:              '수정요청',
    rejected:              '반려',
    ordered:               '발주완료',
    printing:              '인쇄중',
    delivered_to_admin:    '관리자수령',
    delivered_to_applicant:'전달완료',
  },

  // --------------------------------------------------
  // Paper type labels
  // --------------------------------------------------
  PAPER_TYPE_NAMES: {
    premium:  '고급지 (양면)',
    standard: '일반지 (단면)',
  },

  // --------------------------------------------------
  // Delivery method labels
  // --------------------------------------------------
  DELIVERY_METHOD_NAMES: {
    pickup:   '방문수령',
    delivery: '우편배송',
  },
};

// Freeze config to prevent accidental mutation
Object.freeze(CONFIG);
