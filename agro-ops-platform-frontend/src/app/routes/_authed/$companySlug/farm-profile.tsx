import { createFileRoute } from "@tanstack/react-router";
import Page from "@/src/pages/farm-profile/page";

const FarmProfileRoute = () => {
  return <Page />;
};

export const Route = createFileRoute("/_authed/$companySlug/farm-profile")({
  component: FarmProfileRoute,
});
