import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CateringProduct, CateringPackage } from './types';
import { getDisplayPrice, getPricingTypeLabel } from './pricing';

// ── Helpers ──────────────────────────────────────────────────────────────────

interface AdminProduct extends CateringProduct {
  is_active: boolean;
  sort_position: number;
}

interface AdminPackage extends CateringPackage {
  is_active: boolean;
  sort_position: number;
}

function pricingDetail(product: CateringProduct): string {
  const p = product.pricing;
  switch (p.type) {
    case 'tray':
      return p.sizes.map(s => `${s.size}: $${s.price} (serves ${s.servesMin}-${s.servesMax})`).join(', ');
    case 'pan':
      return p.sizes.map(s => `${s.size}: $${s.price} (serves ${s.servesMin}-${s.servesMax})`).join(', ');
    case 'per-person':
      return `$${p.pricePerPerson}/person${p.minOrder ? ` (min ${p.minOrder})` : ''}`;
    case 'per-dozen':
      return `$${p.pricePerDozen}/dozen (serves ${p.servesPerDozen})`;
    case 'per-each':
      return `$${p.priceEach} each${p.minOrder ? ` (min ${p.minOrder})` : ''}`;
    case 'per-container':
      return `$${p.pricePerContainer}/container (serves ${p.servesPerContainer})`;
    case 'flat':
      return `$${p.flatPrice} flat`;
    default:
      return '';
  }
}

function today(): string {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── PDF Export ───────────────────────────────────────────────────────────────

export function exportMenuPDF(products: AdminProduct[], packages: AdminPackage[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title page info
  doc.setFontSize(22);
  doc.setTextColor(26, 26, 26);
  doc.text('Lexington Betty Smokehouse', 40, 45);
  doc.setFontSize(11);
  doc.setTextColor(155, 145, 137);
  doc.text(`Full Menu Export — ${today()}`, 40, 62);

  // ── Products table ──
  const activeProducts = products.filter(p => p.is_active);
  const inactiveProducts = products.filter(p => !p.is_active);

  doc.setFontSize(14);
  doc.setTextColor(26, 26, 26);
  doc.text(`Active Menu Items (${activeProducts.length})`, 40, 88);

  const productRows = activeProducts.map(p => [
    p.title,
    p.categories.join(', '),
    p.pricing.type,
    getDisplayPrice(p),
    pricingDetail(p),
    (p.tags || []).join(', '),
    p.featured ? 'Yes' : '',
    p.minOrderQuantity ?? '',
    p.specialOrder ? 'Yes' : '',
  ]);

  autoTable(doc, {
    startY: 96,
    head: [['Item', 'Categories', 'Pricing Type', 'Display Price', 'Price Detail', 'Tags', 'Featured', 'Min Order', 'Special Order']],
    body: productRows,
    styles: { fontSize: 7.5, cellPadding: 4 },
    headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: [245, 237, 224] },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: 'bold' },
      1: { cellWidth: 55 },
      2: { cellWidth: 55 },
      3: { cellWidth: 65 },
      4: { cellWidth: 160 },
      5: { cellWidth: 100 },
      6: { cellWidth: 40, halign: 'center' },
      7: { cellWidth: 40, halign: 'center' },
      8: { cellWidth: 45, halign: 'center' },
    },
    margin: { left: 40, right: 40 },
  });

  // ── Inactive products (if any) ──
  if (inactiveProducts.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(26, 26, 26);
    doc.text(`Inactive Items (${inactiveProducts.length})`, 40, 45);

    const inactiveRows = inactiveProducts.map(p => [
      p.title,
      p.categories.join(', '),
      p.pricing.type,
      getDisplayPrice(p),
      pricingDetail(p),
      (p.tags || []).join(', '),
    ]);

    autoTable(doc, {
      startY: 53,
      head: [['Item', 'Categories', 'Pricing Type', 'Display Price', 'Price Detail', 'Tags']],
      body: inactiveRows,
      styles: { fontSize: 7.5, cellPadding: 4, textColor: [155, 145, 137] },
      headStyles: { fillColor: [155, 145, 137], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [245, 237, 224] },
      margin: { left: 40, right: 40 },
    });
  }

  // ── Packages table ──
  if (packages.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(26, 26, 26);
    doc.text(`Packages (${packages.length})`, 40, 45);

    const pkgRows = packages.map(pkg => [
      pkg.title,
      pkg.description,
      `$${pkg.pricePerPerson}/person`,
      pkg.minHeadcount ? `${pkg.minHeadcount}` : '',
      pkg.maxHeadcount ? `${pkg.maxHeadcount}` : '',
      pkg.items.join('\n'),
      pkg.is_active ? 'Active' : 'Inactive',
    ]);

    autoTable(doc, {
      startY: 53,
      head: [['Package', 'Description', 'Price', 'Min Guests', 'Max Guests', "What's Included", 'Status']],
      body: pkgRows,
      styles: { fontSize: 8, cellPadding: 5 },
      headStyles: { fillColor: [232, 98, 26], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 237, 224] },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold' },
        1: { cellWidth: 140 },
        2: { cellWidth: 60 },
        3: { cellWidth: 50, halign: 'center' },
        4: { cellWidth: 50, halign: 'center' },
        5: { cellWidth: 200 },
        6: { cellWidth: 50, halign: 'center' },
      },
      margin: { left: 40, right: 40 },
    });
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(155, 145, 137);
    doc.text(
      `Lexington Betty Smokehouse — Menu Export — Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'center' },
    );
  }

  doc.save(`LexBetty-Menu-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── Excel Export ─────────────────────────────────────────────────────────────

export function exportMenuXLS(products: AdminProduct[], packages: AdminPackage[]) {
  const wb = XLSX.utils.book_new();

  // ── Products sheet ──
  const productData = products.map(p => ({
    'Item': p.title,
    'ID': p.id,
    'Description': p.description,
    'Categories': p.categories.join(', '),
    'Pricing Type': p.pricing.type,
    'Display Price': getDisplayPrice(p),
    'Price Detail': pricingDetail(p),
    'Tags': (p.tags || []).join(', '),
    'Featured': p.featured ? 'Yes' : 'No',
    'Active': p.is_active ? 'Yes' : 'No',
    'Min Order': p.minOrderQuantity ?? '',
    'Special Order': p.specialOrder ? 'Yes' : 'No',
    'Sort Position': p.sort_position,
  }));

  const wsProducts = XLSX.utils.json_to_sheet(productData);

  // Set column widths
  wsProducts['!cols'] = [
    { wch: 30 }, // Item
    { wch: 25 }, // ID
    { wch: 50 }, // Description
    { wch: 18 }, // Categories
    { wch: 14 }, // Pricing Type
    { wch: 16 }, // Display Price
    { wch: 50 }, // Price Detail
    { wch: 30 }, // Tags
    { wch: 10 }, // Featured
    { wch: 8 },  // Active
    { wch: 10 }, // Min Order
    { wch: 12 }, // Special Order
    { wch: 10 }, // Sort Position
  ];

  XLSX.utils.book_append_sheet(wb, wsProducts, 'Menu Items');

  // ── Packages sheet ──
  const packageData = packages.map(pkg => ({
    'Package': pkg.title,
    'ID': pkg.id,
    'Description': pkg.description,
    'Price Per Person': `$${pkg.pricePerPerson}`,
    'Min Guests': pkg.minHeadcount ?? '',
    'Max Guests': pkg.maxHeadcount ?? '',
    "What's Included": pkg.items.join('; '),
    'Active': pkg.is_active ? 'Yes' : 'No',
    'Sort Position': pkg.sort_position,
  }));

  const wsPackages = XLSX.utils.json_to_sheet(packageData);
  wsPackages['!cols'] = [
    { wch: 30 }, // Package
    { wch: 25 }, // ID
    { wch: 50 }, // Description
    { wch: 15 }, // Price Per Person
    { wch: 12 }, // Min Guests
    { wch: 12 }, // Max Guests
    { wch: 60 }, // What's Included
    { wch: 8 },  // Active
    { wch: 10 }, // Sort Position
  ];

  XLSX.utils.book_append_sheet(wb, wsPackages, 'Packages');

  XLSX.writeFile(wb, `LexBetty-Menu-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
