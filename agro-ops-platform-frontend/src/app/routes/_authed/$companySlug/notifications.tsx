import { createFileRoute } from "@tanstack/react-router";
import Page from "@/src/pages/notifications/page";

const NotificationsRoute = () => {
  return <Page />;
};

export const Route = createFileRoute("/_authed/$companySlug/notifications")({
  component: NotificationsRoute,
});
