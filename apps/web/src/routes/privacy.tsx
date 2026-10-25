import { LegalPage } from "../features/legal/legal-page";
import { PRIVACY_POLICY } from "../features/legal/privacy-policy";
import { PATHS } from "../lib/paths";
import { pageMeta } from "../lib/site";

export const meta = () =>
  pageMeta({
    description:
      "Bagaimana kami mengumpulkan, memakai, dan melindungi data Anda.",
    path: PATHS.privacy,
    title: PRIVACY_POLICY.title,
  });

const Privacy = () => <LegalPage document={PRIVACY_POLICY} />;

export default Privacy;
