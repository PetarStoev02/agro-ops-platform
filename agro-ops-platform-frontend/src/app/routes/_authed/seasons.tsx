import { createFileRoute } from "@tanstack/react-router";
import Page from "@/src/pages/seasons/page";

const SeasonsRoute = () => {
  return <Page />;
};

export const Route = createFileRoute("/_authed/seasons")({
  component: SeasonsRoute,
});
