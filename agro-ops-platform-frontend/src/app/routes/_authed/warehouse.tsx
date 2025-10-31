import { createFileRoute } from "@tanstack/react-router";
import Page from "@/src/pages/warehouse/page";

const WarehouseRoute = () => {
  return <Page />;
};

export const Route = createFileRoute("/_authed/warehouse")({
  component: WarehouseRoute,
});
