import { createFileRoute } from "@tanstack/react-router";
import Page from "@/src/pages/organizations/page";

const OrganizationsRoute = () => {
  return <Page />;
};

export const Route = createFileRoute("/_authed/$companySlug/organizations")({
  component: OrganizationsRoute,
});
