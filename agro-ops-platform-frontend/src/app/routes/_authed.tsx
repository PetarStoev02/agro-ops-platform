import { createFileRoute, Outlet } from "@tanstack/react-router";

const Authed = () => {
  return <Outlet />;
};

export const Route = createFileRoute("/_authed")({
  component: Authed,
});
