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
 * Salinan langganan Polar yang disinkronkan webhook; sumber kebenaran untuk
 * otorisasi fitur (tanpa memanggil Polar di setiap request). Satu baris per
 * subscription Polar, sehingga riwayat (batal lalu berlangganan lagi) tetap ada.
 * Organisasi dipetakan lewat `external_id` customer Polar, jadi tidak ada tabel
 * customer terpisah.
 */
export const subscriptions = snakeCase.table(
  "billing_subscriptions",
  {
    id: id(),
    polarSubscriptionId: text().notNull().unique(),
    plan: text().$type<PaidPlanId>().notNull(),
    /** Status Polar apa adanya (`active`, `past_due`, `canceled`, ...). */
    status: text().notNull(),
    polarCustomerId: text().notNull(),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    currentPeriodEnd: timestamp({ withTimezone: true }),
    /** Dijadwalkan berhenti di akhir periode atau pada tanggal `ends_at`. */
    cancelAtPeriodEnd: boolean().default(false).notNull(),
    /**
     * `modified_at` subscription di Polar. Webhook bisa tiba tidak berurutan;
     * snapshot yang lebih lama dari nilai ini tidak menimpa baris.
     */
    polarModifiedAt: timestamp({ withTimezone: true }).notNull(),
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
 * Header `webhook-id` webhook Polar yang sudah diproses. Polar mengirim ulang
 * pengiriman yang gagal dengan ID yang sama; baris di sini membuatnya dilewati.
 */
export const webhookEvents = snakeCase.table("billing_webhook_events", {
  /** ID pengiriman Polar (header `webhook-id`), bukan UUID. */
  id: text().primaryKey(),
  type: text().notNull(),
  createdAt: createdAt(),
});

export type Subscription = typeof subscriptions.$inferSelect;
