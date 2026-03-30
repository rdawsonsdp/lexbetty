import { CateringProduct } from './types';

// Standard pan sizes for LB: Half 10-15, Full 20-25
const STANDARD_PAN_SIZES = [
  { size: 'half' as const, servesMin: 10, servesMax: 15 },
  { size: 'full' as const, servesMin: 20, servesMax: 25 },
];

// Helper to create pan pricing with optional estimated weight per pan
function panPricing(halfPrice: number, fullPrice: number, halfWeightOz?: number, fullWeightOz?: number) {
  return {
    type: 'pan' as const,
    sizes: [
      { ...STANDARD_PAN_SIZES[0], price: halfPrice, ...(halfWeightOz ? { estimatedWeightOz: halfWeightOz } : {}) },
      { ...STANDARD_PAN_SIZES[1], price: fullPrice, ...(fullWeightOz ? { estimatedWeightOz: fullWeightOz } : {}) },
    ],
  };
}

export const CATERING_PRODUCTS: CateringProduct[] = [
  // ==================== A LA CARTE — BETTY MEATS (Pork) ====================
  {
    id: 'rib-tips',
    title: 'Rib Tips',
    description: 'Tender, smoky pork rib tips slow-smoked over hickory until they pull apart. A Chicago BBQ favorite.',
    image: '/images/special_rib_tips_chicken.jpg',
    categories: ['lunch'],
    pricing: panPricing(55, 105, 80, 160),
    tags: ['popular', 'bbq', 'pork', 'meats'],
    featured: true,
  },
  {
    id: 'smoked-ribs',
    title: 'Smoked Ribs',
    description: 'Fall-off-the-bone ribs rubbed with our house blend and smoked low and slow for hours. Sold by the pound.',
    image: '/images/chef-dominique-ribs.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 18, minOrder: 3, unit: 'lb' },
    tags: ['bbq', 'pork', 'popular', 'meats'],
    featured: true,
    minOrderQuantity: 10,
  },
  {
    id: 'pulled-pork',
    title: 'Pulled Pork',
    description: 'Hand-pulled shoulder smoked for 14 hours until buttery tender. Piled high with our signature sauce.',
    image: '/images/platter_pulled_pork.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 25, minOrder: 2, unit: 'lb' },
    tags: ['bbq', 'pork', 'popular', 'meats'],
    minOrderQuantity: 5,
  },
  {
    id: 'smoked-hot-links',
    title: 'Smoked Hot Links',
    description: 'Snappy, juicy hot links with a kick of heat, kissed with hickory smoke. A south side staple.',
    image: '/images/bbq_brisket.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-container', pricePerContainer: 60, servesPerContainer: 15, estimatedWeightOz: 80 },
    tags: ['bbq', 'pork', 'spicy', 'meats'],
  },

  // ==================== A LA CARTE — BETTY MEATS (Poultry) ====================
  {
    id: 'smoked-chicken-quarters-wing-mix',
    title: 'Smoked Chicken Quarters & Wing Mix',
    description: 'Juicy bone-in quarters and crispy wings smoked golden brown. Seasoned with Chef Dominique\'s signature rub.',
    image: '/images/special_rib_tips_chicken.jpg',
    categories: ['lunch'],
    pricing: panPricing(95, 190, 112, 224),
    tags: ['bbq', 'poultry', 'popular', 'meats'],
    featured: true,
  },
  {
    id: 'pulled-chicken',
    title: 'Pulled Chicken',
    description: 'Slow-smoked whole chicken, hand-shredded and tossed in our original BBQ sauce. Light, lean, and full of flavor.',
    image: '/images/chicken-quarters.webp',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 15, minOrder: 2, unit: 'lb' },
    tags: ['bbq', 'poultry', 'meats'],
    specialOrder: true,
    minOrderQuantity: 5,
  },
  {
    id: 'turkey-tips',
    title: 'Turkey Tips',
    description: 'Hickory-smoked turkey tips seasoned and charred to perfection. A lighter take on BBQ that doesn\'t sacrifice flavor.',
    image: '/images/Garlic Butter Chicken Breast Hi Res Image.png',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 18, minOrder: 2, unit: 'lb' },
    tags: ['bbq', 'poultry', 'meats'],
    specialOrder: true,
    minOrderQuantity: 5,
  },

  // ==================== A LA CARTE — BETTY MEATS (Beef) ====================
  {
    id: 'brisket',
    title: 'Brisket',
    description: 'Prime beef brisket smoked 16 hours over post oak until the bark shatters and the inside melts. Our pitmaster\'s pride.',
    image: '/images/meat_smoked_brisket.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 34, minOrder: 2, unit: 'lb' },
    tags: ['bbq', 'beef', 'popular', 'premium', 'meats'],
    featured: true,
    minOrderQuantity: 5,
  },
  {
    id: 'beef-wagyu-sausage',
    title: 'Beef Wagyu Sausage',
    description: 'Premium wagyu beef links with a buttery richness you won\'t find anywhere else. Smoked and snappy.',
    image: '/images/wagyu_dog_chicago_style.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 24, minOrder: 2, unit: 'lb' },
    tags: ['bbq', 'beef', 'premium', 'meats'],
  },

  // ==================== A LA CARTE — SLIDERS (24 Units) ====================
  {
    id: 'pulled-chicken-sliders',
    title: 'Pulled Chicken Sliders (24 ct)',
    description: 'Tender smoked chicken piled on warm brioche buns with pickles and slaw. Choose original or spicy BBQ sauce.',
    image: '/images/Stacked Sandwiches Hi Res Shot.png',
    categories: ['lunch'],
    pricing: { type: 'per-container', pricePerContainer: 110, servesPerContainer: 24 },
    tags: ['bbq', 'poultry', 'sliders'],
  },
  {
    id: 'pulled-pork-sliders',
    title: 'Pulled Pork Sliders (24 ct)',
    description: 'Juicy 14-hour pulled pork stacked on buttery brioche with house pickles. A crowd favorite at every event.',
    image: '/images/sandwich_pulled_pork.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-container', pricePerContainer: 180, servesPerContainer: 24 },
    tags: ['bbq', 'pork', 'sliders', 'popular'],
  },
  {
    id: 'brisket-sliders',
    title: 'Brisket Sliders (24 ct)',
    description: 'Melt-in-your-mouth smoked brisket on brioche with pickles and slaw. Premium flavor in every bite.',
    image: '/images/sandwich_brisket.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-container', pricePerContainer: 180, servesPerContainer: 24 },
    tags: ['bbq', 'beef', 'sliders', 'popular'],
  },
  {
    id: 'portabella-peppers-sliders',
    title: 'Portabella & Peppers Sliders (24 ct)',
    description: 'Smoky portabella caps and roasted peppers on brioche buns. A hearty vegetarian option everyone loves.',
    image: '/images/Stacked Sandwiches Hi Res Shot.png',
    categories: ['lunch'],
    pricing: { type: 'per-container', pricePerContainer: 110, servesPerContainer: 24 },
    tags: ['vegetarian', 'sliders', 'vegan'],
  },

  // ==================== A LA CARTE — BETTY SOULFUL SIDES ====================
  {
    id: 'gouda-mac-n-cheese',
    title: 'Gouda Mac n Cheese',
    description: 'Ultra-creamy three-cheese mac made with smoked gouda, baked until golden and bubbly. Pure comfort.',
    image: '/images/Macaroni and Cheese Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(60, 120),
    tags: ['vegetarian', 'popular', 'sides', 'comfort'],
    featured: true,
  },
  {
    id: 'collard-greens',
    title: 'Greens',
    description: 'Slow-braised collard greens simmered with smoked turkey and a touch of vinegar. Soulful and savory.',
    image: '/images/side_collard_greens.jpg',
    categories: ['lunch'],
    pricing: panPricing(45, 80),
    tags: ['sides', 'southern'],
  },
  {
    id: 'brisket-baked-beans',
    title: 'Brisket Baked Beans',
    description: 'Sweet and smoky baked beans loaded with chopped brisket burnt ends. The side that steals the show.',
    image: '/images/side_baked_beans.jpg',
    categories: ['lunch'],
    pricing: panPricing(60, 120),
    tags: ['sides', 'bbq', 'popular'],
  },
  {
    id: 'fresh-corn-on-the-cob',
    title: 'Fresh Corn on the Cob',
    description: 'Sweet seasonal corn grilled and brushed with herb butter. Simple, fresh, and always a hit.',
    image: '/images/Garlic Mashed Potatoes Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(40, 75),
    tags: ['vegetarian', 'vegan', 'sides'],
  },
  {
    id: 'creamy-coleslaw',
    title: 'Creamy Coleslaw',
    description: 'Crisp cabbage and carrots in a tangy, creamy dressing. Cool and refreshing next to hot BBQ.',
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
    description: 'Crisp mixed greens with fresh vegetables, tossed with your choice of ranch or balsamic.',
    image: '/images/Southwest Salad Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(45, 90),
    tags: ['vegetarian', 'vegan', 'sides', 'healthy'],
  },
  {
    id: 'candy-yams',
    title: 'Candy Yams',
    description: 'Brown sugar-glazed sweet potatoes baked until caramelized and tender. A soulful southern classic.',
    image: '/images/side_candy_yams.jpg',
    categories: ['lunch'],
    pricing: panPricing(60, 120),
    tags: ['vegetarian', 'vegan', 'sides', 'southern'],
  },
  {
    id: 'jambalaya',
    title: 'Jambalaya',
    description: 'Spicy Cajun rice loaded with smoked sausage, chicken, and the holy trinity. Bold and filling.',
    image: '/images/Red Beans and Rice Hi Res Shot.png',
    categories: ['lunch'],
    pricing: { type: 'per-container', pricePerContainer: 120, servesPerContainer: 20 },
    tags: ['sides', 'southern', 'popular'],
  },
  {
    id: 'jambalaya-with-shrimp',
    title: 'Jambalaya with Shrimp',
    description: 'Spicy Cajun rice loaded with smoked sausage, chicken, gulf shrimp, and the holy trinity. Bold and filling.',
    image: '/images/Red Beans and Rice Hi Res Shot.png',
    categories: ['lunch'],
    pricing: { type: 'per-container', pricePerContainer: 150, servesPerContainer: 20 },
    tags: ['sides', 'southern', 'popular', 'seafood'],
  },
  {
    id: 'cornbread-muffins',
    title: 'Cornbread Muffins',
    description: 'Warm, golden cornbread muffins baked fresh with a hint of honey. The perfect companion to any plate.',
    image: '/images/cornbread.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-dozen', pricePerDozen: 15, servesPerDozen: 12 },
    tags: ['sides', 'bread', 'vegetarian'],
  },
  {
    id: 'extra-sauce',
    title: 'Extra Sauce (16oz)',
    description: 'Chef Dominique\'s signature BBQ sauce — original sweet and tangy or spicy with a slow burn. 16oz jar.',
    image: '/images/brisket-sauce-pour.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 10, minOrder: 1 },
    tags: ['condiments'],
  },

  // ==================== BETTY DESSERTS ====================
  {
    id: 'banana-pudding',
    title: 'Banana Pudding',
    description: 'Layers of vanilla custard, fresh bananas, and Nilla wafers. Made from scratch — grandma\'s recipe.',
    image: '/images/dessert_banana_pudding.jpg',
    categories: ['lunch', 'dessert'],
    pricing: panPricing(30, 60),
    tags: ['vegetarian', 'dessert', 'popular', 'southern'],
    featured: true,
  },
  {
    id: 'peach-cobbler',
    title: 'Peach Cobbler',
    description: 'Warm, buttery cobbler with sweet peaches and a golden brown crust. Best served warm with a smile.',
    image: '/images/BSB Caramel Cake Slices Hi Res Shot.png',
    categories: ['lunch', 'dessert'],
    pricing: panPricing(30, 60),
    tags: ['vegetarian', 'dessert', 'popular', 'southern'],
  },
  {
    id: 'custom-cake',
    title: '3 Layer Custom Cake',
    description: 'A showstopper three-layer cake custom decorated for your event. Serves up to 50 guests.',
    image: '/images/BSB Red Velvet Cake.png',
    categories: ['lunch', 'dessert'],
    pricing: { type: 'per-each', priceEach: 60, minOrder: 1 },
    tags: ['dessert', 'premium', 'celebration'],
  },
  {
    id: 'chocolate-chip-cookies',
    title: 'Chocolate Chip Cookies',
    description: 'Thick, chewy cookies loaded with chocolate chips and baked golden. Sold by the dozen.',
    image: '/images/BSB Chocolate Chip Cookies Hi Res Shot.png',
    categories: ['lunch', 'dessert'],
    pricing: { type: 'per-dozen', pricePerDozen: 18, servesPerDozen: 12 },
    tags: ['dessert', 'vegetarian'],
  },

  // ==================== BETTY DRINKS ====================
  {
    id: 'tobis-lemonade',
    title: "Tobi's Lemonade",
    description: "Our signature house lemonade — perfectly sweet, perfectly tart. Made fresh by the gallon.",
    image: '/images/Cold Brew Hi Res Shot.png',
    categories: ['lunch', 'dessert'],
    pricing: { type: 'per-container', pricePerContainer: 40, servesPerContainer: 16 },
    tags: ['beverage', 'vegetarian', 'vegan', 'popular'],
    featured: true,
  },
  {
    id: 'homemade-lemonade',
    title: 'Homemade Lemonade',
    description: 'Fresh-squeezed lemonade served cold in individual bottles. Refreshing and real.',
    image: '/images/Cold Brew Hi Res Shot.png',
    categories: ['lunch', 'dessert'],
    pricing: { type: 'per-each', priceEach: 5, minOrder: 5 },
    tags: ['beverage', 'vegetarian', 'vegan'],
  },
  {
    id: 'iced-tea',
    title: 'Iced Tea',
    description: 'Classic southern sweet tea brewed fresh and served ice cold. Unsweetened available on request.',
    image: '/images/Cold Brew Hi Res Shot.png',
    categories: ['lunch', 'dessert'],
    pricing: { type: 'per-each', priceEach: 4, minOrder: 5 },
    tags: ['beverage', 'vegetarian', 'vegan'],
  },
  {
    id: 'water',
    title: 'Water',
    description: 'Cold bottled water to keep your guests hydrated.',
    image: '/images/Soda Hi Res Image Shot.png',
    categories: ['lunch', 'dessert'],
    pricing: { type: 'per-each', priceEach: 2, minOrder: 10 },
    tags: ['beverage', 'vegan'],
  },
  {
    id: 'soda',
    title: 'Coke, Diet Coke, or Sprite',
    description: 'Ice-cold canned sodas. Choose from Coke, Diet Coke, or Sprite.',
    image: '/images/Soda Hi Res Image Shot.png',
    categories: ['lunch', 'dessert'],
    pricing: { type: 'per-each', priceEach: 3, minOrder: 5 },
    tags: ['beverage', 'vegan'],
  },

  // ==================== CATERING SERVICES ====================
  {
    id: 'full-setup',
    title: 'Full Setup Service',
    description: 'Our team handles everything — chafing dishes, serving stations, linens, and cleanup. You just enjoy the party.',
    image: '/images/bbq_brisket.jpg',
    categories: ['breakfast', 'lunch', 'dessert', 'alacarte'],
    pricing: { type: 'per-person', pricePerPerson: 5 },
    tags: ['service'],
  },
  {
    id: 'buffet-drop-off-setup',
    title: 'Buffet Drop Off Set Up',
    description: 'Chafing dishes and sternos set up so your food stays hot and ready to serve.',
    image: '/images/bbq_brisket.jpg',
    categories: ['breakfast', 'lunch', 'dessert', 'alacarte'],
    pricing: { type: 'flat', flatPrice: 50 },
    tags: ['service'],
  },

  // ==================== CATERING EQUIPMENT & EXTRAS ====================
  {
    id: 'sterno',
    title: 'Sterno',
    description: 'Fuel cans to keep your chafing dishes hot throughout the event.',
    image: '/images/bbq_brisket.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 2, minOrder: 1 },
    tags: ['equipment'],
  },
  {
    id: 'catering-rack',
    title: 'Catering Rack',
    description: 'Wire racks to elevate your chafing dishes for a professional buffet setup.',
    image: '/images/bbq_brisket.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 12, minOrder: 1 },
    tags: ['equipment'],
  },
  {
    id: 'serving-utensils',
    title: 'Serving Utensils',
    description: 'Tongs, spoons, and spatulas for your buffet line.',
    image: '/images/bbq_brisket.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 2, minOrder: 1 },
    tags: ['equipment', 'cutlery'],
  },
  {
    id: 'utensil-sets',
    title: 'Utensil Sets',
    description: 'Individual place settings — fork, knife, and napkin wrapped and ready to go.',
    image: '/images/bbq_brisket.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 0.50, minOrder: 10 },
    tags: ['equipment', 'cutlery'],
  },

  // ==================== TAKE US HOME — Retail Add-Ons ====================
  {
    id: 'take-home-bbq-sauce',
    title: "Chef Dominique's BBQ Sauce (32oz)",
    description: 'Our signature sweet-and-smoky sauce bottled up so you can drizzle it on everything at home. A party favorite that keeps the flavor going.',
    image: '/images/brisket-sauce-pour.jpg',
    categories: ['other'],
    pricing: { type: 'per-each', priceEach: 18, minOrder: 1 },
    tags: ['take-home', 'popular'],
    featured: true,
  },
  {
    id: 'take-home-hot-sauce',
    title: "Betty's Hot Sauce (8oz)",
    description: 'Slow-burn heat with smoky depth — a few dashes transform any plate. Made in small batches right here in Chicago.',
    image: '/images/brisket-sauce-pour.jpg',
    categories: ['other'],
    pricing: { type: 'per-each', priceEach: 12, minOrder: 1 },
    tags: ['take-home'],
  },
  {
    id: 'take-home-wagyu-sausage',
    title: 'Wagyu Beef Sausage Pack (4 links)',
    description: 'Premium wagyu links vacuum-sealed and ready for your grill. Because one taste at the party is never enough.',
    image: '/images/wagyu_dog_chicago_style.jpg',
    categories: ['other'],
    pricing: { type: 'per-each', priceEach: 28, minOrder: 1 },
    tags: ['take-home', 'premium', 'bbq'],
    featured: true,
  },
  {
    id: 'take-home-dry-rub',
    title: "Smokehouse Dry Rub (12oz)",
    description: 'The secret blend Chef Dominique rubs on every rack of ribs. Now you can bring the magic to your own backyard.',
    image: '/images/bbq_brisket.jpg',
    categories: ['other'],
    pricing: { type: 'per-each', priceEach: 14, minOrder: 1 },
    tags: ['take-home'],
  },
  {
    id: 'take-home-banana-pudding',
    title: 'Banana Pudding Jar (16oz)',
    description: 'Grandma\'s recipe in a grab-and-go jar. Layers of vanilla custard, fresh bananas, and Nilla wafers — dessert for tomorrow.',
    image: '/images/dessert_banana_pudding.jpg',
    categories: ['other'],
    pricing: { type: 'per-each', priceEach: 10, minOrder: 1 },
    tags: ['take-home', 'dessert'],
  },
  {
    id: 'take-home-rib-tips',
    title: 'Rib Tips Family Pack (3 lbs)',
    description: 'Three pounds of our famous rib tips, sealed and ready to reheat. Perfect for the ride home or tomorrow\'s lunch.',
    image: '/images/special_rib_tips_chicken.jpg',
    categories: ['other'],
    pricing: { type: 'per-each', priceEach: 45, minOrder: 1 },
    tags: ['take-home', 'bbq', 'popular'],
    featured: true,
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

export function getTakeHomeProducts(): CateringProduct[] {
  return CATERING_PRODUCTS.filter((p) => p.tags?.includes('take-home'));
}
