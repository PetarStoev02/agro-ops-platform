import { createFileRoute } from "@tanstack/react-router";
import Page from "@/src/pages/activities/page";

const ActivitiesRoute = () => {
  return <Page />;
};

export const Route = createFileRoute("/_authed/$companySlug/activities")({
  component: ActivitiesRoute,
});
