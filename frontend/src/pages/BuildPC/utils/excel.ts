import type { SelectedParts, PriceTotals, SelectedQuantities } from '../types';


const escapeHtml = (s: string) => {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
};

const fmtMoney = (v: number) => `${v.toLocaleString('vi-VN')} ₫`;

export const exportQuotationExcel = (selected: SelectedParts, quantities: SelectedQuantities = {} as SelectedQuantities, totals: PriceTotals, meta: Record<string, string> = {}) => {
  const entries = (Object.keys(selected) as Array<keyof SelectedParts>).map(k => ({ key: k, product: selected[k], qty: quantities[k] ?? 1 }));
  const rows = [];

  // Header rows
  rows.push(['CÔNG TY TNHH AEKH04']);
  rows.push(['']);
  rows.push(['Showroom: 96A Đ. Trần Phú, P. Mộ Lao, Hà Đông, Hà Nội']);
  rows.push(['Hotline: 0399 999 999']);
  rows.push(['Website: https://aekh04.com.vn']);
  rows.push(['']);
  rows.push(['BẢNG BÁO GIÁ THIẾT BỊ']);
  rows.push(['']);

  // Recipient block
  rows.push(['Kính gửi:', meta.customer_name || '']);
  rows.push(['Nhân viên KD:', meta.sales_name || '']);
  rows.push(['Địa chỉ:', meta.address || '']);
  rows.push(['Điện thoại:', meta.phone || '']);
  rows.push(['MST:', meta.tax_code || '']);
  rows.push(['Email:', meta.email || '']);
  rows.push(['']);
  rows.push(['Ngày:', meta.date_text || '………, ………', 'Giá trị tới:', meta.valid_until_text || '………, ………']);
  rows.push(['Lần báo giá:', meta.quotation_no || '1']);
  rows.push(['']);

  // Table header
  rows.push(['STT', 'Mã sản phẩm', 'Tên sản phẩm', 'Bảo hành', 'Số lượng', 'Đơn giá', 'Thành tiền']);

  // Up to 10 rows
  for (let i = 0; i < 10; i++) {
    const it = entries.filter(e => e.product)[i];
    if (it && it.product) {
      const price = it.product.price;
      const qty = it.qty ?? 1;
      rows.push([
        String(i + 1),
        `P-${it.product.id}`,
        it.product.name,
        'Theo NSX',
        String(qty),
        fmtMoney(price),
        fmtMoney(price * qty),
      ]);
    } else {
      rows.push([String(i + 1), '', '', '', '', '', '']);
    }
  }

  rows.push(['']);
  rows.push(['Tổng tiền đã bao gồm VAT:', fmtMoney(totals.total)]);
  rows.push(['']);

  // Terms
  rows.push(['Các điều kiện thương mại:']);
  rows.push(['Ghi chú: Hình ảnh minh họa, chi tiết và màu sắc có thể khác với thực tế.']);
  rows.push(['Giao hàng: Trong vòng 02 ngày làm việc sau khi ký Hợp đồng hoặc xác nhận đơn hàng.']);
  rows.push(['Bảo hành: Theo tiêu chuẩn của Nhà sản xuất.']);
  rows.push(['Tài khoản ngân hàng: Ngân hàng TMCP Ngoại Thương Việt Nam – Chi nhánh Hà Đông.']);
  rows.push(['Tên tài khoản: Công ty TNHH AEKH04']);
  rows.push(['Thanh toán: Thanh toán 100% giá trị đơn hàng khi nhận hàng.']);
  rows.push(['Số tài khoản VNĐ: 0301000999999 – Ngân hàng Vietcombank – Chi nhánh Hà Đông.']);
  rows.push(['Giá: Đã bao gồm VAT, có thể thay đổi mà chưa kịp báo trước.']);
  rows.push(['']);
  rows.push(['XÁC NHẬN CỦA QUÝ KHÁCH', '', '', '', '', '', 'ĐẠI DIỆN CỦA AEKH04']);
  rows.push(['(Ký, ghi rõ họ tên)', '', '', '', '', '', '(Ký, ghi rõ họ tên)']);

  // Build HTML table
  // Build a nicer HTML layout: centered header, recipient block, styled items table, terms, signatures
  const headerHtml = `
    <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
      <tr>
        <td colspan="7" style="width:100%;padding:0;text-align:center;">
          <div style="display:inline-block;width:100%;max-width:100%;text-align:center;border-bottom:2px solid #000;padding-bottom:6px;">
            <div style="font-weight:bold;font-size:28px;line-height:1.05;">CÔNG TY TNHH AEKH04</div>
            <div style="font-size:14px;margin-top:6px;">Showroom: 96A Đ. Trần Phú, P. Mộ Lao, Hà Đông, Hà Nội</div>
            <div style="font-size:14px;margin-top:2px;">Hotline: 0399 999 999</div>
            <div style="font-size:14px;margin-top:2px;">Website: https://aekh04.com.vn</div>
          </div>
        </td>
      </tr>
      <tr><td colspan="7" style="height:10px"></td></tr>
      <tr><td colspan="7" style="text-align:center;font-weight:bold;font-size:24px;padding:8px;background:#f0f0f0;">BẢNG BÁO GIÁ THIẾT BỊ</td></tr>
    </table>
  `;

  const recipientHtml = `
    <table style="width:100%;border-collapse:collapse;margin-top:8px;">
      <tr>
        <td style="vertical-align:top;width:50%;padding:4px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="width:120px;font-weight:bold;">Kính gửi:</td><td>${escapeHtml(meta.customer_name || '')}</td></tr>
            <tr><td style="font-weight:bold;">Nhân viên KD:</td><td>${escapeHtml(meta.sales_name || '')}</td></tr>
            <tr><td style="font-weight:bold;">Địa chỉ:</td><td>${escapeHtml(meta.address || '')}</td></tr>
            <tr><td style="font-weight:bold;">Điện thoại:</td><td>${escapeHtml(meta.phone || '')}</td></tr>
            <tr><td style="font-weight:bold;">MST:</td><td>${escapeHtml(meta.tax_code || '')}</td></tr>
            <tr><td style="font-weight:bold;">Email:</td><td>${escapeHtml(meta.email || '')}</td></tr>
          </table>
        </td>
        <td style="vertical-align:top;width:50%;padding:4px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="font-weight:bold;">Ngày:</td><td>${escapeHtml(meta.date_text || '………, ………')}</td></tr>
            <tr><td style="font-weight:bold;">Giá trị tới:</td><td>${escapeHtml(meta.valid_until_text || '………, ………')}</td></tr>
            <tr><td style="font-weight:bold;">Lần báo giá:</td><td>${escapeHtml(meta.quotation_no || '1')}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  // Items table header
  const itemsHeader = `
    <tr style="background:#2f75b5;color:#fff;font-weight:bold;">
      <th style="border:1px solid #000;padding:6px;">STT</th>
      <th style="border:1px solid #000;padding:6px;">Mã sản phẩm</th>
      <th style="border:1px solid #000;padding:6px;">Tên sản phẩm</th>
      <th style="border:1px solid #000;padding:6px;">Bảo hành</th>
      <th style="border:1px solid #000;padding:6px;">Số lượng</th>
      <th style="border:1px solid #000;padding:6px;">Đơn giá</th>
      <th style="border:1px solid #000;padding:6px;">Thành tiền</th>
    </tr>
  `;

  // itemsHtmlRows and emptyRowsHtml are used to render the 10-table rows

  // Build items from earlier 'items' variable
  const entriesFiltered = entries.filter(e => e.product);
  const itemsHtmlRows = entriesFiltered.map((it, i) => {
    const price = it.product!.price;
    const qty = it.qty ?? 1;
    return `<tr>
      <td style="border:1px solid #000;padding:6px;text-align:center">${i + 1}</td>
      <td style="border:1px solid #000;padding:6px">${escapeHtml('P-' + it.product!.id)}</td>
      <td style="border:1px solid #000;padding:6px">${escapeHtml(it.product!.name)}</td>
      <td style="border:1px solid #000;padding:6px;text-align:center">Theo NSX</td>
      <td style="border:1px solid #000;padding:6px;text-align:center">${qty}</td>
      <td style="border:1px solid #000;padding:6px;text-align:right">${escapeHtml(fmtMoney(price))}</td>
      <td style="border:1px solid #000;padding:6px;text-align:right">${escapeHtml(fmtMoney(price * qty))}</td>
    </tr>`;
  }).slice(0, 10);

  // fill empty rows to reach 10
  const emptyRowsHtml = [];
  for (let i = itemsHtmlRows.length; i < 10; i++) {
    emptyRowsHtml.push(`<tr>
      <td style="border:1px solid #000;padding:6px;text-align:center">${i + 1}</td>
      <td style="border:1px solid #000;padding:6px"></td>
      <td style="border:1px solid #000;padding:6px"></td>
      <td style="border:1px solid #000;padding:6px"></td>
      <td style="border:1px solid #000;padding:6px"></td>
      <td style="border:1px solid #000;padding:6px"></td>
      <td style="border:1px solid #000;padding:6px"></td>
    </tr>`);
  }

  const totalHtml = `<tr>
    <td colspan="6" style="border:1px solid #000;padding:6px;text-align:right;font-weight:bold">Tổng tiền đã bao gồm VAT:</td>
    <td style="border:1px solid #000;padding:6px;text-align:right;font-weight:bold">${escapeHtml(fmtMoney(totals.total))}</td>
  </tr>`;

  const termsHtml = `
    <tr><td colspan="7" style="padding:6px;font-weight:bold;">Các điều kiện thương mại:</td></tr>
    <tr><td colspan="7" style="padding:4px;">1. Ghi chú: Hình ảnh minh họa, chi tiết và màu sắc có thể khác với thực tế.</td></tr>
    <tr><td colspan="7" style="padding:4px;">2. Giao hàng: Trong vòng 02 ngày làm việc sau khi ký Hợp đồng hoặc xác nhận đơn hàng.</td></tr>
    <tr><td colspan="7" style="padding:4px;">3. Bảo hành: Theo tiêu chuẩn của Nhà sản xuất.</td></tr>
    <tr><td colspan="7" style="padding:4px;">4. Tài khoản ngân hàng: Ngân hàng TMCP Ngoại Thương Việt Nam – Chi nhánh Hà Đông.</td></tr>
    <tr><td colspan="7" style="padding:4px;">5. Tên tài khoản: Công ty TNHH AEKH04</td></tr>
    <tr><td colspan="7" style="padding:4px;">6. Thanh toán: Thanh toán 100% giá trị đơn hàng khi nhận hàng.</td></tr>
    <tr><td colspan="7" style="padding:4px;">7. Số tài khoản VNĐ: 0301000999999 – Ngân hàng Vietcombank – Chi nhánh Hà Đông.</td></tr>
    <tr><td colspan="7" style="padding:4px;">8. Giá: Đã bao gồm VAT, có thể thay đổi mà chưa kịp báo trước.</td></tr>
  `;

  const signatureHtml = `
    <tr>
      <td colspan="3" style="padding-top:28px;text-align:center;font-weight:bold">XÁC NHẬN CỦA QUÝ KHÁCH</td>
      <td colspan="4" style="padding-top:28px;text-align:center;font-weight:bold">ĐẠI DIỆN CỦA AEKH04</td>
    </tr>
    <tr>
      <td colspan="3" style="text-align:center;padding-top:4px;font-size:11px">(Ký, ghi rõ họ tên)</td>
      <td colspan="4" style="text-align:center;padding-top:4px;font-size:11px">(Ký, ghi rõ họ tên & đóng dấu)</td>
    </tr>
  `;

  const html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:Print><x:ValidPrinterInfo/></x:Print></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <meta http-equiv="content-type" content="text/html; charset=UTF-8"/>
    </head>
    <body>
      ${headerHtml}
      ${recipientHtml}
      <table style="width:100%;border-collapse:collapse;margin-top:8px;">
        ${itemsHeader}
        ${itemsHtmlRows.join('')}
        ${emptyRowsHtml.join('')}
        ${totalHtml}
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        ${termsHtml}
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        ${signatureHtml}
      </table>
    </body>
  </html>`;

  // Create blob with BOM to ensure UTF-8 in Excel
  const blob = new Blob(['\uFEFF', html], { type: 'application/vnd.ms-excel;charset=UTF-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bang-bao-gia-aekh04.xls';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export default exportQuotationExcel;
