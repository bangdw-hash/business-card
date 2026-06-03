// =====================================================
// Business Card Application Form Logic
// js/card-form.js
// =====================================================

'use strict';

// ---- Admin-configured defaults (from localStorage) ----
var _adminSettings = (function() {
  try { return JSON.parse(localStorage.getItem('asea_admin_settings') || '{}'); } catch(e) { return {}; }
})();

function _getDefaultFax()       { return _adminSettings.defaultFax      || CONFIG.app.defaultFax      || '02-714-1260'; }
function _getDefaultAddress()   { return (_getAddressPresets())[0]      || CONFIG.app.defaultAddress  || '서울특별시 영등포구 당산로32길 16'; }
function _getAddressPresets()   {
  var list = _adminSettings.addressPresets || CONFIG.app.addressPresets || [];
  if (!list.length) list = ['서울특별시 영등포구 당산로32길 16'];
  return list;
}

// ---- State ----
var currentStep = 1;
var totalSteps  = 5;
var formData    = {
  paper_type:        'standard',
  applicant_name:    '',
  applicant_name_en: '',
  department:        '',
  department_en:     '',
  position_kr:       '',
  position_en:       '',
  phone:             '',
  mobile:            '',
  fax:               '',
  email:             '',
  extension:         '',
  address:           '',
  address_en:        CONFIG.app.defaultAddressEn || '',
  quantity:          100,
  is_urgent:         false,
  is_reorder:        false,
  delivery_method:   'pickup',
  is_bilingual:      false,
  include_qr:        true,
};

// ---- DOM Ready ----
document.addEventListener('DOMContentLoaded', function () {
  initFormPage();
});

function initFormPage() {
  _populateAddressPresets();

  // Paper type selection
  var paperCards = document.querySelectorAll('.paper-type-card');
  paperCards.forEach(function (card) {
    card.addEventListener('click', function () {
      paperCards.forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      formData.paper_type = card.dataset.value;
    });
  });

  // QR option
  var qrCards = document.querySelectorAll('.qr-option-card');
  qrCards.forEach(function (card) {
    card.addEventListener('click', function () {
      qrCards.forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      formData.include_qr = card.dataset.value === 'yes';
      var radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      updateFrontPreview();
    });
  });

  // Address preset dropdown
  var addrPreset = document.getElementById('address-preset');
  if (addrPreset) {
    addrPreset.addEventListener('change', function () {
      var addrInput = document.getElementById('input-address');
      if (addrPreset.value === '__custom__') {
        if (addrInput) { addrInput.value = ''; addrInput.focus(); }
      } else {
        if (addrInput) addrInput.value = addrPreset.value;
        formData.address = addrPreset.value;
      }
    });
  }

  // Email local input
  var emailLocal = document.getElementById('input-email-local');
  if (emailLocal) {
    emailLocal.addEventListener('input', function () {
      formData.email = emailLocal.value.trim() + CONFIG.app.emailDomain;
    });
  }

  // Step navigation
  bindBtn('btn-next-1', function () { goToStep(2); });
  bindBtn('btn-next-2', function () { if (validateStep2()) goToStep(3); });
  bindBtn('btn-next-3', function () { if (validateStep3()) goToStep(4); });
  bindBtn('btn-next-4', function () { goToStep(5); });
  bindBtn('btn-prev-2', function () { goToStep(1); });
  bindBtn('btn-prev-3', function () { goToStep(2); });
  bindBtn('btn-prev-4', function () { goToStep(3); });
  bindBtn('btn-prev-5', function () { goToStep(4); });
  bindBtn('btn-submit', submitRequest);

  // Translate (position only)
  bindBtn('btn-translate', handleTranslate);

  // Translate all (for bilingual)
  bindBtn('btn-translate-all', handleTranslateAll);

  // Live preview updates (step 3)
  bindLivePreview();

  // Bilingual radio cards
  var bilingualCards = document.querySelectorAll('.bilingual-card');
  bilingualCards.forEach(function (card) {
    card.addEventListener('click', function () {
      bilingualCards.forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      var radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      formData.is_bilingual = card.dataset.value === 'yes';
      toggleBackSection(formData.is_bilingual);
      if (formData.is_bilingual) {
        collectStep2Data();
        autoPopulateEnglishFields();
        updateBackPreview();
      }
    });
  });

  // Quantity select
  var qtySelect = document.getElementById('quantity-select');
  var qtyCustomWrapper = document.getElementById('quantity-custom-wrapper');
  var qtyCustom = document.getElementById('quantity-custom');
  if (qtySelect) {
    qtySelect.addEventListener('change', function () {
      if (qtySelect.value === 'other') {
        if (qtyCustomWrapper) qtyCustomWrapper.classList.remove('hidden');
        if (qtyCustom) qtyCustom.focus();
      } else {
        if (qtyCustomWrapper) qtyCustomWrapper.classList.add('hidden');
        formData.quantity = parseInt(qtySelect.value, 10) || 100;
      }
    });
  }
  if (qtyCustom) {
    qtyCustom.addEventListener('input', function () {
      formData.quantity = parseInt(qtyCustom.value, 10) || 100;
    });
  }

  // Urgent toggle
  var urgentToggle = document.getElementById('toggle-urgent');
  if (urgentToggle) {
    urgentToggle.addEventListener('change', function () {
      formData.is_urgent = urgentToggle.checked;
    });
  }

  // Reorder checkbox
  var reorderCheck = document.getElementById('check-reorder');
  var reorderLookup = document.getElementById('reorder-lookup');
  if (reorderCheck) {
    reorderCheck.addEventListener('change', function () {
      formData.is_reorder = reorderCheck.checked;
      if (reorderLookup) reorderLookup.classList.toggle('hidden', !reorderCheck.checked);
    });
  }

  bindBtn('btn-reorder-lookup', handleReorderLookup);

  var deliveryRadios = document.querySelectorAll('input[name="delivery_method"]');
  deliveryRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (radio.checked) formData.delivery_method = radio.value;
    });
  });

  // Back preview inputs
  bindBackPreviewInputs();

  // Success modal
  bindBtn('btn-success-close', function () {
    var modal = document.getElementById('success-modal');
    if (modal) modal.classList.add('hidden');
    window.location.href = 'my-requests.html';
  });

  // Download buttons
  bindBtn('btn-download-front', function () {
    downloadCardImage(document.getElementById('card-front-canvas'),
      '명함_앞면_' + (formData.applicant_name || '프리뷰') + '.png');
  });
  bindBtn('btn-download-back', function () {
    downloadCardImage(document.getElementById('card-back-canvas'),
      '명함_뒷면_' + (formData.applicant_name || '프리뷰') + '.png');
  });

  // Initialize
  goToStep(1);
  renderPlaceholderFront(document.getElementById('card-front-canvas'));
}

// ---- Address preset population ----
function _populateAddressPresets() {
  var select = document.getElementById('address-preset');
  if (!select) return;
  select.innerHTML = '';
  var presets = _getAddressPresets();
  presets.forEach(function (addr) {
    var opt = document.createElement('option');
    opt.value = addr;
    opt.textContent = addr;
    select.appendChild(opt);
  });
  var customOpt = document.createElement('option');
  customOpt.value = '__custom__';
  customOpt.textContent = '직접 입력...';
  select.appendChild(customOpt);

  // Set default address input
  var addrInput = document.getElementById('input-address');
  if (addrInput) addrInput.value = presets[0] || '';
  formData.address = presets[0] || '';
}

// ---- Step Navigation ----
function goToStep(step) {
  currentStep = step;

  for (var i = 1; i <= totalSteps; i++) {
    var content = document.getElementById('step-' + i);
    if (content) content.classList.toggle('active', i === step);
  }
  for (var j = 1; j <= totalSteps; j++) {
    var nav = document.getElementById('step-nav-' + j);
    if (nav) nav.classList.toggle('hidden', j !== step);
  }

  var stepItems = document.querySelectorAll('.step-item');
  stepItems.forEach(function (item, idx) {
    var stepNum = idx + 1;
    item.classList.remove('active', 'completed', 'done');
    if (stepNum < step) item.classList.add('completed');
    else if (stepNum === step) item.classList.add('active');
  });

  if (step === 3) {
    collectStep2Data();
    updateFrontPreview();
  } else if (step === 4) {
    collectStep3Data();
    autoPopulateEnglishFields();
    updateBackPreview();
  } else if (step === 5) {
    collectStep4Data();
    populateSummary();
    renderFinalPreviews();
  }

  var formEl = document.getElementById('card-form-wrapper');
  if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- Validation ----
function validateStep2() {
  var errors = [];
  var name       = getVal('input-name');
  var dept       = getVal('input-department');
  var pos        = getVal('input-position-kr');
  var emailLocal = getVal('input-email-local');

  if (!name)       errors.push({ id: 'input-name',          msg: '이름을 입력해주세요.' });
  if (!dept)       errors.push({ id: 'input-department',    msg: '부서를 입력해주세요.' });
  if (!pos)        errors.push({ id: 'input-position-kr',   msg: '직급을 입력해주세요.' });
  if (!emailLocal) errors.push({ id: 'input-email-local',   msg: '이메일 아이디를 입력해주세요.' });

  document.querySelectorAll('.form-error').forEach(function (el) { el.remove(); });
  document.querySelectorAll('.form-input.error').forEach(function (el) { el.classList.remove('error'); });

  if (errors.length > 0) {
    errors.forEach(function (err) {
      var input = document.getElementById(err.id);
      if (input) {
        input.classList.add('error');
        var errEl = document.createElement('div');
        errEl.className = 'form-error';
        errEl.textContent = err.msg;
        input.parentNode.insertBefore(errEl, input.nextSibling);
      }
    });
    var firstInput = document.getElementById(errors[0].id);
    if (firstInput) firstInput.focus();
    return false;
  }
  return true;
}

function validateStep3() {
  var qty = formData.quantity;
  if (!qty || qty < 1 || qty > 10000) {
    alert('수량은 1~10,000장 사이로 입력해주세요.');
    return false;
  }
  return true;
}

// ---- Data collection ----
function collectStep2Data() {
  formData.applicant_name    = getVal('input-name');
  formData.applicant_name_en = getVal('input-name-en');
  formData.department        = getVal('input-department');
  formData.department_en     = getVal('input-department-en');
  formData.position_kr       = getVal('input-position-kr');
  formData.position_en       = getVal('input-position-en');
  formData.phone             = getVal('input-phone');
  formData.mobile            = getVal('input-mobile');
  formData.fax               = getVal('input-fax') || _getDefaultFax();
  formData.extension         = getVal('input-extension');
  var emailLocal             = getVal('input-email-local');
  formData.email             = emailLocal ? emailLocal + CONFIG.app.emailDomain : '';
  formData.address           = getVal('input-address') || _getDefaultAddress();

  // QR
  var qrChecked = document.querySelector('input[name="include_qr"]:checked');
  if (qrChecked) formData.include_qr = qrChecked.value === 'yes';
}

function collectStep3Data() {
  var qtySelect = document.getElementById('quantity-select');
  if (qtySelect) {
    formData.quantity = qtySelect.value === 'other'
      ? (parseInt(getVal('quantity-custom'), 10) || 100)
      : (parseInt(qtySelect.value, 10) || 100);
  }
  var urgentToggle = document.getElementById('toggle-urgent');
  if (urgentToggle) formData.is_urgent = urgentToggle.checked;
  var reorderCheck = document.getElementById('check-reorder');
  if (reorderCheck) formData.is_reorder = reorderCheck.checked;
  var deliveryRadio = document.querySelector('input[name="delivery_method"]:checked');
  if (deliveryRadio) formData.delivery_method = deliveryRadio.value;
}

function collectStep4Data() {
  var bilingualChecked = document.querySelector('input[name="bilingual_option"]:checked');
  if (bilingualChecked) formData.is_bilingual = bilingualChecked.value === 'yes';
  if (formData.is_bilingual) {
    formData.applicant_name_en = getVal('input-back-name-en')       || formData.applicant_name_en;
    formData.position_en       = getVal('input-back-position-en')   || formData.position_en;
    formData.department_en     = getVal('input-back-department-en') || formData.department_en;
    formData.address_en        = getVal('input-back-address-en')    || formData.address_en;
  }
}

// ---- Preview rendering ----
function bindLivePreview() {
  var previewFields = [
    'input-preview-name', 'input-preview-dept', 'input-preview-position',
    'input-preview-phone', 'input-preview-fax', 'input-preview-mobile',
    'input-preview-email', 'input-preview-ext', 'input-preview-address',
  ];
  previewFields.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', function () {
      syncPreviewFieldToFormData(id);
      updateFrontPreview();
    });
  });
}

function syncPreviewFieldToFormData(inputId) {
  var val = getVal(inputId);
  var map = {
    'input-preview-name':     'applicant_name',
    'input-preview-dept':     'department',
    'input-preview-position': 'position_kr',
    'input-preview-phone':    'phone',
    'input-preview-fax':      'fax',
    'input-preview-mobile':   'mobile',
    'input-preview-email':    'email',
    'input-preview-ext':      'extension',
    'input-preview-address':  'address',
  };
  if (map[inputId]) formData[map[inputId]] = val;
}

function populatePreviewInputs() {
  setVal('input-preview-name',     formData.applicant_name);
  setVal('input-preview-dept',     formData.department);
  setVal('input-preview-position', formData.position_kr);
  setVal('input-preview-phone',    formData.phone);
  setVal('input-preview-fax',      formData.fax || _getDefaultFax());
  setVal('input-preview-mobile',   formData.mobile);
  setVal('input-preview-email',    formData.email);
  setVal('input-preview-ext',      formData.extension);
  setVal('input-preview-address',  formData.address);
}

function updateFrontPreview() {
  populatePreviewInputs();
  renderCardFront(document.getElementById('card-front-canvas'), {
    name:       formData.applicant_name,
    department: formData.department,
    positionKr: formData.position_kr,
    phone:      formData.phone,
    fax:        formData.fax || _getDefaultFax(),
    mobile:     formData.mobile,
    email:      formData.email,
    extension:  formData.extension,
    address:    formData.address,
    include_qr: formData.include_qr,
  });
}

function bindBackPreviewInputs() {
  ['input-back-name-en','input-back-position-en','input-back-department-en',
   'input-back-address-en','input-back-phone','input-back-mobile','input-back-email']
  .forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', updateBackPreview);
  });
}

function updateBackPreview() {
  renderCardBack(document.getElementById('card-back-canvas'), {
    nameEn:       getVal('input-back-name-en')       || formData.applicant_name_en,
    positionEn:   getVal('input-back-position-en')   || formData.position_en,
    departmentEn: getVal('input-back-department-en') || formData.department_en,
    addressEn:    getVal('input-back-address-en')    || formData.address_en,
    phone:        getVal('input-back-phone')         || formData.phone,
    mobile:       getVal('input-back-mobile')        || formData.mobile,
    email:        getVal('input-back-email')         || formData.email,
  });
}

function autoPopulateEnglishFields() {
  if (!getVal('input-back-name-en') && formData.applicant_name_en)
    setVal('input-back-name-en', formData.applicant_name_en);
  if (!getVal('input-back-position-en') && formData.position_en)
    setVal('input-back-position-en', formData.position_en);
  if (!getVal('input-back-department-en') && formData.department_en)
    setVal('input-back-department-en', formData.department_en);
  if (!getVal('input-back-address-en'))
    setVal('input-back-address-en', formData.address_en || CONFIG.app.defaultAddressEn);
  if (!getVal('input-back-phone') && formData.phone)
    setVal('input-back-phone', formData.phone);
  if (!getVal('input-back-mobile') && formData.mobile)
    setVal('input-back-mobile', formData.mobile);
  if (!getVal('input-back-email') && formData.email)
    setVal('input-back-email', formData.email);
}

function toggleBackSection(show) {
  var backSection = document.getElementById('card-back-section');
  if (backSection) backSection.classList.toggle('hidden', !show);
  var noMsg = document.getElementById('no-bilingual-msg');
  if (noMsg) noMsg.classList.toggle('hidden', show);
}

// ---- Translation ----
async function handleTranslate() {
  var posKr = getVal('input-position-kr');
  if (!posKr) { alert('먼저 직급(국문)을 입력해주세요.'); return; }
  var btn = document.getElementById('btn-translate');
  if (btn) { btn.disabled = true; btn.textContent = '번역 중...'; }
  try {
    var suggestions = await translatePosition(posKr);
    showTranslationSuggestions(suggestions, 'input-position-en');
  } catch (e) {
    console.error('[Form] 번역 실패:', e);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '✨ 자동번역'; }
  }
}

async function handleTranslateAll() {
  var btn = document.getElementById('btn-translate-all');
  if (btn) { btn.disabled = true; btn.textContent = '번역 중...'; }
  try {
    // Position
    var posKr = formData.position_kr || getVal('input-position-kr');
    if (posKr && !getVal('input-back-position-en')) {
      var posSuggestions = await translatePosition(posKr);
      if (posSuggestions && posSuggestions.length) {
        setVal('input-back-position-en', posSuggestions[0]);
        formData.position_en = posSuggestions[0];
      }
    }
    // Dept — simple romanization fallback
    if (!getVal('input-back-department-en') && formData.department_en) {
      setVal('input-back-department-en', formData.department_en);
    }
    updateBackPreview();
  } catch(e) {
    console.error('[Form] 전체번역 실패:', e);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '✨ 전체 자동번역'; }
  }
}

// ---- Reorder ----
async function handleReorderLookup() {
  var name       = getVal('reorder-name');
  var emailLocal = getVal('reorder-email');
  if (!name || !emailLocal) { alert('이름과 이메일 아이디를 입력해주세요.'); return; }
  var email = emailLocal + CONFIG.app.emailDomain;
  try {
    var { data, error } = await window.supabase
      .from('card_requests')
      .select('*')
      .eq('applicant_name', name)
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error || !data) { alert('이전 신청 내역을 찾을 수 없습니다.'); return; }
    prefillFromRequest(data);
    alert('이전 신청 내역이 입력되었습니다. 내용을 확인하세요.');
  } catch (e) {
    console.error('[Form] 재발주 조회 실패:', e);
    alert('조회 중 오류가 발생했습니다.');
  }
}

function prefillFromRequest(req) {
  setVal('input-name',          req.applicant_name    || '');
  setVal('input-name-en',       req.applicant_name_en || '');
  setVal('input-department',    req.department        || '');
  setVal('input-department-en', req.department_en     || '');
  setVal('input-position-kr',   req.position_kr       || '');
  setVal('input-position-en',   req.position_en       || '');
  setVal('input-phone',         req.phone             || '');
  setVal('input-mobile',        req.mobile            || '');
  setVal('input-fax',           req.fax               || '');
  setVal('input-extension',     req.extension         || '');
  // email: strip domain
  if (req.email) {
    var localPart = req.email.replace(CONFIG.app.emailDomain, '').replace(/@.*$/, '');
    setVal('input-email-local', localPart);
    formData.email = req.email;
  }
  setVal('input-address', req.address || '');
  if (req.paper_type) {
    formData.paper_type = req.paper_type;
    document.querySelectorAll('.paper-type-card').forEach(function (c) {
      c.classList.toggle('selected', c.dataset.value === req.paper_type);
    });
  }
}

// ---- Summary ----
function populateSummary() {
  var fields = [
    ['summary-paper-type',    CONFIG.PAPER_TYPE_NAMES[formData.paper_type] || formData.paper_type],
    ['summary-name',          formData.applicant_name],
    ['summary-name-en',       formData.applicant_name_en || '-'],
    ['summary-department',    formData.department],
    ['summary-department-en', formData.department_en || '-'],
    ['summary-position-kr',   formData.position_kr],
    ['summary-position-en',   formData.position_en || '-'],
    ['summary-phone',         formData.phone || '-'],
    ['summary-extension',     formData.extension || '-'],
    ['summary-fax',           formData.fax || _getDefaultFax()],
    ['summary-mobile',        formData.mobile || '-'],
    ['summary-email',         formData.email],
    ['summary-address',       formData.address],
    ['summary-quantity',      formData.quantity + '장'],
    ['summary-urgent',        formData.is_urgent ? '⚠️ 긴급' : '일반'],
    ['summary-reorder',       formData.is_reorder ? '재발주' : '신규'],
    ['summary-delivery',      CONFIG.DELIVERY_METHOD_NAMES[formData.delivery_method] || formData.delivery_method],
    ['summary-bilingual',     formData.is_bilingual ? '영문 뒷면 포함' : '없음'],
    ['summary-qr',            formData.include_qr ? '삽입 희망' : '삽입 비희망'],
  ];
  fields.forEach(function (pair) {
    var el = document.getElementById(pair[0]);
    if (el) el.textContent = pair[1] || '-';
  });
}

function renderFinalPreviews() {
  renderCardFront(document.getElementById('summary-front-canvas'), {
    name:       formData.applicant_name,
    department: formData.department,
    positionKr: formData.position_kr,
    phone:      formData.phone,
    fax:        formData.fax || _getDefaultFax(),
    mobile:     formData.mobile,
    email:      formData.email,
    extension:  formData.extension,
    address:    formData.address,
    include_qr: formData.include_qr,
  });

  var backContainer = document.getElementById('summary-back-preview-container');
  if (formData.is_bilingual || formData.paper_type === 'premium') {
    if (backContainer) backContainer.classList.remove('hidden');
    renderCardBack(document.getElementById('summary-back-canvas'), {
      nameEn:       formData.applicant_name_en,
      positionEn:   formData.position_en,
      departmentEn: formData.department_en,
      addressEn:    formData.address_en,
      phone:        formData.phone,
      mobile:       formData.mobile,
      email:        formData.email,
    });
  } else {
    if (backContainer) backContainer.classList.add('hidden');
  }
}

// ---- Submission ----
async function submitRequest() {
  var btn = document.getElementById('btn-submit');
  if (btn) { btn.disabled = true; btn.textContent = '제출 중...'; }
  showSpinner(true);
  try {
    var requestData = {
      applicant_name:    formData.applicant_name,
      applicant_name_en: formData.applicant_name_en || null,
      department:        formData.department,
      department_en:     formData.department_en || null,
      position_kr:       formData.position_kr,
      position_en:       formData.position_en || null,
      phone:             formData.phone || null,
      mobile:            formData.mobile || null,
      fax:               formData.fax || _getDefaultFax(),
      email:             formData.email,
      extension:         formData.extension || null,
      address:           formData.address,
      address_en:        formData.address_en || null,
      paper_type:        formData.paper_type,
      is_bilingual:      formData.is_bilingual,
      quantity:          formData.quantity,
      is_urgent:         formData.is_urgent,
      is_reorder:        formData.is_reorder,
      delivery_method:   formData.delivery_method,
      status:            'pending',
      status_history:    JSON.stringify([{
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: '신청 접수',
      }]),
    };

    var { data, error } = await window.supabase
      .from('card_requests')
      .insert(requestData)
      .select()
      .single();
    if (error) throw error;

    var message = getNewRequestMessage(data);
    await sendTelegramNotification(message);

    var requestIdEl = document.getElementById('success-request-id');
    if (requestIdEl) requestIdEl.textContent = data.id.slice(0, 8).toUpperCase();
    var modal = document.getElementById('success-modal');
    if (modal) modal.classList.remove('hidden');

  } catch (e) {
    console.error('[Form] 제출 실패:', e);
    alert('신청 제출 중 오류가 발생했습니다.\n' + (e.message || e));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '💼 명함 신청하기'; }
    showSpinner(false);
  }
}

// ---- Helpers ----
function bindBtn(id, handler) {
  var el = document.getElementById(id);
  if (el) el.addEventListener('click', handler);
}
function getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function setVal(id, val) {
  var el = document.getElementById(id);
  if (el) el.value = val || '';
}
function showSpinner(show) {
  var spinner = document.getElementById('spinner-overlay');
  if (spinner) spinner.classList.toggle('hidden', !show);
}
