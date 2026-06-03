// 명함 캔버스 미리보기 렌더링

function renderCardFront(canvas, data) {
  const L = CONFIG.cardFrontLayout;
  const ctx = canvas.getContext('2d');
  canvas.width = L.width;
  canvas.height = L.height;

  // 배경
  ctx.fillStyle = L.bgColor;
  ctx.fillRect(0, 0, L.width, L.height);

  // 왼쪽 액센트 바
  ctx.fillStyle = L.accentColor;
  ctx.fillRect(L.accentBar.x, L.accentBar.y, L.accentBar.w, L.accentBar.h);

  // 학교명 국문
  ctx.fillStyle = L.schoolNameKr.color;
  ctx.font = `${L.schoolNameKr.bold ? 'bold ' : ''}${L.schoolNameKr.fontSize}px 'Noto Sans KR', sans-serif`;
  ctx.fillText(CONFIG.app.schoolName, L.schoolNameKr.x, L.schoolNameKr.y);

  // 학교명 영문
  ctx.fillStyle = L.schoolNameEn.color;
  ctx.font = `${L.schoolNameEn.fontSize}px 'Inter', sans-serif`;
  ctx.fillText(CONFIG.app.schoolNameEn, L.schoolNameEn.x, L.schoolNameEn.y);

  // 구분선
  ctx.strokeStyle = L.divider.color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(L.divider.x, L.divider.y);
  ctx.lineTo(L.divider.x + L.divider.w, L.divider.y);
  ctx.stroke();

  const fields = L.fields;

  // 이름
  drawField(ctx, fields.name, data.name, '[이름]');
  // 직급
  drawField(ctx, fields.position, data.position_kr, '[직급]');
  // 부서
  drawField(ctx, fields.department, data.department, '[부서]');
  // 전화
  if (data.phone || data.extension) drawLabelField(ctx, fields.phone, data.phone, '[전화번호]');
  // 휴대폰
  if (data.mobile) drawLabelField(ctx, fields.mobile, data.mobile, '[휴대폰]');
  // 팩스
  if (data.fax) drawLabelField(ctx, fields.fax, data.fax, '[팩스]');
  // 이메일
  drawLabelField(ctx, fields.email, data.email, '[이메일]');
  // 내선
  if (data.extension) drawLabelField(ctx, fields.extension, data.extension, null);
  // 주소
  const addr = data.address || CONFIG.app.defaultAddress;
  ctx.fillStyle = fields.address.color;
  ctx.font = `${fields.address.fontSize}px 'Noto Sans KR', sans-serif`;
  ctx.fillText(addr, fields.address.x, fields.address.y);
}

function renderCardBack(canvas, data) {
  const L = CONFIG.cardBackLayout;
  const ctx = canvas.getContext('2d');
  canvas.width = L.width;
  canvas.height = L.height;

  // 배경
  ctx.fillStyle = L.bgColor;
  ctx.fillRect(0, 0, L.width, L.height);

  // 금색 액센트 바
  ctx.fillStyle = L.accentBar.color;
  ctx.fillRect(L.accentBar.x, L.accentBar.y, L.accentBar.w, L.accentBar.h);

  // 학교명
  ctx.fillStyle = L.schoolNameKr.color;
  ctx.font = `${L.schoolNameKr.fontSize}px 'Noto Sans KR', sans-serif`;
  ctx.fillText(CONFIG.app.schoolName, L.schoolNameKr.x, L.schoolNameKr.y);

  ctx.fillStyle = L.schoolNameEn.color;
  ctx.font = `bold ${L.schoolNameEn.fontSize}px 'Inter', sans-serif`;
  ctx.fillText(CONFIG.app.schoolNameEn, L.schoolNameEn.x, L.schoolNameEn.y);

  // 구분선
  ctx.strokeStyle = L.divider.color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(L.divider.x, L.divider.y);
  ctx.lineTo(L.divider.x + L.divider.w, L.divider.y);
  ctx.stroke();

  const fields = L.fields;
  drawField(ctx, fields.nameEn, data.applicant_name_en, '[English Name]');
  drawField(ctx, fields.positionEn, data.position_en, '[Title]');
  drawField(ctx, fields.departmentEn, data.department_en, '[Department]');
  if (data.phone) drawLabelField(ctx, fields.phone, data.phone, '[Phone]');
  if (data.mobile) drawLabelField(ctx, fields.mobile, data.mobile, '[Mobile]');
  drawLabelField(ctx, fields.email, data.email, '[Email]');
  const addrEn = data.address_en || CONFIG.app.defaultAddressEn;
  ctx.fillStyle = fields.addressEn.color;
  ctx.font = `${fields.addressEn.fontSize}px 'Inter', sans-serif`;
  ctx.fillText(addrEn, fields.addressEn.x, fields.addressEn.y);
}

function drawField(ctx, field, value, placeholder) {
  const text = value && value.trim() ? value : placeholder;
  const isEmpty = !value || !value.trim();
  ctx.fillStyle = isEmpty ? '#bbbbbb' : field.color;
  ctx.font = `${field.bold ? 'bold ' : ''}${field.fontSize}px 'Noto Sans KR', 'Inter', sans-serif`;
  if (isEmpty) {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#cccccc';
    const metrics = ctx.measureText(placeholder);
    ctx.strokeRect(field.x - 4, field.y - field.fontSize, metrics.width + 8, field.fontSize + 8);
    ctx.restore();
  }
  ctx.fillText(text, field.x, field.y);
}

function drawLabelField(ctx, field, value, placeholder) {
  const label = field.label || '';
  const text = value && value.trim() ? value : (placeholder || '');
  const isEmpty = !value || !value.trim();
  if (label) {
    ctx.fillStyle = '#888888';
    ctx.font = `${field.fontSize - 1}px 'Inter', sans-serif`;
    ctx.fillText(label, field.x, field.y);
    const labelW = ctx.measureText(label + ' ').width;
    ctx.fillStyle = isEmpty ? '#bbbbbb' : field.color;
    ctx.font = `${field.fontSize}px 'Noto Sans KR', 'Inter', sans-serif`;
    ctx.fillText(text, field.x + labelW, field.y);
  } else {
    drawField(ctx, field, value, placeholder);
  }
}

function downloadCardImage(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename || 'business-card.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
