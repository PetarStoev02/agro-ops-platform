import { createFileRoute } from "@tanstack/react-router";
import Page from "@/src/pages/diaries/page";

const DiariesRoute = () => {
  return <Page />;
};

export const Route = createFileRoute("/_authed/diaries")({
  component: DiariesRoute,
});
