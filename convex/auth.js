import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).unique(),
});

export const create = mutation({
  args: {
    email: v.string(), passwordHash: v.string(), passwordSalt: v.string(),
    role: v.union(v.literal("admin"), v.literal("buyer")), name: v.optional(v.string()),
  },
  handler: async (ctx, input) => {
    const existing = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", input.email)).unique();
    if (existing) throw new Error("An account with this email already exists.");
    const now = new Date().toISOString();
    let customerId;
    if (input.role === "buyer") {
      const customer = await ctx.db.query("customers").withIndex("by_email", (q) => q.eq("email", input.email)).unique();
      customerId = customer ? customer._id : await ctx.db.insert("customers", { email: input.email, name: input.name, createdAt: now });
    }
    return await ctx.db.insert("users", { ...input, customerId, createdAt: now });
  },
});

export const markLogin = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => { await ctx.db.patch(id, { lastLoginAt: new Date().toISOString() }); return true; },
});
