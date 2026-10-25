import { LegalPage } from "../features/legal/legal-page";
import { TERMS_OF_SERVICE } from "../features/legal/terms-of-service";
import { PATHS } from "../lib/paths";
import { pageMeta } from "../lib/site";

export const meta = () =>
  pageMeta({
    description: "Syarat dan ketentuan penggunaan layanan kami.",
    path: PATHS.terms,
    title: TERMS_OF_SERVICE.title,
  });

const Terms = () => <LegalPage document={TERMS_OF_SERVICE} />;

export default Terms;
