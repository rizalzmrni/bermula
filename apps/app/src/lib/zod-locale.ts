import { z } from "zod";
import { id } from "zod/locales";

// Pesan bawaan Zod dalam bahasa Indonesia, untuk aturan yang tidak diberi
// pesan sendiri di skema. Diimpor `root.tsx` agar berlaku di server & browser.
z.config(id());
