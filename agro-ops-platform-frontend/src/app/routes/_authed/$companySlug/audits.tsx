import { createFileRoute } from "@tanstack/react-router";
import Page from "@/src/pages/audits/page";

const AuditsRoute = () => {
  return <Page />;
};

export const Route = createFileRoute("/_authed/$companySlug/audits")({
  component: AuditsRoute,
});
