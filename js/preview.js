// =====================================================
// Card Preview Rendering (HTML Canvas)
// js/preview.js
// =====================================================

'use strict';

/**
 * Render the front face of the business card onto a canvas element.
 * @param {HTMLCanvasElement} canvas
 * @param {Object} data - Card data fields
 */
function renderCardFront(canvas, data) {
  if (!canvas) return;
  const layout = CONFIG.cardFrontLayout;
  canvas.width  = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = layout.bgColor;
  ctx.fillRect(0, 0, layout.width, layout.height);

  // Left accent stripe
  ctx.fillStyle = layout.accentColor;
  ctx.fillRect(0, 0, layout.accentStripeWidth, layout.height);

  // Right accent stripe (thin)
  ctx.fillStyle = layout.accentColor;
  ctx.fillRect(layout.width - 4, 0, 4, layout.height);

  // Top accent bar
  ctx.fillStyle = layout.accentColor;
  ctx.fillRect(0, 0, layout.width, 4);

  // Bottom accent bar
  ctx.fillStyle = layout.accentColor;
  ctx.fillRect(0, layout.height - 4, layout.width, 4);

  // School name (Korean)
  const sn = layout.schoolName;
  ctx.font = (sn.bold ? 'bold ' : '') + sn.fontSize + 'px "Noto Sans KR", "Malgun Gothic", sans-serif';
  ctx.fillStyle = sn.color;
  ctx.fillText(CONFIG.school.nameKr, sn.x + layout.accentStripeWidth + 10, sn.y);

  // School name (English)
  const sne = layout.schoolNameEn;
  ctx.font = sne.fontSize + 'px Arial, sans-serif';
  ctx.fillStyle = sne.color;
  ctx.fillText(CONFIG.school.nameEn, sne.x + layout.accentStripeWidth + 10, sne.y);

  // Divider line
  const dl = layout.dividerLine;
  ctx.beginPath();
  ctx.strokeStyle = dl.color;
  ctx.lineWidth = dl.thickness;
  ctx.moveTo(dl.x, dl.y);
  ctx.lineTo(dl.x + dl.w, dl.y);
  ctx.stroke();

  // Helper: draw a text field
  function drawField(fieldCfg, text, label) {
    const isEmpty = !text || text.trim() === '';
    const displayText = isEmpty ? '' : text;

    ctx.font = (fieldCfg.bold ? 'bold ' : '') + fieldCfg.fontSize + 'px ' + fieldCfg.fontFamily;

    if (isEmpty) {
      ctx.fillStyle = '#cccccc';
      ctx.font = 'italic ' + (fieldCfg.fontSize - 2) + 'px Arial, sans-serif';
      // skip placeholder for cleanliness
      return;
    }

    ctx.fillStyle = fieldCfg.color;

    if (label) {
      // Draw label in smaller text
      ctx.font = '600 ' + (fieldCfg.fontSize - 2) + 'px Arial, sans-serif';
      ctx.fillStyle = '#888888';
      ctx.fillText(label + '  ', fieldCfg.x, fieldCfg.y);
      const labelWidth = ctx.measureText(label + '  ').width;

      ctx.font = (fieldCfg.bold ? 'bold ' : '') + fieldCfg.fontSize + 'px ' + fieldCfg.fontFamily;
      ctx.fillStyle = fieldCfg.color;
      ctx.fillText(displayText, fieldCfg.x + labelWidth, fieldCfg.y);
    } else {
      ctx.font = (fieldCfg.bold ? 'bold ' : '') + fieldCfg.fontSize + 'px ' + fieldCfg.fontFamily;
      ctx.fillStyle = fieldCfg.color;
      ctx.fillText(displayText, fieldCfg.x, fieldCfg.y);
    }
  }

  const f = layout.fields;
  const ox = layout.accentStripeWidth + 10; // offset for stripe

  // Name
  if (data.name) {
    ctx.font = 'bold ' + f.name.fontSize + 'px "Noto Sans KR", "Malgun Gothic", sans-serif';
    ctx.fillStyle = f.name.color;
    ctx.fillText(data.name, f.name.x + ox, f.name.y);
  }

  // Position
  if (data.positionKr) {
    ctx.font = f.position.fontSize + 'px "Noto Sans KR", "Malgun Gothic", sans-serif';
    ctx.fillStyle = f.position.color;
    ctx.fillText(data.positionKr, f.position.x + ox, f.position.y);
  }

  // Department
  if (data.department) {
    ctx.font = f.department.fontSize + 'px "Noto Sans KR", "Malgun Gothic", sans-serif';
    ctx.fillStyle = f.department.color;
    ctx.fillText(data.department, f.department.x + ox, f.department.y);
  }

  // Phone / Mobile / Email / Extension (with labels)
  function drawLabelField(fieldKey, value) {
    const fc = f[fieldKey];
    if (!fc || !value) return;
    const label = fc.label || '';
    ctx.font = '600 ' + (fc.fontSize - 2) + 'px Arial, sans-serif';
    ctx.fillStyle = '#888888';
    const labelW = ctx.measureText(label + '  ').width;
    ctx.fillText(label, fc.x + ox, fc.y);

    ctx.font = fc.fontSize + 'px Arial, sans-serif';
    ctx.fillStyle = fc.color;
    ctx.fillText(value, fc.x + ox + labelW, fc.y);
  }

  drawLabelField('phone',     data.phone);
  drawLabelField('mobile',    data.mobile);
  drawLabelField('email',     data.email);
  drawLabelField('extension', data.extension);

  // Address
  if (data.address) {
    ctx.font = f.address.fontSize + 'px Arial, sans-serif';
    ctx.fillStyle = f.address.color;
    ctx.fillText(data.address, f.address.x + ox, f.address.y);
  }

  // Watermark if no key info
  if (!data.name && !data.department && !data.positionKr) {
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillStyle = 'rgba(0,48,135,0.08)';
    ctx.save();
    ctx.translate(layout.width / 2, layout.height / 2);
    ctx.rotate(-Math.PI / 8);
    ctx.fillText('명함 미리보기', -80, 0);
    ctx.restore();
  }
}

/**
 * Render the back face of the business card onto a canvas element.
 * @param {HTMLCanvasElement} canvas
 * @param {Object} data - Card data fields
 */
function renderCardBack(canvas, data) {
  if (!canvas) return;
  const layout = CONFIG.cardBackLayout;
  canvas.width  = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext('2d');

  // Background (dark blue)
  ctx.fillStyle = layout.bgColor;
  ctx.fillRect(0, 0, layout.width, layout.height);

  // Decorative gold stripe on left
  ctx.fillStyle = layout.accentColor;
  ctx.fillRect(0, 0, 8, layout.height);

  // Corner accent — top-right gold triangle
  ctx.beginPath();
  ctx.fillStyle = layout.accentColor;
  ctx.moveTo(layout.width - 80, 0);
  ctx.lineTo(layout.width, 0);
  ctx.lineTo(layout.width, 80);
  ctx.closePath();
  ctx.fill();

  // School name (English)
  const sne = layout.schoolNameEn;
  ctx.font = sne.fontSize + 'px Arial, sans-serif';
  ctx.fillStyle = sne.color;
  ctx.fillText(CONFIG.school.nameEn, sne.x + 18, sne.y);

  // Subtitle
  const sns = layout.schoolNameSub;
  ctx.font = sns.fontSize + 'px Arial, sans-serif';
  ctx.fillStyle = sns.color;
  ctx.fillText(CONFIG.school.website || 'www.asea.ac.kr', sns.x + 18, sns.y);

  // Divider line (gold)
  const dl = layout.dividerLine;
  ctx.beginPath();
  ctx.strokeStyle = dl.color;
  ctx.lineWidth = dl.thickness;
  ctx.moveTo(dl.x + 18, dl.y);
  ctx.lineTo(dl.x + 18 + dl.w, dl.y);
  ctx.stroke();

  const f = layout.fields;
  const ox = 18;

  // Name (English)
  if (data.nameEn) {
    ctx.font = 'bold ' + f.nameEn.fontSize + 'px Arial, sans-serif';
    ctx.fillStyle = f.nameEn.color;
    ctx.fillText(data.nameEn, f.nameEn.x + ox, f.nameEn.y);
  }

  // Position (English)
  if (data.positionEn) {
    ctx.font = f.positionEn.fontSize + 'px Arial, sans-serif';
    ctx.fillStyle = f.positionEn.color;
    ctx.fillText(data.positionEn, f.positionEn.x + ox, f.positionEn.y);
  }

  // Department (English)
  if (data.departmentEn) {
    ctx.font = f.departmentEn.fontSize + 'px Arial, sans-serif';
    ctx.fillStyle = f.departmentEn.color;
    ctx.fillText(data.departmentEn, f.departmentEn.x + ox, f.departmentEn.y);
  }

  // Contact fields with labels
  function drawLabelFieldBack(fieldKey, value) {
    const fc = f[fieldKey];
    if (!fc || !value) return;
    const label = fc.label || '';
    ctx.font = '600 ' + (fc.fontSize - 2) + 'px Arial, sans-serif';
    ctx.fillStyle = 'rgba(200,214,240,0.7)';
    const labelW = ctx.measureText(label + '  ').width;
    ctx.fillText(label, fc.x + ox, fc.y);

    ctx.font = fc.fontSize + 'px Arial, sans-serif';
    ctx.fillStyle = fc.color;
    ctx.fillText(value, fc.x + ox + labelW, fc.y);
  }

  drawLabelFieldBack('phone',  data.phone);
  drawLabelFieldBack('mobile', data.mobile);
  drawLabelFieldBack('email',  data.email);

  // Address (English)
  if (data.addressEn) {
    ctx.font = f.addressEn.fontSize + 'px Arial, sans-serif';
    ctx.fillStyle = f.addressEn.color;
    ctx.fillText(data.addressEn, f.addressEn.x + ox, f.addressEn.y);
  }

  // Watermark if no key info
  if (!data.nameEn && !data.departmentEn && !data.positionEn) {
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.save();
    ctx.translate(layout.width / 2, layout.height / 2);
    ctx.rotate(-Math.PI / 8);
    ctx.fillText('CARD BACK PREVIEW', -100, 0);
    ctx.restore();
  }
}

/**
 * Download a canvas as a PNG file.
 * @param {HTMLCanvasElement} canvas
 * @param {string} filename
 */
function downloadCardImage(canvas, filename) {
  if (!canvas) return;
  try {
    const link = document.createElement('a');
    link.download = filename || 'business-card.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error('[Preview] 다운로드 오류:', e);
    alert('이미지 다운로드에 실패했습니다.');
  }
}

/**
 * Render a simple placeholder card (no data)
 */
function renderPlaceholderFront(canvas) {
  renderCardFront(canvas, {});
}

function renderPlaceholderBack(canvas) {
  renderCardBack(canvas, {});
}
