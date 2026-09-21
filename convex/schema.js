import { defineSchema, defineTable } from "convex/server";
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

const productVariant = v.object({
  id: v.string(),
  name: v.string(),
  visual: v.optional(v.string()),
  imagePath: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
});

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    passwordSalt: v.string(),
    role: v.union(v.literal("admin"), v.literal("buyer")),
    customerId: v.optional(v.id("customers")),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
    lastLoginAt: v.optional(v.string()),
  }).index("by_email", ["email"]),

  customers: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    pickupPoint: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  }).index("by_email", ["email"]),

  products: defineTable({
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
    variants: v.array(productVariant),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  }).index("by_slug", ["slug"]).index("by_active", ["active"]),

  inventory: defineTable({
    productId: v.id("products"),
    variantId: v.string(),
    size: v.optional(v.string()),
    quantity: v.number(),
    updatedAt: v.string(),
  }).index("by_product_variant_size", ["productId", "variantId", "size"]),

  orders: defineTable({
    orderId: v.string(),
    customerId: v.optional(v.id("customers")),
    customer,
    fulfillmentMethod: v.string(),
    items: v.array(orderItem),
    total: v.number(),
    paymentStatus: v.string(),
    status: v.string(),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  })
    .index("by_order_id", ["orderId"])
    .index("by_created_at", ["createdAt"])
    .index("by_customer", ["customerId"]),

  payments: defineTable({
    orderId: v.string(),
    provider: v.string(),
    providerPaymentId: v.optional(v.string()),
    amount: v.number(),
    status: v.string(),
    raw: v.optional(v.any()),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  }).index("by_order_id", ["orderId"]),

  orderEvents: defineTable({
    orderId: v.string(),
    type: v.string(),
    payload: v.optional(v.any()),
    createdAt: v.string(),
  }).index("by_order", ["orderId", "createdAt"]),
});
