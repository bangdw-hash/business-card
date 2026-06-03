// =====================================================
// Admin Dashboard Logic
// js/admin.js
// =====================================================

'use strict';

// ---- State ----
var allRequests   = [];
var currentFilter = 'all';
var activeSection = 'requests'; // 'requests' | 'payment'
var detailModalRequest = null;
var realtimeChannel = null;

// ---- DOM Ready ----
document.addEventListener('DOMContentLoaded', function () {
  initAdminPage();
});

async function initAdminPage() {
  // Check auth state
  var { data: { session } } = await window.supabase.auth.getSession();
  if (!session) {
    showLoginView();
  } else {
    showAdminView(session.user);
  }

  // Auth state changes
  window.supabase.auth.onAuthStateChange(function (event, session) {
    if (event === 'SIGNED_IN' && session) {
      showAdminView(session.user);
    } else if (event === 'SIGNED_OUT') {
      showLoginView();
    }
  });

  // Login form
  var loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      await handleLogin();
    });
  }

  // Logout button
  var logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
      await window.supabase.auth.signOut();
    });
  }

  // Tab filters
  document.querySelectorAll('.tab-btn[data-filter]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setFilter(btn.dataset.filter);
    });
  });

  // Section nav
  document.querySelectorAll('.section-nav-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchSection(btn.dataset.section);
    });
  });

  // Modal close
  var modalOverlay = document.getElementById('detail-modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeDetailModal();
    });
  }
  var modalClose = document.getElementById('modal-close-btn');
  if (modalClose) modalClose.addEventListener('click', closeDetailModal);

  // Invoice modal close
  var invModalOverlay = document.getElementById('invoice-modal-overlay');
  if (invModalOverlay) {
    invModalOverlay.addEventListener('click', function (e) {
      if (e.target === invModalOverlay) closeInvoiceModal();
    });
  }
  var invModalClose = document.getElementById('invoice-modal-close');
  if (invModalClose) invModalClose.addEventListener('click', closeInvoiceModal);
}

// ---- Auth ----
async function handleLogin() {
  var email    = document.getElementById('login-email').value.trim();
  var password = document.getElementById('login-password').value;
  var errEl    = document.getElementById('login-error');
  var btn      = document.getElementById('btn-login');

  if (!email || !password) {
    if (errEl) errEl.textContent = '이메일과 비밀번호를 입력해주세요.';
    return;
  }

  if (btn) btn.disabled = true;
  if (errEl) errEl.textContent = '';

  try {
    var { data, error } = await window.supabase.auth.signInWithPassword({ email: email, password: password });
    if (error) throw error;
  } catch (e) {
    if (errEl) errEl.textContent = '로그인 실패: ' + (e.message || '이메일 또는 비밀번호를 확인해주세요.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function showLoginView() {
  setElClass('login-view', false, 'hidden');
  setElClass('admin-view', true,  'hidden');
  if (realtimeChannel) {
    window.supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

function showAdminView(user) {
  setElClass('login-view', true,  'hidden');
  setElClass('admin-view', false, 'hidden');

  var emailEl = document.getElementById('admin-email');
  if (emailEl) emailEl.textContent = user.email;

  loadRequests();
  subscribeRealtime();
}

// ---- Data Loading ----
async function loadRequests() {
  showTableLoading(true);
  try {
    var { data, error } = await window.supabase
      .from('card_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allRequests = data || [];
    renderStats();
    renderTable();
  } catch (e) {
    console.error('[Admin] 데이터 로드 실패:', e);
    showTableError('데이터를 불러오는 데 실패했습니다. CONFIG.supabase를 확인하세요.');
  } finally {
    showTableLoading(false);
  }
}

function subscribeRealtime() {
  if (realtimeChannel) window.supabase.removeChannel(realtimeChannel);
  realtimeChannel = window.supabase
    .channel('card_requests_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'card_requests' }, function () {
      loadRequests();
    })
    .subscribe();
}

// ---- Stats ----
function renderStats() {
  var now = new Date();
  var thisMonth = allRequests.filter(function (r) {
    var d = new Date(r.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  setText('stat-total-month',   thisMonth.length);
  setText('stat-pending',       allRequests.filter(function(r){ return r.status === 'pending'; }).length);
  setText('stat-in-progress',   allRequests.filter(function(r){ return ['approved','ordered','printing'].includes(r.status); }).length);
  setText('stat-done',          allRequests.filter(function(r){ return ['delivered_to_admin','delivered_to_applicant'].includes(r.status); }).length);
}

// ---- Table Rendering ----
function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.tab-btn[data-filter]').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderTable();
}

function getFilteredRequests() {
  if (currentFilter === 'all') return allRequests;
  return allRequests.filter(function (r) { return r.status === currentFilter; });
}

function renderTable() {
  var tbody = document.getElementById('requests-tbody');
  if (!tbody) return;

  var filtered = getFilteredRequests();

  // Update tab counts
  updateTabCounts();

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">신청 내역이 없습니다</div></div></td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function (req) {
    var date = new Date(req.created_at).toLocaleDateString('ko-KR');
    var urgentClass = req.is_urgent ? ' urgent' : '';
    var urgentBadge = req.is_urgent ? '<span class="urgent-badge">⚠ 긴급</span>' : '';
    var reorderBadge = req.is_reorder ? '<span class="reorder-badge">재발주</span>' : '';
    var paperLabel = CONFIG.PAPER_TYPE_NAMES[req.paper_type] || req.paper_type;
    var statusBadge = renderStatusBadge(req.status);

    return '<tr class="clickable' + urgentClass + '" data-id="' + req.id + '">' +
      '<td>' + date + '</td>' +
      '<td><strong>' + esc(req.applicant_name) + '</strong></td>' +
      '<td>' + esc(req.department) + '</td>' +
      '<td>' + esc(req.position_kr) + '</td>' +
      '<td>' + paperLabel + '</td>' +
      '<td>' + (req.quantity || '-') + '장</td>' +
      '<td>' + urgentBadge + '</td>' +
      '<td>' + statusBadge + '</td>' +
      '<td><button class="btn btn-sm btn-outline btn-detail" data-id="' + req.id + '">상세</button>' + reorderBadge + '</td>' +
      '</tr>';
  }).join('');

  // Bind row clicks
  tbody.querySelectorAll('tr[data-id]').forEach(function (row) {
    row.addEventListener('click', function (e) {
      if (e.target.classList.contains('btn-detail') || e.target.closest('.btn-detail')) return;
      var req = allRequests.find(function (r) { return r.id === row.dataset.id; });
      if (req) openDetailModal(req);
    });
  });
  tbody.querySelectorAll('.btn-detail').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var req = allRequests.find(function (r) { return r.id === btn.dataset.id; });
      if (req) openDetailModal(req);
    });
  });
}

function updateTabCounts() {
  var statusMap = {
    'all':                  allRequests.length,
    'pending':              allRequests.filter(function(r){ return r.status === 'pending'; }).length,
    'approved':             allRequests.filter(function(r){ return r.status === 'approved'; }).length,
    'revision':             allRequests.filter(function(r){ return r.status === 'revision'; }).length,
    'rejected':             allRequests.filter(function(r){ return r.status === 'rejected'; }).length,
    'ordered':              allRequests.filter(function(r){ return r.status === 'ordered'; }).length,
    'printing':             allRequests.filter(function(r){ return r.status === 'printing'; }).length,
    'delivered_to_admin':   allRequests.filter(function(r){ return r.status === 'delivered_to_admin'; }).length,
    'delivered_to_applicant': allRequests.filter(function(r){ return r.status === 'delivered_to_applicant'; }).length,
  };

  document.querySelectorAll('.tab-btn[data-filter]').forEach(function (btn) {
    var countEl = btn.querySelector('.tab-count');
    if (countEl) countEl.textContent = statusMap[btn.dataset.filter] || 0;
  });
}

// ---- Detail Modal ----
function openDetailModal(req) {
  detailModalRequest = req;
  var modal = document.getElementById('detail-modal-overlay');
  if (!modal) return;
  modal.classList.remove('hidden');

  // Populate header
  setText('modal-title', esc(req.applicant_name) + ' (' + esc(req.department) + ')');

  // Populate details
  var details = [
    ['modal-detail-status',    renderStatusBadge(req.status)],
    ['modal-detail-name',      req.applicant_name],
    ['modal-detail-name-en',   req.applicant_name_en || '-'],
    ['modal-detail-dept',      req.department],
    ['modal-detail-dept-en',   req.department_en || '-'],
    ['modal-detail-position',  req.position_kr],
    ['modal-detail-position-en', req.position_en || '-'],
    ['modal-detail-phone',     req.phone || '-'],
    ['modal-detail-mobile',    req.mobile || '-'],
    ['modal-detail-fax',       req.fax || '-'],
    ['modal-detail-email',     req.email],
    ['modal-detail-extension', req.extension || '-'],
    ['modal-detail-paper',     CONFIG.PAPER_TYPE_NAMES[req.paper_type] || req.paper_type],
    ['modal-detail-quantity',  (req.quantity || '-') + '장'],
    ['modal-detail-bilingual', req.is_bilingual ? '신청' : '미신청'],
    ['modal-detail-urgent',    req.is_urgent ? '⚠️ 긴급' : '일반'],
    ['modal-detail-reorder',   req.is_reorder ? '재발주' : '신규'],
    ['modal-detail-delivery',  CONFIG.DELIVERY_METHOD_NAMES[req.delivery_method] || req.delivery_method],
    ['modal-detail-deadline',  req.deadline_date || '-'],
    ['modal-detail-unit-price', req.unit_price ? Number(req.unit_price).toLocaleString('ko-KR') + '원' : '-'],
    ['modal-detail-total-price', req.total_price ? Number(req.total_price).toLocaleString('ko-KR') + '원' : '-'],
    ['modal-detail-admin-note', req.admin_note || '-'],
    ['modal-detail-vendor-note', req.vendor_note || '-'],
    ['modal-detail-order-note', req.order_note || '-'],
    ['modal-detail-created',   new Date(req.created_at).toLocaleString('ko-KR')],
  ];

  details.forEach(function (pair) {
    var el = document.getElementById(pair[0]);
    if (!el) return;
    if (pair[0] === 'modal-detail-status') {
      el.innerHTML = pair[1];
    } else {
      el.textContent = pair[1];
    }
  });

  // Render status timeline
  renderTimeline(req.status_history);

  // Render card previews
  var frontCanvas = document.getElementById('modal-front-canvas');
  var backCanvas  = document.getElementById('modal-back-canvas');

  renderCardFront(frontCanvas, {
    name:       req.applicant_name,
    department: req.department,
    positionKr: req.position_kr,
    phone:      req.phone,
    mobile:     req.mobile,
    email:      req.email,
    extension:  req.extension,
    address:    req.address,
  });

  if (req.is_bilingual) {
    var backContainer = document.getElementById('modal-back-preview');
    if (backContainer) backContainer.classList.remove('hidden');
    renderCardBack(backCanvas, {
      nameEn:       req.applicant_name_en,
      positionEn:   req.position_en,
      departmentEn: req.department_en,
      addressEn:    req.address_en,
      phone:        req.phone,
      mobile:       req.mobile,
      email:        req.email,
    });
  } else {
    var backContainer2 = document.getElementById('modal-back-preview');
    if (backContainer2) backContainer2.classList.add('hidden');
  }

  // Bind action buttons
  bindModalActions(req);

  // Show/hide approved-only fields
  updateApprovalInputsVisibility(req.status);
}

function closeDetailModal() {
  var modal = document.getElementById('detail-modal-overlay');
  if (modal) modal.classList.add('hidden');
  detailModalRequest = null;
}

function renderTimeline(historyRaw) {
  var container = document.getElementById('modal-timeline');
  if (!container) return;

  var history = [];
  try {
    if (typeof historyRaw === 'string') history = JSON.parse(historyRaw);
    else if (Array.isArray(historyRaw)) history = historyRaw;
  } catch (e) { history = []; }

  if (history.length === 0) {
    container.innerHTML = '<p class="text-muted text-sm">이력 없음</p>';
    return;
  }

  container.innerHTML = '<div class="timeline">' +
    history.slice().reverse().map(function (item) {
      var date = item.timestamp ? new Date(item.timestamp).toLocaleString('ko-KR') : '-';
      var statusName = CONFIG.STATUS_NAMES[item.status] || item.status;
      return '<div class="timeline-item">' +
        '<div class="timeline-dot"></div>' +
        '<div class="timeline-time">' + date + '</div>' +
        '<div class="timeline-status">' + statusName + '</div>' +
        (item.note ? '<div class="timeline-note">' + esc(item.note) + '</div>' : '') +
        (item.by ? '<div class="timeline-note text-xs">담당: ' + esc(item.by) + '</div>' : '') +
        '</div>';
    }).join('') +
    '</div>';
}

function updateApprovalInputsVisibility(status) {
  var approveSection = document.getElementById('approve-inputs-section');
  if (approveSection) {
    approveSection.classList.toggle('hidden', status !== 'pending' && status !== 'revision');
  }
}

function bindModalActions(req) {
  // Helper: bind status action button
  function bindAction(btnId, newStatus, promptNote, requiresApprovalData) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    // Clone to remove old listeners
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', async function () {
      var note = '';
      if (promptNote) {
        note = prompt(promptNote + '\n(입력하지 않으면 뾩 내용이 전달됩니다)') || '';
      }

      var extraData = {};
      if (requiresApprovalData) {
        var deadlineInput = document.getElementById('approve-deadline');
        var unitPriceInput = document.getElementById('approve-unit-price');
        var totalPriceInput = document.getElementById('approve-total-price');
        var orderNoteInput = document.getElementById('approve-order-note');

        if (deadlineInput && deadlineInput.value) extraData.deadline_date = deadlineInput.value;
        if (unitPriceInput && unitPriceInput.value) extraData.unit_price = parseFloat(unitPriceInput.value);
        if (totalPriceInput && totalPriceInput.value) extraData.total_price = parseFloat(totalPriceInput.value);
        if (orderNoteInput && orderNoteInput.value) extraData.order_note = orderNoteInput.value.trim();
      }

      // Get current admin email
      var { data: { session } } = await window.supabase.auth.getSession();
      var adminEmail = session ? session.user.email : 'admin';

      await updateRequestStatus(req.id, newStatus, note, adminEmail, extraData);
    });
  }

  bindAction('btn-action-approve',             'approved',              '승인 메모 (선택)',   true);
  bindAction('btn-action-revision',            'revision',              '수정 요청 사유를 입력해주세요:',  false);
  bindAction('btn-action-reject',              'rejected',              '반려 사유를 입력해주세요:',        false);
  bindAction('btn-action-ordered',             'ordered',               '발주 메모 (선택)',   false);
  bindAction('btn-action-printing',            'printing',              null,                 false);
  bindAction('btn-action-delivered-admin',     'delivered_to_admin',    null,                 false);
  bindAction('btn-action-delivered-applicant', 'delivered_to_applicant',null,                 false);

  // Save admin note
  var saveNoteBtn = document.getElementById('btn-save-admin-note');
  if (saveNoteBtn) {
    var newSave = saveNoteBtn.cloneNode(true);
    saveNoteBtn.parentNode.replaceChild(newSave, saveNoteBtn);
    newSave.addEventListener('click', async function () {
      var noteInput = document.getElementById('modal-admin-note-input');
      var note = noteInput ? noteInput.value.trim() : '';
      var { error } = await window.supabase.from('card_requests').update({ admin_note: note }).eq('id', req.id);
      if (!error) alert('메모가 저장되었습니다.');
    });
  }

  // Set admin note value
  var adminNoteInput = document.getElementById('modal-admin-note-input');
  if (adminNoteInput) adminNoteInput.value = req.admin_note || '';
}

async function updateRequestStatus(requestId, newStatus, note, adminEmail, extraData) {
  var req = allRequests.find(function (r) { return r.id === requestId; });
  if (!req) return;

  var historyEntry = {
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: note || null,
    by: adminEmail,
  };

  var currentHistory = [];
  try {
    if (typeof req.status_history === 'string') currentHistory = JSON.parse(req.status_history);
    else if (Array.isArray(req.status_history)) currentHistory = req.status_history;
  } catch (e) { currentHistory = []; }

  currentHistory.push(historyEntry);

  var updatePayload = Object.assign(
    {
      status: newStatus,
      status_history: JSON.stringify(currentHistory),
    },
    note ? { admin_note: note } : {},
    extraData || {}
  );

  showSpinnerAdmin(true);
  try {
    var { data, error } = await window.supabase
      .from('card_requests')
      .update(updatePayload)
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    // Send notification
    var msg = getStatusUpdateMessage(data, newStatus, note);
    await sendTelegramNotification(msg);

    // Reload and close modal
    await loadRequests();
    closeDetailModal();
    alert('상태가 ' + (CONFIG.STATUS_NAMES[newStatus] || newStatus) + '으로 변경되었습니다.');
  } catch (e) {
    console.error('[Admin] 상태 업데이트 실패:', e);
    alert('상태 변경 중 오류가 발생했습니다.\n' + (e.message || e));
  } finally {
    showSpinnerAdmin(false);
  }
}

// ---- Section Switch ----
function switchSection(section) {
  activeSection = section;
  document.querySelectorAll('.admin-section').forEach(function (el) {
    el.classList.toggle('hidden', el.dataset.section !== section);
  });
  document.querySelectorAll('.section-nav-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.section === section);
  });
  if (section === 'payment') loadPaymentSection();
}

// ---- Payment Section ----
async function loadPaymentSection() {
  showPaymentLoading(true);
  try {
    var invoices = await loadMonthlyInvoices();
    renderInvoiceTable(invoices);
  } catch (e) {
    console.error('[Admin] 인보이스 로드 실패:', e);
  } finally {
    showPaymentLoading(false);
  }
}

function renderInvoiceTable(invoices) {
  var tbody = document.getElementById('invoice-tbody');
  if (!tbody) return;

  if (!invoices || invoices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">💳</div><div class="empty-state-title">인보이스 내역이 없습니다</div><div class="empty-state-desc">팝로더 상태(발주완료 이상)의 주문이 있어야 인보이스가 생성됩니다.</div></div></td></tr>';
    return;
  }

  tbody.innerHTML = invoices.map(function (inv) {
    var ymStr  = formatYearMonth(inv.invoice_year, inv.invoice_month);
    var amount = formatKRW(inv.total_amount);
    var badge  = renderInvoiceBadge(inv.status);
    var due    = inv.payment_due_date || '-';
    return '<tr class="clickable" data-inv-id="' + inv.id + '">' +
      '<td>' + ymStr + '</td>' +
      '<td>' + (inv.total_orders || 0) + '건</td>' +
      '<td>' + (inv.total_quantity || 0) + '장</td>' +
      '<td>' + amount + '</td>' +
      '<td>' + badge + '</td>' +
      '<td>' + due + '</td>' +
      '<td>' +
        '<div class="flex gap-8">' +
        (inv.status === 'pending' ? '<button class="btn btn-sm btn-primary btn-inv-confirm" data-id="' + inv.id + '">확인완료</button>' : '') +
        (inv.status === 'confirmed' ? '<button class="btn btn-sm btn-success btn-inv-pay" data-id="' + inv.id + '">지급완료</button>' : '') +
        '<button class="btn btn-sm btn-secondary btn-inv-pdf" data-id="' + inv.id + '">PDF</button>' +
        '</div>' +
      '</td>' +
      '</tr>';
  }).join('');

  // Bind invoice row clicks
  tbody.querySelectorAll('tr[data-inv-id]').forEach(function (row) {
    row.addEventListener('click', function (e) {
      if (e.target.closest('button')) return;
      var inv = invoices.find(function (i) { return i.id === row.dataset.invId; });
      if (inv) openInvoiceModal(inv);
    });
  });

  // Bind confirm/pay/pdf buttons
  tbody.querySelectorAll('.btn-inv-confirm').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      if (!confirm('이 월 명함 주문을 확인 완료로 처리하시겠습니까?')) return;
      var ok = await updateInvoiceStatus(btn.dataset.id, 'confirmed', {});
      if (ok) { loadPaymentSection(); alert('확인 완료로 업데이트되었습니다.'); }
    });
  });

  tbody.querySelectorAll('.btn-inv-pay').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      if (!confirm('지급 완료로 처리하시겠습니까?')) return;
      var ok = await updateInvoiceStatus(btn.dataset.id, 'paid', { payment_date: new Date().toISOString().slice(0, 10) });
      if (ok) { loadPaymentSection(); alert('지급 완료로 업데이트되었습니다.'); }
    });
  });

  tbody.querySelectorAll('.btn-inv-pdf').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      var invId = btn.dataset.id;
      var inv = invoices.find(function (i) { return i.id === invId; });
      if (!inv) return;
      var orders = await getOrdersForMonth(inv.invoice_year, inv.invoice_month);
      generateInvoicePDF(inv, orders);
    });
  });
}

// ---- Invoice Modal ----
async function openInvoiceModal(inv) {
  var modal = document.getElementById('invoice-modal-overlay');
  if (!modal) return;
  modal.classList.remove('hidden');

  setText('invoice-modal-title', formatYearMonth(inv.invoice_year, inv.invoice_month) + ' 발주 내역');
  setText('invoice-modal-year-month', formatYearMonth(inv.invoice_year, inv.invoice_month));
  setText('invoice-modal-status-badge', '');
  var statusBadgeEl = document.getElementById('invoice-modal-status-badge');
  if (statusBadgeEl) statusBadgeEl.innerHTML = renderInvoiceBadge(inv.status);
  setText('invoice-modal-total-orders', (inv.total_orders || 0) + '건');
  setText('invoice-modal-total-qty', (inv.total_quantity || 0) + '장');
  setText('invoice-modal-total-amount', formatKRW(inv.total_amount));
  setText('invoice-modal-due-date', inv.payment_due_date || '-');
  setText('invoice-modal-payment-date', inv.payment_date || '-');

  var dueDateInput = document.getElementById('invoice-due-date-input');
  if (dueDateInput) dueDateInput.value = inv.payment_due_date || '';

  var adminNoteInput = document.getElementById('invoice-admin-note-input');
  if (adminNoteInput) adminNoteInput.value = inv.admin_note || '';

  // Load orders for this month
  var orders = await getOrdersForMonth(inv.invoice_year, inv.invoice_month);
  renderInvoiceOrderList(orders);

  // Bind save due date
  var saveDueBtn = document.getElementById('btn-save-due-date');
  if (saveDueBtn) {
    var newBtn = saveDueBtn.cloneNode(true);
    saveDueBtn.parentNode.replaceChild(newBtn, saveDueBtn);
    newBtn.addEventListener('click', async function () {
      var val = dueDateInput ? dueDateInput.value : '';
      var ok = await updateInvoiceStatus(inv.id, inv.status, { payment_due_date: val });
      if (ok) alert('지급 예정일이 저장되었습니다.');
    });
  }

  // Bind PDF
  var pdfBtn = document.getElementById('btn-invoice-pdf');
  if (pdfBtn) {
    var newPdf = pdfBtn.cloneNode(true);
    pdfBtn.parentNode.replaceChild(newPdf, pdfBtn);
    newPdf.addEventListener('click', function () {
      generateInvoicePDF(inv, orders);
    });
  }

  // Bind recalculate
  var recalcBtn = document.getElementById('btn-recalculate');
  if (recalcBtn) {
    var newRecalc = recalcBtn.cloneNode(true);
    recalcBtn.parentNode.replaceChild(newRecalc, recalcBtn);
    newRecalc.addEventListener('click', async function () {
      var ok = await recalculateInvoiceTotals(inv.id);
      if (ok) { alert('합계가 재계산되었습니다.'); closeInvoiceModal(); loadPaymentSection(); }
    });
  }
}

function closeInvoiceModal() {
  var modal = document.getElementById('invoice-modal-overlay');
  if (modal) modal.classList.add('hidden');
}

function renderInvoiceOrderList(orders) {
  var container = document.getElementById('invoice-order-list');
  if (!container) return;
  if (!orders || orders.length === 0) {
    container.innerHTML = '<p class="text-muted text-sm">이 월에 해당하는 주문이 없습니다.</p>';
    return;
  }
  container.innerHTML = '<div class="admin-table-wrapper"><table class="admin-table"><thead><tr>' +
    '<th>신청일</th><th>성명</th><th>부서</th><th>직급</th><th>수량</th><th>단가</th><th>금액</th><th>상태</th>' +
    '</tr></thead><tbody>' +
    orders.map(function (o) {
      return '<tr>' +
        '<td>' + new Date(o.created_at).toLocaleDateString('ko-KR') + '</td>' +
        '<td>' + esc(o.applicant_name) + '</td>' +
        '<td>' + esc(o.department) + '</td>' +
        '<td>' + esc(o.position_kr) + '</td>' +
        '<td>' + (o.quantity || '-') + '장</td>' +
        '<td>' + (o.unit_price ? formatKRW(o.unit_price) : '-') + '</td>' +
        '<td>' + (o.total_price ? formatKRW(o.total_price) : '-') + '</td>' +
        '<td>' + renderStatusBadge(o.status) + '</td>' +
        '</tr>';
    }).join('') +
    '</tbody></table></div>';
}

// ---- Generate this month invoice ----
var generateInvBtn = document.getElementById('btn-generate-invoice');
if (generateInvBtn) {
  generateInvBtn.addEventListener('click', async function () {
    var now = new Date();
    var inv = await getOrCreateInvoice(now.getFullYear(), now.getMonth() + 1);
    if (inv) {
      await recalculateInvoiceTotals(inv.id);
      alert('이번 달 인보이스가 생성/갱신되었습니다.');
      loadPaymentSection();
    }
  });
}

// ---- Helpers ----
function renderStatusBadge(status) {
  var name = CONFIG.STATUS_NAMES[status] || status;
  return '<span class="badge badge-' + status + '">' + name + '</span>';
}

function renderInvoiceBadge(status) {
  var labels = { pending: '확인 대기', confirmed: '확인 완료', paid: '지급 완료' };
  return '<span class="badge badge-invoice-' + status + '">' + (labels[status] || status) + '</span>';
}

function showTableLoading(show) {
  var el = document.getElementById('table-loading');
  if (el) el.classList.toggle('hidden', !show);
}

function showTableError(msg) {
  var tbody = document.getElementById('requests-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="9"><div class="alert alert-error">' + msg + '</div></td></tr>';
}

function showPaymentLoading(show) {
  var el = document.getElementById('payment-loading');
  if (el) el.classList.toggle('hidden', !show);
}

function showSpinnerAdmin(show) {
  var el = document.getElementById('admin-spinner');
  if (el) el.classList.toggle('hidden', !show);
}

function setText(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setElClass(id, add, cls) {
  var el = document.getElementById(id);
  if (!el) return;
  if (add) el.classList.add(cls);
  else el.classList.remove(cls);
}

function esc(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
