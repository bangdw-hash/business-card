// =====================================================
// Notification Utilities (Telegram + EmailJS)
// js/notifications.js
// =====================================================

'use strict';

/**
 * Send a Telegram notification message.
 * @param {string} message - Markdown-formatted message
 * @returns {Promise<boolean>}
 */
async function sendTelegramNotification(message) {
  if (!CONFIG.telegram.enabled) {
    console.info('[Telegram] 비활성화됨. CONFIG.telegram.enabled = true 로 설정하세요.');
    return false;
  }

  const token = CONFIG.telegram.botToken;
  const chatId = CONFIG.telegram.adminChatId;

  if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
    console.warn('[Telegram] botToken이 설정되지 않았습니다.');
    return false;
  }

  if (!chatId || chatId === 'YOUR_TELEGRAM_ADMIN_CHAT_ID') {
    console.warn('[Telegram] adminChatId가 설정되지 않았습니다.');
    return false;
  }

  try {
    const resp = await fetch(
      'https://api.telegram.org/bot' + token + '/sendMessage',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      }
    );

    if (!resp.ok) {
      const err = await resp.json();
      console.error('[Telegram] API 오류:', err);
      return false;
    }

    console.info('[Telegram] 메시지 전송 성공');
    return true;
  } catch (e) {
    console.error('[Telegram] 전송 실패:', e.message);
    return false;
  }
}

/**
 * Send an email notification via EmailJS.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} body - Email body (plain text)
 * @returns {Promise<boolean>}
 */
async function sendEmailNotification(to, subject, body) {
  if (!CONFIG.emailjs.enabled) {
    console.info('[EmailJS] 비활성화됨. CONFIG.emailjs.enabled = true 로 설정하세요.');
    return false;
  }

  if (typeof emailjs === 'undefined') {
    console.warn('[EmailJS] EmailJS SDK가 로드되지 않았습니다.');
    return false;
  }

  try {
    await emailjs.send(
      CONFIG.emailjs.serviceId,
      CONFIG.emailjs.templateId,
      {
        to_email: to,
        subject: subject,
        message: body,
      },
      CONFIG.emailjs.userId
    );
    console.info('[EmailJS] 이메일 전송 성공: ' + to);
    return true;
  } catch (e) {
    console.error('[EmailJS] 전송 실패:', e);
    return false;
  }
}

/**
 * Format a new request notification message.
 * @param {Object} request
 * @returns {string}
 */
function getNewRequestMessage(request) {
  const now = new Date();
  const dateStr = now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  return [
    '<b>💼 새 명함 신청</b>',
    '',
    '통보 일시: ' + dateStr,
    '신청자: <b>' + escapeHtml(request.applicant_name) + '</b>',
    '부서: ' + escapeHtml(request.department || '-'),
    '직급: ' + escapeHtml(request.position_kr || '-'),
    '이메일: ' + escapeHtml(request.email || '-'),
    '용지: ' + (CONFIG.PAPER_TYPE_NAMES[request.paper_type] || request.paper_type || '-'),
    '수량: ' + (request.quantity || '-') + '장',
    '긴급: ' + (request.is_urgent ? '⚠️ 긴급' : '일반'),
    '',
    '관리자 페이지: ' + CONFIG.app.baseUrl + '/admin.html',
  ].join('\n');
}

/**
 * Format a status update notification message.
 * @param {Object} request
 * @param {string} newStatus
 * @param {string} note
 * @returns {string}
 */
function getStatusUpdateMessage(request, newStatus, note) {
  const now = new Date();
  const dateStr = now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const statusName = CONFIG.STATUS_NAMES[newStatus] || newStatus;

  const lines = [
    '<b>🔄 명함 신청 상태 변경</b>',
    '',
    '변경 일시: ' + dateStr,
    '신청자: <b>' + escapeHtml(request.applicant_name) + '</b>',
    '부서: ' + escapeHtml(request.department || '-'),
    '상태: <b>' + statusName + '</b>',
  ];

  if (note) {
    lines.push('메모: ' + escapeHtml(note));
  }

  if (newStatus === 'approved' && request.deadline_date) {
    lines.push('납기일: ' + request.deadline_date);
  }

  lines.push('');
  lines.push('내 신청 조회: ' + CONFIG.app.baseUrl + '/my-requests.html');

  return lines.join('\n');
}

/**
 * Helper: escape HTML special characters
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
