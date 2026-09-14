import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const product = v.object({
  slug: v.string(),
  name: v.string(),
  category: v.string(),
  price: v.number(),
  active: v.boolean(),
  sizes: v.array(v.string()),
  variants: v.array(v.object({
    id: v.string(),
    name: v.string(),
    visual: v.optional(v.string()),
    imagePath: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
  })),
});

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("products").withIndex("by_active", (q) => q.eq("active", true)).collect(),
});

export const seedCatalog = mutation({
  args: { products: v.array(product) },
  handler: async (ctx, { products }) => {
    const now = new Date().toISOString();
    for (const item of products) {
      const existing = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", item.slug)).unique();
      if (existing) await ctx.db.patch(existing._id, { ...item, updatedAt: now });
      else await ctx.db.insert("products", { ...item, createdAt: now });
    }
    return products.length;
  },
});
