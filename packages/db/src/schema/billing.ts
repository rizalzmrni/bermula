import { PAID_PLANS } from "@bermula/core/plans";
import type { PaidPlanId } from "@bermula/core/plans";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  snakeCase,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "../columns";
import { organizations } from "./auth";

const toSqlList = (values: readonly string[]) =>
  sql.raw(values.map((value) => `'${value}'`).join(", "));

/**
 * Satu Stripe customer per organisasi (pembayar = organisasi, bukan pengguna).
 * Dibuat saat Checkout pertama dan dipakai ulang untuk Billing Portal.
 */
export const customers = snakeCase.table("billing_customers", {
  id: id(),
  stripeCustomerId: text().notNull().unique(),
  organizationId: uuid()
    .notNull()
    .unique()
    .references(() => organizations.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/**
 * Salinan langganan Stripe yang disinkronkan webhook; sumber kebenaran untuk
 * otorisasi fitur (tanpa memanggil Stripe di setiap request). Satu baris per
 * subscription Stripe, sehingga riwayat (batal lalu berlangganan lagi) tetap ada.
 */
export const subscriptions = snakeCase.table(
  "billing_subscriptions",
  {
    id: id(),
    stripeSubscriptionId: text().notNull().unique(),
    plan: text().$type<PaidPlanId>().notNull(),
    /** Status Stripe apa adanya (`active`, `past_due`, `canceled`, ...). */
    status: text().notNull(),
    stripeCustomerId: text().notNull(),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    currentPeriodEnd: timestamp({ withTimezone: true }),
    /** Dijadwalkan berhenti di akhir periode atau pada tanggal `cancel_at`. */
    cancelAtPeriodEnd: boolean().default(false).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("billing_subscriptions_organization_id_idx").on(table.organizationId),
    check(
      "billing_subscriptions_plan_check",
      sql`${table.plan} in (${toSqlList(PAID_PLANS)})`
    ),
  ]
);

/**
 * `event.id` webhook Stripe yang sudah diproses. Stripe bisa mengirim ulang
 * event yang sama; baris di sini membuat pengiriman ulang dilewati.
 */
export const webhookEvents = snakeCase.table("billing_webhook_events", {
  /** ID event Stripe (`evt_...`), bukan UUID. */
  id: text().primaryKey(),
  type: text().notNull(),
  createdAt: createdAt(),
});

export type BillingCustomer = typeof customers.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
