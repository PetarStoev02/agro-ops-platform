import { createFileRoute } from "@tanstack/react-router";
import Page from "@/src/pages/credits/page";

const CreditsRoute = () => {
  return <Page />;
};

export const Route = createFileRoute("/_authed/$companySlug/credits")({
  component: CreditsRoute,
});
