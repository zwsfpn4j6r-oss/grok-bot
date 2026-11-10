import { createFileRoute } from "@tanstack/react-router";
import { GrokApp } from "@/components/grok-app";

export const Route = createFileRoute("/")({
  component: GrokApp,
});
