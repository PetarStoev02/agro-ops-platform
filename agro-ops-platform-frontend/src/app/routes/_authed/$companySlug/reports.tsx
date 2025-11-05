import { createFileRoute } from "@tanstack/react-router";
import Page from "@/src/pages/reports/page";

const ReportsRoute = () => {
  return <Page />;
};

export const Route = createFileRoute("/_authed/$companySlug/reports")({
  component: ReportsRoute,
});
