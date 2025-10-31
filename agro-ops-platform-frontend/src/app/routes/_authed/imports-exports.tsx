import { createFileRoute } from "@tanstack/react-router";
import Page from "@/src/pages/imports-exports/page";

const ImportsExportsRoute = () => {
  return <Page />;
};

export const Route = createFileRoute("/_authed/imports-exports")({
  component: ImportsExportsRoute,
});
