import { createFileRoute, Outlet } from "@tanstack/react-router";
import Page from "@/src/pages/fields/page";

const FieldsRoute = () => {
  return (
    <>
      <Page />
      <Outlet />
    </>
  );
};

export const Route = createFileRoute("/_authed/$companySlug/fields")({
  component: FieldsRoute,
});
