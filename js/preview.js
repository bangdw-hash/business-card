// 명함 캔버스 미리보기 렌더링
// KoPubWorld 돋움 서체 우선 적용 (Canvas FontFace API)
// data 키는 snake_case / camelCase 모두 허용

(function() {
  if (typeof FontFace === 'undefined') return;
  var base = 'assets/fonts/';
  [
    ['KoPubWorld_Dotum_Light.ttf',  '300'],
    ['KoPubWorld_Dotum_Medium.ttf', '500'],
    ['KoPubWorld_Dotum_Bold.ttf',   '700'],
  ].forEach(function(w) {
    new FontFace('KoPubWorldDotum', 'url(' + base + w[0] + ')', { weight: w[1] })
      .load().then(function(f) { document.fonts.add(f); })
      .catch(function() {});
  });
})();

function _krFont(size, bold) {
  return (bold ? 'bold ' : '') + size + "px KoPubWorldDotum, 'Noto Sans KR', sans-serif";
}
function _enFont(size, bold) {
  return (bold ? 'bold ' : '') + size + "px 'Inter', sans-serif";
}

function _norm(data) {
  // card-form.js 는 positionKr, admin/vendor 는 position_kr 사용 — 둘 다 처리
  return {
    name:         data.name        || data.applicant_name    || '',
    nameEn:       data.nameEn      || data.applicant_name_en || '',
    department:   data.department  || '',
    departmentEn: data.departmentEn|| data.department_en     || '',
    positionKr:   data.positionKr  || data.position_kr       || '',
    positionEn:   data.positionEn  || data.position_en       || '',
    phone:        data.phone       || '',
    mobile:       data.mobile      || '',
    fax:          data.fax         || '',
    email:        data.email       || '',
    extension:    data.extension   || '',
    address:      data.address     || CONFIG.app.defaultAddress,
    addressEn:    data.addressEn   || data.address_en || CONFIG.app.defaultAddressEn,
  };
}

function renderCardFront(canvas, rawData) {
  if (!canvas) return;
  const d = _norm(rawData || {});
  const L = CONFIG.cardFrontLayout;
  const ctx = canvas.getContext('2d');
  canvas.width  = L.width;
  canvas.height = L.height;

  // 배경
  ctx.fillStyle = L.bgColor;
  ctx.fillRect(0, 0, L.width, L.height);

  // 왼쪽 액센트 바
  ctx.fillStyle = L.accentColor;
  ctx.fillRect(L.accentBar.x, L.accentBar.y, L.accentBar.w, L.accentBar.h);

  // 학교명 국문
  ctx.fillStyle = L.schoolNameKr.color;
  ctx.font = _krFont(L.schoolNameKr.fontSize, L.schoolNameKr.bold);
  ctx.fillText(CONFIG.app.schoolName, L.schoolNameKr.x, L.schoolNameKr.y);

  // 학교명 영문
  ctx.fillStyle = L.schoolNameEn.color;
  ctx.font = _enFont(L.schoolNameEn.fontSize, false);
  ctx.fillText(CONFIG.app.schoolNameEn, L.schoolNameEn.x, L.schoolNameEn.y);

  // 구분선
  ctx.strokeStyle = L.divider.color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(L.divider.x, L.divider.y);
  ctx.lineTo(L.divider.x + L.divider.w, L.divider.y);
  ctx.stroke();

  const F = L.fields;
  _drawField(ctx, F.name,       d.name,       '[이름]');
  _drawField(ctx, F.position,   d.positionKr, '[직급]');
  _drawField(ctx, F.department, d.department, '[부서]');
  if (d.phone)     _drawLabelField(ctx, F.phone,     d.phone,     null);
  if (d.mobile)    _drawLabelField(ctx, F.mobile,    d.mobile,    null);
  if (d.fax)       _drawLabelField(ctx, F.fax,       d.fax,       null);
  _drawLabelField(ctx, F.email,     d.email,     '[이메일]');
  if (d.extension) _drawLabelField(ctx, F.extension, d.extension, null);

  // 주소
  ctx.fillStyle = F.address.color;
  ctx.font = _krFont(F.address.fontSize, false);
  ctx.fillText(d.address, F.address.x, F.address.y);
}

function renderCardBack(canvas, rawData) {
  if (!canvas) return;
  const d = _norm(rawData || {});
  const L = CONFIG.cardBackLayout;
  const ctx = canvas.getContext('2d');
  canvas.width  = L.width;
  canvas.height = L.height;

  // 배경
  ctx.fillStyle = L.bgColor;
  ctx.fillRect(0, 0, L.width, L.height);

  // 금색 액센트 바
  ctx.fillStyle = L.accentBar.color;
  ctx.fillRect(L.accentBar.x, L.accentBar.y, L.accentBar.w, L.accentBar.h);

  // 학교명
  ctx.fillStyle = L.schoolNameKr.color;
  ctx.font = _krFont(L.schoolNameKr.fontSize, false);
  ctx.fillText(CONFIG.app.schoolName, L.schoolNameKr.x, L.schoolNameKr.y);

  ctx.fillStyle = L.schoolNameEn.color;
  ctx.font = _enFont(L.schoolNameEn.fontSize, true);
  ctx.fillText(CONFIG.app.schoolNameEn, L.schoolNameEn.x, L.schoolNameEn.y);

  // 구분선
  ctx.strokeStyle = L.divider.color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(L.divider.x, L.divider.y);
  ctx.lineTo(L.divider.x + L.divider.w, L.divider.y);
  ctx.stroke();

  const F = L.fields;
  _drawField(ctx, F.nameEn,       d.nameEn,       '[English Name]');
  _drawField(ctx, F.positionEn,   d.positionEn,   '[Title]');
  _drawField(ctx, F.departmentEn, d.departmentEn, '[Department]');
  if (d.phone)  _drawLabelField(ctx, F.phone,  d.phone,  null);
  if (d.mobile) _drawLabelField(ctx, F.mobile, d.mobile, null);
  _drawLabelField(ctx, F.email, d.email, '[Email]');

  ctx.fillStyle = F.addressEn.color;
  ctx.font = _enFont(F.addressEn.fontSize, false);
  ctx.fillText(d.addressEn, F.addressEn.x, F.addressEn.y);
}

// 초기 placeholder 렌더링 (빈 상태)
function renderPlaceholderFront(canvas) {
  renderCardFront(canvas, {});
}

function renderPlaceholderBack(canvas) {
  renderCardBack(canvas, {});
}

function downloadCardImage(canvas, filename) {
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = filename || 'business-card.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ---- 내부 헬퍼 ----
function _drawField(ctx, field, value, placeholder) {
  const text    = value && value.trim() ? value : placeholder;
  const isEmpty = !value || !value.trim();
  ctx.fillStyle = isEmpty ? '#cccccc' : field.color;
  ctx.font = _krFont(field.fontSize, field.bold);
  if (isEmpty && placeholder) {
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#cccccc';
    const mw = ctx.measureText(placeholder).width;
    ctx.strokeRect(field.x - 2, field.y - field.fontSize + 2, mw + 4, field.fontSize + 4);
    ctx.restore();
  }
  if (text) ctx.fillText(text, field.x, field.y);
}

function _drawLabelField(ctx, field, value, placeholder) {
  const label   = field.label || '';
  const text    = value && value.trim() ? value : (placeholder || '');
  const isEmpty = !value || !value.trim();
  if (label) {
    ctx.fillStyle = '#888888';
    ctx.font = _enFont(field.fontSize - 1, false);
    ctx.fillText(label, field.x, field.y);
    const lw = ctx.measureText(label + ' ').width;
    ctx.fillStyle = isEmpty ? '#cccccc' : field.color;
    ctx.font = _krFont(field.fontSize, false);
    if (text) ctx.fillText(text, field.x + lw, field.y);
  } else {
    _drawField(ctx, field, value, placeholder);
  }
}
