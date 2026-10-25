import { Resend } from "resend";

import type { EmailTransport } from "./transport";

export interface ResendTransportOptions {
  /** Dari binding Worker (`env.RESEND_API_KEY`), bukan dari env modul. */
  apiKey: string;
}

/**
 * Transport Resend. SDK memakai `fetch`, jadi berjalan di Workers. Email
 * dirender sendiri oleh sender (bukan opsi `react` SDK) agar HTML & teks
 * polosnya sama dengan yang diuji.
 */
export const createResendTransport = ({
  apiKey,
}: ResendTransportOptions): EmailTransport => {
  const resend = new Resend(apiKey);

  return {
    send: async (message) => {
      // SDK Resend tidak melempar error API; hasilnya harus dicek manual.
      const { error } = await resend.emails.send(message);

      if (error) {
        throw new Error(
          `Resend rejected email (${error.name}, status ${error.statusCode ?? "unknown"}): ${error.message}`
        );
      }
    },
  };
};
