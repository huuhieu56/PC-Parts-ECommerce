import jsPDF from 'jspdf';
import type { SelectedParts, PriceTotals } from '../types';

export const exportPcBuildPdf = async (selected: SelectedParts, totals: PriceTotals) => {
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(16);
    doc.text('Computer Shop - Cấu hình PC', 10, y);
    y += 8;
    doc.setFontSize(12);
    Object.entries(selected).forEach(([k, p]) => {
        doc.text(`${k.toUpperCase()}: ${p ? p.name : '-'}`, 10, y);
        y += 6;
        if (y > 280) { doc.addPage(); y = 10; }
    });
    y += 4;
    doc.text(`Tạm tính: ${totals.subtotal.toLocaleString('vi-VN')} ₫`, 10, y); y += 6;
    doc.text(`Thuế (VAT): ${totals.tax.toLocaleString('vi-VN')} ₫`, 10, y); y += 6;
    doc.text(`Tổng: ${totals.total.toLocaleString('vi-VN')} ₫`, 10, y);
    doc.save('pc-build.pdf');
};
