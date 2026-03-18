import { z } from 'zod';

const traySizeSchema = z.object({
  size: z.enum(['small', 'medium', 'large']),
  price: z.number().min(0),
  servesMin: z.number().min(1),
  servesMax: z.number().min(1),
});

const panSizeSchema = z.object({
  size: z.enum(['half', 'full']),
  price: z.number().min(0),
  servesMin: z.number().min(1),
  servesMax: z.number().min(1),
});

const pricingSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('tray'),
    sizes: z.array(traySizeSchema).min(1),
  }),
  z.object({
    type: z.literal('pan'),
    sizes: z.array(panSizeSchema).min(1),
  }),
  z.object({
    type: z.literal('per-person'),
    pricePerPerson: z.number().min(0),
    minOrder: z.number().min(1).optional(),
  }),
  z.object({
    type: z.literal('per-dozen'),
    pricePerDozen: z.number().min(0),
    servesPerDozen: z.number().min(1),
  }),
  z.object({
    type: z.literal('per-each'),
    priceEach: z.number().min(0),
    minOrder: z.number().min(1).optional(),
  }),
  z.object({
    type: z.literal('per-lb'),
    pricePerLb: z.number().min(0),
    minOrder: z.number().min(1).optional(),
  }),
  z.object({
    type: z.literal('per-container'),
    pricePerContainer: z.number().min(0),
    servesPerContainer: z.number().min(1),
  }),
  z.object({
    type: z.literal('flat'),
    flatPrice: z.number().min(0),
  }),
]);

export const productSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/, 'ID must be lowercase letters, numbers, and hyphens'),
  title: z.string().min(1),
  description: z.string().min(1),
  image: z.string().min(1),
  categories: z.array(z.enum(['breakfast', 'lunch', 'dessert', 'alacarte', 'other'])).min(1),
  pricing: pricingSchema,
  tags: z.array(z.string()).nullish(),
  featured: z.boolean().nullish(),
  variantId: z.string().nullish(),
  slug: z.string().nullish(),
  inventory: z.number().nullish(),
  minOrderQuantity: z.number().min(1).nullish(),
  specialOrder: z.boolean().nullish(),
  is_active: z.boolean().nullish(),
  sort_position: z.number().nullish(),
});

export type ProductFormData = z.infer<typeof productSchema>;
