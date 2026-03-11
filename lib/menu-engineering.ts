// Menu Engineering Classification & Recommendation Engine
// Implements the industry-standard Star/Plowhorse/Puzzle/Dog matrix

import {
  SALES_DATA,
  PRODUCT_PROFILES,
  MONTHS,
  getMonthlySummary,
  type MonthlySalesRecord,
  type ProductSalesProfile,
} from './sales-data';

// ==================== TYPES ====================

export type Quadrant = 'star' | 'plowhorse' | 'puzzle' | 'dog';

export type RecommendationType =
  | 'feature'
  | 'reprice'
  | 'promote'
  | 'remove'
  | 'seasonal'
  | 'bundle';

export type RecommendationPriority = 'high' | 'medium' | 'low';

export interface ClassifiedProduct {
  productId: string;
  title: string;
  category: string;
  subcategory: string;
  quadrant: Quadrant;
  // 6-month aggregates
  totalRevenue: number;
  totalProfit: number;
  totalUnits: number;
  avgMarginPct: number;
  avgSellingPrice: number;
  costPerUnit: number;
  // Normalized 0-100 for scatter plot
  popularityScore: number; // X axis
  profitabilityScore: number; // Y axis
  // Monthly breakdown
  monthlyData: MonthlySalesRecord[];
  // Trend
  trend: 'rising' | 'declining' | 'stable';
  trendPct: number; // % change first half vs second half
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  quadrant: Quadrant | 'cross';
  impactAmount: number; // estimated $ impact (monthly)
  impactLabel: string;
  productIds: string[];
}

// ==================== CLASSIFICATION ====================

export function classifyProducts(): ClassifiedProduct[] {
  // 1. Aggregate 6-month totals per product
  const productAggregates = new Map<
    string,
    {
      totalRevenue: number;
      totalProfit: number;
      totalUnits: number;
      records: MonthlySalesRecord[];
    }
  >();

  for (const record of SALES_DATA) {
    const existing = productAggregates.get(record.productId) || {
      totalRevenue: 0,
      totalProfit: 0,
      totalUnits: 0,
      records: [],
    };
    existing.totalRevenue += record.revenue;
    existing.totalProfit += record.grossProfit;
    existing.totalUnits += record.unitsSold;
    existing.records.push(record);
    productAggregates.set(record.productId, existing);
  }

  // 2. Calculate means for classification thresholds
  const allProducts = Array.from(productAggregates.entries());
  const meanPopularity =
    allProducts.reduce((sum, [, d]) => sum + d.totalUnits, 0) /
    allProducts.length;
  const meanProfitability =
    allProducts.reduce((sum, [, d]) => {
      const margin = d.totalRevenue > 0 ? (d.totalProfit / d.totalRevenue) * 100 : 0;
      return sum + margin;
    }, 0) / allProducts.length;

  // Get min/max for normalization
  const allUnits = allProducts.map(([, d]) => d.totalUnits);
  const allMargins = allProducts.map(([, d]) =>
    d.totalRevenue > 0 ? (d.totalProfit / d.totalRevenue) * 100 : 0
  );
  const minUnits = Math.min(...allUnits);
  const maxUnits = Math.max(...allUnits);
  const minMargin = Math.min(...allMargins);
  const maxMargin = Math.max(...allMargins);

  // 3. Classify each product
  const classified: ClassifiedProduct[] = [];

  for (const [productId, data] of allProducts) {
    const profile = PRODUCT_PROFILES.find((p) => p.productId === productId);
    if (!profile) continue;

    const avgMarginPct =
      data.totalRevenue > 0
        ? Math.round((data.totalProfit / data.totalRevenue) * 1000) / 10
        : 0;

    const isHighPopularity = data.totalUnits >= meanPopularity;
    const isHighProfitability = avgMarginPct >= meanProfitability;

    let quadrant: Quadrant;
    if (isHighPopularity && isHighProfitability) quadrant = 'star';
    else if (isHighPopularity && !isHighProfitability) quadrant = 'plowhorse';
    else if (!isHighPopularity && isHighProfitability) quadrant = 'puzzle';
    else quadrant = 'dog';

    // Normalize to 0-100
    const popularityScore =
      maxUnits > minUnits
        ? Math.round(((data.totalUnits - minUnits) / (maxUnits - minUnits)) * 100)
        : 50;
    const profitabilityScore =
      maxMargin > minMargin
        ? Math.round(((avgMarginPct - minMargin) / (maxMargin - minMargin)) * 100)
        : 50;

    // Calculate trend: compare first 3 months vs last 3 months
    const sortedRecords = [...data.records].sort((a, b) =>
      a.month.localeCompare(b.month)
    );
    const firstHalfUnits = sortedRecords
      .slice(0, 3)
      .reduce((s, r) => s + r.unitsSold, 0);
    const secondHalfUnits = sortedRecords
      .slice(3)
      .reduce((s, r) => s + r.unitsSold, 0);
    const trendPct =
      firstHalfUnits > 0
        ? Math.round(((secondHalfUnits - firstHalfUnits) / firstHalfUnits) * 100)
        : 0;

    let trend: 'rising' | 'declining' | 'stable';
    if (trendPct > 10) trend = 'rising';
    else if (trendPct < -10) trend = 'declining';
    else trend = 'stable';

    classified.push({
      productId,
      title: profile.title,
      category: profile.category,
      subcategory: profile.subcategory,
      quadrant,
      totalRevenue: Math.round(data.totalRevenue * 100) / 100,
      totalProfit: Math.round(data.totalProfit * 100) / 100,
      totalUnits: data.totalUnits,
      avgMarginPct,
      avgSellingPrice: profile.avgSellingPrice,
      costPerUnit: profile.costPerUnit,
      popularityScore,
      profitabilityScore,
      monthlyData: sortedRecords,
      trend,
      trendPct,
    });
  }

  return classified;
}

// ==================== QUADRANT HELPERS ====================

export function getQuadrantLabel(q: Quadrant): string {
  switch (q) {
    case 'star':
      return 'Star';
    case 'plowhorse':
      return 'Plowhorse';
    case 'puzzle':
      return 'Puzzle';
    case 'dog':
      return 'Dog';
  }
}

export function getQuadrantEmoji(q: Quadrant): string {
  switch (q) {
    case 'star':
      return '\u2B50';
    case 'plowhorse':
      return '\uD83D\uDC34';
    case 'puzzle':
      return '\uD83E\uDDE9';
    case 'dog':
      return '\uD83D\uDC15';
  }
}

export function getQuadrantColor(q: Quadrant): string {
  switch (q) {
    case 'star':
      return '#E8621A';
    case 'plowhorse':
      return '#e88c3a';
    case 'puzzle':
      return '#4a90d9';
    case 'dog':
      return '#9ca3af';
  }
}

export function getQuadrantDescription(q: Quadrant): string {
  switch (q) {
    case 'star':
      return 'High popularity, high profitability';
    case 'plowhorse':
      return 'High popularity, low profitability';
    case 'puzzle':
      return 'Low popularity, high profitability';
    case 'dog':
      return 'Low popularity, low profitability';
  }
}

// ==================== RECOMMENDATION ENGINE ====================

export function generateRecommendations(
  products: ClassifiedProduct[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  let nextId = 1;

  const stars = products.filter((p) => p.quadrant === 'star');
  const plowhorses = products.filter((p) => p.quadrant === 'plowhorse');
  const puzzles = products.filter((p) => p.quadrant === 'puzzle');
  const dogs = products.filter((p) => p.quadrant === 'dog');

  // --- STAR RECOMMENDATIONS ---

  // Feature top stars prominently
  const topStars = [...stars]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 3);
  if (topStars.length > 0) {
    const monthlyRev = topStars.reduce((s, p) => s + p.totalRevenue / 6, 0);
    recommendations.push({
      id: `rec-${nextId++}`,
      type: 'feature',
      priority: 'high',
      title: `Feature Top Stars on Menu & Website`,
      description: `Move ${topStars.map((p) => p.title).join(', ')} to prominent positions. Add "Most Popular" badges and hero imagery.`,
      rationale: `These ${topStars.length} items drive ${formatDollar(monthlyRev)}/month in revenue with above-average margins. Featuring them will increase order frequency.`,
      quadrant: 'star',
      impactAmount: Math.round(monthlyRev * 0.08),
      impactLabel: `+${formatDollar(Math.round(monthlyRev * 0.08))}/mo from increased visibility`,
      productIds: topStars.map((p) => p.productId),
    });
  }

  // Bundle star anchor: Brisket + Mac + Cornbread
  const brisket = products.find((p) => p.productId === 'beef-brisket');
  const mac = products.find((p) => p.productId === 'mac-and-cheese');
  const cornbread = products.find((p) => p.productId === 'cornbread');
  if (brisket && mac && cornbread) {
    const bundleMonthlyRev =
      (brisket.totalRevenue + mac.totalRevenue + cornbread.totalRevenue) / 6;
    recommendations.push({
      id: `rec-${nextId++}`,
      type: 'bundle',
      priority: 'high',
      title: `Launch "BBQ Pitmaster" Bundle`,
      description: `Create a signature bundle: Brisket + Mac & Cheese + Cornbread at a 5% discount. Position as the go-to BBQ catering package.`,
      rationale: `These items already sell together frequently due to complementary sales correlation. A bundle formalizes this and increases average order value.`,
      quadrant: 'star',
      impactAmount: Math.round(bundleMonthlyRev * 0.12),
      impactLabel: `+${formatDollar(Math.round(bundleMonthlyRev * 0.12))}/mo from bundle upsells`,
      productIds: ['beef-brisket', 'mac-and-cheese', 'cornbread'],
    });
  }

  // Rising star spotlight
  const risingStars = stars.filter((p) => p.trend === 'rising');
  if (risingStars.length > 0) {
    const topRising = risingStars.sort((a, b) => b.trendPct - a.trendPct)[0];
    recommendations.push({
      id: `rec-${nextId++}`,
      type: 'feature',
      priority: 'medium',
      title: `Spotlight Rising Star: ${topRising.title}`,
      description: `${topRising.title} is trending up ${topRising.trendPct}% over the period. Invest in photography and social media promotion.`,
      rationale: `Momentum items benefit most from marketing investment. Capitalize on organic growth before it plateaus.`,
      quadrant: 'star',
      impactAmount: Math.round((topRising.totalRevenue / 6) * 0.15),
      impactLabel: `+${formatDollar(Math.round((topRising.totalRevenue / 6) * 0.15))}/mo from accelerated growth`,
      productIds: [topRising.productId],
    });
  }

  // --- PLOWHORSE RECOMMENDATIONS ---

  // Price increase for high-volume, low-margin items
  const repriceTargets = [...plowhorses]
    .sort((a, b) => b.totalUnits - a.totalUnits)
    .slice(0, 4);
  for (const product of repriceTargets) {
    const targetMargin = 70; // target margin %
    const currentPrice = product.avgSellingPrice;
    const cost = product.costPerUnit;
    const targetPrice = Math.round((cost / (1 - targetMargin / 100)) * 100) / 100;
    const priceIncrease = Math.max(0, targetPrice - currentPrice);

    if (priceIncrease > 0.5) {
      const monthlyUnits = product.totalUnits / 6;
      const monthlyImpact = Math.round(priceIncrease * monthlyUnits);

      recommendations.push({
        id: `rec-${nextId++}`,
        type: 'reprice',
        priority: 'high',
        title: `Increase ${product.title} Price by ${formatDollar(priceIncrease)}`,
        description: `Raise from ${formatDollar(currentPrice)} to ${formatDollar(targetPrice)} per unit. Current margin: ${product.avgMarginPct}% → Target: ${targetMargin}%.`,
        rationale: `High volume (${Math.round(monthlyUnits)} units/mo) means even a small price increase has significant impact. Demand is proven — customers will absorb a modest increase.`,
        quadrant: 'plowhorse',
        impactAmount: monthlyImpact,
        impactLabel: `+${formatDollar(monthlyImpact)}/mo additional profit`,
        productIds: [product.productId],
      });
    }
  }

  // Plowhorse cost reduction
  const costTargets = plowhorses
    .filter((p) => p.avgMarginPct < 55)
    .slice(0, 2);
  for (const product of costTargets) {
    const potentialSaving = Math.round(product.costPerUnit * 0.08 * 100) / 100;
    const monthlyUnits = product.totalUnits / 6;
    recommendations.push({
      id: `rec-${nextId++}`,
      type: 'reprice',
      priority: 'medium',
      title: `Negotiate Lower Costs for ${product.title}`,
      description: `Explore bulk purchasing or alternative suppliers to reduce COGS by ~8% (${formatDollar(potentialSaving)}/unit).`,
      rationale: `At ${Math.round(monthlyUnits)} units/month, even small cost reductions compound significantly.`,
      quadrant: 'plowhorse',
      impactAmount: Math.round(potentialSaving * monthlyUnits),
      impactLabel: `+${formatDollar(Math.round(potentialSaving * monthlyUnits))}/mo from cost savings`,
      productIds: [product.productId],
    });
  }

  // --- PUZZLE RECOMMENDATIONS ---

  // Promote high-margin underperformers
  const promoteTargets = [...puzzles]
    .sort((a, b) => b.avgMarginPct - a.avgMarginPct)
    .slice(0, 3);
  for (const product of promoteTargets) {
    const monthlyUnits = product.totalUnits / 6;
    const targetIncrease = Math.round(monthlyUnits * 0.3);
    const monthlyImpact = Math.round(
      targetIncrease * product.avgSellingPrice * (product.avgMarginPct / 100)
    );

    recommendations.push({
      id: `rec-${nextId++}`,
      type: 'promote',
      priority: 'medium',
      title: `Promote ${product.title} with Sampling & Placement`,
      description: `Add to "Chef's Picks" section, include as free sample in large orders, and pair with popular star items.`,
      rationale: `${product.avgMarginPct}% margin is excellent — the challenge is awareness. A 30% volume increase (+${targetIncrease} units/mo) would significantly boost profits.`,
      quadrant: 'puzzle',
      impactAmount: monthlyImpact,
      impactLabel: `+${formatDollar(monthlyImpact)}/mo if volume increases 30%`,
      productIds: [product.productId],
    });
  }

  // Bundle puzzles with stars
  const puzzleBundleCandidates = puzzles.filter(
    (p) => p.category === 'lunch' && p.subcategory !== 'add-on'
  );
  if (puzzleBundleCandidates.length > 0 && topStars.length > 0) {
    const puzzleItem = puzzleBundleCandidates[0];
    const starItem = topStars.find((s) => s.category === puzzleItem.category) || topStars[0];
    recommendations.push({
      id: `rec-${nextId++}`,
      type: 'bundle',
      priority: 'medium',
      title: `Bundle ${puzzleItem.title} with ${starItem.title}`,
      description: `Offer a "Complete Meal" pairing at 3% off. Cross-promote the high-margin puzzle item alongside the proven star.`,
      rationale: `${puzzleItem.title} has ${puzzleItem.avgMarginPct}% margin but low volume. Piggybacking on ${starItem.title}'s popularity exposes it to more buyers.`,
      quadrant: 'puzzle',
      impactAmount: Math.round((puzzleItem.totalRevenue / 6) * 0.2),
      impactLabel: `+${formatDollar(Math.round((puzzleItem.totalRevenue / 6) * 0.2))}/mo from cross-sell`,
      productIds: [puzzleItem.productId, starItem.productId],
    });
  }

  // --- DOG RECOMMENDATIONS ---

  // Remove declining dogs
  const decliningDogs = dogs.filter((p) => p.trend === 'declining');
  if (decliningDogs.length > 0) {
    const worstDogs = [...decliningDogs]
      .sort((a, b) => a.trendPct - b.trendPct)
      .slice(0, 3);
    const totalWasted = worstDogs.reduce(
      (s, p) => s + (p.totalRevenue - p.totalProfit) / 6,
      0
    );
    recommendations.push({
      id: `rec-${nextId++}`,
      type: 'remove',
      priority: 'high',
      title: `Remove ${worstDogs.length} Declining Menu Items`,
      description: `Consider removing: ${worstDogs.map((p) => `${p.title} (${p.trendPct}%)`).join(', ')}. Replace with higher-performing alternatives.`,
      rationale: `These items are declining in both popularity and profitability. They consume prep time, ingredient inventory, and menu space that could be allocated to stars and puzzles.`,
      quadrant: 'dog',
      impactAmount: Math.round(totalWasted * 0.5),
      impactLabel: `Save ${formatDollar(Math.round(totalWasted * 0.5))}/mo in wasted COGS & labor`,
      productIds: worstDogs.map((p) => p.productId),
    });
  }

  // Convert seasonal dogs to limited-time specials
  const seasonalDogs = dogs.filter(
    (p) => p.trend === 'stable' || p.trend === 'rising'
  );
  if (seasonalDogs.length > 0) {
    const candidates = seasonalDogs.slice(0, 3);
    recommendations.push({
      id: `rec-${nextId++}`,
      type: 'seasonal',
      priority: 'low',
      title: `Convert ${candidates.length} Items to Limited-Time Specials`,
      description: `Make ${candidates.map((p) => p.title).join(', ')} available only during their peak season months. Scarcity drives demand.`,
      rationale: `These items perform below average overall but may have seasonal peaks. Limiting availability reduces waste while creating urgency.`,
      quadrant: 'dog',
      impactAmount: Math.round(
        candidates.reduce((s, p) => s + p.totalRevenue / 6, 0) * 0.1
      ),
      impactLabel: `+${formatDollar(Math.round(candidates.reduce((s, p) => s + p.totalRevenue / 6, 0) * 0.1))}/mo from scarcity pricing`,
      productIds: candidates.map((p) => p.productId),
    });
  }

  // --- SEASONAL RECOMMENDATIONS ---

  // Spring menu refresh
  const springRising = products.filter(
    (p) =>
      p.monthlyData.length >= 6 &&
      p.monthlyData[5].unitsSold > p.monthlyData[4].unitsSold * 1.1
  );
  if (springRising.length > 0) {
    const topSpring = springRising
      .sort(
        (a, b) =>
          b.monthlyData[5].unitsSold / b.monthlyData[4].unitsSold -
          a.monthlyData[5].unitsSold / a.monthlyData[4].unitsSold
      )
      .slice(0, 4);
    recommendations.push({
      id: `rec-${nextId++}`,
      type: 'seasonal',
      priority: 'medium',
      title: `Spring Menu Refresh — Feature Trending Items`,
      description: `Highlight items gaining momentum into March: ${topSpring.map((p) => p.title).join(', ')}. Update menu photography and descriptions.`,
      rationale: `These items show Feb→Mar growth, aligning with spring event season. Corporate events ramp up in Q2 — be ready.`,
      quadrant: 'cross',
      impactAmount: Math.round(
        topSpring.reduce((s, p) => s + p.totalRevenue / 6, 0) * 0.1
      ),
      impactLabel: `+${formatDollar(Math.round(topSpring.reduce((s, p) => s + p.totalRevenue / 6, 0) * 0.1))}/mo from seasonal positioning`,
      productIds: topSpring.map((p) => p.productId),
    });
  }

  // Vegan January push (for next year planning)
  const veganItems = products.filter(
    (p) =>
      p.subcategory === 'vegan' ||
      p.productId === 'plant-based-lunch-package'
  );
  if (veganItems.length > 0) {
    const janPeak = veganItems.reduce((s, p) => {
      const janData = p.monthlyData.find((m) => m.month === '2026-01');
      return s + (janData?.revenue || 0);
    }, 0);
    recommendations.push({
      id: `rec-${nextId++}`,
      type: 'seasonal',
      priority: 'low',
      title: `Plan "New Year, New Menu" Vegan Promotion`,
      description: `Prepare a January vegan catering push. Bundle Plant-Based Lunch Package with Vegan Scramble for corporate wellness events.`,
      rationale: `Vegan items spiked in January (resolution season). Planning ahead for next Jan with targeted marketing could capture more of this demand.`,
      quadrant: 'cross',
      impactAmount: Math.round(janPeak * 0.15),
      impactLabel: `+${formatDollar(Math.round(janPeak * 0.15))}/mo during January push`,
      productIds: veganItems.map((p) => p.productId),
    });
  }

  // Holiday prep recommendation
  const holidayPeakers = products
    .filter((p) => {
      const decData = p.monthlyData.find((m) => m.month === '2025-12');
      const avgOther =
        p.monthlyData
          .filter((m) => m.month !== '2025-12')
          .reduce((s, m) => s + m.revenue, 0) / 5;
      return decData && decData.revenue > avgOther * 1.3;
    })
    .sort((a, b) => {
      const aDecRev = a.monthlyData.find((m) => m.month === '2025-12')?.revenue || 0;
      const bDecRev = b.monthlyData.find((m) => m.month === '2025-12')?.revenue || 0;
      return bDecRev - aDecRev;
    })
    .slice(0, 5);

  if (holidayPeakers.length > 0) {
    recommendations.push({
      id: `rec-${nextId++}`,
      type: 'seasonal',
      priority: 'medium',
      title: `Prepare Holiday Catering Packages Early`,
      description: `Build pre-set holiday packages around top December performers: ${holidayPeakers.map((p) => p.title).join(', ')}. Open pre-orders by October.`,
      rationale: `December was the highest-revenue month. Early holiday packages lock in bookings and reduce last-minute kitchen strain.`,
      quadrant: 'cross',
      impactAmount: Math.round(
        holidayPeakers.reduce(
          (s, p) =>
            s + (p.monthlyData.find((m) => m.month === '2025-12')?.revenue || 0),
          0
        ) * 0.1
      ),
      impactLabel: `+${formatDollar(Math.round(holidayPeakers.reduce((s, p) => s + (p.monthlyData.find((m) => m.month === '2025-12')?.revenue || 0), 0) * 0.1))}/mo during holiday season`,
      productIds: holidayPeakers.map((p) => p.productId),
    });
  }

  // --- BUNDLE RECOMMENDATIONS ---

  // Complementary pairings from data
  const lunchStars = stars.filter((p) => p.category === 'lunch');
  const breakfastStars = stars.filter((p) => p.category === 'breakfast');

  if (breakfastStars.length >= 2) {
    const bfastAnchor = breakfastStars[0];
    const bfastSide = breakfastStars[1];
    const coffee = products.find((p) => p.productId === 'fresh-brewed-coffee');
    if (coffee) {
      recommendations.push({
        id: `rec-${nextId++}`,
        type: 'bundle',
        priority: 'medium',
        title: `Create "Executive Breakfast" Bundle`,
        description: `Package ${bfastAnchor.title} + ${bfastSide.title} + Fresh Brewed Coffee at a 4% discount. Target corporate morning meetings.`,
        rationale: `These items frequently appear in the same orders. A formal bundle simplifies ordering and increases average ticket.`,
        quadrant: 'star',
        impactAmount: Math.round(
          ((bfastAnchor.totalRevenue + bfastSide.totalRevenue + coffee.totalRevenue) /
            6) *
            0.08
        ),
        impactLabel: `+${formatDollar(Math.round(((bfastAnchor.totalRevenue + bfastSide.totalRevenue + coffee.totalRevenue) / 6) * 0.08))}/mo from bundle upsells`,
        productIds: [bfastAnchor.productId, bfastSide.productId, coffee.productId],
      });
    }
  }

  // Dessert upsell
  const dessertPuzzles = puzzles.filter(
    (p) => p.category === 'dessert'
  );
  if (dessertPuzzles.length > 0 && lunchStars.length > 0) {
    const dessert = dessertPuzzles[0];
    recommendations.push({
      id: `rec-${nextId++}`,
      type: 'promote',
      priority: 'low',
      title: `Add Dessert Upsell to Lunch Orders`,
      description: `Auto-suggest ${dessert.title} as an add-on when customers order lunch entrees. "Add dessert for your team?"`,
      rationale: `Desserts have high margins (${dessert.avgMarginPct}%) but low attachment rate. A checkout upsell prompt could boost dessert add-ons by 15-20%.`,
      quadrant: 'puzzle',
      impactAmount: Math.round((dessert.totalRevenue / 6) * 0.18),
      impactLabel: `+${formatDollar(Math.round((dessert.totalRevenue / 6) * 0.18))}/mo from upsell conversions`,
      productIds: [dessert.productId],
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ==================== SUMMARY HELPERS ====================

export function getQuadrantSummary(products: ClassifiedProduct[]) {
  const quadrants: Quadrant[] = ['star', 'plowhorse', 'puzzle', 'dog'];
  return quadrants.map((q) => {
    const items = products.filter((p) => p.quadrant === q);
    return {
      quadrant: q,
      count: items.length,
      totalRevenue: Math.round(items.reduce((s, p) => s + p.totalRevenue, 0)),
      totalProfit: Math.round(items.reduce((s, p) => s + p.totalProfit, 0)),
      avgMargin:
        items.length > 0
          ? Math.round(
              (items.reduce((s, p) => s + p.avgMarginPct, 0) / items.length) * 10
            ) / 10
          : 0,
    };
  });
}

export function getCategoryHeatmapData(products: ClassifiedProduct[]) {
  const categories = ['breakfast', 'lunch', 'dessert', 'beverage', 'snack'];

  return categories.map((cat) => {
    const catProducts = products.filter((p) => p.category === cat);
    const monthlyRevenue = MONTHS.map((month) => {
      return catProducts.reduce((sum, p) => {
        const monthRecord = p.monthlyData.find((m) => m.month === month);
        return sum + (monthRecord?.revenue || 0);
      }, 0);
    });
    return {
      category: cat,
      months: MONTHS,
      values: monthlyRevenue.map((v) => Math.round(v)),
    };
  });
}

// ==================== FORMAT HELPERS ====================

function formatDollar(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${monthNames[parseInt(m) - 1]} ${year}`;
}

export function formatMonthShort(month: string): string {
  const [, m] = month.split('-');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return monthNames[parseInt(m) - 1];
}
