'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CATERING_PRODUCTS } from '@/lib/products';
import { CateringProduct } from '@/lib/types';
import { getDisplayPrice, getPricingTypeLabel } from '@/lib/pricing';
import { classifyProducts, type Quadrant } from '@/lib/menu-engineering';
import { loadMenuConfig, type MenuConfig } from '@/lib/menu-config';
import DietaryFilterBar from '@/components/catering/DietaryFilterBar';
import { useDisabledCategories } from '@/lib/hooks/useEnabledEventTypes';

// --- Menu Engineering Defaults (used when no config is applied) ---

const DEFAULT_REMOVED_IDS = ['celsius-energy', 'red-bull'];

const DEFAULT_CHEFS_PICK_IDS = [
  'herb-crusted-salmon',
  'roasted-asparagus',
  'pesto-pasta-salad',
  'grilled-flank-steak',
  'herb-salmon',
];

const DEFAULT_BBQ_BUNDLE_IDS = ['beef-brisket', 'mac-and-cheese', 'cornbread'];

const DEFAULT_CUSTOMER_FAVORITE_IDS = [
  'fried-chicken',
  'breakfast-casserole',
  'shrimp-grits',
  'mac-and-cheese',
  'signature-sandwich-package',
  'collard-greens',
];

const QUADRANT_ORDER: Record<string, number> = {
  star: 0,
  plowhorse: 1,
  puzzle: 2,
  dog: 3,
};

// --- Menu Sections ---

const MENU_SECTIONS = [
  {
    id: 'featured',
    title: 'FEATURED',
    subtitle: 'Curated Spreads & Best Sellers',
    image: '/images/bbq_brisket.jpg',
    subsections: [],
  },
  {
    id: 'chefs-picks',
    title: "CHEF'S PICKS",
    subtitle: 'Hidden Gems Hand-Selected by Our Kitchen',
    image: '/images/Herb-Crusted Salmon with Garlic Butter Sauce Shot Hi Res.png',
    subsections: [],
  },
  {
    id: 'breakfast',
    title: 'BREAKFAST',
    subtitle: 'Start Your Day Right',
    image: '/images/Shrimp and Grits Shot High Res.png',
    subsections: [
      { id: 'sunrise-staples', title: 'Sunrise Staples', description: 'Light bites to start your morning' },
      { id: 'soulful-starts', title: 'Soulful Starts', description: 'Hearty breakfast favorites' },
      { id: 'breakfast-proteins', title: 'Proteins', description: 'Savory breakfast meats' },
      { id: 'southern-favorites', title: 'Southern Favorites', description: 'Classic southern breakfast dishes' },
      { id: 'breakfast-handhelds', title: 'Handhelds', description: 'Grab-and-go options' },
      { id: 'breakfast-vegan', title: 'Vegan Options', description: 'Plant-based breakfast items' },
    ],
  },
  {
    id: 'lunch',
    title: 'LUNCH & DINNER',
    subtitle: 'Satisfying Meals for Any Occasion',
    image: '/images/Stacked Sandwiches Hi Res Shot.png',
    subsections: [
      { id: 'salads', title: 'Fresh Salads', description: 'Crisp and flavorful' },
      { id: 'protein-addons', title: 'Protein Add-Ons', description: 'Top your salad with protein' },
      { id: 'lunch-packages', title: 'Lunch Packages', description: 'Complete boxed meals' },
      { id: 'flavor-bars', title: 'Flavor Bars', description: 'Interactive build-your-own stations' },
      { id: 'entrees', title: 'Entrées', description: 'Main course selections' },
      { id: 'sides-potatoes', title: 'Sides - Potatoes', description: 'Hearty potato dishes' },
      { id: 'sides-pasta', title: 'Sides - Pasta & Grains', description: 'Comfort classics' },
      { id: 'sides-vegetables', title: 'Sides - Vegetables', description: 'Fresh and flavorful veggies' },
      { id: 'sides-breads', title: 'Sides - Breads', description: 'Fresh-baked accompaniments' },
      { id: 'sides-cold', title: 'Sides - Cold', description: 'Refreshing cold sides' },
    ],
  },
  {
    id: 'desserts',
    title: 'DESSERTS',
    subtitle: 'Sweet Endings from Brown Sugar Bakery',
    image: '/images/BSB Caramel Cake Slices Hi Res Shot.png',
    subsections: [],
  },
  {
    id: 'beverages',
    title: 'BEVERAGES',
    subtitle: 'Drinks for Every Occasion',
    image: '/images/Cold Brew Hi Res Shot.png',
    subsections: [
      { id: 'hot-beverages', title: 'Hot Beverages', description: 'Coffee, tea, and more' },
      { id: 'cold-beverages', title: 'Cold Beverages', description: 'Refreshing cold drinks' },
    ],
  },
];

// --- Product Mapping ---

function getProductsForSubsection(subsectionId: string): CateringProduct[] {
  const mappings: Record<string, (p: CateringProduct) => boolean> = {
    'sunrise-staples': (p) =>
      p.categories.includes('breakfast') &&
      ['morning-mingle-tray', 'parfait-bar', 'fresh-fruit-tray', 'fresh-fruit-cups', 'whole-fruit'].includes(p.id),
    'soulful-starts': (p) =>
      p.categories.includes('breakfast') &&
      ['scrambled-eggs', 'breakfast-casserole', 'breakfast-potatoes', 'cajun-hash', 'buttermilk-biscuits', 'biscuits-gravy'].includes(p.id),
    'breakfast-proteins': (p) =>
      p.categories.includes('breakfast') &&
      ['turkey-sausage-links', 'chicken-sausage-patties', 'turkey-bacon', 'pork-sausage', 'pork-bacon'].includes(p.id),
    'southern-favorites': (p) =>
      p.categories.includes('breakfast') &&
      ['southern-grits', 'shrimp-grits', 'catfish-grits'].includes(p.id),
    'breakfast-handhelds': (p) =>
      p.categories.includes('breakfast') &&
      ['biscuit-sandwiches', 'breakfast-wraps'].includes(p.id),
    'breakfast-vegan': (p) =>
      p.categories.includes('breakfast') &&
      ['vegan-scramble', 'vegan-sunrise-wrap', 'vegan-fruit-parfaits'].includes(p.id),
    'salads': (p) =>
      p.categories.includes('lunch') &&
      ['signature-chopped-salad', 'caesar-salad', 'southwest-salad', 'garden-salad'].includes(p.id),
    'protein-addons': (p) =>
      p.categories.includes('lunch') &&
      ['diced-grilled-chicken', 'herb-salmon', 'grilled-flank-steak'].includes(p.id),
    'lunch-packages': (p) =>
      p.categories.includes('lunch') &&
      ['signature-sandwich-package', 'plant-based-lunch-package'].includes(p.id),
    'flavor-bars': (p) =>
      p.categories.includes('lunch') &&
      ['southwest-grain-bowl-bar', 'loaded-mashed-potato-bar'].includes(p.id),
    'entrees': (p) =>
      p.categories.includes('lunch') &&
      ['beef-brisket', 'garlic-herb-chicken', 'smothered-chicken', 'jerk-chicken', 'fried-chicken', 'fried-catfish', 'roasted-turkey', 'herb-crusted-salmon'].includes(p.id),
    'sides-potatoes': (p) =>
      p.categories.includes('lunch') &&
      ['garlic-mashed-potatoes', 'roasted-red-potatoes', 'potato-wedges'].includes(p.id),
    'sides-pasta': (p) =>
      p.categories.includes('lunch') &&
      ['mac-and-cheese', 'spaghetti-meat-sauce', 'fettuccine-alfredo', 'rice-pilaf', 'red-beans-rice'].includes(p.id),
    'sides-vegetables': (p) =>
      p.categories.includes('lunch') &&
      ['southern-cabbage', 'collard-greens', 'southern-green-beans', 'vegetable-medley', 'roasted-asparagus', 'sweet-potatoes', 'creamed-corn'].includes(p.id),
    'sides-breads': (p) =>
      p.categories.includes('lunch') &&
      ['garlic-bread', 'cornbread', 'garlic-knots'].includes(p.id),
    'sides-cold': (p) =>
      p.categories.includes('lunch') &&
      ['coleslaw', 'potato-salad', 'cold-pasta-salad', 'pesto-pasta-salad'].includes(p.id),
    'hot-beverages': (p) =>
      (p.tags?.includes('beverage') ?? false) &&
      ['fresh-brewed-coffee', 'hot-tea', 'hot-chocolate'].includes(p.id),
    'cold-beverages': (p) =>
      (p.tags?.includes('beverage') ?? false) &&
      ['cold-brew-coffee', 'bottled-juices', 'coconut-water', 'bottled-water', 'assorted-sodas', 'sparkling-water', 'iced-tea'].includes(p.id),
  };

  const filter = mappings[subsectionId];
  if (!filter) return [];
  return CATERING_PRODUCTS.filter(filter);
}

function filterByDietary(products: CateringProduct[], filters: string[]): CateringProduct[] {
  if (filters.length === 0) return products;
  return products.filter(p => filters.every(f => p.tags?.includes(f)));
}

function getProductsForSection(sectionId: string): CateringProduct[] {
  if (sectionId === 'desserts') {
    return CATERING_PRODUCTS.filter(p => p.tags?.includes('dessert'));
  }
  return [];
}

// --- Badge Logic ---

type MenuBadge = 'popular' | 'chefs-pick' | 'new' | null;

function getBadgeForProduct(productId: string): MenuBadge {
  if (productId === 'beef-brisket') return 'new';
  const product = CATERING_PRODUCTS.find(p => p.id === productId);
  if (product?.tags?.includes('popular')) return 'popular';
  return null;
}

const BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  popular: { bg: 'bg-[#dabb64]', text: 'text-[#363333]', label: 'POPULAR' },
  'chefs-pick': { bg: 'bg-[#4a90d9]', text: 'text-white', label: "CHEF'S PICK" },
  new: { bg: 'bg-emerald-500', text: 'text-white', label: 'NEW' },
};

// --- Components ---

function MenuItemCard({ product, badge }: { product: CateringProduct; badge?: MenuBadge }) {
  const badgeStyle = badge ? BADGE_STYLES[badge] : null;

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-32 sm:h-40">
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover"
        />
        {badgeStyle && (
          <div className={`absolute top-2 left-2 ${badgeStyle.bg} ${badgeStyle.text} px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide`}>
            {badgeStyle.label}
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-oswald font-bold text-[#363333] text-sm sm:text-base mb-1 line-clamp-1">
          {product.title}
        </h4>
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-oswald font-bold text-[#dabb64]">
            {getDisplayPrice(product)}
          </span>
          <span className="text-[10px] text-gray-400 uppercase">
            {getPricingTypeLabel(product)}
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Page ---

export default function MenusPage() {
  const [activeSection, setActiveSection] = useState<string | null>('featured');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [menuConfig, setMenuConfig] = useState<MenuConfig | null>(null);
  const { disabledCategories } = useDisabledCategories();

  // Load menu engineering config from localStorage on mount
  useEffect(() => {
    setMenuConfig(loadMenuConfig());
  }, []);

  // Derive active IDs — config overrides defaults
  const REMOVED_ITEM_IDS = useMemo(
    () => new Set(menuConfig ? menuConfig.removedItemIds : DEFAULT_REMOVED_IDS),
    [menuConfig],
  );
  const CHEFS_PICK_IDS = useMemo(
    () => (menuConfig && menuConfig.chefsPickIds.length > 0 ? menuConfig.chefsPickIds : DEFAULT_CHEFS_PICK_IDS),
    [menuConfig],
  );
  const CUSTOMER_FAVORITE_IDS = useMemo(
    () => (menuConfig && menuConfig.featuredProductIds.length > 0 ? menuConfig.featuredProductIds : DEFAULT_CUSTOMER_FAVORITE_IDS),
    [menuConfig],
  );
  const BBQ_BUNDLE_IDS = useMemo(
    () => (menuConfig && menuConfig.bundles.length > 0 ? menuConfig.bundles[0].productIds : DEFAULT_BBQ_BUNDLE_IDS),
    [menuConfig],
  );

  // Compute menu engineering classifications for quadrant-based ordering
  const quadrantMap = useMemo(() => {
    const classified = classifyProducts();
    const map = new Map<string, Quadrant>();
    for (const item of classified) {
      map.set(item.productId, item.quadrant);
    }
    return map;
  }, []);

  // Sort products by quadrant: stars first, then plowhorses, puzzles, dogs
  const sortByQuadrant = (products: CateringProduct[]): CateringProduct[] => {
    return [...products].sort((a, b) => {
      const aOrder = QUADRANT_ORDER[quadrantMap.get(a.id) || 'dog'] ?? 3;
      const bOrder = QUADRANT_ORDER[quadrantMap.get(b.id) || 'dog'] ?? 3;
      return aOrder - bOrder;
    });
  };

  // Featured section data
  const bbqBundleProducts = BBQ_BUNDLE_IDS
    .map(id => CATERING_PRODUCTS.find(p => p.id === id))
    .filter(Boolean) as CateringProduct[];

  const customerFavorites = filterByDietary(
    CUSTOMER_FAVORITE_IDS
      .map(id => CATERING_PRODUCTS.find(p => p.id === id))
      .filter(Boolean) as CateringProduct[],
    activeFilters,
  );

  // Chef's Picks data
  const chefsPickProducts = filterByDietary(
    CHEFS_PICK_IDS
      .map(id => CATERING_PRODUCTS.find(p => p.id === id))
      .filter(Boolean) as CateringProduct[],
    activeFilters,
  );

  const handleToggleFilter = (tag: string) => {
    setActiveFilters(prev =>
      prev.includes(tag)
        ? prev.filter(f => f !== tag)
        : [...prev, tag]
    );
  };

  // Map menu section IDs to category IDs for filtering
  const sectionCategoryMap: Record<string, string> = {
    breakfast: 'breakfast',
    lunch: 'lunch',
    desserts: 'dessert',
  };

  const visibleSections = useMemo(
    () =>
      MENU_SECTIONS.filter((s) => {
        const cat = sectionCategoryMap[s.id];
        return !cat || !disabledCategories.includes(cat);
      }),
    [disabledCategories],
  );

  // Track scroll position to update active nav tab
  useEffect(() => {
    const handleScroll = () => {
      const sections = visibleSections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id),
      }));

      for (const section of sections) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
      setActiveSection(sectionId);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7efd7]">
      {/* Hero Header */}
      <div className="bg-[#363333] py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-[#dabb64] to-transparent" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h1 className="font-oswald text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#f7efd7] tracking-wider mb-4">
              OUR MENUS
            </h1>
            <p className="text-[#dabb64] text-lg sm:text-xl max-w-2xl mx-auto">
              Exceptional food crafted with care. Browse our complete catering menu featuring over 90 delicious items.
            </p>
          </div>
        </div>
      </div>

      {/* Menu Engineering Active Indicator */}
      {menuConfig && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm text-green-800">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Optimized by Menu Engineering &mdash; applied{' '}
              {new Date(menuConfig.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <Link
              href="/menu-engineering"
              className="ml-2 text-green-700 underline hover:text-green-900 font-semibold"
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Quick Navigation */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-2 py-4 scrollbar-hide">
            {visibleSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`px-4 py-2 rounded-full font-oswald font-semibold text-sm whitespace-nowrap transition-all ${
                  activeSection === section.id
                    ? 'bg-[#363333] text-white'
                    : 'bg-[#f7efd7] text-[#363333] hover:bg-[#dabb64]/30'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
          {/* Dietary Filters */}
          <div className="pb-3">
            <DietaryFilterBar activeTags={activeFilters} onToggleTag={handleToggleFilter} />
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {visibleSections.map((section, sectionIndex) => (
          <section
            key={section.id}
            id={section.id}
            className={`mb-16 sm:mb-20 scroll-mt-20 ${sectionIndex > 0 ? 'pt-8' : ''}`}
          >
            {/* Section Header — text-only for Featured/Chef's Picks, hero image for categories */}
            {section.id === 'featured' || section.id === 'chefs-picks' ? (
              <div className="mb-8 sm:mb-12">
                <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-[#363333] tracking-wider mb-2">
                  {section.title}
                </h2>
                <p className="text-gray-500 text-base sm:text-lg">
                  {section.subtitle}
                </p>
                <div className="h-1 w-16 bg-[#dabb64] mt-4" />
              </div>
            ) : (
              <div className="relative mb-8 sm:mb-12 rounded-2xl overflow-hidden">
                <div className="relative h-48 sm:h-64">
                  <Image
                    src={section.image}
                    alt={section.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#363333]/90 via-[#363333]/70 to-transparent" />
                </div>
                <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
                  <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-[#f7efd7] tracking-wider mb-2">
                    {section.title}
                  </h2>
                  <p className="text-[#dabb64] text-base sm:text-lg">
                    {section.subtitle}
                  </p>
                </div>
              </div>
            )}

            {/* === FEATURED SECTION === */}
            {section.id === 'featured' && (
              <>
                {/* BBQ Pitmaster Bundle Showcase */}
                <div className="mb-12">
                  <div className="bg-[#363333] rounded-2xl overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="relative h-64 md:h-auto min-h-[280px]">
                        <Image
                          src="/images/bbq_brisket.jpg"
                          alt="BBQ Pitmaster Spread"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                          SIGNATURE SPREAD
                        </div>
                      </div>
                      <div className="p-6 sm:p-8 flex flex-col justify-center">
                        <h3 className="font-oswald text-2xl sm:text-3xl font-bold text-[#f7efd7] mb-3 tracking-wide">
                          BBQ PITMASTER PACKAGE
                        </h3>
                        <p className="text-white/70 mb-6 text-sm sm:text-base">
                          Our Texas-style brisket smoked low and slow for 14 hours, paired with soul-warming
                          three-cheese mac &amp; cheese and golden buttery Southern cornbread. The complete BBQ
                          spread your guests won&apos;t stop talking about.
                        </p>
                        <div className="flex flex-wrap gap-3 mb-6">
                          {bbqBundleProducts.map(p => (
                            <div key={p.id} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden relative flex-shrink-0">
                                <Image src={p.image} alt={p.title} fill className="object-cover" />
                              </div>
                              <div>
                                <span className="text-white text-xs font-semibold">{p.title.split('(')[0].trim()}</span>
                                <span className="text-[#dabb64] text-[10px] block">{getDisplayPrice(p)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Link
                          href="/#catering"
                          className="inline-flex items-center gap-2 bg-[#dabb64] text-[#363333] font-oswald font-bold px-6 py-3 rounded-lg hover:bg-[#f7efd7] transition-all w-fit"
                        >
                          <span>Build This Spread</span>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Favorites */}
                {customerFavorites.length > 0 && (
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div>
                        <h3 className="font-oswald text-xl sm:text-2xl font-bold text-[#363333]">
                          Customer Favorites
                        </h3>
                        <p className="text-sm text-gray-500">Our most ordered items across all categories</p>
                      </div>
                      <div className="flex-1 h-px bg-[#dabb64]/50" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      {customerFavorites.map(product => (
                        <MenuItemCard key={product.id} product={product} badge="popular" />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* === CHEF'S PICKS SECTION === */}
            {section.id === 'chefs-picks' && chefsPickProducts.length > 0 && (
              <div>
                <p className="text-gray-600 mb-6 max-w-2xl">
                  Premium selections with exceptional flavor profiles and outstanding value.
                  These are the items our team recommends for an elevated catering experience.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {chefsPickProducts.map(product => (
                    <MenuItemCard key={product.id} product={product} badge="chefs-pick" />
                  ))}
                </div>
              </div>
            )}

            {/* === STANDARD SUBSECTION RENDERING === */}
            {section.subsections.length > 0 && (
              <div className="space-y-12">
                {section.subsections.map((subsection) => {
                  const rawProducts = getProductsForSubsection(subsection.id).filter(p => !REMOVED_ITEM_IDS.has(p.id));
                  const sorted = sortByQuadrant(rawProducts);
                  const products = filterByDietary(sorted, activeFilters);
                  if (products.length === 0) return null;

                  return (
                    <div key={subsection.id}>
                      <div className="flex items-center gap-4 mb-6">
                        <div>
                          <h3 className="font-oswald text-xl sm:text-2xl font-bold text-[#363333]">
                            {subsection.title}
                          </h3>
                          <p className="text-sm text-gray-500">{subsection.description}</p>
                        </div>
                        <div className="flex-1 h-px bg-[#dabb64]/50" />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {products.map((product) => (
                          <MenuItemCard
                            key={product.id}
                            product={product}
                            badge={getBadgeForProduct(product.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* === FLAT SECTIONS (desserts) === */}
            {section.subsections.length === 0 && section.id !== 'featured' && section.id !== 'chefs-picks' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filterByDietary(sortByQuadrant(getProductsForSection(section.id).filter(p => !REMOVED_ITEM_IDS.has(p.id))), activeFilters).map((product) => (
                  <MenuItemCard key={product.id} product={product} badge={getBadgeForProduct(product.id)} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* CTA Section */}
      <div className="bg-[#363333] py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-oswald text-2xl sm:text-3xl md:text-4xl font-bold text-[#f7efd7] mb-4 tracking-wide">
            READY TO ORDER?
          </h3>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">
            Build your custom catering order with our easy-to-use ordering system. Prices auto-adjust based on your guest count.
          </p>
          <Link
            href="/#catering"
            className="inline-flex items-center gap-2 bg-[#dabb64] text-[#363333] font-oswald font-bold px-8 py-3 rounded-lg hover:bg-[#f7efd7] transition-all"
          >
            <span>Start Your Order</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Pricing Note */}
      <div className="bg-[#f7efd7] py-8 border-t border-[#dabb64]/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h4 className="font-oswald text-lg font-bold text-[#363333] mb-2">PRICING INFORMATION</h4>
            <p className="text-sm text-gray-600">
              Our catering is priced by serving size to accommodate groups of all sizes.
              <strong> Trays</strong> serve 10-40 guests, <strong>Pans</strong> serve 10-25 guests,
              and <strong>Per-Person</strong> items are priced individually.
              Minimum orders apply to some items. Delivery fees are based on order size.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
