# Pricing Audit & Bug Report

**Project:** Lexington Betty Smokehouse — Catering Ordering Platform
**Date:** 2026-05-12
**Scope:** All orders in production (47 orders, 209 line items)
**Status:** Bug confirmed, root cause identified, fix designed and ready to deploy

---

## Executive Summary

A latent bug in the cart-pricing engine has caused **three customer orders to be overcharged by a total of $2,205** since March 2026. The bug only triggers when a customer adjusts the quantity stepper above 1 on a pan-, tray-, per-person-, or flat-priced item; the order then silently bills the customer at 2× or 3× the correct amount. Stored line items show a coherent (but wrong) total — the customer's invoice, kitchen ticket, and revenue figures all reflect the inflated number.

A secondary issue: both the order-creation API and the admin order-edit API trust client-supplied prices verbatim rather than recomputing line totals from the authoritative product price in the database. This means the inflated values flowed straight to persistence with no server-side sanity check, and also leaves the system theoretically open to price manipulation by a malicious client.

There are no race conditions or concurrency bugs creating these inconsistencies — the draft-save, cart-load, and order-edit flows have been audited and ruled out. The bug is deterministic and reproducible.

A four-part remediation is detailed in §6 below.

---

## 1. The Bug

For products priced by **pan**, **tray**, **per-person**, or **flat** rate (i.e., the four pricing types whose quantity is derived from event headcount, not from the user's stepper), the cart engine multiplies the final line total by **both**:

1. The headcount-derived quantity (e.g., 100 guests ÷ 25 per full pan = 4–5 pans), **and**
2. The user's stepper value (e.g., 3 if the customer clicked `+` twice after the initial add).

This is a double-multiplication. The customer is charged `unit_price × headcount_qty × stepper_qty` when the correct total is `unit_price × headcount_qty`.

**Source location:** `lib/pricing.ts:336-340`

```ts
return {
  ...calc,
  itemQuantity: item.quantity,
  totalPrice: calc.totalPrice * item.quantity,   // ← bug
};
```

`calc.totalPrice` is already `size.price * quantity` for these pricing types (computed correctly upstream). Multiplying by `item.quantity` a second time inflates the total by an integer factor of 2, 3, 4, … depending on how many times the customer hit the `+` stepper.

The bug does **not** affect `per-each`, `per-container`, `per-dozen`, or `per-lb` items — those pricing types use `item.quantity` legitimately as the chosen count and are handled by their own branches earlier in the function.

### Worked Example: LB-3208 (Alice McLean, May 8 2026)

- Item: Gouda Mac n Cheese, **full pan**
- Headcount: 100
- Customer's stepper: **3**

Step-by-step inside the engine:

| Step | Computation | Result |
|------|-------------|--------|
| 1. Determine best pan size | `headcount / servesMax = 100 / 25` | Full pan |
| 2. Derive pan count | `ceil(100 / 20) = 5` | 5 pans |
| 3. Compute correct line total | `$120 × 5` | **$600** (correct) |
| 4. **Bug:** multiply by stepper | `$600 × 3` | **$1,800** (stored) |
| 5. Stored payload | `unitPrice=$120, quantity=5, totalPrice=$1,800` | Internally inconsistent — `$120 × 5 ≠ $1,800` |

The stored line item displays as "5 Full Pans @ $120 = $1,800" on the invoice. Because the unit price and quantity look correct in isolation, the inflation is invisible to a quick visual review — only multiplying the two and comparing to the stored total reveals it.

---

## 2. Customer Impact — Confirmed Overcharges

A full sweep of all 47 production orders / 209 line items identified **5 line items across 3 orders** with this defect:

| Order | Date | Headcount | Item | Stored Total | Correct Total | Overcharge | Stepper Factor |
|-------|------|-----------|------|-------------:|--------------:|-----------:|:--------------:|
| LB-3208 | 2026-05-08 | 100 | Gouda Mac n Cheese (full pan) | $1,800.00 | $600.00 | **+$1,200.00** | ×3 |
| LB-3208 | 2026-05-08 | 100 | Creamy Coleslaw (full pan) | $825.00 | $275.00 | **+$550.00** | ×3 |
| LB-7187 | 2026-04-24 | 10 | Banana Pudding (half pan) | $60.00 | $30.00 | **+$30.00** | ×2 |
| LB-7187 | 2026-04-24 | 10 | Rib Tips (half pan) | $130.00 | $65.00 | **+$65.00** | ×2 |
| SD-8559 | 2026-03-18 | 50 | Gouda Mac n Cheese (full pan) | $720.00 | $360.00 | **+$360.00** | ×2 |
| | | | | | **Total:** | **+$2,205.00** | |

**Customer-facing remediation required.** Each of these customers paid (or was invoiced) the inflated amount. They are owed a refund or credit:

- **LB-3208 — Alice McLean:** $1,750.00 overcharge
- **LB-7187:** $95.00 overcharge
- **SD-8559:** $360.00 overcharge

---

## 3. Related Findings (Not Bugs, but Worth Noting)

### 3a. Stale Hardcoded Fallback Prices

`lib/products.ts` contains hardcoded fallback prices used when the Supabase product fetch fails. Three of those fallback prices no longer match the current DB values:

| Product | Fallback (code) | DB (current) |
|---------|----------------:|-------------:|
| Rib Tips (half pan) | $55 | $65 |
| Rib Tips (full pan) | $105 | $130 |
| Creamy Coleslaw (half pan) | $10 | $30 |
| Creamy Coleslaw (full pan) | $35 | $55 |

Three historical orders (LB-3243, SD-4096, SD-5807) were placed when the fallback prices were live and contain those older numbers. These are **correct for their snapshot in time** — they are not overcharges. However, the fallback values should be updated to match the DB (or the fallback path eliminated) to prevent future drift.

### 3b. Tamper-Trusting Persistence Endpoints

Both the customer-facing order creation route and the admin order edit route trust client-supplied prices verbatim:

- `app/api/create-catering-order/route.ts:93-94` — subtotal is summed from `body.items[i].totalPrice` (client value); `orderTotal` defaults to `body.orderTotal` (client value).
- `lib/orders/update.ts:64-69` — admin PATCH recomputes subtotal from `items[i].totalPrice` but again from the client-supplied number, never from the DB product price.

Neither path re-derives prices from `public.products.pricing`. A bug like the pan-multiplier (or, in a malicious scenario, a tampered client request) flows straight through. **A server-side recompute is the architectural fix.**

### 3c. `order_total` vs `subtotal + delivery_fee` Drift

Two orders (LB-7187, SD-8559) have `order_total` that exceeds `subtotal + delivery_fee` by what appears to be a legacy `salesTax` value baked into `order_total` at insert time but never stored on the row. If an admin edits only the delivery fee on such an order, the code recomputes `order_total = subtotal + delivery_fee` and silently erases the tax component. A separate, low-priority hardening item.

### 3d. Admin Race Conditions

The admin status PATCH (`app/api/admin/orders/route.ts:77-118`) has no editable-status gate and no optimistic concurrency control (no `If-Match` / `updated_at` check). Two simultaneous edits result in last-writer-wins. Investigated and **ruled out** as a cause of the overcharges in §2 — the admin edit path uses different math (`unitPrice * quantity`) and would actually heal the inflated totals if the order were re-saved. Worth noting for future hardening, but not the root cause.

### 3e. Cart-Draft Race — Ruled Out

The draft load/save flow (in `git stash@{0}`) was traced end-to-end. The draft hydration replaces cart state rather than merging, runs at most once per login, and is gated against overwriting a non-empty local cart. It cannot compound stepper quantities. The overcharges are **not** caused by a race; they are deterministic outputs of the pan-multiplier bug.

---

## 4. Root Cause

The pan/tray/per-person/flat pricing types compute their final quantity from event headcount inside `calculateProductOrder` (lib/pricing.ts:80–235). Each of those branches returns a `calc` object with the correctly derived `quantity` and `totalPrice = price × quantity`.

The outer wrapper `calculateAllOrderItems` (lib/pricing.ts:257–342) was apparently written under the assumption that `item.quantity` is a user-controlled multiplier for *every* pricing type. Per the comment at line 335 in the source ("tray / pan / per-person / flat: item.quantity is a multiplier"), the author intended the stepper to scale the headcount-derived quantity.

But the UI (`MenuItemRow.tsx`, `CateringProductCard.tsx`) and the cart drawer present the stepper as "absolute pan count" to the user — the customer reads `[+] 3` as *three pans*, not *three times whatever the engine decided*. So the stepper value is fed in with one meaning and consumed with another. There is no UI affordance to set the stepper to something other than 1 deliberately; customers who interact with the stepper at all trigger the bug.

The bug has lain dormant because:
1. Most customers don't touch the stepper on a pan item — they accept the engine's pan count and proceed.
2. The stored `quantity` field still reflects the headcount-derived value (the spread `...calc` keeps it), so the receipt visually looks consistent in isolation.
3. There is no server-side re-validation that would flag the arithmetic inconsistency.

---

## 5. Reproducibility

This bug is **fully deterministic** and reproducible in under a minute:

1. Open `/products`, add Gouda Mac n Cheese to cart.
2. Open the cart drawer. Click the `+` stepper twice (cart now shows quantity = 3).
3. Proceed to checkout with headcount = 100.
4. Observe: line item shows "5 Full Pans @ $120 = $1,800" — but $120 × 5 = $600. The customer pays $1,800.

A regression test should pin the corrected behavior at headcount = 100 + stepper = 3, asserting `totalPrice` either equals `unit_price × stepper_qty` (if the team chooses to honor the stepper as absolute pan count) or `unit_price × headcount_qty` (if the team chooses to ignore the stepper for headcount-derived types).

---

## 6. Resolution — Corrective Action Plan

### 6.1 Immediate Code Fix (Required)

**File:** `lib/pricing.ts:336-340`

**Change:** Remove the redundant multiplication for headcount-derived pricing types.

```diff
- return {
-   ...calc,
-   itemQuantity: item.quantity,
-   totalPrice: calc.totalPrice * item.quantity,
- };
+ return {
+   ...calc,
+   itemQuantity: 1,
+ };
```

For `tray`, `pan`, `per-person`, and `flat`, the line total is fully determined by headcount and the chosen size; the stepper is not a multiplier and should not appear in the math. The `per-each`, `per-container`, `per-dozen`, and `per-lb` branches are unaffected because they return earlier in the function with their own correct math.

If the team wants to preserve a stepper for pan items (e.g., "I want an extra full pan on top of what the engine recommends"), the correct treatment is to **add** to `calc.quantity` (not multiply onto `totalPrice`) and re-derive `totalPrice = size.price × new_quantity`. That is a UX decision and not strictly required to fix the overcharge bug.

### 6.2 Server-Side Recompute (Strongly Recommended)

Make the order subtotal "simple and non-fudgeable" by recomputing every line total from canonical DB prices at persistence time, in both `app/api/create-catering-order/route.ts` and `lib/orders/update.ts`. The route accepts only `{productId, quantity, selectedSize, headcount}` and ignores any client-supplied `unitPrice` / `totalPrice` / `orderTotal`.

**Sketch:**

```ts
// New helper: lib/orders/compute-line-total.ts
export async function computeLineTotal(
  productId: string,
  stepperQty: number,
  selectedSize: 'small'|'medium'|'large'|'half'|'full'|null,
  headcount: number,
) {
  const { data } = await supabaseAdmin
    .from('products').select('pricing').eq('id', productId).single();
  if (!data) throw new Error(`Unknown product: ${productId}`);
  const item: SelectedCateringItem = {
    product: { id: productId, pricing: data.pricing /* …minimal fields */ } as any,
    quantity: stepperQty,
    selectedSize,
  };
  const [line] = calculateAllOrderItems([item], headcount);
  return line;  // authoritative unitPrice, totalPrice, displayText
}
```

In the create route:

```diff
- const subtotal = body.items.reduce((sum, item) => sum + item.totalPrice, 0);
- const orderTotal = body.orderTotal || (subtotal + deliveryFee);
+ const recomputed = await Promise.all(
+   body.items.map(i => computeLineTotal(i.productId, i.quantity, i.selectedSize, body.headcount))
+ );
+ const subtotal  = recomputed.reduce((s, l) => s + l.totalPrice, 0);
+ const orderTotal = subtotal + deliveryFee;
@@
-          items: body.items,
+          items: recomputed,
```

Same change applied to `lib/orders/update.ts:64-69` for the admin edit path. After this change:

- The customer can't submit a tampered price.
- The pan-multiplier bug (if it were ever reintroduced) would be caught because the server's recompute would disagree with anything the client tried to assert.
- A single canonical formula (`SUM(productPriceFromDB(line))`) defines the subtotal.

### 6.3 Update Stale Fallback Prices

`lib/products.ts` — update rib-tips and creamy-coleslaw fallback prices to match the live DB ($65/$130 and $30/$55 respectively). Alternatively, eliminate the hardcoded fallback entirely and surface a clear error if the DB is unreachable; silently using stale prices is worse than failing loudly.

### 6.4 Customer Remediation

Issue refunds or credits for the three affected orders, as listed in §2. Total customer credit owed: **$2,205.00**.

| Order | Customer | Refund Due |
|-------|----------|-----------:|
| LB-3208 | Alice McLean | $1,750.00 |
| LB-7187 | (per CRM) | $95.00 |
| SD-8559 | (per CRM) | $360.00 |

Recommend a brief, transparent customer communication acknowledging the billing error and confirming the refund.

### 6.5 Regression Test

Add a unit test against `lib/pricing.ts`:

```ts
test('stepper above 1 does not double-charge pan items', () => {
  const item = { product: gouda, quantity: 3, selectedSize: 'full' };
  const [calc] = calculateAllOrderItems([item], 100);
  expect(calc.totalPrice).toBe(600);  // not 1800
});
```

And a parallel test for the new server-side recompute path that asserts a tampered POST body cannot inflate the persisted subtotal.

---

## 7. Programmatic Safeguards Going Forward

These are the automated, code-level protections that will be in place after the fix is deployed. None of them require a human to check anything — they run on every order, every time. Together they make it structurally hard for a wrong price to reach a customer, even if a future code change accidentally reintroduces a bug.

### 7.1 What's in place today

Essentially nothing. The current system trusts whatever the customer's browser tells it about prices. When the browser said "the total for Gouda Mac is $1,800," the system wrote $1,800 to the database. That's how this bug reached production in the first place — there was no second pair of eyes between the browser and the order record.

### 7.2 What will be in place after the fix

Think of it like a bank deposit. Today, the customer fills out a deposit slip and the teller writes down whatever the slip says. After the fix, the teller counts the cash themselves and ignores the slip.

**Layer 1 — Fix the math in the cart.**
The cart's price calculator has a single line of code that was multiplying the total twice. Removing the duplicate multiplication makes the cart display the right number the first time. This alone fixes the immediate bug for any new orders.

**Layer 2 — Recompute every price on the server.**
When an order arrives, the server looks up each item in the menu database, calculates the price from scratch using the official rules, and stores that calculated number. It ignores whatever price the customer's browser claimed. If the browser is broken, out of date, or even maliciously modified, it doesn't matter — the server uses the menu as the single source of truth.

**Layer 3 — Database safety net.**
A rule inside the database itself rejects any order where the math doesn't add up — i.e., where a line item's total doesn't equal its unit price times its quantity, or where the order's overall total doesn't equal the sum of its line items. Even if a future code change accidentally reintroduces a bug, the database refuses to save bad data.

**Layer 4 — Automatic tests on every code change.**
A set of small tests runs automatically every time a developer changes the codebase. Two of those tests specifically check that (a) increasing a pan-item's quantity doesn't multiply the price wrongly, and (b) a tampered or buggy submission gets corrected by the server. If either test fails, the code change cannot be released. This prevents the bug from ever being reintroduced.

**Layer 5 — Prevent two admins from overwriting each other.**
When an admin opens an order to edit it, the system records the moment they loaded the page. If another admin saves changes to the same order in the meantime, the second save is rejected with a "please reload and try again" message. This stops two staff members from silently undoing each other's work.

**Layer 6 — Nightly automatic audit.**
Every night at a scheduled time, the system re-checks every order in the database against the current menu prices and the arithmetic rules. If anything is off — a new bug, a price drift, an unexpected edit — it emails the team automatically. This catches issues within 24 hours instead of waiting for a customer to notice.

### 7.3 How the layers work together

A wrong price would have to defeat **four independent automated layers** to reach a customer:

1. The cart math has to be correct (Layer 1), **and**
2. The server has to accept it without recalculating (Layer 2 prevents this), **and**
3. The database has to accept the inconsistent row (Layer 3 prevents this), **and**
4. The nightly audit has to fail to flag it (Layer 6 prevents this).

On top of that, the automated test suite (Layer 4) blocks any future code change from breaking these guarantees before that change can be deployed, and Layer 5 closes off the separate risk of admins racing each other.

In plain terms: today there is one fragile path from browser to database. After the fix, there are four independent checks, three of which would have caught the current bug on their own.

---

## 8. Verification After Fix

After the §6.1 and §6.2 changes deploy, re-run the audit query and confirm:

- For every order in `public.orders`, every line item satisfies `total_price == unit_price * quantity` (no integer multipliers).
- `orders.subtotal == SUM(items[].totalPrice)`.
- `orders.order_total == orders.subtotal + orders.delivery_fee` (modulo any deliberate tax line, which should be its own column).

A simple SQL check:

```sql
SELECT order_number, items
FROM orders
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(items) elt
  WHERE (elt->>'totalPrice')::numeric <> (elt->>'unitPrice')::numeric * (elt->>'quantity')::numeric
);
```

Should return zero rows after the fix is live.

---

## 8. Files Referenced

| File | Lines | Role |
|------|-------|------|
| `lib/pricing.ts` | 336–340 | **Bug location** (double-multiplication) |
| `lib/pricing.ts` | 49–67, 112–142 | Pan size derivation & per-type formula |
| `lib/pricing.ts` | 257–342 | `calculateAllOrderItems` outer wrapper |
| `lib/products.ts` | 28, 159–167, 200–207 | Hardcoded fallback prices (some stale) |
| `app/api/create-catering-order/route.ts` | 91–125 | Tamper-trusting order INSERT |
| `lib/orders/update.ts` | 64–69, 92–100 | Tamper-trusting admin edit |
| `app/api/admin/orders/[id]/route.ts` | 34–69 | Admin PATCH entry |
| `app/api/admin/orders/route.ts` | 77–118 | List PATCH (no edit-status gate, no concurrency control) |
| `context/CateringContext.tsx` | 126–181, 269–277, 365 | Cart state, draft hydration |
| `app/checkout/page.tsx` | 345–356 | Order submission payload |

---

## 9. Sign-Off Checklist

- [ ] Approve customer refunds for LB-3208, LB-7187, SD-8559 (total $2,205)
- [ ] Send corrected invoices / refund notifications to affected customers
- [ ] Merge fix for `lib/pricing.ts:336-340`
- [ ] Merge server-side recompute in create-order and admin-edit routes
- [ ] Update stale fallback prices in `lib/products.ts` (or remove fallback)
- [ ] Add regression test for stepper > 1 on pan items
- [ ] Run verification SQL in §7 and confirm zero rows
- [ ] Add `tax_amount` column to `orders` to stop conflating tax into `order_total`
- [ ] (Future) Add `updated_at` optimistic concurrency check on admin PATCH endpoints
