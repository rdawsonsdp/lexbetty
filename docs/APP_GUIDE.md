# Lexington Betty Catering — Staff Guide

## What this site does

This is the catering ordering website for Lexington Betty Smokehouse. Companies, event planners, and people throwing big events use it to put together a BBQ order online and submit it.

The site doesn't charge their card. Instead, you get an email, call them, take their card over the phone, run it in Clover, then mark the order paid in the admin page. The customer gets a receipt by email and we make and deliver the food on the day of the event.

## How a typical order works (start to finish)

1. A customer visits the website.
2. They build their order (a package, an a la carte menu, or the food truck).
3. They submit it on the checkout page.
4. You get an email with their info, items, and total. Their phone number is at the top.
5. You call them, confirm the details, and take their card over the phone.
6. You run the card in Clover (or take cash, check, or ACH).
7. You open the order in the admin page and click **Mark Paid**. The customer is automatically emailed a receipt.
8. On the day of the event you make the food and deliver (or they pick up).
9. You mark the order Ready when it's prepped, then Complete after delivery.

---

## Part 1 — What customers see (the public side)

### The home page (`/`)

The front door. A big black header reads "CATERING FOR EVERY OCCASION" with four picture cards underneath:

1. **Plan Your Next Corporate Event** — for someone who has a guest count but doesn't know what to order. Walks them through it.
2. **Order Catering** — a la carte, for customers who just want to pick from the menu.
3. **Executive & Corporate Box Lunches** — pre-built boxed lunches for office meetings.
4. **Reserve Our Food Truck** — for booking the actual food truck on site.

They tap whichever fits. There's also a "Visit Our Restaurant" link at the bottom going to the main restaurant site.

![Home page - desktop](screenshots/home-desktop.png)
![Home page - mobile](screenshots/home-mobile.png)

### "Plan Your Next Corporate Event" (`/plan`)

A short wizard. Two questions:

1. **How many guests?** — Type a number or tap a quick pill (10, 25, 50, 100, 150, 200).
2. **Per-person budget?** — Three cards: budget, mid-tier, premium. Optional.

After they pick a budget (or click "See Menu Recommendations" to skip), they land on the menu with the headcount filled in.

![Plan page - desktop](screenshots/plan-desktop.png)
![Plan page - mobile](screenshots/plan-mobile.png)

### The catering menu (`/products`)

The full menu, grouped by category — Meats, Sliders, Sides, Desserts, Drinks, Extras.

- The **Meats** section has an "Open Meat Planner" button — a helper that recommends how much meat to order for the headcount.
- A **Lunch Specials** callout in the middle of the page lets customers grab a Party Deal package with one click.
- On desktop the cart sits in a panel on the right. On phones, a bar pinned at the bottom shows the running total and opens the cart.

When they're done they tap **Continue to Checkout**.

![Catering menu - desktop](screenshots/products-desktop.png)
![Catering menu - mobile](screenshots/products-mobile.png)

### "Executive & Corporate Box Lunches" (`/packages`)

A simple page with our two Betty Box options for corporate orders — boxed lunches for meetings, conferences, or training days. Customer picks the one they want, sets headcount, and it goes into the cart.

![Box lunches - desktop](screenshots/packages-desktop.png)
![Box lunches - mobile](screenshots/packages-mobile.png)

### "Reserve Our Food Truck" (`/food-truck`)

Just one card with the food truck package details. The customer picks how many guests (minimum 40), sees the calculated total, and adds it to the cart. There are also four "Make It a Feast" buttons at the bottom (Add Desserts, Cornbread Muffins, Drinks, Sides) that send them to the menu to add extras.

![Food truck - desktop](screenshots/food-truck-desktop.png)
![Food truck - mobile](screenshots/food-truck-mobile.png)

### Checkout (`/checkout`)

Where the customer enters everything we need:

- **Contact info** — name, email, phone, company.
- **Delivery address** — or pick "Local Pickup" and skip the address.
- **Event details** — event name, date, delivery time.
- **Special instructions** — for the kitchen (allergies, dietary notes, setup quirks).
- **Notes for us** — anything else they want us to know.
- **Tax exempt?** — checkbox. If they check it, they upload a tax-exempt certificate.

The right side shows a running summary (subtotal, delivery fee, tax, total). There's also a checkbox for full buffet setup ($50 extra).

When they click **Place Order**, the order goes in, they get a confirmation email, and you get a notification email.

![Checkout - desktop](screenshots/checkout-desktop.png)
![Checkout - mobile](screenshots/checkout-mobile.png)

### Confirmation page (`/order-confirmation`)

The "thank you, we got it" page. Big green checkmark, the order number, and an orange banner saying "We'll get back to you" (or a Pay Now link if there's a QuickBooks invoice).

Below that is a summary of the order, the delivery details, and a "Here's What We'll Take Care Of" timeline. A Download Receipt button creates a PDF.

![Confirmation - desktop](screenshots/order-confirmation-desktop.png)

---

## Part 2 — What you (staff) see (the admin side)

To get into the admin panel, go to **`/admin/orders`** in your browser. You'll see a password box. Type the admin password you were given. You only have to do this once per browser session.

### Orders (`/admin/orders`)

The main screen for running the business day-to-day. A list of every order, newest at top.

Across the top are filter tabs: **All, Pending, Invoiced, Paid, Ready, Complete, Cancelled**. Each shows a count. Click one to filter.

Each order is colored by status:

- **Pending (amber)** — just came in, not paid yet.
- **Invoiced (blue)** — we've sent an invoice.
- **Paid (green)** — payment collected.
- **Ready (purple)** — food is prepped.
- **Complete (emerald)** — delivered and done.
- **Cancelled (red)** — cancelled.

The search bar takes order number, name, or email.

Click any row to open a side panel with everything about the order: customer info, delivery address, event date and time, headcount, items, totals, and special instructions. A **Notes** box at the bottom is for internal notes the customer never sees.

#### How to mark an order paid

The most common thing you'll do. Steps:

1. Click the order to open it.
2. Click the green **Mark Paid** button.
3. A small box pops up.
4. Pick how they paid: Card, Cash, Check, ACH, or Other.
5. Type a confirmation or reference number — Clover transaction code, last 4 of the card, check number, or "cash".
6. The amount is pre-filled with the order total. Change it for partial payments.
7. The date is today. Change it if needed.
8. Click **Mark Paid**.

That's it. The order flips to Paid and the customer is auto-emailed a receipt.

#### How to change an order's status

Pending becomes Paid automatically when you mark it paid. After that, you move it through Ready and Complete by hand.

In the order panel you'll see colored buttons:

- **Mark Paid (green)** — covered above.
- **Mark Ready (purple)** — click when the kitchen has finished prepping.
- **Mark Complete (emerald)** — click after delivery or pickup.

There's also a status dropdown for manual changes. The normal flow: **Pending → Invoiced → Paid → Ready → Complete**.

![Orders list - desktop](screenshots/admin-orders-desktop.png)

### Editing an order (`/admin/orders/[id]/edit`)

Use this when a customer calls and needs something changed — headcount, date, an extra tray, a new address. From the order panel, click the orange **Edit Order** button.

A sticky bar at the top stays put as you scroll. It has the order number, the status badge, and these buttons: **Email Customer**, **Email Staff**, **Cancel** (goes back), **Cancel Order** (cancels the whole order), and **Save Changes**.

The page is two columns. Left is forms; right is items, totals, and payment.

#### What you can change

- **Customer** — name, email, phone, company.
- **Event** — date, time, headcount, event type, and a "Setup required" checkbox.
- **Delivery** — the address.
- **Notes** — Special Instructions (kitchen sees), Customer Notes (customer sees), Admin Notes (internal — edit from the orders list panel, not here).
- **Items** — see below.
- **Totals** — you can edit the delivery fee directly.
- **Status** — pending, invoiced, paid, or cancelled.
- **Record Payment** — only shows when the order is Invoiced. Same fields as the Mark Paid box.

#### The Email Customer / Email Staff buttons

After you make changes, use these to send a fresh copy:

- **Email Customer** — sends the customer an updated copy. Use this when date, time, address, headcount, or items changed. They get an "Order Updated" email with a yellow banner.
- **Email Staff** — sends the kitchen an updated copy. Use this when items changed.

Save your changes first so the email has the updated info.

#### Adding items from the menu

Under Items in the right column, expand **Add Items From Menu**. There's a search bar and category pills (All, Meats, Sliders, Sides, Desserts, Drinks, Extras). Click any item to add it. For trays and pans, pick the size pill first (Small/Medium/Large or Half/Full).

Adding an item that's already on the order bumps the quantity up by 1. The list below it lets you change quantities or remove items.

Click **Save Changes** in the sticky bar when done.

#### Recording payment from the edit page

If the order is Invoiced, a **Record Payment** card shows on the right. Same fields as the Mark Paid pop-up: method, reference, amount, date. Click **Mark Paid** at the bottom — the customer gets a receipt automatically.

![Edit order - desktop](screenshots/admin-orders-edit-desktop.png)

### Customers (`/admin/customers`)

A master list of every customer. Columns: name, email, phone, company, orders placed, total spent, first order, last order.

Sort by any column, search by name or email, and use the Export button at the top to download as CSV or Excel.

Use this to see a customer's history or pull a list for a marketing email.

![Customers - desktop](screenshots/admin-customers-desktop.png)

### Menu (`/admin/menu`)

Where you change the menu and prices. Two tabs: **Products** and **Packages**.

For each item you can edit the title, description, and photo; change the price; mark it Active (shows on the site) or hide it; mark it Featured (shows up first); and drag to reorder.

Use this when you change a price, run out of an item, add a new dish, or update a photo.

![Menu editor - desktop](screenshots/admin-menu-desktop.png)

### Email settings (`/admin/email`)

Controls the emails the site sends. From here you can:

- Turn order emails on or off (use this if you're closed and don't want orders coming in).
- Change subject lines on quote and order emails.
- Change the company phone, email, and address shown in email footers.
- Change which addresses get the "new order" notification.

There's also a Send Test Email box for sending a test to your own inbox.

![Email settings - desktop](screenshots/admin-email-desktop.png)

### Analytics (`/admin/analytics`)

A dashboard showing how the site is doing: visitors, orders, total revenue, average order size, what's selling. Flip between 7 days, 30 days, etc.

For getting a sense of what's working. You don't have to look at it every day.

![Analytics - desktop](screenshots/admin-analytics-desktop.png)

### Settings (`/admin/settings`)

General site settings — mostly set up once and don't change. Adjust business rules (minimum orders, default delivery fees), turn whole menu categories on or off, and check email settings.

![Settings - desktop](screenshots/admin-settings-desktop.png)

---

## Part 3 — The emails we send

The site sends three kinds of emails on its own. You don't send these by hand.

### When a customer places an order

- **The customer** gets a "Thanks, here's your order" email with their items, totals, event details, and a note about what happens next.
- **You (the restaurant)** get a notification email. Orange banner at the top: **"Action Required — Call Customer to Collect Payment"**. Customer's name and phone number are big and tappable. Below that: total to collect, event date, and headcount.

### When you mark an order paid

- **The customer** gets a Payment Receipt email with a green "Payment Received" banner. It shows the payment method, reference number, amount, and date. They keep it for their books.

### When you click Email Customer or Email Staff

- An "Order Updated" email with a yellow banner. Use this when something on the order changed and you want to send a fresh copy.

---

## Part 4 — Quick reference: common tasks

- **How do I find an order?** Go to `/admin/orders`. Type the order number, customer name, or email in the search bar.
- **How do I see all orders for one customer?** Go to `/admin/customers`. Click the customer. Or just search for their email in the orders list.
- **How do I change a customer's headcount or event date?** Open the order. Click Edit Order. Change the field. Click Save Changes. Then click Email Customer to send them an updated copy.
- **How do I add an item to an existing order?** Open the order, click Edit Order, scroll to the Items section, expand "Add Items From Menu", search for the item, click to add. Save Changes.
- **How do I mark an order paid?** Open the order, click the green Mark Paid button, fill in the payment info, click Mark Paid. The customer gets a receipt automatically.
- **How do I send the customer an updated copy of their order?** Open the order, click Edit Order, click Email Customer in the sticky top bar.
- **How do I cancel an order?** Open the order, click Edit Order, click the red Cancel Order button in the sticky top bar.
- **How do I see what's been paid this week?** Go to `/admin/orders` and click the Paid tab. Sort by date if needed.
- **How do I update a price on the menu?** Go to `/admin/menu`, click the item, change the price, save.
- **How do I turn off order emails (e.g., during a closure)?** Go to `/admin/email`. Flip the "Email Enabled" toggle off. Don't forget to flip it back on later.

---

## Part 5 — Tips and gotchas

- **Once an order is marked Paid, you can't edit the items.** The Edit page only works for Pending and Invoiced orders. Make item changes BEFORE marking paid.
- **The phone number is the most important field.** Tap it in the email or admin to dial.
- **Save Changes is greyed out until you change something.** That's correct — nothing to save.
- **Mark Paid auto-emails the receipt.** You don't send it yourself.
- **Save before clicking Email Customer.** Otherwise the email won't have your latest changes.
- **Tax-exempt needs a certificate.** If they checked the box but didn't upload, the site charges tax anyway.
- **Delivery fee is automatic.** $100 under $1k, $150 for $1k–$2k, $250 over $2k. Pickup is free. You can override on the edit page.
- **Admin Notes are internal.** Customer never sees them. Good for things like "called twice, left voicemail".

---

## Part 6 — Who to call if something breaks

If something on the website isn't working — a page won't load, an email didn't send, a button isn't doing what it should — contact your administrator or the developer who set this up. Don't try to fix it yourself.
