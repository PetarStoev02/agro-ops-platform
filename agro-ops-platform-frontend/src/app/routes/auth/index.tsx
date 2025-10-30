import { createFileRoute } from "@tanstack/react-router";

const LoginRoute = () => {
  return <>Hello World</>;
};

export const Route = createFileRoute("/auth/")({
  component: LoginRoute,
});
