/**
 * Seed script: Migrates hardcoded CATERING_PRODUCTS to Supabase.
 * Run with: npx tsx scripts/seed-products.ts
 */
import { createClient } from '@supabase/supabase-js';
import { CATERING_PRODUCTS } from '../lib/products';

// Load env vars
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log(`Seeding ${CATERING_PRODUCTS.length} products to Supabase...`);

  const rows = CATERING_PRODUCTS.map((product, index) => ({
    id: product.id,
    title: product.title,
    description: product.description,
    image: product.image,
    categories: product.categories,
    pricing: product.pricing,
    tags: product.tags ?? null,
    featured: product.featured ?? false,
    variant_id: product.variantId ?? null,
    slug: product.slug ?? null,
    inventory: product.inventory ?? null,
    is_active: true,
    sort_position: index,
  }));

  // Upsert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from('products')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Error on batch ${i / batchSize + 1}:`, error);
      process.exit(1);
    }
    console.log(`  Batch ${i / batchSize + 1}: ${batch.length} products upserted`);
  }

  console.log('Seed complete!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
