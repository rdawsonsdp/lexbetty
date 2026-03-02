import { CateringProduct } from './types';

// Standard tray sizes: Small 10-15, Medium 15-24, Large 25-40
const STANDARD_TRAY_SIZES = [
  { size: 'small' as const, servesMin: 10, servesMax: 15 },
  { size: 'medium' as const, servesMin: 15, servesMax: 24 },
  { size: 'large' as const, servesMin: 25, servesMax: 40 },
];

// Standard pan sizes: Half 10-15, Full 20-25
const STANDARD_PAN_SIZES = [
  { size: 'half' as const, servesMin: 10, servesMax: 15 },
  { size: 'full' as const, servesMin: 20, servesMax: 25 },
];

// Helper to create tray pricing
function trayPricing(smallPrice: number, medPrice: number, lgPrice: number) {
  return {
    type: 'tray' as const,
    sizes: [
      { ...STANDARD_TRAY_SIZES[0], price: smallPrice },
      { ...STANDARD_TRAY_SIZES[1], price: medPrice },
      { ...STANDARD_TRAY_SIZES[2], price: lgPrice },
    ],
  };
}

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
  // ==================== BREAKFAST - SUNRISE STAPLES ====================
  {
    id: 'morning-mingle-tray',
    title: 'Morning Mingle Tray',
    description: 'A fresh assortment of muffins, danishes, donuts, banana bread, and bagels with cream cheese & butter. Includes fruit cups and breakfast bars.',
    image: '/images/Breakfast Biscuits Shot High Res.png',
    categories: ['breakfast'],
    pricing: trayPricing(98, 156, 260),
    tags: ['pastries', 'assorted', 'popular'],
  },
  {
    id: 'parfait-bar',
    title: 'Build-Your-Own Parfait Bar',
    description: 'Creamy vanilla Greek yogurt with granola, fresh berries, and honey on the side.',
    image: '/images/Yogurt Parfait Shot High Res.png',
    categories: ['breakfast'],
    pricing: trayPricing(98, 156, 260),
    tags: ['healthy', 'interactive', 'vegetarian'],
  },
  {
    id: 'fresh-fruit-tray',
    title: 'Fresh Fruit Tray',
    description: 'Seasonal, hand-cut fruit chunks including pineapple, cantaloupe, honeydew, grapes, strawberries & watermelon.',
    image: '/images/Fruit Salad Shot Hi Res.png',
    categories: ['breakfast', 'lunch', 'dessert'],
    pricing: trayPricing(98, 156, 260),
    tags: ['healthy', 'vegan', 'fruit', 'gluten-free', 'dairy-free', 'halal'],
  },
  {
    id: 'fresh-fruit-cups',
    title: 'Fresh Fruit Cups',
    description: 'Seasonal, hand-cut fruit chunks including pineapple, cantaloupe, honeydew, grapes, strawberries & watermelon.',
    image: '/images/Fruit Salad Shot Hi Res.png',
    categories: ['breakfast', 'lunch', 'dessert'],
    pricing: { type: 'per-each', priceEach: 7, minOrder: 10 },
    tags: ['healthy', 'individual', 'vegan', 'gluten-free', 'dairy-free', 'halal'],
  },
  {
    id: 'whole-fruit',
    title: 'Whole Fruit (Apples, Bananas, Oranges)',
    description: 'Fresh, grab-and-go whole fruit — a light and wholesome option for any breakfast spread.',
    image: '/images/Fruit Salad Shot Hi Res.png',
    categories: ['breakfast', 'dessert'],
    pricing: { type: 'per-dozen', pricePerDozen: 24, servesPerDozen: 12 },
    tags: ['healthy', 'vegan', 'grab-and-go', 'gluten-free', 'dairy-free', 'halal'],
  },

  // ==================== BREAKFAST - SOULFUL STARTS ====================
  {
    id: 'scrambled-eggs',
    title: 'Scrambled Eggs',
    description: 'Fluffy scrambled eggs cooked fresh — a timeless breakfast favorite.',
    image: '/images/Breakfast Casserole Bake Hi Res Shot.png',
    categories: ['breakfast'],
    pricing: trayPricing(59, 94, 156),
    tags: ['classic', 'protein', 'vegetarian', 'gluten-free', 'halal'],
  },
  {
    id: 'breakfast-casserole',
    title: 'Breakfast Casserole Bake',
    description: 'A hearty baked dish layered with eggs, cheese, potatoes, and your choice of breakfast protein. Sliced into squares and served warm.',
    image: '/images/Breakfast Casserole Bake Hi Res Shot.png',
    categories: ['breakfast'],
    pricing: trayPricing(88, 140, 234),
    tags: ['hearty', 'protein', 'popular', 'vegetarian', 'halal'],
  },
  {
    id: 'breakfast-potatoes',
    title: 'Home-Style Breakfast Potatoes',
    description: 'Classic seasoned breakfast potatoes with sautéed onions and green peppers.',
    image: '/images/Southern Breakfast Potatoes High Res Shot.png',
    categories: ['breakfast'],
    pricing: trayPricing(59, 94, 156),
    tags: ['classic', 'vegetarian'],
  },
  {
    id: 'cajun-hash',
    title: 'Cajun Hash',
    description: 'Diced potatoes, peppers, and caramelized onions tossed in mild Cajun seasoning, with your choice of breakfast protein.',
    image: '/images/Breakfast Potatoes Shot High Res.png',
    categories: ['breakfast'],
    pricing: trayPricing(59, 94, 156),
    tags: ['cajun', 'spicy'],
  },
  {
    id: 'buttermilk-biscuits',
    title: 'Buttermilk Biscuit Platter',
    description: 'Full-size, freshly baked buttermilk biscuits served warm with butter, jam, and hot sauce packets.',
    image: '/images/Breakfast Biscuits Shot High Res.png',
    categories: ['breakfast'],
    pricing: { type: 'per-dozen', pricePerDozen: 37, servesPerDozen: 12 },
    tags: ['bread', 'southern', 'vegetarian'],
  },
  {
    id: 'biscuits-gravy',
    title: 'Biscuits & Gravy',
    description: 'Buttermilk biscuits served with your choice of turkey or pork sausage gravy.',
    image: '/images/Breakfast Biscuits Shot High Res.png',
    categories: ['breakfast'],
    pricing: trayPricing(59, 94, 156),
    tags: ['southern', 'comfort'],
  },

  // ==================== BREAKFAST - PROTEINS ====================
  {
    id: 'turkey-sausage-links',
    title: 'Turkey Sausage Links',
    description: 'Lean turkey sausage links, perfectly seasoned and cooked.',
    image: '/images/Breakfast Meats II Hi Res Shot.png',
    categories: ['breakfast'],
    pricing: trayPricing(49, 78, 130),
    tags: ['protein', 'turkey', 'gluten-free', 'dairy-free'],
  },
  {
    id: 'chicken-sausage-patties',
    title: 'Chicken Sausage Patties',
    description: 'Savory chicken sausage patties, a lighter protein option.',
    image: '/images/Breakfast Meats II Hi Res Shot.png',
    categories: ['breakfast'],
    pricing: trayPricing(39, 62, 104),
    tags: ['protein', 'chicken', 'gluten-free', 'dairy-free'],
  },
  {
    id: 'turkey-bacon',
    title: 'Turkey Bacon',
    description: 'Crispy turkey bacon strips, a leaner alternative.',
    image: '/images/Breakfast Meats II Hi Res Shot_1.png',
    categories: ['breakfast'],
    pricing: trayPricing(39, 62, 104),
    tags: ['protein', 'turkey', 'gluten-free', 'dairy-free'],
  },
  {
    id: 'pork-sausage',
    title: 'Pork Sausage Patties or Links',
    description: 'Classic pork sausage, available as patties or links.',
    image: '/images/Breakfast Meats II Hi Res Shot.png',
    categories: ['breakfast'],
    pricing: trayPricing(39, 62, 104),
    tags: ['protein', 'pork', 'classic', 'gluten-free', 'dairy-free'],
  },
  {
    id: 'pork-bacon',
    title: 'Pork Bacon',
    description: 'Traditional crispy pork bacon strips.',
    image: '/images/Breakfast Meats II Hi Res Shot_1.png',
    categories: ['breakfast'],
    pricing: trayPricing(39, 62, 104),
    tags: ['protein', 'pork', 'classic', 'gluten-free', 'dairy-free'],
  },

  // ==================== BREAKFAST - SOUTHERN FAVORITES ====================
  {
    id: 'southern-grits',
    title: 'Southern Grits (Plain or Cheese)',
    description: 'Creamy stone-ground grits, available plain or with cheese.',
    image: '/images/Shrimp and Grits Shot High Res.png',
    categories: ['breakfast'],
    pricing: trayPricing(39, 62, 104),
    tags: ['southern', 'comfort', 'vegetarian', 'gluten-free'],
  },
  {
    id: 'shrimp-grits',
    title: 'Shrimp & Grits',
    description: 'Creamy stone-ground grits topped with sautéed Cajun-style shrimp, scallions, and a buttery pan sauce.',
    image: '/images/Shrimp and Grits Shot High Res.png',
    categories: ['breakfast'],
    pricing: trayPricing(68, 109, 182),
    tags: ['southern', 'seafood', 'premium', 'popular', 'gluten-free'],
  },
  {
    id: 'catfish-grits',
    title: 'Fried Catfish Fillets & Grits',
    description: 'Crispy, golden-fried catfish fillets served with creamy or cheesy grits.',
    image: '/images/Shrimp and Grits Shot High Res.png',
    categories: ['breakfast'],
    pricing: trayPricing(88, 140, 234),
    tags: ['southern', 'seafood', 'premium', 'gluten-free'],
  },

  // ==================== BREAKFAST - HANDHELDS ====================
  {
    id: 'biscuit-sandwiches',
    title: 'Buttermilk Biscuit Sandwiches',
    description: 'Flaky, buttery biscuits filled with scrambled eggs, melted cheese, and your choice of protein. Individually wrapped.',
    image: '/images/Breakfast Biscuits Shot High Res.png',
    categories: ['breakfast'],
    pricing: { type: 'per-dozen', pricePerDozen: 62, servesPerDozen: 12 },
    tags: ['handheld', 'grab-and-go', 'popular'],
  },
  {
    id: 'breakfast-wraps',
    title: 'Breakfast Wraps',
    description: 'Warm flour tortilla wraps filled with scrambled eggs, melted cheese, and sautéed veggies, plus your choice of protein. Individually wrapped.',
    image: '/images/Vegan Breakfast Wraps High Res Image.png',
    categories: ['breakfast'],
    pricing: { type: 'per-dozen', pricePerDozen: 62, servesPerDozen: 12 },
    tags: ['handheld', 'grab-and-go'],
  },

  // ==================== BREAKFAST - VEGAN ====================
  {
    id: 'vegan-scramble',
    title: 'Vegan Scramble',
    description: 'Plant-based scramble made from tofu or chickpeas, sautéed with fresh spinach, onions, and bell peppers. Hearty, savory, and protein-packed.',
    image: '/images/Vegan Breakfast Wraps High Res Image.png',
    categories: ['breakfast'],
    pricing: trayPricing(68, 109, 182),
    tags: ['vegan', 'plant-based', 'protein', 'dairy-free'],
  },
  {
    id: 'vegan-sunrise-wrap',
    title: 'Vegan Sunrise Wrap',
    description: 'Spinach tortilla filled with plant-based scramble, sautéed bell peppers, onions, spinach, and vegan cheese. Individually wrapped.',
    image: '/images/Vegan Breakfast Wraps High Res Image.png',
    categories: ['breakfast'],
    pricing: { type: 'per-dozen', pricePerDozen: 62, servesPerDozen: 12 },
    tags: ['vegan', 'plant-based', 'handheld', 'dairy-free'],
  },
  {
    id: 'vegan-fruit-parfaits',
    title: 'Vegan Fruit Parfaits',
    description: 'Coconut milk yogurt layered with seasonal fruit and nut-free granola.',
    image: '/images/Yogurt Parfait Shot High Res.png',
    categories: ['breakfast'],
    pricing: { type: 'per-each', priceEach: 5, minOrder: 10 },
    tags: ['vegan', 'plant-based', 'healthy', 'dairy-free'],
  },

  // ==================== LUNCH - SALADS ====================
  {
    id: 'signature-chopped-salad',
    title: 'Signature Chopped Salad',
    description: 'Romaine, mixed greens, olives, roasted peppers, cucumbers, tomatoes, carrots, red onions, pasta, and bleu cheese. Served with homemade Italian vinaigrette.',
    image: '/images/Southwest Salad Shot Hi Res.png',
    categories: ['lunch'],
    pricing: trayPricing(68, 109, 182),
    tags: ['salad', 'signature', 'popular', 'vegetarian', 'halal'],
  },
  {
    id: 'caesar-salad',
    title: 'Classic Caesar Salad',
    description: 'Romaine hearts, shaved parmesan, and garlic croutons. Served with creamy Caesar dressing.',
    image: '/images/Southwest Salad Shot Hi Res.png',
    categories: ['lunch'],
    pricing: trayPricing(59, 94, 156),
    tags: ['salad', 'classic', 'vegetarian', 'halal'],
  },
  {
    id: 'southwest-salad',
    title: 'Southwest Salad',
    description: 'Romaine with black beans, corn, bell peppers, grape tomatoes, and crispy tortilla strips. Served with chipotle ranch dressing.',
    image: '/images/Southwest Salad Shot Hi Res.png',
    categories: ['lunch'],
    pricing: trayPricing(68, 109, 182),
    tags: ['salad', 'southwest', 'vegetarian', 'halal'],
  },
  {
    id: 'garden-salad',
    title: 'Traditional Garden Salad',
    description: 'Mixed greens, tomatoes, cucumbers, shredded carrots, and red onions. Served with your choice of dressing.',
    image: '/images/Southwest Salad Shot Hi Res.png',
    categories: ['lunch'],
    pricing: trayPricing(59, 94, 156),
    tags: ['salad', 'classic', 'vegetarian', 'halal'],
  },

  // ==================== LUNCH - PROTEIN ADD-ONS ====================
  {
    id: 'diced-grilled-chicken',
    title: 'Diced Grilled Chicken Breast',
    description: 'Lightly seasoned and grilled, diced for easy salad serving.',
    image: '/images/Garlic Butter Chicken Breast Hi Res Image.png',
    categories: ['lunch'],
    pricing: trayPricing(29, 47, 78),
    tags: ['protein', 'chicken', 'add-on', 'gluten-free', 'dairy-free', 'halal'],
  },
  {
    id: 'herb-salmon',
    title: 'Herb-Marinated Salmon',
    description: 'Roasted with lemon, herbs, and olive oil. Served warm or chilled.',
    image: '/images/Herb-Crusted Salmon with Garlic Butter Sauce Shot Hi Res.png',
    categories: ['lunch'],
    pricing: trayPricing(49, 78, 130),
    tags: ['protein', 'seafood', 'premium', 'add-on', 'gluten-free', 'dairy-free', 'halal'],
  },
  {
    id: 'grilled-flank-steak',
    title: 'Grilled Flank Steak',
    description: 'Marinated and grilled, sliced medium for maximum flavor and tenderness.',
    image: '/images/Garlic Butter Chicken Breast Hi Res Image.png',
    categories: ['lunch'],
    pricing: trayPricing(43, 69, 114),
    tags: ['protein', 'beef', 'premium', 'add-on', 'gluten-free', 'dairy-free', 'halal'],
  },

  // ==================== LUNCH - PACKAGES ====================
  {
    id: 'signature-sandwich-package',
    title: 'Signature Sandwich Package',
    description: 'Full-size artisan sandwich on white, wheat, rye, or French bread. Includes kettle-style chips, pasta salad, fresh fruit cup, and a Brown Sugar Bakery chocolate chip cookie.',
    image: '/images/Sandwich and Chips Shot Hi Res.png',
    categories: ['lunch'],
    pricing: { type: 'per-person', pricePerPerson: 20, minOrder: 10 },
    tags: ['package', 'boxed-lunch', 'popular'],
  },
  {
    id: 'plant-based-lunch-package',
    title: 'Plant-Based Lunch Package',
    description: 'A satisfying and entirely vegan meal option. Includes a plant-based main, fresh fruit cup, and a vegan chocolate chip cookie.',
    image: '/images/Stacked Sandwiches Hi Res Shot.png',
    categories: ['lunch'],
    pricing: { type: 'per-person', pricePerPerson: 22, minOrder: 10 },
    tags: ['package', 'vegan', 'boxed-lunch'],
  },

  // ==================== LUNCH - FLAVOR BARS ====================
  {
    id: 'southwest-grain-bowl-bar',
    title: 'Southwest Grain Bowl Bar',
    description: 'A build-your-own rice bowl bar with bold, satisfying toppings. Includes cilantro-lime rice, seasoned black beans, warm tortillas, and all toppings.',
    image: '/images/Red Beans and Rice Hi Res Shot.png',
    categories: ['lunch'],
    pricing: trayPricing(166, 265, 442),
    tags: ['interactive', 'southwest', 'popular'],
  },
  {
    id: 'loaded-mashed-potato-bar',
    title: 'Loaded Mashed Potato Bar',
    description: 'A comfort-forward build-your-own bar anchored by creamy garlic mashed potatoes. Includes diced grilled chicken, bacon crumbles, shredded cheddar, sour cream, chives, and brown gravy.',
    image: '/images/Garlic Mashed Potatoes Shot Hi Res.png',
    categories: ['lunch'],
    pricing: trayPricing(146, 234, 390),
    tags: ['interactive', 'comfort', 'popular'],
  },

  // ==================== LUNCH - ENTREES ====================
  {
    id: 'garlic-herb-chicken',
    title: 'Garlic Herb Chicken Breast (Boneless)',
    description: 'Boneless chicken breasts roasted with garlic, herbs, and olive oil.',
    image: '/images/Garlic Butter Chicken Breast Hi Res Image.png',
    categories: ['lunch'],
    pricing: panPricing(117, 187),
    tags: ['entree', 'chicken', 'healthy', 'gluten-free', 'dairy-free', 'halal'],
  },
  {
    id: 'smothered-chicken',
    title: 'Smothered Chicken',
    description: 'Bone-in chicken baked low and slow in rich onion gravy.',
    image: '/images/Garlic Butter Chicken Breast Hi Res Image.png',
    categories: ['lunch'],
    pricing: panPricing(117, 187),
    tags: ['entree', 'chicken', 'southern', 'comfort', 'gluten-free', 'halal'],
  },
  {
    id: 'jerk-chicken',
    title: 'Jerk Chicken',
    description: 'Grilled chicken marinated in house jerk seasoning.',
    image: '/images/Garlic Butter Chicken Breast Hi Res Image.png',
    categories: ['lunch'],
    pricing: panPricing(137, 187),
    tags: ['entree', 'chicken', 'caribbean', 'spicy', 'gluten-free', 'dairy-free', 'halal'],
  },
  {
    id: 'fried-chicken',
    title: 'Fried Chicken (Winglets or Parts)',
    description: 'Southern-style seasoned fried chicken.',
    image: '/images/Garlic Butter Chicken Breast Hi Res Image.png',
    categories: ['lunch'],
    pricing: panPricing(117, 187),
    tags: ['entree', 'chicken', 'southern', 'popular', 'dairy-free'],
  },
  {
    id: 'fried-catfish',
    title: 'Fried Catfish Fillets',
    description: 'Cornmeal-crusted and fried crisp. Served with hot sauce.',
    image: '/images/Herb-Crusted Salmon with Garlic Butter Sauce Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(137, 187),
    tags: ['entree', 'seafood', 'southern', 'dairy-free', 'halal'],
  },
  {
    id: 'roasted-turkey',
    title: 'Roasted Turkey with Gravy',
    description: 'Oven-roasted, sliced, and served with herb gravy.',
    image: '/images/Garlic Butter Chicken Breast Hi Res Image.png',
    categories: ['lunch'],
    pricing: panPricing(137, 218),
    tags: ['entree', 'turkey', 'classic', 'gluten-free', 'dairy-free'],
  },
  {
    id: 'herb-crusted-salmon',
    title: 'Herb-Crusted Salmon with Garlic Butter Sauce',
    description: 'Roasted salmon fillets with garlic butter and house seasoning.',
    image: '/images/Herb-Crusted Salmon with Garlic Butter Sauce Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(137, 218),
    tags: ['entree', 'seafood', 'premium', 'gluten-free', 'dairy-free', 'halal'],
  },
  {
    id: 'beef-brisket',
    title: 'Slow-Smoked Beef Brisket',
    description: 'Melt-in-your-mouth Texas-style brisket, smoked low and slow over oak for 14 hours with our signature dry rub. Hand-sliced and served with tangy house BBQ sauce.',
    image: '/images/bbq_brisket.jpg',
    categories: ['lunch'],
    pricing: panPricing(175, 300),
    tags: ['entree', 'beef', 'bbq', 'premium', 'southern', 'gluten-free', 'dairy-free'],
    featured: true,
  },

  // ==================== LUNCH - SIDES (POTATOES) ====================
  {
    id: 'garlic-mashed-potatoes',
    title: 'Garlic Mashed Potatoes',
    description: 'Whipped with roasted garlic and butter.',
    image: '/images/Garlic Mashed Potatoes Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(68, 109),
    tags: ['side', 'potato', 'comfort', 'vegetarian', 'gluten-free', 'halal'],
  },
  {
    id: 'roasted-red-potatoes',
    title: 'Roasted Red Potatoes',
    description: 'Oven-roasted with olive oil, garlic, and herbs.',
    image: '/images/Garlic Mashed Potatoes Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(68, 109),
    tags: ['side', 'potato', 'healthy', 'vegetarian', 'gluten-free', 'halal'],
  },
  {
    id: 'potato-wedges',
    title: 'Potato Wedges',
    description: 'Thick-cut, golden brown potato wedges seasoned with herbs and spices.',
    image: '/images/Breakfast Potatoes Shot High Res.png',
    categories: ['lunch'],
    pricing: panPricing(68, 109),
    tags: ['side', 'potato', 'vegetarian', 'halal'],
  },

  // ==================== LUNCH - SIDES (PASTA & GRAINS) ====================
  {
    id: 'mac-and-cheese',
    title: 'Macaroni & Cheese',
    description: 'Creamy, soul-warming three-cheese baked mac with a crispy golden crust your guests won\'t stop talking about.',
    image: '/images/Macaroni and Cheese Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(68, 109),
    tags: ['side', 'pasta', 'comfort', 'popular', 'vegetarian', 'halal'],
    featured: true,
  },
  {
    id: 'spaghetti-meat-sauce',
    title: 'Spaghetti with Meat Sauce',
    description: 'Classic spaghetti with seasoned meat sauce (turkey or beef).',
    image: '/images/Fettucine Alfredo with Grilled Chicken Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(59, 94),
    tags: ['side', 'pasta', 'classic'],
  },
  {
    id: 'fettuccine-alfredo',
    title: 'Fettuccine Alfredo',
    description: 'Creamy Alfredo pasta.',
    image: '/images/Fettucine Alfredo with Grilled Chicken Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(68, 109),
    tags: ['side', 'pasta', 'creamy', 'vegetarian'],
  },
  {
    id: 'rice-pilaf',
    title: 'Rice Pilaf',
    description: 'Lightly seasoned rice with herbs and vegetables.',
    image: '/images/Red Beans and Rice Hi Res Shot.png',
    categories: ['lunch'],
    pricing: panPricing(59, 94),
    tags: ['side', 'grain', 'healthy', 'vegetarian', 'gluten-free', 'dairy-free', 'halal'],
  },
  {
    id: 'red-beans-rice',
    title: 'Red Beans & Rice',
    description: 'Slow-simmered red beans over white rice with Creole-style seasoning.',
    image: '/images/Red Beans and Rice Hi Res Shot.png',
    categories: ['lunch'],
    pricing: panPricing(59, 94),
    tags: ['side', 'grain', 'southern', 'creole', 'gluten-free', 'dairy-free', 'halal'],
  },

  // ==================== LUNCH - SIDES (VEGETABLES) ====================
  {
    id: 'southern-cabbage',
    title: 'Southern-Style Cabbage',
    description: 'Braised cabbage with onions and garlic.',
    image: '/images/Collard Greens with Smoked Turkey High End Shot.png',
    categories: ['lunch'],
    pricing: panPricing(68, 109),
    tags: ['side', 'vegetable', 'southern', 'vegetarian', 'gluten-free', 'dairy-free', 'halal'],
  },
  {
    id: 'collard-greens',
    title: 'Collard Greens',
    description: 'Slow-cooked and seasoned to perfection.',
    image: '/images/Collard Greens with Smoked Turkey High End Shot.png',
    categories: ['lunch'],
    pricing: panPricing(68, 109),
    tags: ['side', 'vegetable', 'southern', 'popular', 'vegetarian', 'gluten-free', 'dairy-free', 'halal'],
  },
  {
    id: 'southern-green-beans',
    title: 'Southern Green Beans',
    description: 'Slow-simmered with onion, garlic, and seasoning.',
    image: '/images/Collard Greens with Smoked Turkey High End Shot.png',
    categories: ['lunch'],
    pricing: panPricing(68, 109),
    tags: ['side', 'vegetable', 'southern', 'vegetarian', 'gluten-free', 'dairy-free', 'halal'],
  },
  {
    id: 'vegetable-medley',
    title: 'Vegetable Medley',
    description: 'Broccoli, cauliflower, and carrots.',
    image: '/images/Collard Greens with Smoked Turkey High End Shot.png',
    categories: ['lunch'],
    pricing: panPricing(49, 78),
    tags: ['side', 'vegetable', 'healthy', 'vegetarian', 'gluten-free', 'dairy-free', 'halal'],
  },
  {
    id: 'roasted-asparagus',
    title: 'Roasted Asparagus',
    description: 'Oven-roasted with olive oil and sea salt.',
    image: '/images/Collard Greens with Smoked Turkey High End Shot.png',
    categories: ['lunch'],
    pricing: panPricing(68, 109),
    tags: ['side', 'vegetable', 'premium', 'vegetarian', 'gluten-free', 'dairy-free', 'halal'],
  },
  {
    id: 'sweet-potatoes',
    title: 'Sweet Potatoes',
    description: 'Baked with brown sugar, cinnamon, nutmeg, and butter.',
    image: '/images/Southern Breakfast Potatoes High Res Shot.png',
    categories: ['lunch'],
    pricing: panPricing(68, 109),
    tags: ['side', 'vegetable', 'southern', 'sweet', 'vegetarian', 'gluten-free', 'halal'],
  },
  {
    id: 'creamed-corn',
    title: 'Creamed Corn',
    description: 'Sweet corn in a creamy butter sauce.',
    image: '/images/Collard Greens with Smoked Turkey High End Shot.png',
    categories: ['lunch'],
    pricing: panPricing(59, 94),
    tags: ['side', 'vegetable', 'comfort', 'vegetarian', 'gluten-free', 'halal'],
  },

  // ==================== LUNCH - SIDES (BREADS) ====================
  {
    id: 'garlic-bread',
    title: 'Garlic Bread',
    description: 'Toasted and brushed with garlic butter and herbs.',
    image: '/images/Breakfast Biscuits Shot High Res.png',
    categories: ['lunch'],
    pricing: { type: 'per-dozen', pricePerDozen: 31, servesPerDozen: 12 },
    tags: ['side', 'bread', 'vegetarian'],
  },
  {
    id: 'cornbread',
    title: 'Cornbread',
    description: 'Golden, buttery Southern-style cornbread baked fresh — the perfect companion to any BBQ spread.',
    image: '/images/cornbread.jpg',
    categories: ['lunch'],
    pricing: { type: 'per-dozen', pricePerDozen: 38, servesPerDozen: 12 },
    tags: ['side', 'bread', 'southern', 'vegetarian'],
    featured: true,
  },
  {
    id: 'garlic-knots',
    title: 'Garlic Knots',
    description: 'Toasted and brushed with garlic butter and herbs.',
    image: '/images/Breakfast Biscuits Shot High Res.png',
    categories: ['lunch'],
    pricing: { type: 'per-dozen', pricePerDozen: 38, servesPerDozen: 12 },
    tags: ['side', 'bread', 'vegetarian'],
  },

  // ==================== LUNCH - SIDES (COLD) ====================
  {
    id: 'coleslaw',
    title: 'Coleslaw',
    description: 'Creamy cabbage slaw with shredded carrots and vinegar.',
    image: '/images/Southwest Salad Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(68, 109),
    tags: ['side', 'cold', 'classic', 'vegetarian', 'gluten-free'],
  },
  {
    id: 'potato-salad',
    title: 'Potato Salad',
    description: 'Southern-style with mayo, mustard, relish, and optional egg.',
    image: '/images/Garlic Mashed Potatoes Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(68, 109),
    tags: ['side', 'cold', 'southern', 'vegetarian', 'gluten-free'],
  },
  {
    id: 'cold-pasta-salad',
    title: 'Cold Pasta Salad',
    description: 'Tri-color rotini with crisp vegetables in Italian dressing.',
    image: '/images/Fettucine Alfredo with Grilled Chicken Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(68, 109),
    tags: ['side', 'cold', 'pasta', 'vegetarian'],
  },
  {
    id: 'pesto-pasta-salad',
    title: 'Cold Pesto Pasta Salad',
    description: 'Tri-color rotini with crisp vegetables in Pesto dressing.',
    image: '/images/Fettucine Alfredo with Grilled Chicken Shot Hi Res.png',
    categories: ['lunch'],
    pricing: panPricing(88, 140),
    tags: ['side', 'cold', 'pasta', 'premium', 'vegetarian'],
  },

  // ==================== DESSERTS ====================
  {
    id: 'cake-slices',
    title: 'Cake Slices',
    description: 'From Brown Sugar Bakery. Available in Caramel, Red Velvet, Lemon, Chocolate, and Pound Cake.',
    image: '/images/BSB Caramel Cake Slices Hi Res Shot.png',
    categories: ['breakfast', 'lunch', 'dessert'],
    pricing: { type: 'per-each', priceEach: 9, minOrder: 10 },
    tags: ['dessert', 'bakery', 'popular', 'vegetarian'],
  },
  {
    id: 'red-velvet-cake',
    title: 'Red Velvet Cake Slices',
    description: 'From Brown Sugar Bakery. Rich red velvet with cream cheese frosting.',
    image: '/images/BSB Red Velvet Cake.png',
    categories: ['breakfast', 'lunch', 'dessert'],
    pricing: { type: 'per-each', priceEach: 9, minOrder: 10 },
    tags: ['dessert', 'bakery', 'popular', 'vegetarian'],
  },
  {
    id: 'cheesecake-slices',
    title: 'Cheesecake Slices',
    description: 'From Brown Sugar Bakery. Available in Classic, Strawberry, Carrot Cake, and Turtle.',
    image: '/images/BSB Strawberry Cheesecake Slice Hi Res Shot.png',
    categories: ['breakfast', 'lunch', 'dessert'],
    pricing: { type: 'per-each', priceEach: 12, minOrder: 10 },
    tags: ['dessert', 'bakery', 'premium', 'vegetarian'],
  },
  {
    id: 'strawberry-cheesecake',
    title: 'Strawberry Cheesecake Slices',
    description: 'From Brown Sugar Bakery. Creamy cheesecake topped with fresh strawberries.',
    image: '/images/BSB Strawberry Cheesecake.png',
    categories: ['breakfast', 'lunch', 'dessert'],
    pricing: { type: 'per-each', priceEach: 12, minOrder: 10 },
    tags: ['dessert', 'bakery', 'premium', 'vegetarian'],
  },
  {
    id: 'cookies',
    title: 'Chocolate Chip Cookies',
    description: 'Brown Sugar Bakery Chocolate Chip cookies. Packaged in sets of 12.',
    image: '/images/BSB Chocolate Chip Cookies Hi Res Shot.png',
    categories: ['breakfast', 'lunch', 'dessert'],
    pricing: { type: 'per-dozen', pricePerDozen: 30, servesPerDozen: 12 },
    tags: ['dessert', 'bakery', 'popular', 'vegetarian'],
  },

  // ==================== SNACKS ====================
  {
    id: 'snack-pack-standard',
    title: 'Snack Pack (Standard)',
    description: 'Includes a mix of classic and premium snacks: Garrett\'s Popcorn, Skinny Pop, Pringles, chips, veggie straws, trail mix, fruit snacks, and assorted truffles. 2-3 items per person.',
    image: '/images/Kind Bars and Granola Snacks Hi Res Shot.png',
    categories: ['dessert'],
    pricing: { type: 'per-person', pricePerPerson: 8, minOrder: 10 },
    tags: ['dessert', 'package', 'popular'],
  },
  {
    id: 'snack-pack-vegan',
    title: 'Snack Pack (Vegan)',
    description: 'Includes a curated mix of plant-based snacks: veggie straws, fruit bar, vegan chocolate, assorted nuts, granola or popcorn. 2-3 items per person.',
    image: '/images/Kind Bars and Granola Snacks Hi Res Shot.png',
    categories: ['dessert'],
    pricing: { type: 'per-person', pricePerPerson: 10, minOrder: 10 },
    tags: ['dessert', 'package', 'vegan'],
  },
  {
    id: 'assorted-chips',
    title: 'Assorted Chips',
    description: 'Miss Vickie\'s, Sun Chips, Pringles, and other premium chip varieties.',
    image: '/images/Assorted Chips Hi Res Shot.png',
    categories: ['dessert', 'lunch'],
    pricing: { type: 'per-each', priceEach: 2, minOrder: 10 },
    tags: ['dessert', 'chips'],
  },
  {
    id: 'miss-vickies-chips',
    title: 'Miss Vickie\'s Chips',
    description: 'Premium kettle-cooked chips in assorted flavors.',
    image: '/images/Miss Vickies Chips Hi Res Shot.png',
    categories: ['dessert', 'lunch'],
    pricing: { type: 'per-each', priceEach: 2, minOrder: 10 },
    tags: ['dessert', 'chips', 'premium'],
  },

  // ==================== BEVERAGES - BREAKFAST ====================
  {
    id: 'fresh-brewed-coffee',
    title: 'Fresh Brewed Coffee',
    description: 'Includes cups, stirrers, sweeteners, and creamers.',
    image: '/images/Cold Brew Hi Res Shot.png',
    categories: ['breakfast', 'lunch'],
    pricing: { type: 'per-container', pricePerContainer: 25, servesPerContainer: 10 },
    tags: ['beverage', 'hot', 'coffee'],
  },
  {
    id: 'hot-tea',
    title: 'Hot Tea',
    description: 'Assorted herbal, green, and black teas with lemon and honey.',
    image: '/images/Cold Brew Hi Res Shot.png',
    categories: ['breakfast', 'lunch'],
    pricing: { type: 'per-container', pricePerContainer: 22, servesPerContainer: 10 },
    tags: ['beverage', 'hot', 'tea'],
  },
  {
    id: 'hot-chocolate',
    title: 'Hot Chocolate',
    description: 'Rich cocoa served with optional marshmallows.',
    image: '/images/Cold Brew Hi Res Shot.png',
    categories: ['breakfast'],
    pricing: { type: 'per-container', pricePerContainer: 24, servesPerContainer: 10 },
    tags: ['beverage', 'hot', 'chocolate'],
  },
  {
    id: 'cold-brew-coffee',
    title: 'Cold Brew Coffee (Bottled)',
    description: 'Chilled and unsweetened. Individually bottled.',
    image: '/images/Cold Brew Hi Res Shot.png',
    categories: ['breakfast', 'lunch'],
    pricing: { type: 'per-each', priceEach: 3, minOrder: 10 },
    tags: ['beverage', 'cold', 'coffee', 'dairy-free'],
  },
  {
    id: 'bottled-juices',
    title: 'Bottled Juices',
    description: 'Orange, Apple, or Cranberry.',
    image: '/images/San Pellegrino Drinks Hi Res Shot.png',
    categories: ['breakfast', 'lunch'],
    pricing: { type: 'per-each', priceEach: 3, minOrder: 10 },
    tags: ['beverage', 'cold', 'juice', 'dairy-free'],
  },
  {
    id: 'coconut-water',
    title: 'Coconut Water',
    description: 'Plant-based hydration — plain or fruit-infused.',
    image: '/images/San Pellegrino Drinks Hi Res Shot.png',
    categories: ['breakfast'],
    pricing: { type: 'per-each', priceEach: 3, minOrder: 10 },
    tags: ['beverage', 'cold', 'healthy', 'vegan', 'dairy-free'],
  },
  {
    id: 'bottled-water',
    title: 'Bottled Water',
    description: 'Still spring water.',
    image: '/images/San Pellegrino Drinks Hi Res Shot.png',
    categories: ['breakfast', 'lunch'],
    pricing: { type: 'per-each', priceEach: 2, minOrder: 10 },
    tags: ['beverage', 'cold', 'water', 'dairy-free'],
  },

  // ==================== BEVERAGES - LUNCH ====================
  {
    id: 'assorted-sodas',
    title: 'Assorted Sodas',
    description: 'Coca-Cola, Pepsi, Sprite, Ginger Ale, and Diet options.',
    image: '/images/Soda Hi Res Image Shot.png',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 2, minOrder: 10 },
    tags: ['beverage', 'cold', 'soda', 'dairy-free'],
  },
  {
    id: 'sparkling-water',
    title: 'San Pellegrino Sparkling Water',
    description: 'Classic and fruit-infused flavors.',
    image: '/images/San Pellegrino Drinks Hi Res Shot.png',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 2, minOrder: 10 },
    tags: ['beverage', 'cold', 'sparkling', 'dairy-free'],
  },
  {
    id: 'iced-tea',
    title: 'Arizona Iced Teas',
    description: 'Green Tea, Lemon, and Watermelon.',
    image: '/images/San Pellegrino Drinks Hi Res Shot.png',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 2, minOrder: 10 },
    tags: ['beverage', 'cold', 'tea', 'dairy-free'],
  },
  {
    id: 'celsius-energy',
    title: 'Celsius Energy Drink',
    description: 'Available in assorted performance flavors. Vegan-friendly.',
    image: '/images/San Pellegrino Drinks Hi Res Shot.png',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 3, minOrder: 10 },
    tags: ['beverage', 'cold', 'energy', 'dairy-free'],
  },
  {
    id: 'red-bull',
    title: 'Red Bull or Red Bull Sugar-Free',
    description: 'Classic energy drink or same boost, zero sugar.',
    image: '/images/San Pellegrino Drinks Hi Res Shot.png',
    categories: ['lunch'],
    pricing: { type: 'per-each', priceEach: 3, minOrder: 10 },
    tags: ['beverage', 'cold', 'energy', 'dairy-free'],
  },
];

// Get products by event type
export function getProductsByEventType(eventType: string | null): CateringProduct[] {
  if (!eventType) return CATERING_PRODUCTS;
  return CATERING_PRODUCTS.filter(product => product.categories.includes(eventType as any));
}

// Get product by ID
export function getProductById(id: string): CateringProduct | undefined {
  return CATERING_PRODUCTS.find(product => product.id === id);
}

// Get recommended products based on event type, budget, and what's already in the cart
export function getRecommendedProducts(
  eventType: string | null,
  cartItemIds: string[],
  budgetRange?: { min: number; max: number } | null,
  limit: number = 6,
): CateringProduct[] {
  let candidates = CATERING_PRODUCTS.filter(p => !cartItemIds.includes(p.id));

  // Filter by event type if set
  if (eventType) {
    candidates = candidates.filter(p => p.categories.includes(eventType as any));
  }

  // Exclude packages, interactive bars, and beverages for recommendations
  candidates = candidates.filter(p =>
    !p.tags?.includes('package') &&
    !p.tags?.includes('interactive') &&
    !p.tags?.includes('beverage')
  );

  // Prioritize popular items
  candidates.sort((a, b) => {
    const aPopular = a.tags?.includes('popular') ? 1 : 0;
    const bPopular = b.tags?.includes('popular') ? 1 : 0;
    return bPopular - aPopular;
  });

  return candidates.slice(0, limit);
}

// Build a suggested menu for a given event type and headcount
export function getSuggestedMenu(
  eventType: string | null,
  headcount: number,
  budgetRange?: { min: number; max: number } | null,
): CateringProduct[] {
  const category = eventType || 'lunch';
  const available = CATERING_PRODUCTS.filter(p =>
    p.categories.includes(category as any) &&
    !p.tags?.includes('package') &&
    !p.tags?.includes('interactive')
  );

  const pick = (tags: string[], count: number): CateringProduct[] => {
    const matches = available.filter(p => tags.some(t => p.tags?.includes(t)));
    return matches.slice(0, count);
  };

  const menu: CateringProduct[] = [];

  if (category === 'breakfast') {
    menu.push(...pick(['entree', 'classic'], 1));
    menu.push(...pick(['protein'], 1));
    menu.push(...pick(['side'], 1));
    menu.push(...pick(['beverage'], 1));
  } else if (category === 'lunch') {
    menu.push(...pick(['entree'], 1));
    menu.push(...pick(['side'], 2));
    menu.push(...pick(['beverage'], 1));
  } else {
    menu.push(...pick(['dessert', 'bakery'], 2));
    menu.push(...pick(['beverage'], 1));
  }

  // Deduplicate
  const seen = new Set<string>();
  return menu.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}
