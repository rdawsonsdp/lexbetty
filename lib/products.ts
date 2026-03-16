import { CateringProduct } from './types';

// Standard pan sizes for LB: Half 10-15, Full 20-25
const STANDARD_PAN_SIZES = [
  { size: 'half' as const, servesMin: 10, servesMax: 15 },
  { size: 'full' as const, servesMin: 20, servesMax: 25 },
];

// Helper to create pan pricing
function panPricing(halfPrice: number, fullPrice: number) {
  return {
    type: 'pan' as const,
    sizes: [
      { ...STANDARD_PAN_SIZES[0], price: halfPrice },
      { ...STANDARD_PAN_SIZES[1], price: fullPrice },
    ],
  };
}

export const CATERING_PRODUCTS: CateringProduct[] = [
  // ==================== A LA CARTE — BETTY MEATS (Pork) ====================
  {
    id: 'rib-tips',
    title: 'Rib Tips',
    description: 'Smoked to perfection rib tips. Half pan (4 lbs) or full pan (8 lbs).',
    image: '/images/special_rib_tips_chicken.jpg',
    categories: ['lunch'],
    pricing: panPricing(55, 105),
    tags: ['popular', 'bbq', 'pork'],
    featured: true,
  },
  {
    id: 'smoked-ribs',
    title: 'Smoked Ribs',
    description: 'Slow-smoked ribs, sold by the pound.',
    image: '/images/chef-dominique-ribs.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 18, minOrder: 3 },
    tags: ['bbq', 'pork', 'popular'],
    featured: true,
  },
  {
    id: 'pulled-pork',
    title: 'Pulled Pork',
    description: 'Tender slow-smoked pulled pork, sold by the pound.',
    image: '/images/platter_pulled_pork.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 25, minOrder: 2 },
    tags: ['bbq', 'pork', 'popular'],
  },
  {
    id: 'smoked-hot-links',
    title: 'Smoked Hot Links',
    description: 'Spicy smoked hot links. Full pan.',
    image: '/images/bbq_brisket.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-container', pricePerContainer: 60, servesPerContainer: 15 },
    tags: ['bbq', 'pork', 'spicy'],
  },

  // ==================== A LA CARTE — BETTY MEATS (Poultry) ====================
  {
    id: 'smoked-chicken-quarters-wing-mix',
    title: 'Smoked Chicken Quarters & Wing Mix',
    description: 'Smoked chicken quarters and wings. 5 pounds ($95) or 10 pounds ($190).',
    image: '/images/special_rib_tips_chicken.jpg',
    categories: ['lunch'],
    pricing: panPricing(95, 190),
    tags: ['bbq', 'poultry', 'popular'],
    featured: true,
  },
  {
    id: 'pulled-chicken',
    title: 'Pulled Chicken',
    description: 'Tender smoked pulled chicken, sold by the pound.',
    image: '/images/Garlic Butter Chicken Breast Hi Res Image.png',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 15, minOrder: 2 },
    tags: ['bbq', 'poultry'],
  },
  {
    id: 'turkey-tips',
    title: 'Turkey Tips',
    description: 'Smoked turkey tips, sold by the pound.',
    image: '/images/Garlic Butter Chicken Breast Hi Res Image.png',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 18, minOrder: 2 },
    tags: ['bbq', 'poultry'],
  },

  // ==================== A LA CARTE — BETTY MEATS (Beef) ====================
  {
    id: 'brisket',
    title: 'Brisket',
    description: 'Premium smoked brisket, sold by the pound.',
    image: '/images/meat_smoked_brisket.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 34, minOrder: 2 },
    tags: ['bbq', 'beef', 'popular', 'premium'],
    featured: true,
  },
  {
    id: 'beef-rib-tips',
    title: 'Beef Rib Tips',
    description: 'Smoked beef rib tips, sold by the pound. Market price.',
    image: '/images/meat_smoked_brisket.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 30, minOrder: 2 },
    tags: ['bbq', 'beef', 'premium'],
  },
  {
    id: 'beef-wagyu-sausage',
    title: 'Beef Wagyu Sausage',
    description: 'Premium wagyu beef sausage, sold by the pound.',
    image: '/images/wagyu_dog_chicago_style.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 24, minOrder: 2 },
    tags: ['bbq', 'beef', 'premium'],
  },

  // ==================== A LA CARTE — SLIDERS (24 Units) ====================
  {
    id: 'pulled-chicken-sliders',
    title: 'Pulled Chicken Sliders (24 ct)',
    description: 'Smoked to perfection on brioche buns with pickles & coleslaw on the side. Original or spicy BBQ sauce.',
    image: '/images/Stacked Sandwiches Hi Res Shot.png',
    categories: ['lunch'],
    pricing: { type: 'per-container', pricePerContainer: 110, servesPerContainer: 24 },
    tags: ['bbq', 'poultry', 'sliders'],
  },
  {
    id: 'pulled-pork-sliders',
    title: 'Pulled Pork Sliders (24 ct)',
    description: 'Smoked to perfection on brioche buns with pickles & coleslaw on the side. Original or spicy BBQ sauce.',
    image: '/images/sandwich_pulled_pork.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-container', pricePerContainer: 180, servesPerContainer: 24 },
    tags: ['bbq', 'pork', 'sliders', 'popular'],
  },
  {
    id: 'brisket-sliders',
    title: 'Brisket Sliders (24 ct)',
    description: 'Smoked to perfection on brioche buns with pickles & coleslaw on the side. Original or spicy BBQ sauce.',
    image: '/images/sandwich_brisket.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-container', pricePerContainer: 180, servesPerContainer: 24 },
    tags: ['bbq', 'beef', 'sliders', 'popular'],
  },
  {
    id: 'portabella-peppers-sliders',
    title: 'Portabella & Peppers Sliders (24 ct)',
    description: 'Smoked portabella mushroom and peppers on brioche buns with pickles & coleslaw on the side. Vegetarian.',
    image: '/images/Stacked Sandwiches Hi Res Shot.png',
    categories: ['lunch'],
    pricing: { type: 'per-container', pricePerContainer: 110, servesPerContainer: 24 },
    tags: ['vegetarian', 'sliders', 'vegan'],
  },

  // ==================== A LA CARTE — BETTY SOULFUL SIDES ====================
  {
    id: 'gouda-mac-n-cheese',
    title: 'Gouda Mac n Cheese',
    description: 'Creamy gouda mac and cheese. Vegetarian.',
    image: '/images/Macaroni and Cheese Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(60, 120),
    tags: ['vegetarian', 'popular', 'sides', 'comfort'],
    featured: true,
  },
  {
    id: 'collard-greens',
    title: 'Greens',
    description: 'Slow-cooked collard greens.',
    image: '/images/side_collard_greens.jpg',
    categories: ['lunch'],
    pricing: panPricing(45, 80),
    tags: ['sides', 'southern'],
  },
  {
    id: 'brisket-baked-beans',
    title: 'Brisket Baked Beans',
    description: 'Hearty baked beans with smoked brisket.',
    image: '/images/side_baked_beans.jpg',
    categories: ['lunch'],
    pricing: panPricing(60, 120),
    tags: ['sides', 'bbq', 'popular'],
  },
  {
    id: 'fresh-corn-on-the-cob',
    title: 'Fresh Corn on the Cob',
    description: 'Fresh corn on the cob. Vegetarian. Market price.',
    image: '/images/Garlic Mashed Potatoes Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(40, 75),
    tags: ['vegetarian', 'vegan', 'sides'],
  },
  {
    id: 'creamy-coleslaw',
    title: 'Creamy Coleslaw',
    description: 'Creamy coleslaw. Vegetarian. Small or Large.',
    image: '/images/Southwest Salad Shot Hi Res.png',
    categories: ['lunch'],
    pricing: {
      type: 'pan',
      sizes: [
        { size: 'half' as const, servesMin: 8, servesMax: 12, price: 10 },
        { size: 'full' as const, servesMin: 20, servesMax: 30, price: 35 },
      ],
    },
    tags: ['vegetarian', 'vegan', 'sides'],
  },
  {
    id: 'chopped-salad',
    title: 'Chopped Salad',
    description: 'Fresh chopped salad with ranch or balsamic dressing. Vegetarian.',
    image: '/images/Southwest Salad Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(45, 90),
    tags: ['vegetarian', 'vegan', 'sides', 'healthy'],
  },
  {
    id: 'candy-yams',
    title: 'Candy Yams',
    description: 'Sweet candied yams. Vegetarian.',
    image: '/images/side_candy_yams.jpg',
    categories: ['lunch'],
    pricing: panPricing(60, 120),
    tags: ['vegetarian', 'vegan', 'sides', 'southern'],
  },
  {
    id: 'jambalaya',
    title: 'Jambalaya',
    description: 'Hearty jambalaya. Full pan.',
    image: '/images/Red Beans and Rice Hi Res Shot.png',
    categories: ['lunch'],
    pricing: { type: 'per-container', pricePerContainer: 120, servesPerContainer: 20 },
    tags: ['sides', 'southern', 'popular'],
  },
  {
    id: 'cornbread-muffins',
    title: 'Cornbread Muffins',
    description: 'Freshly baked cornbread muffins, sold by the dozen.',
    image: '/images/cornbread.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-dozen', pricePerDozen: 15, servesPerDozen: 12 },
    tags: ['sides', 'bread', 'vegetarian'],
  },
  {
    id: 'extra-sauce',
    title: 'Extra Sauce (16oz)',
    description: 'Additional BBQ sauce. Original or spicy. 16oz container.',
    image: '/images/brisket-sauce-pour.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 10, minOrder: 1 },
    tags: ['condiments'],
  },

  // ==================== BETTY DESSERTS ====================
  {
    id: 'banana-pudding',
    title: 'Banana Pudding',
    description: 'Homemade banana pudding. Vegetarian.',
    image: '/images/dessert_banana_pudding.jpg',
    categories: ['dessert'],
    pricing: panPricing(30, 60),
    tags: ['vegetarian', 'dessert', 'popular', 'southern'],
    featured: true,
  },
  {
    id: 'peach-cobbler',
    title: 'Peach Cobbler',
    description: 'Homemade peach cobbler. Vegetarian.',
    image: '/images/BSB Caramel Cake Slices Hi Res Shot.png',
    categories: ['dessert'],
    pricing: panPricing(30, 60),
    tags: ['vegetarian', 'dessert', 'popular', 'southern'],
  },
  {
    id: 'custom-cake',
    title: '3 Layer Custom Cake',
    description: 'Custom 3-layer cake for events up to 50 guests.',
    image: '/images/BSB Red Velvet Cake.png',
    categories: ['dessert'],
    pricing: { type: 'per-each', priceEach: 60, minOrder: 1 },
    tags: ['dessert', 'premium', 'celebration'],
  },
  {
    id: 'chocolate-chip-cookies',
    title: 'Chocolate Chip Cookies',
    description: 'Freshly baked chocolate chip cookies, sold by the dozen.',
    image: '/images/BSB Chocolate Chip Cookies Hi Res Shot.png',
    categories: ['dessert'],
    pricing: { type: 'per-dozen', pricePerDozen: 18, servesPerDozen: 12 },
    tags: ['dessert', 'vegetarian'],
  },

  // ==================== BETTY DRINKS ====================
  {
    id: 'tobis-lemonade',
    title: "Tobi's Lemonade",
    description: "Tobi's signature lemonade by the gallon. Vegetarian.",
    image: '/images/Cold Brew Hi Res Shot.png',
    categories: ['dessert'],
    pricing: { type: 'per-container', pricePerContainer: 40, servesPerContainer: 16 },
    tags: ['beverage', 'vegetarian', 'vegan', 'popular'],
    featured: true,
  },
  {
    id: 'homemade-lemonade',
    title: 'Homemade Lemonade',
    description: 'Individual homemade lemonade.',
    image: '/images/Cold Brew Hi Res Shot.png',
    categories: ['dessert'],
    pricing: { type: 'per-each', priceEach: 5, minOrder: 5 },
    tags: ['beverage', 'vegetarian', 'vegan'],
  },
  {
    id: 'iced-tea',
    title: 'Iced Tea',
    description: 'Freshly brewed iced tea.',
    image: '/images/Cold Brew Hi Res Shot.png',
    categories: ['dessert'],
    pricing: { type: 'per-each', priceEach: 4, minOrder: 5 },
    tags: ['beverage', 'vegetarian', 'vegan'],
  },
  {
    id: 'water',
    title: 'Water',
    description: 'Bottled water.',
    image: '/images/Soda Hi Res Image Shot.png',
    categories: ['dessert'],
    pricing: { type: 'per-each', priceEach: 2, minOrder: 10 },
    tags: ['beverage', 'vegan'],
  },
  {
    id: 'soda',
    title: 'Coke, Diet Coke, or Sprite',
    description: 'Canned sodas — Coke, Diet Coke, or Sprite.',
    image: '/images/Soda Hi Res Image Shot.png',
    categories: ['dessert'],
    pricing: { type: 'per-each', priceEach: 3, minOrder: 5 },
    tags: ['beverage', 'vegan'],
  },

  // ==================== CATERING SERVICES ====================
  {
    id: 'full-setup',
    title: 'Full Setup Service',
    description: 'Our team will set up your complete catering spread — chafing dishes, serving stations, table linens, and cleanup.',
    image: '/images/bbq_brisket.jpg',
    categories: ['breakfast', 'lunch', 'dessert', 'alacarte'],
    pricing: { type: 'per-person', pricePerPerson: 5 },
    tags: ['service'],
  },

  // ==================== CATERING EQUIPMENT & EXTRAS ====================
  {
    id: 'sterno',
    title: 'Sterno',
    description: 'Sterno fuel can for chafing dishes. $2 each.',
    image: '/images/bbq_brisket.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 2, minOrder: 1 },
    tags: ['equipment'],
  },
  {
    id: 'catering-rack',
    title: 'Catering Rack',
    description: 'Catering rack for food service. $12 each.',
    image: '/images/bbq_brisket.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 12, minOrder: 1 },
    tags: ['equipment'],
  },
  {
    id: 'serving-utensils',
    title: 'Serving Utensils',
    description: 'Serving utensils. $2 per utensil.',
    image: '/images/bbq_brisket.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 2, minOrder: 1 },
    tags: ['equipment', 'cutlery'],
  },
  {
    id: 'utensil-sets',
    title: 'Utensil Sets',
    description: 'Individual utensil sets (fork, knife, napkin). $0.50 per set.',
    image: '/images/bbq_brisket.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 0.50, minOrder: 10 },
    tags: ['equipment', 'cutlery'],
  },
];

// Helper functions

export function getProductsByEventType(eventType: string): CateringProduct[] {
  if (eventType === 'alacarte') return CATERING_PRODUCTS;
  return CATERING_PRODUCTS.filter((p) => p.categories.includes(eventType as 'breakfast' | 'lunch'));
}

export function getProductById(id: string): CateringProduct | undefined {
  return CATERING_PRODUCTS.find((p) => p.id === id);
}

export function getRecommendedProducts(
  eventType?: string | null,
  maxBudgetPerPerson?: number | null,
  selectedProductIds?: string[]
): CateringProduct[] {
  let products = CATERING_PRODUCTS.filter(
    (p) => !p.tags?.includes('equipment') && !p.tags?.includes('cutlery') && !p.tags?.includes('condiments')
  );

  if (eventType && eventType !== 'alacarte') {
    products = products.filter((p) =>
      p.categories.includes(eventType as 'breakfast' | 'lunch')
    );
  }

  // Exclude already-selected products
  if (selectedProductIds && selectedProductIds.length > 0) {
    products = products.filter((p) => !selectedProductIds.includes(p.id));
  }

  // Prioritize featured items
  products.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });

  return products.slice(0, 6);
}

export function getSuggestedMenu(eventType: string): CateringProduct[] {
  const products = getProductsByEventType(eventType);
  return products.filter((p) => p.featured).slice(0, 4);
}
