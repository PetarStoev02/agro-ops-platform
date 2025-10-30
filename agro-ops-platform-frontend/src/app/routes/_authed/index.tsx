import { createFileRoute } from "@tanstack/react-router";
import Page from "@/src/pages/dashboard/page";

const AuthedIndexRoute = () => {
  return <Page />;
};

export const Route = createFileRoute("/_authed/")({
  component: AuthedIndexRoute,
});
