import { describe, it, expect, vi } from 'vitest';
import { formatPDFCurrency, generateInvoicePDF } from '../pdfService.js';

describe('PDF Service & Invoice Formatter', () => {
  it('formats currency with ASCII Rs. and uniform two decimal places', () => {
    expect(formatPDFCurrency(1900)).toBe('Rs. 1,900.00');
    expect(formatPDFCurrency(0)).toBe('Rs. 0.00');
    expect(formatPDFCurrency(125.5)).toBe('Rs. 125.50');
    expect(formatPDFCurrency(54321.75)).toBe('Rs. 54,321.75');
    // Ensure no unicode Rupee symbol (₹) is present
    expect(formatPDFCurrency(1000)).not.toContain('₹');
    expect(formatPDFCurrency(1000)).toMatch(/^Rs\. \d/);
  });

  it('runs generateInvoicePDF without throwing errors', () => {
    const mockSale = {
      id: 'sale-1',
      invoiceNumber: 'INV-2026-001',
      date: new Date('2026-10-27T10:00:00Z'),
      customerName: 'Ananya Sharma',
      customerPhone: '+91 98123 45678',
      paymentMethod: 'UPI',
      status: 'PAID',
      items: [
        { productName: 'Handmade Crochet Sunflower Tote Bag', quantity: 1, unitPrice: 1200, total: 1200 },
        { productName: 'Crochet Daisy Coaster Set (4 pcs)', quantity: 2, unitPrice: 350, total: 700 },
      ],
      subtotal: 1900,
      discountAmount: 100,
      shippingCharged: 50,
      totalAmount: 1850,
      paidAmount: 1850,
      balanceAmount: 0,
      notes: 'Gift wrap requested with handwritten note.',
    };

    const mockProfile = {
      name: 'Wooly Bloom',
      tagline: 'Crochet Artistry & Bespoke Handmade Goods',
      address: 'Studio 4, Bloom Craft Collective, Pune',
      phone: '+91 98765 43210',
      email: 'hello@woolybloom.com',
    };

    // Should generate without errors
    expect(() => generateInvoicePDF(mockSale, mockProfile)).not.toThrow();
  });
});
