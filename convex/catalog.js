import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const product = v.object({
  slug: v.string(),
  name: v.string(),
  category: v.string(),
  price: v.number(),
  color: v.optional(v.string()),
  lead: v.optional(v.string()),
  note: v.optional(v.string()),
  details: v.optional(v.array(v.string())),
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

export const listAll = query({
  args: {},
  handler: async (ctx) => ctx.db.query("products").order("desc").collect(),
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

export const upsert = mutation({
  args: {
    id: v.optional(v.id("products")),
    slug: v.string(),
    name: v.string(),
    category: v.string(),
    price: v.number(),
    color: v.optional(v.string()),
    lead: v.optional(v.string()),
    note: v.optional(v.string()),
    details: v.optional(v.array(v.string())),
    active: v.boolean(),
    sizes: v.array(v.string()),
    variants: v.array(v.object({
      id: v.string(),
      name: v.string(),
      visual: v.optional(v.string()),
      imagePath: v.optional(v.string()),
      images: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, product) => {
    const now = new Date().toISOString();
    const { id, ...data } = product;
    const duplicate = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", data.slug)).unique();
    if (id) {
      await ctx.db.patch(id, { ...data, updatedAt: now });
      return id;
    }
    if (duplicate) {
      await ctx.db.patch(duplicate._id, { ...data, updatedAt: now });
      return duplicate._id;
    }
    return await ctx.db.insert("products", { ...data, createdAt: now });
  },
});

export const archive = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { active: false, updatedAt: new Date().toISOString() });
    return id;
  },
});
