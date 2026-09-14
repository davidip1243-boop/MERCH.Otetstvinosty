import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const customer = v.object({
  name: v.optional(v.string()),
  phone: v.optional(v.string()),
  email: v.string(),
  address: v.optional(v.string()),
  pickupPoint: v.optional(v.string()),
});

const orderItem = v.object({
  id: v.string(),
  name: v.string(),
  size: v.optional(v.string()),
  colour: v.optional(v.string()),
  quantity: v.number(),
  unitPrice: v.number(),
  total: v.number(),
});

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("orders").withIndex("by_created_at").order("desc").collect(),
});

export const getById = query({
  args: { orderId: v.string() },
  handler: async (ctx, { orderId }) => ctx.db.query("orders").withIndex("by_order_id", (q) => q.eq("orderId", orderId)).unique(),
});

export const create = mutation({
  args: {
    orderId: v.string(),
    customer,
    fulfillmentMethod: v.string(),
    items: v.array(orderItem),
    total: v.number(),
    paymentStatus: v.string(),
    status: v.string(),
    createdAt: v.string(),
  },
  handler: async (ctx, order) => {
    const existing = await ctx.db.query("orders").withIndex("by_order_id", (q) => q.eq("orderId", order.orderId)).unique();
    if (existing) return existing._id;
    const now = new Date().toISOString();
    const customer = await ctx.db.query("customers").withIndex("by_email", (q) => q.eq("email", order.customer.email)).unique();
    const customerId = customer
      ? (await ctx.db.patch(customer._id, { ...order.customer, updatedAt: now }), customer._id)
      : await ctx.db.insert("customers", { ...order.customer, createdAt: now });
    const orderId = await ctx.db.insert("orders", { ...order, customerId });
    await ctx.db.insert("payments", { orderId: order.orderId, provider: order.fulfillmentMethod === "pickup" ? "none" : "tbank", amount: order.total, status: order.paymentStatus, createdAt: now });
    await ctx.db.insert("orderEvents", { orderId: order.orderId, type: "created", payload: { status: order.status }, createdAt: now });
    return orderId;
  },
});

export const updateStatus = mutation({
  args: { orderId: v.string(), status: v.string() },
  handler: async (ctx, { orderId, status }) => {
    const order = await ctx.db.query("orders").withIndex("by_order_id", (q) => q.eq("orderId", orderId)).unique();
    if (!order) return null;
    const updatedAt = new Date().toISOString();
    await ctx.db.patch(order._id, { status, updatedAt });
    await ctx.db.insert("orderEvents", { orderId, type: "status_changed", payload: { status }, createdAt: updatedAt });
    return { ...order, status, updatedAt };
  },
});

export const updatePayment = mutation({
  args: {
    orderId: v.string(),
    status: v.string(),
    amount: v.number(),
    providerPaymentId: v.optional(v.string()),
    raw: v.optional(v.any()),
  },
  handler: async (ctx, { orderId, status, amount, providerPaymentId, raw }) => {
    const order = await ctx.db.query("orders").withIndex("by_order_id", (q) => q.eq("orderId", orderId)).unique();
    if (!order) return null;
    if (Math.round(order.total * 100) !== Math.round(amount)) throw new Error("Payment amount does not match order total.");
    const now = new Date().toISOString();
    const payment = await ctx.db.query("payments").withIndex("by_order_id", (q) => q.eq("orderId", orderId)).unique();
    if (payment) await ctx.db.patch(payment._id, { status, providerPaymentId, raw, updatedAt: now });
    else await ctx.db.insert("payments", { orderId, provider: "tbank", amount: order.total, status, providerPaymentId, raw, createdAt: now });
    await ctx.db.patch(order._id, { paymentStatus: status, updatedAt: now, ...(status === "CONFIRMED" || status === "AUTHORIZED" ? { status: "paid" } : {}) });
    await ctx.db.insert("orderEvents", { orderId, type: "payment_updated", payload: { status, providerPaymentId }, createdAt: now });
    return true;
  },
});

export const backfillRelatedData = mutation({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();
    let updated = 0;
    for (const order of orders) {
      const now = new Date().toISOString();
      let customerId = order.customerId;
      if (!customerId) {
        const customer = await ctx.db.query("customers").withIndex("by_email", (q) => q.eq("email", order.customer.email)).unique();
        customerId = customer
          ? (await ctx.db.patch(customer._id, { ...order.customer, updatedAt: now }), customer._id)
          : await ctx.db.insert("customers", { ...order.customer, createdAt: order.createdAt || now });
        await ctx.db.patch(order._id, { customerId });
      }
      const payment = await ctx.db.query("payments").withIndex("by_order_id", (q) => q.eq("orderId", order.orderId)).unique();
      if (!payment) await ctx.db.insert("payments", { orderId: order.orderId, provider: "tbank", amount: order.total, status: order.paymentStatus, createdAt: order.createdAt || now });
      const event = await ctx.db.query("orderEvents").withIndex("by_order", (q) => q.eq("orderId", order.orderId)).first();
      if (!event) await ctx.db.insert("orderEvents", { orderId: order.orderId, type: "created", payload: { status: order.status }, createdAt: order.createdAt || now });
      updated += 1;
    }
    return updated;
  },
});
