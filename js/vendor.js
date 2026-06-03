// =====================================================
// Vendor Dashboard Logic
// js/vendor.js
// =====================================================

'use strict';

var vendorOrders   = [];
var vendorFilter   = 'ordered';
var vendorSection  = 'orders'; // 'orders' | 'payment'

// ---- DOM Ready ----
document.addEventListener('DOMContentLoaded', function () {
  initVendorPage();
});

async function initVendorPage() {
  // Validate token from URL
  var params = new URLSearchParams(window.location.search);
  var token  = params.get('token');

  if (!token || token !== CONFIG.vendor.accessToken) {
    showAccessDenied();
    return;
  }

  showVendorDashboard();
  await loadVendorOrders();

  // Tab filter
  document.querySelectorAll('.vendor-tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      vendorFilter = btn.dataset.filter;
      document.querySelectorAll('.vendor-tab-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.filter === vendorFilter);
      });
      renderVendorOrders();
    });
  });

  // Section nav
  document.querySelectorAll('.vendor-section-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      vendorSection = btn.dataset.section;
      document.querySelectorAll('.vendor-section-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.section === vendorSection);
      });
      document.querySelectorAll('.vendor-section').forEach(function (s) {
        s.classList.toggle('hidden', s.dataset.section !== vendorSection);
      });
      if (vendorSection === 'payment') loadVendorPaymentSection();
    });
  });
}

function showAccessDenied() {
  var denied = document.getElementById('access-denied');
  var dashboard = document.getElementById('vendor-dashboard');
  if (denied)    denied.classList.remove('hidden');
  if (dashboard) dashboard.classList.add('hidden');
}

function showVendorDashboard() {
  var denied = document.getElementById('access-denied');
  var dashboard = document.getElementById('vendor-dashboard');
  if (denied)    denied.classList.add('hidden');
  if (dashboard) dashboard.classList.remove('hidden');
}

// ---- Data ----
async function loadVendorOrders() {
  var loadingEl = document.getElementById('vendor-orders-loading');
  if (loadingEl) loadingEl.classList.remove('hidden');
  try {
    var { data, error } = await window.supabase
      .from('card_requests')
      .select('*')
      .in('status', ['ordered', 'printing', 'delivered_to_admin', 'delivered_to_applicant'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    vendorOrders = data || [];
    renderVendorOrders();
  } catch (e) {
    console.error('[Vendor] 주문 로드 실패:', e);
    var container = document.getElementById('vendor-orders-container');
    if (container) container.innerHTML = '<div class="alert alert-error">CONFIG.supabase를 설정해주세요.</div>';
  } finally {
    if (loadingEl) loadingEl.classList.add('hidden');
  }
}

// ---- Render Orders ----
function renderVendorOrders() {
  var container = document.getElementById('vendor-orders-container');
  if (!container) return;

  var filtered = vendorOrders.filter(function (o) {
    if (vendorFilter === 'ordered')  return o.status === 'ordered';
    if (vendorFilter === 'printing') return o.status === 'printing';
    if (vendorFilter === 'done')     return ['delivered_to_admin', 'delivered_to_applicant'].includes(o.status);
    return true;
  });

  // Update filter tab counts
  var counts = {
    ordered:  vendorOrders.filter(function(o){ return o.status === 'ordered'; }).length,
    printing: vendorOrders.filter(function(o){ return o.status === 'printing'; }).length,
    done:     vendorOrders.filter(function(o){ return ['delivered_to_admin','delivered_to_applicant'].includes(o.status); }).length,
  };
  document.querySelectorAll('.vendor-tab-btn').forEach(function (btn) {
    var countEl = btn.querySelector('.tab-count');
    if (countEl) countEl.textContent = counts[btn.dataset.filter] || 0;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📵</div><div class="empty-state-title">해당 주문이 없습니다</div></div>';
    return;
  }

  container.innerHTML = filtered.map(function (order) {
    return renderOrderCard(order);
  }).join('');

  // Bind action buttons
  container.querySelectorAll('.btn-start-printing').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      await updateVendorOrderStatus(btn.dataset.id, 'printing');
    });
  });
  container.querySelectorAll('.btn-finish-printing').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      await updateVendorOrderStatus(btn.dataset.id, 'delivered_to_admin');
    });
  });
  container.querySelectorAll('.btn-save-vendor-note').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      var noteInput = document.getElementById('vendor-note-' + btn.dataset.id);
      var note = noteInput ? noteInput.value.trim() : '';
      var { error } = await window.supabase
        .from('card_requests')
        .update({ vendor_note: note })
        .eq('id', btn.dataset.id);
      if (!error) alert('거래체 메모가 저장되었습니다.');
    });
  });
  container.querySelectorAll('.upload-area').forEach(function (area) {
    area.addEventListener('click', function () {
      alert('Supabase Storage 연결 후 파일 업로드가 가능합니다.\nCONFIG.supabase를 설정하세요.');
    });
  });
}

function renderOrderCard(order) {
  var date = new Date(order.created_at).toLocaleDateString('ko-KR');
  var deadline = order.deadline_date ? new Date(order.deadline_date).toLocaleDateString('ko-KR') : '-';
  var paperLabel = CONFIG.PAPER_TYPE_NAMES[order.paper_type] || order.paper_type;
  var statusName = CONFIG.STATUS_NAMES[order.status] || order.status;

  var urgentBadge = order.is_urgent
    ? '<span class="urgent-badge">⚠ 긴급</span>'
    : '';

  var actionBtns = '';
  if (order.status === 'ordered') {
    actionBtns = '<button class="btn btn-primary btn-sm btn-start-printing" data-id="' + order.id + '">🖨️ 인쇄 시작</button>';
  } else if (order.status === 'printing') {
    actionBtns = '<button class="btn btn-success btn-sm btn-finish-printing" data-id="' + order.id + '">✅ 인쇄 완료</button>';
  }

  var uploadSection = (order.status === 'ordered' || order.status === 'printing')
    ? '<div class="upload-area mt-12" data-id="' + order.id + '">' +
        '<div>📄 인쇄 파일 업로드 (Supabase Storage 연결 후 사용 가능)</div>' +
      '</div>'
    : (order.print_file_url
        ? '<div class="mt-8"><a href="' + order.print_file_url + '" target="_blank" class="btn btn-sm btn-secondary">파일 보기</a></div>'
        : '');

  return '<div class="vendor-order-card">' +
    '<div class="vendor-order-header">' +
      '<div>' +
        '<span class="vendor-order-title">' + esc(order.applicant_name) + '</span>' +
        '&nbsp;' + urgentBadge +
      '</div>' +
      '<span class="badge badge-' + order.status + '">' + statusName + '</span>' +
    '</div>' +
    '<div class="vendor-order-meta">' +
      '<div class="vendor-order-meta-item"><div class="vendor-order-meta-label">부서</div><div class="vendor-order-meta-value">' + esc(order.department) + '</div></div>' +
      '<div class="vendor-order-meta-item"><div class="vendor-order-meta-label">직급</div><div class="vendor-order-meta-value">' + esc(order.position_kr) + '</div></div>' +
      '<div class="vendor-order-meta-item"><div class="vendor-order-meta-label">수량</div><div class="vendor-order-meta-value">' + (order.quantity || '-') + '장</div></div>' +
      '<div class="vendor-order-meta-item"><div class="vendor-order-meta-label">용지</div><div class="vendor-order-meta-value">' + paperLabel + '</div></div>' +
      '<div class="vendor-order-meta-item"><div class="vendor-order-meta-label">납기일</div><div class="vendor-order-meta-value">' + deadline + '</div></div>' +
      '<div class="vendor-order-meta-item"><div class="vendor-order-meta-label">신청일</div><div class="vendor-order-meta-value">' + date + '</div></div>' +
    '</div>' +
    (order.order_note ? '<div class="alert alert-info mb-12"><strong>특이사항:</strong> ' + esc(order.order_note) + '</div>' : '') +
    '<div class="form-group">' +
      '<label style="font-size:12px;color:#6b7280;">거래체 메모</label>' +
      '<div class="input-with-button">' +
        '<input id="vendor-note-' + order.id + '" type="text" class="form-input" placeholder="메모 입력..." value="' + esc(order.vendor_note || '') + '">' +
        '<button class="btn btn-secondary btn-sm btn-save-vendor-note" data-id="' + order.id + '">저장</button>' +
      '</div>' +
    '</div>' +
    uploadSection +
    '<div class="vendor-order-actions">' + actionBtns + '</div>' +
  '</div>';
}

async function updateVendorOrderStatus(orderId, newStatus) {
  var order = vendorOrders.find(function (o) { return o.id === orderId; });
  if (!order) return;

  var historyEntry = {
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: newStatus === 'printing' ? '인쇄 시작' : '인쇄 완료 - 관리자 수령 대기',
    by: CONFIG.vendor.companyName || 'vendor',
  };

  var currentHistory = [];
  try {
    if (typeof order.status_history === 'string') currentHistory = JSON.parse(order.status_history);
    else if (Array.isArray(order.status_history)) currentHistory = order.status_history;
  } catch (e) { currentHistory = []; }

  currentHistory.push(historyEntry);

  try {
    var { error } = await window.supabase
      .from('card_requests')
      .update({
        status: newStatus,
        status_history: JSON.stringify(currentHistory),
      })
      .eq('id', orderId);

    if (error) throw error;

    var statusName = CONFIG.STATUS_NAMES[newStatus] || newStatus;
    alert('상태가 [' + statusName + ']으로 변경되었습니다.');
    await loadVendorOrders();
  } catch (e) {
    console.error('[Vendor] 상태 업데이트 실패:', e);
    alert('상태 변경 실패: ' + (e.message || e));
  }
}

// ---- Payment Section ----
async function loadVendorPaymentSection() {
  var loadingEl = document.getElementById('vendor-payment-loading');
  if (loadingEl) loadingEl.classList.remove('hidden');
  try {
    var invoices = await loadMonthlyInvoices();
    renderVendorInvoiceTable(invoices);
  } catch (e) {
    console.error('[Vendor] 인보이스 로드 실패:', e);
  } finally {
    if (loadingEl) loadingEl.classList.add('hidden');
  }
}

function renderVendorInvoiceTable(invoices) {
  var container = document.getElementById('vendor-payment-container');
  if (!container) return;

  if (!invoices || invoices.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💳</div><div class="empty-state-title">대금 내역이 없습니다</div></div>';
    return;
  }

  container.innerHTML = '<div class="admin-table-wrapper"><table class="invoice-table"><thead><tr>' +
    '<th>연월</th><th>발주 건수</th><th>수량</th><th>총금액</th><th>상태</th><th>지급 예정일</th><th>가능</th>' +
    '</tr></thead><tbody>' +
    invoices.map(function (inv) {
      var ymStr  = formatYearMonth(inv.invoice_year, inv.invoice_month);
      var amount = formatKRW(inv.total_amount);
      var badge  = renderVendorInvoiceBadge(inv.status);
      var due    = inv.payment_due_date || '-';
      var canPdf = inv.status === 'confirmed' || inv.status === 'paid';
      return '<tr>' +
        '<td><strong>' + ymStr + '</strong></td>' +
        '<td>' + (inv.total_orders || 0) + '건</td>' +
        '<td>' + (inv.total_quantity || 0) + '장</td>' +
        '<td><strong>' + amount + '</strong></td>' +
        '<td>' + badge + '</td>' +
        '<td>' + due + '</td>' +
        '<td>' +
          (canPdf
            ? '<button class="btn btn-sm btn-secondary btn-vendor-pdf" data-id="' + inv.id +
              '" data-year="' + inv.invoice_year + '" data-month="' + inv.invoice_month + '">PDF 다운</button>'
            : '<span class="text-muted text-xs">확인 이후 가능</span>') +
        '</td>' +
        '</tr>';
    }).join('') +
    '</tbody></table></div>';

  // Bind PDF buttons
  container.querySelectorAll('.btn-vendor-pdf').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      var invId = btn.dataset.id;
      var inv = invoices.find(function (i) { return i.id === invId; });
      if (!inv) return;
      var year = parseInt(btn.dataset.year, 10);
      var month = parseInt(btn.dataset.month, 10);
      var orders = await getOrdersForMonth(year, month);
      generateInvoicePDF(inv, orders);
    });
  });
}

function renderVendorInvoiceBadge(status) {
  var labels = { pending: '확인 대기', confirmed: '확인 완료', paid: '지급 완료' };
  var cls = { pending: 'badge-invoice-pending', confirmed: 'badge-invoice-confirmed', paid: 'badge-invoice-paid' };
  return '<span class="badge ' + (cls[status] || '') + '">' + (labels[status] || status) + '</span>';
}

function esc(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
