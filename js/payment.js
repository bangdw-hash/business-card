// 월별 대금 처리 — admin.js 및 vendor.js에서 공통 사용
// window.supabase 및 window._supabase 모두 지원

function _db() {
  return window._supabase || window.supabase;
}

async function loadMonthlyInvoices() {
  const { data, error } = await _db()
    .from('monthly_invoices')
    .select('*')
    .order('invoice_year', { ascending: false })
    .order('invoice_month', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function getOrCreateInvoice(year, month) {
  let { data, error } = await _db()
    .from('monthly_invoices')
    .select('*')
    .eq('invoice_year', year)
    .eq('invoice_month', month)
    .single();

  if (error && error.code === 'PGRST116') {
    const ins = await _db()
      .from('monthly_invoices')
      .insert({ invoice_year: year, invoice_month: month })
      .select()
      .single();
    if (ins.error) throw ins.error;
    data = ins.data;
  } else if (error) {
    throw error;
  }
  return data;
}

async function getOrdersForMonth(year, month) {
  const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
  const endDate = new Date(year, month, 1).toISOString().split('T')[0];
  const { data, error } = await _db()
    .from('card_requests')
    .select('*')
    .in('status', ['delivered_to_admin', 'delivered_to_applicant'])
    .gte('updated_at', startDate)
    .lt('updated_at', endDate)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function recalculateInvoiceTotals(invoiceId) {
  const { data: inv } = await _db()
    .from('monthly_invoices').select('*').eq('id', invoiceId).single();
  if (!inv) return false;
  const orders = await getOrdersForMonth(inv.invoice_year, inv.invoice_month);
  const total_orders   = orders.length;
  const total_quantity = orders.reduce((s, o) => s + (o.quantity || 0), 0);
  const total_amount   = orders.reduce((s, o) => s + (parseFloat(o.total_price) || 0), 0);
  await _db().from('monthly_invoices').update({ total_orders, total_quantity, total_amount }).eq('id', invoiceId);
  return true;
}

async function updateInvoiceStatus(invoiceId, status, extra = {}) {
  const update = { status, ...extra };
  if (status === 'paid' && !update.payment_date) update.payment_date = new Date().toISOString().split('T')[0];
  const { error } = await _db().from('monthly_invoices').update(update).eq('id', invoiceId);
  if (error) { console.error('[payment] updateInvoiceStatus 오류:', error); return false; }
  return true;
}

async function generateInvoicePDF(invoice, orders) {
  if (!window.jspdf) { alert('jsPDF 라이브러리가 로드되지 않았습니다.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const yearMonth = `${invoice.invoice_year}년 ${invoice.invoice_month}월`;
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(20); doc.setTextColor(0, 48, 135);
  doc.text('발 주 내 역 서', pageW / 2, 25, { align: 'center' });
  doc.setFontSize(11); doc.setTextColor(80, 80, 80);
  doc.text(CONFIG.app.schoolName,   pageW / 2, 33, { align: 'center' });
  doc.text(CONFIG.app.schoolNameEn, pageW / 2, 39, { align: 'center' });
  doc.setFontSize(12); doc.setTextColor(0, 0, 0);
  doc.text(`정산 기간: ${yearMonth}`, 14, 52);
  doc.text(`발행일: ${new Date().toLocaleDateString('ko-KR')}`, 14, 59);
  doc.text(`상태: ${CONFIG.invoiceStatusLabels[invoice.status] || invoice.status}`, 14, 66);
  if (invoice.payment_due_date) doc.text(`지급 예정일: ${invoice.payment_due_date}`, 14, 73);

  const tableData = (orders || []).map((o, i) => [
    i + 1,
    new Date(o.created_at).toLocaleDateString('ko-KR'),
    o.applicant_name,
    o.department,
    o.position_kr,
    o.quantity,
    o.unit_price  ? formatKRW(o.unit_price)  : '-',
    o.total_price ? formatKRW(o.total_price) : '-',
    o.paper_type === 'premium' ? '고급' : '일반',
  ]);

  doc.autoTable({
    startY: 80,
    head: [['#', '신청일', '성명', '부서', '직급', '수량', '단가', '금액', '용지']],
    body: tableData,
    styles: { font: 'helvetica', fontSize: 9 },
    headStyles: { fillColor: [0, 48, 135], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 244, 255] },
    foot: [['', '', '', '', '합계', invoice.total_quantity || 0, '', formatKRW(invoice.total_amount || 0), '']],
    footStyles: { fillColor: [230, 230, 230], fontStyle: 'bold' },
  });

  const finalY = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(10);
  doc.text('발주처 확인:', 14, finalY);  doc.rect(50, finalY - 8, 60, 20);
  doc.text('수령자 확인:', 130, finalY); doc.rect(166, finalY - 8, 30, 20);
  doc.save(`아세아항공_발주내역서_${invoice.invoice_year}년${invoice.invoice_month}월.pdf`);
}

// 유틸리티
function formatYearMonth(year, month) {
  return `${year}년 ${String(month).padStart(2,'0')}월`;
}

function formatKRW(amount) {
  return Number(amount || 0).toLocaleString('ko-KR') + '원';
}

// 월별 인보이스 카드 렌더링 (공통 UI)
function renderInvoiceCard(inv, isAdmin) {
  const statusLabel = CONFIG.invoiceStatusLabels[inv.status] || inv.status;
  const statusClass = { pending: 'badge-gray', confirmed: 'badge-blue', paid: 'badge-green' }[inv.status] || 'badge-gray';
  return `
    <div class="invoice-card" data-id="${inv.id}">
      <div class="invoice-card-header">
        <span class="invoice-period">${formatYearMonth(inv.invoice_year, inv.invoice_month)}</span>
        <span class="badge ${statusClass}">${statusLabel}</span>
      </div>
      <div class="invoice-card-body">
        <div class="invoice-stat"><span>발주건수</span><strong>${inv.total_orders || 0}건</strong></div>
        <div class="invoice-stat"><span>총수량</span><strong>${inv.total_quantity || 0}매</strong></div>
        <div class="invoice-stat"><span>총금액</span><strong>${formatKRW(inv.total_amount)}</strong></div>
        ${inv.payment_due_date ? `<div class="invoice-stat"><span>지급예정일</span><strong>${inv.payment_due_date}</strong></div>` : ''}
      </div>
      ${isAdmin ? `
      <div class="invoice-card-actions">
        ${inv.status === 'pending'   ? `<button class="btn btn-sm btn-primary" onclick="confirmInvoice('${inv.id}')">확인완료</button>` : ''}
        ${inv.status === 'confirmed' ? `<button class="btn btn-sm btn-success" onclick="payInvoice('${inv.id}')">지급완료</button>` : ''}
        <button class="btn btn-sm btn-outline" onclick="setPaymentDueDate('${inv.id}')">지급예정일 설정</button>
        <button class="btn btn-sm btn-secondary" onclick="downloadInvoicePDF('${inv.id}')">PDF 다운로드</button>
      </div>` : `
      <div class="invoice-card-actions">
        <button class="btn btn-sm btn-secondary" onclick="downloadInvoicePDF('${inv.id}')">PDF 다운로드</button>
      </div>`}
    </div>`;
}
