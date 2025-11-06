import { createFileRoute } from "@tanstack/react-router";
import FieldDetailsPage from "@/src/pages/fields/[fieldId]/page";

export const Route = createFileRoute("/_authed/$companySlug/fields/$fieldId")({
  component: FieldDetailsPage,
});
