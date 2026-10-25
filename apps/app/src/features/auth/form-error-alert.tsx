import {
  Alert,
  AlertDescription,
} from "@bermula/design-system/components/ui/alert";
import { IconAlertTriangle } from "@tabler/icons-react";

/** Error tingkat form dari action (bukan error per field). */
export const FormErrorAlert = ({ message }: { message?: string }) =>
  message ? (
    <Alert variant="destructive">
      <IconAlertTriangle aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  ) : null;
