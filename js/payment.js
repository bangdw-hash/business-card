// =====================================================
// Monthly Payment Management Utilities
// js/payment.js
// =====================================================

'use strict';

/**
 * Load all monthly invoices.
 * @returns {Promise<Object[]>}
 */
async function loadMonthlyInvoices() {
  try {
    const { data, error } = await window.supabase
      .from('monthly_invoices')
      .select('*')
      .order('invoice_year', { ascending: false })
      .order('invoice_month', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('[Payment] 인보이스 로드 실패:', e);
    return [];
  }
}

/**
 * Get or create a monthly invoice record.
 * @param {number} year
 * @param {number} month
 * @returns {Promise<Object|null>}
 */
async function getOrCreateInvoice(year, month) {
  try {
    // Try to find existing
    const { data: existing, error: fetchError } = await window.supabase
      .from('monthly_invoices')
      .select('*')
      .eq('invoice_year', year)
      .eq('invoice_month', month)
      .single();

    if (!fetchError && existing) {
      return existing;
    }

    // Create new
    const { data: created, error: createError } = await window.supabase
      .from('monthly_invoices')
      .insert({
        invoice_year: year,
        invoice_month: month,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) throw createError;
    return created;
  } catch (e) {
    console.error('[Payment] 인보이스 생성 실패:', e);
    return null;
  }
}

/**
 * Update invoice status and optional fields.
 * @param {string} invoiceId
 * @param {string} status - 'pending' | 'confirmed' | 'paid'
 * @param {Object} data - additional fields to update
 * @returns {Promise<boolean>}
 */
async function updateInvoiceStatus(invoiceId, status, data) {
  try {
    const updateData = Object.assign({ status: status }, data || {});
    if (status === 'paid') {
      updateData.payment_date = new Date().toISOString().slice(0, 10);
    }

    const { error } = await window.supabase
      .from('monthly_invoices')
      .update(updateData)
      .eq('id', invoiceId);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('[Payment] 인보이스 상태 업데이트 실패:', e);
    return false;
  }
}

/**
 * Get all card_requests linked to a specific month.
 * @param {number} year
 * @param {number} month
 * @returns {Promise<Object[]>}
 */
async function getOrdersForMonth(year, month) {
  try {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate   = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data, error } = await window.supabase
      .from('card_requests')
      .select('*')
      .in('status', ['ordered', 'printing', 'delivered_to_admin', 'delivered_to_applicant'])
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('[Payment] 주문 조회 실패:', e);
    return [];
  }
}

/**
 * Recalculate and update invoice totals based on card_requests.
 * @param {string} invoiceId
 * @returns {Promise<boolean>}
 */
async function recalculateInvoiceTotals(invoiceId) {
  try {
    const { data: invoice, error: invError } = await window.supabase
      .from('monthly_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invError || !invoice) throw invError || new Error('Invoice not found');

    const orders = await getOrdersForMonth(invoice.invoice_year, invoice.invoice_month);
    const linked = orders.filter(function(o) { return o.invoice_id === invoiceId; });

    const totalOrders   = linked.length;
    const totalQuantity = linked.reduce(function(sum, o) { return sum + (o.quantity || 0); }, 0);
    const totalAmount   = linked.reduce(function(sum, o) { return sum + (parseFloat(o.total_price) || 0); }, 0);

    const { error: updateError } = await window.supabase
      .from('monthly_invoices')
      .update({
        total_orders:   totalOrders,
        total_quantity: totalQuantity,
        total_amount:   totalAmount,
      })
      .eq('id', invoiceId);

    if (updateError) throw updateError;
    return true;
  } catch (e) {
    console.error('[Payment] 합계 재계산 실패:', e);
    return false;
  }
}

/**
 * Generate and download an invoice PDF using jsPDF + AutoTable.
 * @param {Object} invoice
 * @param {Object[]} orders
 */
function generateInvoicePDF(invoice, orders) {
  if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
    alert('jsPDF 라이브러리가 로드되지 않았습니다. 페이지를 새로고침하고 다시 시도해주세요.');
    return;
  }

  try {
    var jsPDFClass = (typeof window.jspdf !== 'undefined') ? window.jspdf.jsPDF : jsPDF;
    var doc = new jsPDFClass({ orientation: 'p', unit: 'mm', format: 'a4' });

    var pageW = doc.internal.pageSize.getWidth();
    var margin = 20;
    var contentW = pageW - margin * 2;

    // ---- Header ----
    doc.setFillColor(0, 48, 135);
    doc.rect(0, 0, pageW, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('ASEA Aviation Vocational School', margin, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('아세아항공직업전문학교', margin, 23);
    doc.text(CONFIG.school.address || '', margin, 29);

    // Title
    doc.setTextColor(0, 48, 135);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('발주 내역서', pageW / 2, 50, { align: 'center' });

    // Period
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(60, 60, 60);
    doc.text(
      invoice.invoice_year + '년 ' + invoice.invoice_month + '월',
      pageW / 2, 60, { align: 'center' }
    );

    // Invoice info box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, 65, contentW, 28, 2, 2, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('발주 업체:', margin + 5, 74);
    doc.text('거래업체:', margin + contentW / 2 + 5, 74);

    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(CONFIG.vendor.companyName || '-', margin + 35, 74);
    doc.text(CONFIG.school.nameKr || '-', margin + contentW / 2 + 35, 74);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('상태:', margin + 5, 83);
    doc.text('지급 예정일:', margin + contentW / 2 + 5, 83);

    var statusLabel = { pending: '확인 대기', confirmed: '확인 완료', paid: '지급 완료' };
    doc.setTextColor(30, 30, 30);
    doc.text(statusLabel[invoice.status] || invoice.status, margin + 35, 83);
    doc.text(invoice.payment_due_date || '-', margin + contentW / 2 + 35, 83);

    // Order table
    var tableStartY = 100;

    var tableColumns = [
      { header: '번호', dataKey: 'no' },
      { header: '신청일', dataKey: 'date' },
      { header: '성명', dataKey: 'name' },
      { header: '부서', dataKey: 'dept' },
      { header: '직급', dataKey: 'pos' },
      { header: '수량', dataKey: 'qty' },
      { header: '단가', dataKey: 'unit' },
      { header: '금액', dataKey: 'total' },
      { header: '비고', dataKey: 'note' },
    ];

    var tableRows = orders.map(function(order, idx) {
      var createdDate = order.created_at ? new Date(order.created_at).toLocaleDateString('ko-KR') : '-';
      var unitP = order.unit_price ? Number(order.unit_price).toLocaleString('ko-KR') + '원' : '-';
      var totalP = order.total_price ? Number(order.total_price).toLocaleString('ko-KR') + '원' : '-';
      return {
        no: String(idx + 1),
        date: createdDate,
        name: order.applicant_name || '-',
        dept: order.department || '-',
        pos: order.position_kr || '-',
        qty: String(order.quantity || 0) + '장',
        unit: unitP,
        total: totalP,
        note: order.paper_type === 'premium' ? '고급지' : '일반지',
      };
    });

    // Totals row
    var totalAmt = orders.reduce(function(s, o) { return s + (parseFloat(o.total_price) || 0); }, 0);
    var totalQty = orders.reduce(function(s, o) { return s + (o.quantity || 0); }, 0);

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: tableStartY,
        head: [tableColumns.map(function(c) { return c.header; })],
        body: tableRows.map(function(r) {
          return tableColumns.map(function(c) { return r[c.dataKey]; });
        }),
        foot: [['', '', '', '', '합계', totalQty + '장', '', totalAmt.toLocaleString('ko-KR') + '원', '']],
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [0, 48, 135],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        footStyles: {
          fillColor: [240, 244, 255],
          textColor: [0, 48, 135],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 22 },
          2: { cellWidth: 22 },
          3: { cellWidth: 28 },
          4: { cellWidth: 22 },
          5: { cellWidth: 15, halign: 'center' },
          6: { cellWidth: 22, halign: 'right' },
          7: { cellWidth: 22, halign: 'right' },
          8: { cellWidth: 15 },
        },
        margin: { left: margin, right: margin },
      });
    } else {
      // Fallback: simple text table
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text('(자동 테이블 생성 플러그인이 필요합니다 - jspdf-autotable)', margin, tableStartY + 10);
      tableRows.forEach(function(r, i) {
        doc.text(
          (i+1) + '. ' + r.name + ' | ' + r.dept + ' | ' + r.qty + ' | ' + r.total,
          margin,
          tableStartY + 20 + i * 8
        );
      });
    }

    // Footer
    var finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : tableStartY + tableRows.length * 10 + 30;

    // Totals summary
    doc.setFillColor(0, 48, 135);
    doc.rect(margin, finalY, contentW, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(
      '의 총 발주: ' + orders.length + '건  |  의 총 수량: ' + totalQty + '장  |  의 총 금액: ' + totalAmt.toLocaleString('ko-KR') + '원',
      pageW / 2,
      finalY + 8,
      { align: 'center' }
    );

    // Signature area
    var sigY = finalY + 25;
    doc.setDrawColor(180, 180, 180);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Vendor sig box
    doc.rect(margin, sigY, 70, 35);
    doc.text('확인 (발주업체)', margin + 35, sigY + 7, { align: 'center' });
    doc.text('서명: ___________________', margin + 35, sigY + 22, { align: 'center' });
    doc.text('날짜:  ___________________', margin + 35, sigY + 30, { align: 'center' });

    // School sig box
    doc.rect(pageW - margin - 70, sigY, 70, 35);
    doc.text('확인 (학교)', pageW - margin - 35, sigY + 7, { align: 'center' });
    doc.text('서명: ___________________', pageW - margin - 35, sigY + 22, { align: 'center' });
    doc.text('날짜:  ___________________', pageW - margin - 35, sigY + 30, { align: 'center' });

    // Generated timestamp
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(
      '생성일시: ' + new Date().toLocaleString('ko-KR'),
      margin,
      doc.internal.pageSize.getHeight() - 8
    );

    // Save
    var filename = '아세아항공_발주내역서_' +
      invoice.invoice_year + '년' + String(invoice.invoice_month).padStart(2, '0') + '월.pdf';
    doc.save(filename);
    console.info('[Payment] PDF 생성 완료: ' + filename);
  } catch (e) {
    console.error('[Payment] PDF 생성 실패:', e);
    alert('PDF 생성 중 오류가 발생했습니다.\n' + e.message);
  }
}

/**
 * Format currency in Korean Won
 * @param {number} amount
 * @returns {string}
 */
function formatKRW(amount) {
  if (amount == null || isNaN(amount)) return '-';
  return Number(amount).toLocaleString('ko-KR') + '원';
}

/**
 * Format year/month as display string
 * @param {number} year
 * @param {number} month
 * @returns {string}
 */
function formatYearMonth(year, month) {
  return year + '년 ' + month + '월';
}
