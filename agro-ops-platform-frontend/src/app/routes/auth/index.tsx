"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

const AuthIndexComponent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/auth/sign-in" });
  }, [navigate]);

  return null;
};

export const Route = createFileRoute("/auth/")({
  component: AuthIndexComponent,
});
