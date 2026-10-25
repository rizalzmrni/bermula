import { createDb } from "@bermula/db/client";
import { createApiEnv } from "@bermula/env/api";

import {
  createApiLogger,
  createCaptureException,
  createStorage,
} from "./lib/runtime";
import { runStorageCleanup } from "./services/storage-cleanup";
import type { Bindings } from "./types";

/**
 * Handler Cron Trigger (`triggers.crons` di `wrangler.jsonc`). Saat ini hanya
 * ada satu jadwal; bila bertambah, pilih job berdasarkan `controller.cron`.
 */
export const scheduled: ExportedHandlerScheduledHandler<Bindings> = async (
  controller,
  bindings,
  ctx
) => {
  const env = createApiEnv(bindings);
  const logger = createApiLogger(env, {
    cron: controller.cron,
    job: "storage-cleanup",
  });

  try {
    const deleted = await runStorageCleanup({
      db: createDb({ databaseUrl: env.DATABASE_URL }),
      // Waktu jadwal, bukan jam saat ini, agar retry memakai batas yang sama.
      now: new Date(controller.scheduledTime),
      storage: createStorage(env),
    });
    logger.info("Storage cleanup completed", deleted);
  } catch (error) {
    logger.error("Storage cleanup failed", { error });
    const captureException = createCaptureException(env);
    if (captureException && error instanceof Error) {
      // Ditunggu langsung (bukan `waitUntil`): tidak ada respons yang tertahan,
      // dan kegagalan kirim tetap tercatat sebelum log di-flush.
      try {
        await captureException(error, {
          handled: false,
          properties: { cron: controller.cron },
        });
      } catch (captureError) {
        logger.warn("Failed to send exception to PostHog", {
          error: captureError,
        });
      }
    }
    // Dilempar ulang agar invocation tercatat gagal di dashboard Cron Triggers.
    throw error;
  } finally {
    ctx.waitUntil(logger.flush());
  }
};
