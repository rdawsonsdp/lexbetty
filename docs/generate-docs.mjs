import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, HeadingLevel,
  PageBreak, ShadingType, Header, Footer, TabStopPosition, TabStopType,
  convertInchesToTwip, ImageRun,
} from 'docx';
import fs from 'fs';

// Brand colors (RGB)
const DARK = '1A1A1A';
const ORANGE = 'E8621A';
const CREAM = 'F5EDE0';
const GRAY = '9B9189';
const WHITE = 'FFFFFF';

// Helpers
function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 400 : 240, after: 120 },
    children: [
      new TextRun({
        text,
        font: 'Arial',
        bold: true,
        size: level === HeadingLevel.HEADING_1 ? 36 : level === HeadingLevel.HEADING_2 ? 28 : 24,
        color: level === HeadingLevel.HEADING_1 ? ORANGE : DARK,
      }),
    ],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.afterSpacing ?? 120 },
    children: [
      new TextRun({
        text,
        font: 'Arial',
        size: opts.size ?? 22,
        color: opts.color ?? DARK,
        bold: opts.bold ?? false,
        italics: opts.italics ?? false,
      }),
    ],
  });
}

function bullet(text, boldPrefix = '') {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix, font: 'Arial', size: 22, bold: true, color: DARK }));
  }
  children.push(new TextRun({ text, font: 'Arial', size: 22, color: DARK }));
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children,
  });
}

function numberedItem(text, num) {
  return new Paragraph({
    numbering: { reference: 'ordered-list', level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: DARK })],
  });
}

function makeTable(headers, rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(h => new TableCell({
      shading: { type: ShadingType.SOLID, color: DARK },
      children: [new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: h, font: 'Arial', size: 20, bold: true, color: WHITE })],
      })],
      width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
    })),
  });

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map(cell => new TableCell({
      shading: ri % 2 === 0 ? { type: ShadingType.SOLID, color: 'FAFAFA' } : undefined,
      children: [new Paragraph({
        spacing: { before: 30, after: 30 },
        children: [new TextRun({ text: String(cell), font: 'Arial', size: 20, color: DARK })],
      })],
    })),
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

function callout(text) {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    indent: { left: convertInchesToTwip(0.25) },
    border: {
      left: { style: BorderStyle.SINGLE, size: 6, color: ORANGE },
    },
    shading: { type: ShadingType.SOLID, color: CREAM },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: DARK })],
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function spacer(pts = 200) {
  return new Paragraph({ spacing: { before: pts } });
}

// =========== BUILD DOCUMENT ===========

const doc = new Document({
  numbering: {
    config: [{
      reference: 'ordered-list',
      levels: [{
        level: 0,
        format: 'decimal',
        text: '%1.',
        alignment: AlignmentType.LEFT,
      }],
    }],
  },
  styles: {
    default: {
      document: {
        run: { font: 'Arial', size: 22 },
      },
    },
  },
  sections: [
    // ==================== COVER PAGE ====================
    {
      properties: {
        page: {
          margin: { top: convertInchesToTwip(0), bottom: convertInchesToTwip(0), left: convertInchesToTwip(0), right: convertInchesToTwip(0) },
        },
      },
      children: [
        // Dark background header block
        new Paragraph({
          spacing: { before: 0 },
          shading: { type: ShadingType.SOLID, color: DARK },
          children: [new TextRun({ text: ' ', size: 20 })],
        }),
        spacer(600),
        spacer(600),
        spacer(400),
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [
            new TextRun({ text: 'LEXINGTON BETTY', font: 'Arial', size: 72, bold: true, color: DARK }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: 'SMOKEHOUSE', font: 'Arial', size: 72, bold: true, color: ORANGE }),
          ],
        }),
        // Divider line
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', font: 'Arial', size: 18, color: ORANGE }),
          ],
        }),
        // Subtitle
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({ text: 'APPLICATION DOCUMENTATION', font: 'Arial', size: 28, bold: true, color: DARK, characterSpacing: 200 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({ text: 'Operations & Technical Reference', font: 'Arial', size: 24, color: GRAY }),
          ],
        }),
        // Badge
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({ text: '   VERSION 1.0  —  MARCH 2026   ', font: 'Arial', size: 22, bold: true, color: ORANGE }),
          ],
        }),
        spacer(200),
        // Info block
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({ text: 'Prepared for Chef Dominique Leach', font: 'Arial', size: 22, color: DARK }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '756 E. 111th St, Chicago, IL 60628', font: 'Arial', size: 22, color: GRAY }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '(312) 600-8155  •  orders@lexingtonbettycatering.com', font: 'Arial', size: 22, color: GRAY }),
          ],
        }),
        spacer(200),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({ text: 'lexingtonbettycatering.com', font: 'Arial', size: 24, bold: true, color: ORANGE }),
          ],
        }),
        spacer(300),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'Next.js  •  Supabase  •  Vercel  •  Resend  •  QuickBooks Online', font: 'Arial', size: 18, color: GRAY }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [
            new TextRun({ text: '"Best BBQ in Chicago" — As Seen on Good Morning America', font: 'Arial', size: 20, italics: true, color: GRAY }),
          ],
        }),
      ],
    },

    // ==================== MAIN CONTENT ====================
    {
      properties: {
        page: {
          margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.25), right: convertInchesToTwip(1) },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'Lexington Betty Smokehouse — Application Documentation', font: 'Arial', size: 16, color: GRAY, italics: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Lexington Betty Smokehouse  •  756 E. 111th St, Chicago, IL 60628  •  (312) 600-8155', font: 'Arial', size: 14, color: GRAY })],
          })],
        }),
      },
      children: [
        // ---- TABLE OF CONTENTS ----
        heading('Table of Contents'),
        para('1.  Platform Overview'),
        para('2.  Brand Identity & Colors'),
        para('3.  Technical Architecture'),
        para('4.  Customer Order Flow'),
        para('5.  Menu & Products'),
        para('6.  Cart & Checkout'),
        para('7.  Take Us Home — Upsell Products'),
        para('8.  Admin Dashboard'),
        para('9.  Orders Management'),
        para('10. Kitchen Printouts (PDFs)'),
        para('11. Email Integration (Resend)'),
        para('12. QuickBooks Integration'),
        para('13. Hosting & Domain'),
        para('14. Environment Variables'),
        para('15. Email Notifications'),
        para('16. Getting Started (Developer Guide)'),

        pageBreak(),

        // ---- 1. PLATFORM OVERVIEW ----
        heading('1. Platform Overview'),
        para('Lexington Betty Smokehouse is a catering ordering platform built for Chef Dominique Leach\'s BBQ catering business in Chicago. The platform allows customers to build custom catering orders, select from pre-built packages, and submit orders or request quotes — all through a guided, mobile-friendly ordering wizard.'),
        callout('"Best BBQ in Chicago" — as seen on Good Morning America'),
        heading('Key Features', HeadingLevel.HEADING_2),
        bullet(' Guided ordering wizard — 6-step flow from event type to checkout', 'Guided Ordering Wizard —'),
        bullet(' Flexible ordering — build your own or choose packages', 'Build Your Own or Packages —'),
        bullet(' Auto-calculates quantities based on headcount', 'Smart Portions —'),
        bullet(' Sternos, racks, utensils with smart suggestions', 'Equipment & Extras —'),
        bullet(' Retail add-on products at checkout', 'Take Us Home Upsells —'),
        bullet(' Full menu management, order tracking, analytics', 'Admin Dashboard —'),
        bullet(' Order/quote confirmations via Resend', 'Automated Emails —'),
        bullet(' Auto-invoice creation with payment links', 'QuickBooks Integration —'),
        bullet(' Packing slips and full order PDFs', 'Kitchen Printouts —'),
        bullet(' Customer loyalty program (Coming Soon)', 'Betty VIP —'),

        pageBreak(),

        // ---- 2. BRAND ----
        heading('2. Brand Identity & Colors'),
        para('The visual design matches the physical Lexington Betty Smokehouse menu board and branding.'),
        heading('Color Palette', HeadingLevel.HEADING_2),
        makeTable(
          ['Color', 'Hex Code', 'Usage'],
          [
            ['Near Black', '#1A1A1A', 'Primary text, dark backgrounds, headers'],
            ['Smokehouse Orange', '#E8621A', 'Accent color, CTAs, prices, highlights'],
            ['Warm Gray', '#9B9189', 'Secondary text, borders, subtle elements'],
            ['Warm Cream', '#F5EDE0', 'Section backgrounds, cards'],
            ['Cream', '#EDE3D0', 'Deeper cream accents'],
          ]
        ),
        heading('Typography', HeadingLevel.HEADING_2),
        bullet(' Headings, prices, navigation, buttons', 'Oswald —'),
        bullet(' Body text, descriptions, form fields', 'System sans-serif —'),
        heading('Logo Assets', HeadingLevel.HEADING_2),
        para('All logos stored in /public/images/:'),
        makeTable(
          ['File', 'Usage'],
          [
            ['lb-logo-horizontal.png', 'Header navigation'],
            ['lb-logo-white.png', 'Footer (dark background)'],
            ['lb-logo-stacked.png', 'Marketing sections'],
            ['lb-logo-dark.png', 'Light background usage'],
            ['lb-house-icon-orange.png', 'Favicon / app icon'],
          ]
        ),

        pageBreak(),

        // ---- 3. ARCHITECTURE ----
        heading('3. Technical Architecture'),
        heading('Tech Stack', HeadingLevel.HEADING_2),
        makeTable(
          ['Component', 'Technology', 'Purpose'],
          [
            ['Framework', 'Next.js 14', 'React SSR/SSG web application'],
            ['Styling', 'Tailwind CSS', 'Utility-first CSS framework'],
            ['Database', 'Supabase (PostgreSQL)', 'Products, orders, settings, tokens'],
            ['Email', 'Resend', 'Transactional emails (order confirmations)'],
            ['Invoicing', 'QuickBooks Online', 'Invoice creation, payment links'],
            ['Hosting', 'Vercel', 'Edge deployment, serverless functions'],
            ['Source Code', 'GitHub', 'Repository: rdawsonsdp/lexbetty'],
            ['PDF Generation', 'jsPDF', 'Order receipts, packing slips'],
            ['AI', 'Anthropic Claude', 'AI Concierge (Betty AI)'],
          ]
        ),
        heading('Database Tables (Supabase)', HeadingLevel.HEADING_2),
        makeTable(
          ['Table', 'Purpose'],
          [
            ['orders', 'All customer orders and quotes'],
            ['products', 'Menu items (admin-managed, with fallback)'],
            ['packages', 'Pre-built catering packages'],
            ['settings', 'App settings (email config, categories)'],
            ['qb_tokens', 'QuickBooks OAuth tokens'],
            ['order_training_data', 'AI training data from orders'],
            ['customer_profiles', 'Customer accounts (Betty VIP)'],
          ]
        ),
        heading('Data Fallback Strategy', HeadingLevel.HEADING_2),
        para('Supabase DB  →  Hardcoded Data  →  In-Memory Cache'),
        para('If the database is unavailable, the app falls back to hardcoded products in lib/products.ts and lib/packages.ts, ensuring the ordering flow never breaks.'),

        pageBreak(),

        // ---- 4. ORDER FLOW ----
        heading('4. Customer Order Flow'),
        para('The ordering process follows a guided wizard with 6 steps plus checkout:'),
        para('Step 1: Event Type  →  Step 2: Event Info  →  Step 3: Guests & Budget  →  Step 4: Order Type  →  Step 5: Build Order  →  Step 6: Equipment  →  Checkout', { bold: true }),
        spacer(100),
        heading('Step 1: Event Type', HeadingLevel.HEADING_3),
        bullet(' Full smokehouse menu with meats, sides, desserts', 'BBQ Catering (Lunch) —'),
        bullet(' Sweet treats and beverages only', 'Desserts & Drinks —'),
        heading('Step 2: Event Info', HeadingLevel.HEADING_3),
        para('Collects event details: name, date, time, venue address, and special instructions.'),
        heading('Step 3: Guests & Budget', HeadingLevel.HEADING_3),
        para('Customer sets headcount and optionally selects a budget range per person. The budget tracker shows real-time status.'),
        heading('Step 4: Order Type', HeadingLevel.HEADING_3),
        bullet(' Select individual items from the full menu', 'Build Your Own —'),
        bullet(' Choose a pre-built catering package with fixed per-person pricing', 'Packages —'),
        heading('Step 5: Build Order', HeadingLevel.HEADING_3),
        para('Main menu selection screen. Products organized by category (Meats, Sliders, Sides, Desserts, Drinks). Cart sidebar shows running totals. Quantities auto-adjust based on headcount.'),
        heading('Step 6: Equipment & Extras', HeadingLevel.HEADING_3),
        para('Smart suggestions: pan count suggests sternos/racks, headcount suggests utensil sets.'),
        makeTable(
          ['Item', 'Price'],
          [
            ['Sterno', '$2 each'],
            ['Catering Rack', '$12 each'],
            ['Serving Utensils', '$2 each'],
            ['Utensil Sets', '$0.50 each'],
          ]
        ),
        heading('Checkout', HeadingLevel.HEADING_3),
        para('Two-step checkout: (1) Contact info, delivery address, event details, delivery type. (2) Review & submit as quote or order. Validation message box shows all missing fields.'),
        heading('After Submission', HeadingLevel.HEADING_3),
        para('Save to DB  →  Send Email  →  Create QB Invoice  →  Confirmation Page', { bold: true }),

        pageBreak(),

        // ---- 5. MENU ----
        heading('5. Menu & Products'),
        heading('Product Categories', HeadingLevel.HEADING_2),
        makeTable(
          ['Category', 'Items'],
          [
            ['Betty Meats (Pork)', 'Rib Tips, Smoked Ribs, Pulled Pork, Hot Links'],
            ['Betty Meats (Poultry)', 'Chicken Quarters & Wing Mix, Pulled Chicken, Turkey Tips'],
            ['Betty Meats (Beef)', 'Brisket, Beef Wagyu Sausage'],
            ['Sliders (24 ct)', 'Pulled Chicken, Pulled Pork, Brisket, Portabella & Peppers'],
            ['Soulful Sides', 'Gouda Mac, Greens, Baked Beans, Corn, Coleslaw, Salad, Candy Yams, Jambalaya, Cornbread'],
            ['Desserts', 'Banana Pudding, Peach Cobbler, Custom Cake, Cookies'],
            ['Drinks', "Tobi's Lemonade, Lemonade, Iced Tea, Water, Soda"],
            ['Equipment', 'Sterno, Catering Rack, Serving Utensils, Utensil Sets'],
            ['Take Us Home', 'BBQ Sauce, Hot Sauce, Wagyu Pack, Dry Rub, Banana Pudding Jar, Rib Tips Pack'],
          ]
        ),
        heading('Pricing Models', HeadingLevel.HEADING_2),
        makeTable(
          ['Type', 'Description', 'Example'],
          [
            ['pan', 'Half/Full pan with serving ranges', 'Gouda Mac: Half $60, Full $120'],
            ['per-each', 'Unit price with min order', 'Smoked Ribs: $18/lb, min 3 lbs'],
            ['per-container', 'Container with serving count', 'Hot Links: $60, serves 15'],
            ['per-dozen', 'Dozen count', 'Cornbread: $15/dozen'],
            ['per-person', 'Per guest pricing', 'Full Setup: $5/person'],
            ['flat', 'Fixed price', 'Buffet Setup: $50'],
          ]
        ),
        heading('Catering Packages', HeadingLevel.HEADING_2),
        makeTable(
          ['Package', 'Includes', 'Price'],
          [
            ['Betty Party Deal', '3 Meats + 3 Sides', '$22/person'],
            ['Betty Party Deal Plus', '4 Meats + 4 Sides', '$35/person'],
            ['Betty Box Executive', 'Individual boxed meals', '$16/person'],
            ['Betty Corporate', 'Full corporate spread', '$25/person'],
            ['Food Truck Experience', 'On-site food truck', '$20/person (min 40)'],
          ]
        ),

        pageBreak(),

        // ---- 6. CART ----
        heading('6. Cart & Checkout'),
        heading('Cart Features', HeadingLevel.HEADING_2),
        bullet(' on desktop (right column), slide-out drawer on mobile', 'Sticky sidebar'),
        bullet(' +/- buttons on each item with minimum order enforcement', 'Editable quantities —'),
        bullet(' 3px border for visibility', 'Thick border styling —'),
        bullet(' Per person and total cost update instantly', 'Real-time totals —'),
        bullet(' Progress bar showing on-track / under / over', 'Budget tracker —'),
        bullet(' Warning if portions don\'t cover headcount', 'Serving coverage —'),
        bullet(' Direct input with quick-select presets (10, 25, 50, 100, 150, 200)', 'Headcount adjustment —'),
        heading('Delivery Options', HeadingLevel.HEADING_2),
        makeTable(
          ['Type', 'Fee', 'Details'],
          [
            ['Standard Delivery (<$1,000)', '$100', 'Delivered to your address'],
            ['Delivery ($1,000–$2,000)', '$150', 'Mid-size order delivery'],
            ['Delivery ($2,000+)', '$250', 'Large order delivery'],
            ['Local Pickup', 'Free', '756 E. 111th St, Chicago'],
          ]
        ),
        heading('Pricing Calculation', HeadingLevel.HEADING_2),
        bullet(' Sum of all item prices (auto-calculated)', 'Subtotal —'),
        bullet(' Based on subtotal tier', 'Delivery Fee —'),
        bullet(' Optional $50 add-on', 'Buffet Setup —'),
        bullet(' 10.25%', 'Sales Tax —'),
        bullet(' Subtotal + Delivery + Setup + Tax', 'Order Total —'),

        pageBreak(),

        // ---- 7. UPSELL ----
        heading('7. Take Us Home — Upsell Products'),
        para('At the bottom of the checkout form, a prominent dark-themed section displays retail add-on products. These are managed under the "Take Us Home" category in admin menu management.'),
        makeTable(
          ['Product', 'Price', 'Description'],
          [
            ["Chef Dominique's BBQ Sauce (32oz)", '$18', 'Signature sweet-and-smoky sauce'],
            ["Betty's Hot Sauce (8oz)", '$12', 'Slow-burn heat, small batch'],
            ['Wagyu Beef Sausage Pack (4 links)', '$28', 'Premium wagyu, vacuum-sealed'],
            ['Smokehouse Dry Rub (12oz)', '$14', "Chef Dominique's secret blend"],
            ['Banana Pudding Jar (16oz)', '$10', "Grab-and-go grandma's recipe"],
            ['Rib Tips Family Pack (3 lbs)', '$45', 'Sealed and ready to reheat'],
          ]
        ),
        para('Products already in the cart are automatically hidden from the upsell section.'),

        pageBreak(),

        // ---- 8. ADMIN ----
        heading('8. Admin Dashboard'),
        para('The admin panel is accessible at /admin/menu and protected by password authentication.'),
        callout('Admin Password: bbq2026 — Authentication uses HMAC-signed tokens valid for 24 hours.'),
        heading('Admin Navigation', HeadingLevel.HEADING_2),
        makeTable(
          ['Page', 'URL', 'Purpose'],
          [
            ['Orders', '/admin/orders', 'View, manage, and fulfill orders'],
            ['Menu', '/admin/menu', 'Product & package CRUD, drag reorder'],
            ['Engineering', '/menu-engineering', 'Menu performance analytics'],
            ['Email', '/admin/email', 'Email settings, templates, test send'],
            ['Analytics', '/admin/analytics', 'Order and user analytics'],
            ['QuickBooks', '/admin/quickbooks', 'QB connection management'],
            ['Settings', '/admin/settings', 'App configuration'],
          ]
        ),
        heading('Menu Management Features', HeadingLevel.HEADING_2),
        bullet(' Search and filter products by category'),
        bullet(' Create, edit, delete products with full pricing'),
        bullet(' Drag-to-reorder products within categories'),
        bullet(' Toggle products active/featured'),
        bullet(' Image upload for product photos'),
        bullet(' Tag management for filtering'),
        bullet(' Category visibility toggles'),
        bullet(' Export menu as PDF or Excel'),

        pageBreak(),

        // ---- 9. ORDERS ----
        heading('9. Orders Management'),
        para('The admin orders page (/admin/orders) provides a Shopify-style interface for managing all orders.'),
        heading('Order List Features', HeadingLevel.HEADING_2),
        bullet(' All, Pending, Invoiced, Paid, Cancelled (with counts)', 'Status filter tabs —'),
        bullet(' By order number, customer name, or email', 'Search —'),
        bullet(' Order #, Customer, Event Date, Total, Status, Created', 'Sortable columns —'),
        bullet(' 20 orders per page', 'Pagination —'),
        bullet(' Table on desktop, cards on mobile', 'Responsive —'),
        heading('Order Detail Panel', HeadingLevel.HEADING_2),
        para('Click any order to open a slide-out panel with status management, customer info, event details, itemized order, pricing breakdown, QuickBooks info, and PDF downloads.'),
        heading('Order Statuses', HeadingLevel.HEADING_2),
        makeTable(
          ['Status', 'Color', 'Meaning'],
          [
            ['Pending', 'Amber', 'Order received, not yet invoiced'],
            ['Invoiced', 'Blue', 'QB invoice created, awaiting payment'],
            ['Paid', 'Green', 'Payment received'],
            ['Cancelled', 'Red', 'Order cancelled or invoice voided'],
          ]
        ),
        para('Order numbers use the prefix LB- followed by a 4-digit number (e.g., LB-2406).'),

        pageBreak(),

        // ---- 10. KITCHEN ----
        heading('10. Kitchen Printouts (PDFs)'),
        para('Two PDF documents are available from the admin orders panel. Both generated client-side using jsPDF.'),
        heading('Packing Slip (No Prices)', HeadingLevel.HEADING_2),
        bullet(' LB branded header with order number and date'),
        bullet(' Customer name and event date in bold at the top'),
        bullet(' Event time, guest count, contact info, delivery address'),
        bullet(' Checklist of items with checkboxes — no pricing'),
        bullet(' Setup requirements (Full Setup or Drop-off)'),
        bullet(' "Packed by" and "Checked by" sign-off lines'),
        heading('Full Order (With Prices)', HeadingLevel.HEADING_2),
        bullet(' Branded header with order number'),
        bullet(' All items with descriptions and pricing'),
        bullet(' Subtotal, delivery fee, total, per-person cost'),
        bullet(' Full contact and delivery details'),

        pageBreak(),

        // ---- 11. EMAIL ----
        heading('11. Email Integration (Resend)'),
        makeTable(
          ['Item', 'Details'],
          [
            ['Provider', 'Resend (resend.com)'],
            ['Library', 'resend v6.9.3 (npm)'],
            ['Sending Domain', 'lexingtonbettycatering.com (verified)'],
            ['From Address', 'orders@lexingtonbettycatering.com'],
            ['Reply-To', 'orders@lexingtonbettycatering.com'],
          ]
        ),
        heading('When Emails Are Sent', HeadingLevel.HEADING_2),
        bullet(' Customer receives quote confirmation with 7-day validity', 'Quote submission —'),
        bullet(' Customer receives order confirmation with delivery timeline', 'Order submission —'),
        bullet(' Separate invoice email sent via QB\'s system (if connected)', 'QB Invoice —'),
        heading('Email Template Contents', HeadingLevel.HEADING_2),
        bullet(' Branded header (Lexington Betty Smokehouse)'),
        bullet(' Event details (date, time, guests, venue, setup)'),
        bullet(' Itemized order list with descriptions and pricing'),
        bullet(' Pricing breakdown (subtotal, delivery, total, per-person)'),
        bullet(' "What Happens Next" timeline'),
        bullet(' Company contact info in footer'),
        heading('Admin Email Settings', HeadingLevel.HEADING_2),
        para('Configurable at /admin/email: enable/disable notifications, customize subject templates, edit company info, and send test emails.'),
        heading('DNS Records Required', HeadingLevel.HEADING_2),
        bullet(' TXT record allowing Resend to send on behalf of the domain', 'SPF —'),
        bullet(' TXT records for email authentication', 'DKIM —'),
        bullet(' Optional but recommended for deliverability', 'DMARC —'),

        pageBreak(),

        // ---- 12. QUICKBOOKS ----
        heading('12. QuickBooks Integration'),
        para('When QuickBooks Online is connected, the platform automatically creates invoices for new orders and provides customers with online payment links.'),
        heading('Order-to-Invoice Flow', HeadingLevel.HEADING_2),
        para('1. Customer places order (not a quote)\n2. System checks if QB is connected\n3. Finds or creates QB customer by email\n4. Creates invoice with all line items + delivery fee\n5. Enables online credit card and ACH payment\n6. Retrieves payment link from QB\n7. Updates order record with invoice ID and payment link\n8. Sends invoice email via QB\'s email system'),
        callout('Quotes skip QB: Quote requests do not create QuickBooks invoices. Only confirmed orders trigger the invoicing flow.'),
        heading('Webhook Handling', HeadingLevel.HEADING_2),
        bullet(' Verifies invoice balance = $0, then marks order as "paid"', 'Invoice Update —'),
        bullet(' Marks the linked order as "cancelled"', 'Invoice Void —'),
        bullet(' HMAC-SHA256 with timing-safe comparison', 'Signature verification —'),
        heading('Security Measures', HeadingLevel.HEADING_2),
        bullet(' Random token in httpOnly cookie', 'CSRF-safe OAuth state —'),
        bullet(' Calls Intuit revocation endpoint', 'Token revocation on disconnect —'),
        bullet(' 5-minute buffer before expiry', 'Automatic token refresh —'),
        bullet(' minorversion=65 on all calls', 'API versioning —'),
        bullet(' Input sanitization on email queries', 'Query safety —'),

        pageBreak(),

        // ---- 13. HOSTING ----
        heading('13. Hosting & Domain'),
        makeTable(
          ['Item', 'Details'],
          [
            ['Domain', 'lexingtonbettycatering.com'],
            ['Hosting', 'Vercel (Edge Network)'],
            ['Vercel IP (A Record)', '76.76.21.21'],
            ['www CNAME', 'cname.vercel-dns.com'],
            ['GitHub Repository', 'rdawsonsdp/lexbetty'],
            ['Supabase Project ID', 'ghsqkkreeurpypitegvp'],
            ['Dev Server Port', '3001'],
          ]
        ),
        heading('Deployment', HeadingLevel.HEADING_2),
        para('The application deploys automatically via Vercel\'s GitHub integration. Every push to the main branch triggers a new production deployment.'),
        heading('DNS Configuration', HeadingLevel.HEADING_2),
        makeTable(
          ['Record Type', 'Host', 'Value'],
          [
            ['A', '@', '76.76.21.21'],
            ['CNAME', 'www', 'cname.vercel-dns.com'],
            ['TXT (SPF)', '@', 'See Resend dashboard'],
            ['CNAME (DKIM)', 'See Resend', 'See Resend dashboard'],
          ]
        ),

        pageBreak(),

        // ---- 14. ENV VARS ----
        heading('14. Environment Variables'),
        para('All environment variables must be set in both .env.local (local development) and Vercel project settings (production).'),
        makeTable(
          ['Variable', 'Purpose', 'Required'],
          [
            ['ADMIN_PASSWORD', 'Admin panel login password', 'Yes'],
            ['NEXT_PUBLIC_SUPABASE_URL', 'Supabase project URL', 'Yes'],
            ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase anonymous key', 'Yes'],
            ['SUPABASE_SERVICE_ROLE_KEY', 'Supabase service role key', 'Yes'],
            ['RESEND_API_KEY', 'Resend email API key', 'Yes'],
            ['RESEND_FROM_EMAIL', 'Sender email address', 'Yes'],
            ['ANTHROPIC_API_KEY', 'Claude AI for concierge', 'Optional'],
            ['OPENAI_API_KEY', 'Whisper voice transcription', 'Optional'],
            ['QB_CLIENT_ID', 'QuickBooks OAuth client ID', 'For QB'],
            ['QB_CLIENT_SECRET', 'QuickBooks OAuth client secret', 'For QB'],
            ['QB_REDIRECT_URI', 'QuickBooks OAuth callback URL', 'For QB'],
            ['QB_ENVIRONMENT', 'sandbox or production', 'For QB'],
            ['QB_WEBHOOK_VERIFIER_TOKEN', 'Webhook signature verification', 'For QB'],
          ]
        ),
        callout('Security: Never commit .env.local to Git. For production, set all variables in the Vercel dashboard under Project Settings → Environment Variables.'),

        pageBreak(),

        // ---- 15. NOTIFICATIONS ----
        heading('15. Email Notifications'),
        para('The platform can automatically CC (carbon copy) store staff on every order and quote confirmation email sent to customers. This ensures the kitchen, management, or front-of-house team is notified of new orders in real time — no extra steps required.'),

        heading('How It Works', HeadingLevel.HEADING_2),
        para('When a customer submits an order or quote, the confirmation email is sent to the customer AND copied to all notification email addresses configured in the admin panel. The store receives the exact same email the customer sees — including all items, pricing, event details, and delivery information.'),

        heading('Setting Up Notifications', HeadingLevel.HEADING_2),
        para('Follow these steps to configure notification emails:', { bold: true }),
        spacer(60),

        para('Step 1: Log into the Admin Panel', { bold: true, size: 24 }),
        para('Go to your site and navigate to the admin panel. Log in with the admin password.'),
        para('URL: https://www.lexingtonbettycatering.com/admin/email', { size: 20 }),
        spacer(60),

        para('Step 2: Scroll to the Notifications Section', { bold: true, size: 24 }),
        para('On the Email Settings page, scroll down past "Subject Lines" and "Company Contact" until you see the Notifications card.'),
        spacer(60),

        para('Step 3: Enter Email Addresses', { bold: true, size: 24 }),
        para('In the "Notification Email Addresses" field, type the email addresses that should receive copies of all orders and quotes. Separate multiple addresses with commas.'),
        spacer(30),
        para('Examples:', { bold: true }),
        para('Single address:  store@lexingtonbettycatering.com', { size: 20 }),
        para('Multiple addresses:  store@lexingtonbettycatering.com, chef@lexingtonbettycatering.com, manager@gmail.com', { size: 20 }),
        spacer(60),

        para('Step 4: Click "Save Settings"', { bold: true, size: 24 }),
        para('After entering the addresses, click the Save Settings button at the bottom of the page. You will see a green "Settings saved!" confirmation.'),
        spacer(60),

        para('Step 5: Verify with a Test Order', { bold: true, size: 24 }),
        para('Place a test order through the site to confirm the notification emails arrive. Check spam/junk folders if they don\'t appear within a few minutes.'),

        heading('Managing Notifications', HeadingLevel.HEADING_2),
        makeTable(
          ['Action', 'How To'],
          [
            ['Add a recipient', 'Add their email to the list, separated by a comma, then Save'],
            ['Remove a recipient', 'Delete their email from the list, then Save'],
            ['Disable all notifications', 'Clear the field completely (leave blank), then Save'],
            ['Change a recipient', 'Edit the email address directly in the field, then Save'],
          ]
        ),

        heading('Important Notes', HeadingLevel.HEADING_2),
        bullet(' Notification emails are CC\'d, meaning the customer can see the CC addresses in their email. Use professional store addresses.'),
        bullet(' Notifications are sent for both orders AND quotes — the store is always in the loop.'),
        bullet(' If the notification field is blank, emails are sent only to the customer (no CC).'),
        bullet(' Notification settings take effect immediately after saving — no restart or redeploy needed.'),
        bullet(' If emails are not arriving, check: (1) the email address is correct, (2) check spam/junk folder, (3) verify the Email Notifications toggle is ON.'),

        callout('Recommended: Add at least one store email address so the team is notified of every new order. This is especially important for same-week catering requests that need immediate attention.'),

        pageBreak(),

        // ---- 16. GETTING STARTED ----
        heading('16. Getting Started (Developer Guide)'),
        heading('Prerequisites', HeadingLevel.HEADING_2),
        bullet(' Node.js 18+ and npm'),
        bullet(' Git'),
        bullet(' Access to the GitHub repository'),
        heading('Local Setup', HeadingLevel.HEADING_2),
        para('git clone https://github.com/rdawsonsdp/lexbetty.git', { size: 20 }),
        para('cd lexbetty', { size: 20 }),
        para('npm install', { size: 20 }),
        para('cp .env.example .env.local  (then edit with actual keys)', { size: 20 }),
        para('npm run dev  (app runs on http://localhost:3001)', { size: 20 }),
        heading('Key Directories', HeadingLevel.HEADING_2),
        makeTable(
          ['Directory', 'Purpose'],
          [
            ['/app', 'Next.js pages and API routes'],
            ['/app/admin', 'Admin dashboard pages'],
            ['/app/api', 'Server-side API endpoints'],
            ['/components', 'React components'],
            ['/context', 'React Context providers (CateringContext)'],
            ['/lib', 'Utilities, business logic, integrations'],
            ['/lib/email', 'Resend email integration'],
            ['/lib/quickbooks', 'QuickBooks integration'],
            ['/lib/supabase', 'Database client and helpers'],
            ['/public/images', 'Logo assets and food photography'],
          ]
        ),
        heading('Common Commands', HeadingLevel.HEADING_2),
        makeTable(
          ['Command', 'Purpose'],
          [
            ['npm run dev', 'Start development server (port 3001)'],
            ['npm run build', 'Production build'],
            ['npm run start', 'Start production server'],
            ['npm run lint', 'Run ESLint'],
          ]
        ),
        heading('Deployment', HeadingLevel.HEADING_2),
        para('Push to main branch → Vercel auto-deploys to lexingtonbettycatering.com.'),

        spacer(400),

        // Footer
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          border: { top: { style: BorderStyle.SINGLE, size: 3, color: ORANGE } },
          children: [new TextRun({ text: ' ' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'LEXINGTON BETTY SMOKEHOUSE', font: 'Arial', size: 28, bold: true, color: DARK })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Best BBQ in Chicago', font: 'Arial', size: 22, color: ORANGE, italics: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80 },
          children: [new TextRun({ text: '756 E. 111th St, Chicago, IL 60628  •  (312) 600-8155  •  orders@lexingtonbettycatering.com', font: 'Arial', size: 18, color: GRAY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40 },
          children: [new TextRun({ text: 'Document generated March 2026 — Version 1.0', font: 'Arial', size: 16, color: GRAY })],
        }),
      ],
    },
  ],
});

// Generate and save
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync('./docs/Lexington-Betty-Smokehouse-Documentation.docx', buffer);
console.log('✓ Generated: docs/Lexington-Betty-Smokehouse-Documentation.docx');
