import { createFileRoute } from "@tanstack/react-router";
import Page from "@/src/pages/admin/import-chemicals/page";

const AdminImportChemicalsRoute = () => {
  return <Page />;
};

export const Route = createFileRoute(
  "/_authed/$companySlug/admin/import-chemicals",
)({
  component: AdminImportChemicalsRoute,
});
