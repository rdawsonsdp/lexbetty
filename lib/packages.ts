import { CateringPackage, EventType } from './types';

export const CATERING_PACKAGES: CateringPackage[] = [
  // ==================== BETTY PARTY DEALS ====================
  {
    id: 'betty-party-deal-3',
    title: 'Betty Party Deal — 3 Meats / 3 Sides',
    description: 'Our classic party spread with 3 smoked meats and 3 soulful sides. Only available for lunch caterings, 10 people and more.',
    pricePerPerson: 22,
    image: '/images/chef-dominique-ribs.jpg',
    items: [
      'Choice of 3 Betty Meats (Smoked Chicken, Pulled Pork, Rib Tips)',
      'Choice of 3 Betty Soulful Sides (Gouda Mac n Cheese, Baked Beans, Greens, Coleslaw)',
    ],
    categories: ['lunch'],
    minHeadcount: 10,
  },
  {
    id: 'betty-party-deal-4',
    title: 'Betty Party Deal — 4 Meats / 4 Sides',
    description: 'The ultimate party spread with 4 smoked meats and 4 soulful sides. Only available for lunch caterings, 10 people and more.',
    pricePerPerson: 35,
    image: '/images/brisket-sauce-pour.jpg',
    items: [
      'Choice of 4 Betty Meats (Smoked Chicken, Pulled Pork, Rib Tips)',
      'Choice of 4 Betty Soulful Sides (Gouda Mac n Cheese, Baked Beans, Greens, Coleslaw)',
    ],
    categories: ['lunch'],
    minHeadcount: 10,
  },

  // ==================== BETTY BOXES ====================
  {
    id: 'betty-box-executive',
    title: 'Betty Box — Executive',
    description: 'Great for corporate events. 1 meat, 1 side, 1 dessert per person.',
    pricePerPerson: 16,
    image: '/images/Sandwich and Chips Shot Hi Res.png',
    items: [
      'Choice of: Smoked chicken + gouda mac & cheese + chocolate chip cookie',
      'Or: Pulled pork sandwich + baked beans + chocolate chip cookie',
      'Or: Smoked portabella & pepper sandwich + slaw + chocolate chip cookie',
    ],
    categories: ['lunch'],
    minHeadcount: 10,
  },
  {
    id: 'betty-box-corporate',
    title: 'Betty Box — Corporate',
    description: 'Great for corporate events. 1 meat, 2 sides, 1 corn muffin & 1 dessert per person.',
    pricePerPerson: 25,
    image: '/images/bbq_brisket.jpg',
    items: [
      'Choice of: Rib tips + gouda mac & cheese + slaw + chocolate chip cookie',
      'Or: Smoked chicken + gouda mac & cheese + slaw + chocolate chip cookie',
      'Or: Smoked portabella & pepper sandwich + slaw + corn bread + chocolate chip cookies',
      'Or: Beef brisket sandwich + gouda mac & cheese + slaw + chocolate chip cookies (+$3)',
    ],
    categories: ['lunch'],
    minHeadcount: 10,
  },

  // ==================== BETTY FOOD TRUCK ====================
  {
    id: 'betty-food-truck',
    title: 'Betty Food Truck',
    description: 'LBSH pulls up to your event to vend a selected menu. Great for outdoor events. Minimum 40 guests. $250 reservation fee. Reservation must be prepaid in advance.',
    pricePerPerson: 20,
    image: '/images/chef-dominique-ribs.jpg',
    items: [
      'Pick 2 Betty Meats: Pulled Chicken Sandwiches, Smoked Chicken, Pulled Pork Sandwiches, Rib Tips, Brisket Sandwiches (+$2), Portabella Mushroom Sandwich',
      'Pick 2 Betty Soulful Sides: Gouda Mac n Cheese, Collard Greens, Baked Beans, Slaw',
      'Pick 1 Dessert: Cookies or Banana Pudding',
      'Pick 2 Beverages: Tobi\'s Lemonade, Cake Products, Water',
    ],
    categories: ['lunch'],
    minHeadcount: 40,
  },
];

export function getPackagesByEventType(eventType: EventType): CateringPackage[] {
  return CATERING_PACKAGES.filter((pkg) => pkg.categories.includes(eventType));
}

export function getPackagesByBudget(
  packages: CateringPackage[],
  minBudget: number,
  maxBudget: number
): CateringPackage[] {
  return packages.filter(
    (pkg) => pkg.pricePerPerson >= minBudget && pkg.pricePerPerson <= maxBudget
  );
}
