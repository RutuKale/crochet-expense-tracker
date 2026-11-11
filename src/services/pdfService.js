/**
 * Wooly Bloom - Luxury Invoice PDF Generator
 * Generates an elegant, printable PDF invoice with business branding
 * 
 * Fixes: Uses standard ASCII currency format ("Rs. X,XXX.00") instead of unicode '₹'
 * to prevent font encoding corruption (which caused small first digits / garbled characters in standard jsPDF Helvetica).
 */

import { jsPDF } from 'jspdf';
import { formatDate } from '../domain/formatters.js';
import { LOGO_BASE64 } from '../assets/logoBase64.js';

/**
 * Cleanly format currency for jsPDF with standard ASCII characters.
 * Guarantees uniform 2-decimal precision and eliminates font encoding issues.
 * @param {number|string} amount 
 * @returns {string} e.g. "Rs. 1,900.00"
 */
export function formatPDFCurrency(amount) {
  const numeric = typeof amount === 'number' && !isNaN(amount) ? amount : Number(amount) || 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);

  return `Rs. ${formatted}`;
}

/**
 * Generate and download a stylish, brand-aligned PDF invoice for Wooly Bloom
 * @param {Object} sale - Sale/Invoice data object
 * @param {Object} businessProfile - Business profile metadata
 */
export function generateInvoicePDF(sale, businessProfile) {
  if (!sale) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // 1. HEADER BANNER (Obsidian Noir: #121217 - matches logo circular background)
  const headerHeight = 44;
  doc.setFillColor(18, 18, 23);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Triple-ribbon accent reflecting the logo's yarn bands (Spun Gold, Dusty Rose, Heather Mauve)
  doc.setFillColor(223, 180, 40); // Spun Gold: #DFB428
  doc.rect(0, headerHeight - 2.4, pageWidth, 1.0, 'F');
  doc.setFillColor(185, 78, 98);  // Dusty Rose: #B94E62
  doc.rect(0, headerHeight - 1.4, pageWidth, 0.7, 'F');
  doc.setFillColor(124, 72, 115); // Heather Mauve / Plum: #7C4873
  doc.rect(0, headerHeight - 0.7, pageWidth, 0.7, 'F');

  // Official Logo Embedding (Left)
  const logoX = margin;
  const logoY = 6.5;
  const logoSize = 30;

  try {
    if (LOGO_BASE64) {
      doc.addImage(LOGO_BASE64, 'PNG', logoX, logoY, logoSize, logoSize);
    }
  } catch (err) {
    console.warn('Could not embed logo image in PDF', err);
  }

  // Brand Name & Tagline
  const brandTextX = logoX + logoSize + 5;
  doc.setTextColor(223, 180, 40); // Spun Gold (#DFB428)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  const brandName = (businessProfile?.name || 'Wooly Bloom').toUpperCase();
  doc.text(brandName, brandTextX, 16);

  doc.setTextColor(245, 238, 226); // Pearlescent Warm Cream
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    businessProfile?.tagline || 'Crochet Artistry & Bespoke Handmade Goods',
    brandTextX,
    22
  );

  doc.setTextColor(210, 195, 175); // Warm Sand
  doc.setFontSize(7.5);
  const studioAddress = businessProfile?.address || 'Studio 4, Bloom Craft Collective, Pune';
  const studioContact = `Phone: ${businessProfile?.phone || '+91 98765 43210'}  •  ${businessProfile?.email || 'hello@woolybloom.com'}`;
  doc.text(studioAddress, brandTextX, 28);
  doc.text(studioContact, brandTextX, 33);

  // Invoice Title & Meta (Right side of banner)
  const rightX = pageWidth - margin;
  doc.setTextColor(223, 180, 40); // Spun Gold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TAX INVOICE', rightX, 16, { align: 'right' });

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`${sale.invoiceNumber || 'INV-0001'}`, rightX, 23, { align: 'right' });

  doc.setTextColor(210, 195, 175); // Warm Sand
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Date: ${formatDate(sale.date)}`, rightX, 29, { align: 'right' });

  if (sale.orderNumber || sale.id) {
    doc.setFontSize(7);
    doc.setTextColor(175, 160, 140);
    doc.text(`Ref: #${sale.orderNumber || String(sale.id).slice(0, 8)}`, rightX, 34, { align: 'right' });
  }


  // 2. STATUS & INVOICE MEMORANDUM BAR
  doc.setTextColor(124, 72, 115); // Heather Mauve from logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL BILL OF SALE / CASH MEMORANDUM', margin, 52);

  // Status Badge Pill
  const isPaid = (sale.status === 'PAID' || sale.status === 'completed') || (Number(sale.balanceAmount) <= 0);
  const isPartial = (sale.status === 'PARTIALLY_PAID' || (Number(sale.balanceAmount) > 0 && Number(sale.paidAmount) > 0));

  let badgeText = 'PAYMENT PENDING';
  let badgeColor = [185, 78, 98]; // Dusty Rose from logo yarn waves
  if (isPaid) {
    badgeText = 'PAID IN FULL';
    badgeColor = [49, 102, 63]; // Botanical Sage Green from logo bloom leaves
  } else if (isPartial) {
    badgeText = 'PARTIALLY PAID';
    badgeColor = [200, 150, 25]; // Spun Gold from logo hook/rings
  }

  const badgeWidth = 36;
  const badgeHeight = 6.5;
  const badgeX = pageWidth - margin - badgeWidth;
  const badgeY = 47.5;

  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(badgeText, badgeX + (badgeWidth / 2), badgeY + 4.5, { align: 'center' });


  // 3. BILLED FROM & BILLED TO CARDS (Side by side)
  const cardY = 58;
  const cardWidth = 87;
  const cardHeight = 31;
  const rightCardX = margin + cardWidth + 6;

  // Billed From Card
  doc.setFillColor(253, 251, 247); // Pearlescent Warm Cream
  doc.setDrawColor(226, 214, 192); // Soft Sand Border
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, cardY, cardWidth, cardHeight, 2, 2, 'FD');

  // Spun Gold accent stripe on top of Issued By card
  doc.setDrawColor(223, 180, 40);
  doc.setLineWidth(0.8);
  doc.line(margin + 1, cardY, margin + cardWidth - 1, cardY);

  doc.setTextColor(165, 120, 20); // Warm Spun Gold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('ISSUED BY (MAKER & STUDIO):', margin + 4, cardY + 5.5);

  doc.setTextColor(18, 18, 23); // Obsidian Noir
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(businessProfile?.name || 'Wooly Bloom Studio', margin + 4, cardY + 11);

  doc.setTextColor(75, 70, 65);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(businessProfile?.address || 'Studio 4, Bloom Craft Collective, Pune', margin + 4, cardY + 16);
  doc.text(`Phone: ${businessProfile?.phone || '+91 98765 43210'}`, margin + 4, cardY + 20.5);
  doc.text(`Email: ${businessProfile?.email || 'hello@woolybloom.com'}`, margin + 4, cardY + 25);

  // Billed To Card
  doc.setFillColor(253, 251, 247); // Pearlescent Warm Cream
  doc.setDrawColor(226, 214, 192); // Soft Sand Border
  doc.setLineWidth(0.3);
  doc.roundedRect(rightCardX, cardY, cardWidth, cardHeight, 2, 2, 'FD');

  // Dusty Rose accent stripe on top of Billed To card
  doc.setDrawColor(185, 78, 98);
  doc.setLineWidth(0.8);
  doc.line(rightCardX + 1, cardY, rightCardX + cardWidth - 1, cardY);

  doc.setTextColor(185, 78, 98); // Dusty Rose
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('BILLED TO (CLIENT):', rightCardX + 4, cardY + 5.5);

  doc.setTextColor(18, 18, 23); // Obsidian Noir
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(sale.customerName || 'Walk-in Customer', rightCardX + 4, cardY + 11);

  doc.setTextColor(75, 70, 65);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Phone: ${sale.customerPhone || 'Not Provided'}`, rightCardX + 4, cardY + 16);
  doc.text(`Payment Method: ${sale.paymentMethod || 'UPI / Cash'}`, rightCardX + 4, cardY + 20.5);
  doc.text(`Invoice Status: ${isPaid ? 'Settled in Full' : 'Pending Clearance'}`, rightCardX + 4, cardY + 25);


  // 4. LINE ITEMS TABLE
  let currentY = 95;
  const tableWidth = pageWidth - (margin * 2);

  const drawTableHeader = (y) => {
    // Header background: Obsidian Noir
    doc.setFillColor(18, 18, 23);
    doc.roundedRect(margin, y, tableWidth, 8, 1.5, 1.5, 'F');

    // Spun Gold accent line across top of table header
    doc.setFillColor(223, 180, 40);
    doc.rect(margin, y, tableWidth, 0.8, 'F');

    // Header column labels in Spun Gold
    doc.setTextColor(223, 180, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('#', margin + 4, y + 5.3);
    doc.text('HANDCRAFTED ITEM DESCRIPTION', margin + 14, y + 5.3);
    doc.text('QTY', 118, y + 5.3, { align: 'center' });
    doc.text('UNIT PRICE', 152, y + 5.3, { align: 'right' });
    doc.text('AMOUNT', pageWidth - margin - 4, y + 5.3, { align: 'right' });
  };

  drawTableHeader(currentY);
  currentY += 8;

  // Table Rows
  const items = Array.isArray(sale.items) && sale.items.length > 0 ? sale.items : [];

  items.forEach((item, index) => {
    // Pagination check if items list is very long
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
      drawTableHeader(currentY);
      currentY += 8;
    }

    const rowHeight = 7.8;

    // Alternating row background (Soft Warm Cream)
    if (index % 2 === 1) {
      doc.setFillColor(253, 250, 247);
      doc.rect(margin, currentY, tableWidth, rowHeight, 'F');
    }

    // Hairline row separator
    doc.setDrawColor(236, 230, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, currentY + rowHeight, margin + tableWidth, currentY + rowHeight);

    // Row text
    doc.setFontSize(8);

    // Index
    doc.setTextColor(130, 120, 115);
    doc.setFont('helvetica', 'normal');
    doc.text(String(index + 1), margin + 4, currentY + 5);

    // Product Name (truncated if unusually long)
    doc.setTextColor(18, 18, 23); // Obsidian Noir
    doc.setFont('helvetica', 'bold');
    const productName = item.productName || 'Custom Crochet Item';
    const truncatedName = doc.splitTextToSize(productName, 85)[0] || productName;
    doc.text(truncatedName, margin + 14, currentY + 5);

    // Quantity
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(String(item.quantity || 1), 118, currentY + 5, { align: 'center' });

    // Unit Price (Standard ASCII "Rs. X,XXX.00")
    doc.text(formatPDFCurrency(item.unitPrice), 152, currentY + 5, { align: 'right' });

    // Total Amount (Standard ASCII "Rs. X,XXX.00")
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(18, 18, 23);
    doc.text(formatPDFCurrency(item.total), pageWidth - margin - 4, currentY + 5, { align: 'right' });

    currentY += rowHeight;
  });


  // 5. TOTALS AND CARE NOTES SECTION
  let totalsStartY = Math.max(currentY + 6, 140);

  // Pagination check for bottom summary
  if (totalsStartY + 52 > 268) {
    doc.addPage();
    totalsStartY = 20;
  }

  const leftBoxWidth = 92;
  const rightBoxWidth = 82;
  const rightBoxX = margin + leftBoxWidth + 6;
  const sectionHeight = 49;

  // Left Box: Care Guide & Order Notes
  doc.setFillColor(253, 251, 247);
  doc.setDrawColor(226, 214, 192);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, totalsStartY, leftBoxWidth, sectionHeight, 2, 2, 'FD');

  // Heather Mauve top accent line
  doc.setDrawColor(124, 72, 115);
  doc.setLineWidth(0.8);
  doc.line(margin + 1, totalsStartY, margin + leftBoxWidth - 1, totalsStartY);

  doc.setTextColor(124, 72, 115); // Heather Mauve
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('ORDER NOTES & HANDMADE CARE INSTRUCTIONS', margin + 4, totalsStartY + 5.5);

  doc.setTextColor(65, 60, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  let noteLineY = totalsStartY + 11.5;

  if (sale.notes) {
    doc.setTextColor(185, 78, 98); // Dusty Rose accent for note
    doc.setFont('helvetica', 'bold');
    doc.text(`Note: ${sale.notes}`, margin + 4, noteLineY);
    noteLineY += 5;
    doc.setTextColor(65, 60, 55);
    doc.setFont('helvetica', 'normal');
  }

  doc.text('• 100% Handcrafted with premium yarns & materials.', margin + 4, noteLineY);
  doc.text('• Gentle cold hand wash only; lay flat to dry in shade.', margin + 4, noteLineY + 4.5);
  doc.text('• Do not wring, bleach, or tumble dry at high heat.', margin + 4, noteLineY + 9);
  doc.text('• For custom commissions: contact woolybloom.studio@gmail.com', margin + 4, noteLineY + 13.5);
  doc.text('• Thank you for supporting independent handmade art!', margin + 4, noteLineY + 18);


  // Right Box: Financial Summary Breakdown
  doc.setFillColor(253, 251, 247);
  doc.setDrawColor(226, 214, 192);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightBoxX, totalsStartY, rightBoxWidth, sectionHeight, 2, 2, 'FD');

  // Spun Gold top accent line
  doc.setDrawColor(223, 180, 40);
  doc.setLineWidth(0.8);
  doc.line(rightBoxX + 1, totalsStartY, rightBoxX + rightBoxWidth - 1, totalsStartY);

  const summaryLabelX = rightBoxX + 5;
  const summaryValueX = rightBoxX + rightBoxWidth - 5;
  let summaryY = totalsStartY + 6.5;

  // Subtotal
  doc.setTextColor(70, 65, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Subtotal:', summaryLabelX, summaryY);
  doc.text(formatPDFCurrency(sale.subtotal), summaryValueX, summaryY, { align: 'right' });

  // Discount (if any)
  if (sale.discountAmount > 0) {
    summaryY += 4.8;
    doc.setTextColor(185, 78, 98); // Dusty Rose
    doc.text('Discount Applied:', summaryLabelX, summaryY);
    doc.text(`- ${formatPDFCurrency(sale.discountAmount)}`, summaryValueX, summaryY, { align: 'right' });
  }

  // Shipping (if any)
  if (sale.shippingCharged > 0) {
    summaryY += 4.8;
    doc.setTextColor(70, 65, 60);
    doc.text('Shipping & Handling:', summaryLabelX, summaryY);
    doc.text(`+ ${formatPDFCurrency(sale.shippingCharged)}`, summaryValueX, summaryY, { align: 'right' });
  }

  // Divider line before Grand Total
  summaryY += 3.5;
  doc.setDrawColor(226, 214, 192);
  doc.setLineWidth(0.3);
  doc.line(summaryLabelX, summaryY, summaryValueX, summaryY);

  // Grand Total Banner (Obsidian Noir with Spun Gold Border & Text)
  summaryY += 2;
  const grandTotalBannerHeight = 9.5;
  doc.setFillColor(18, 18, 23);
  doc.roundedRect(rightBoxX + 2, summaryY, rightBoxWidth - 4, grandTotalBannerHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(223, 180, 40);
  doc.setLineWidth(0.4);
  doc.roundedRect(rightBoxX + 2, summaryY, rightBoxWidth - 4, grandTotalBannerHeight, 1.5, 1.5, 'S');

  doc.setTextColor(223, 180, 40); // Spun Gold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TOTAL BILL:', summaryLabelX + 1, summaryY + 6.2);
  doc.setFontSize(9.5);
  doc.text(formatPDFCurrency(sale.totalAmount), summaryValueX - 1, summaryY + 6.2, { align: 'right' });

  // Amount Paid
  summaryY += grandTotalBannerHeight + 4.5;
  doc.setTextColor(49, 102, 63); // Botanical Sage Green from logo bloom
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Amount Paid:', summaryLabelX, summaryY);
  doc.text(formatPDFCurrency(sale.paidAmount), summaryValueX, summaryY, { align: 'right' });

  // Balance Due / Status
  summaryY += 4.5;
  if (sale.balanceAmount > 0) {
    doc.setTextColor(185, 78, 98); // Dusty Rose from logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Balance Due:', summaryLabelX, summaryY);
    doc.text(formatPDFCurrency(sale.balanceAmount), summaryValueX, summaryY, { align: 'right' });
  } else {
    doc.setTextColor(49, 102, 63); // Botanical Sage Green from logo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Balance: Nil (Fully Cleared)', summaryLabelX, summaryY);
  }


  // 6. ELEGANT FOOTER
  const footerY = 277;

  // Signature Triple-ribbon decorative rule (Spun Gold, Dusty Rose, Heather Mauve)
  doc.setFillColor(223, 180, 40); // Spun Gold
  doc.rect(margin, footerY, tableWidth, 0.6, 'F');
  doc.setFillColor(185, 78, 98);  // Dusty Rose
  doc.rect(margin, footerY + 0.8, tableWidth, 0.4, 'F');
  doc.setFillColor(124, 72, 115); // Heather Mauve
  doc.rect(margin, footerY + 1.4, tableWidth, 0.4, 'F');

  // Maker's note
  doc.setFontSize(7.5);
  doc.setTextColor(115, 105, 100);
  doc.setFont('helvetica', 'italic');
  doc.text(
    businessProfile?.invoiceSettings?.footerNote || 'Handmade with love & patience. Each piece is crafted with care by Wooly Bloom.',
    pageWidth / 2,
    footerY + 5.5,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(155, 145, 140);
  doc.text(
    'Wooly Bloom Studio  •  Crochet Artistry & Bespoke Goods  •  Tax Invoice  •  Generated Electronically',
    pageWidth / 2,
    footerY + 9.5,
    { align: 'center' }
  );

  // Trigger browser download
  const safeFileName = sale.invoiceNumber ? `${sale.invoiceNumber}.pdf` : `invoice-${Date.now()}.pdf`;
  doc.save(safeFileName);
}
