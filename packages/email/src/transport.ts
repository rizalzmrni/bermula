/** Email yang sudah dirender, siap dikirim penyedia mana pun. */
export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Batas antara template dan penyedia email. Test memakai transport tiruan,
 * dan mengganti Resend cukup dengan menulis transport baru.
 */
export interface EmailTransport {
  /** Wajib melempar `Error` bila gagal, agar pemanggil bisa mencatatnya. */
  send: (message: EmailMessage) => Promise<void>;
}
