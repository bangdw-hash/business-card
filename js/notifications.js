// Telegram Bot API 알림 및 EmailJS 이메일 발송

async function sendTelegramNotification(message) {
  if (CONFIG.telegram.botToken === 'YOUR_TELEGRAM_BOT_TOKEN') {
    console.warn('[Telegram] botToken이 설정되지 않았습니다.');
    return;
  }
  try {
    const url = `https://api.telegram.org/bot${CONFIG.telegram.botToken}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONFIG.telegram.adminChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch (e) {
    console.error('[Telegram] 발송 실패:', e);
  }
}

async function sendEmailNotification(to, subject, body) {
  if (CONFIG.emailjs.serviceId === 'YOUR_EMAILJS_SERVICE_ID') {
    console.warn('[EmailJS] serviceId가 설정되지 않았습니다.');
    return;
  }
  try {
    await emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateId, {
      to_email: to,
      subject: subject,
      message: body,
    }, CONFIG.emailjs.publicKey);
  } catch (e) {
    console.error('[EmailJS] 발송 실패:', e);
  }
}

function getNewRequestMessage(req) {
  const urgent = req.is_urgent ? '\n⚡ <b>긴급 신청</b>' : '';
  return `[명함 신청 접수]${urgent}
신청자: ${req.applicant_name} (${req.department} / ${req.position_kr})
용지: ${req.paper_type === 'premium' ? '고급(임원)' : '일반'} / 수량: ${req.quantity}매
영문뒷면: ${req.is_bilingual ? '있음' : '없음'}
신청일: ${new Date(req.created_at).toLocaleDateString('ko-KR')}
→ <a href="${CONFIG.app.baseUrl}/admin.html">관리자 페이지 바로가기</a>`;
}

function getStatusUpdateMessage(req, newStatus, note) {
  const labels = CONFIG.statusLabels;
  return `[명함 상태 변경]
신청자: ${req.applicant_name} (${req.department})
변경: ${labels[req.status] || req.status} → ${labels[newStatus] || newStatus}${
    note ? `\n메모: ${note}` : ''
  }
→ <a href="${CONFIG.app.baseUrl}/my-requests.html">내 신청 이력 조회</a>`;
}
