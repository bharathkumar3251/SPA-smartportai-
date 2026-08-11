import { createFileRoute } from "@tanstack/react-router";
import { ForbiddenPanel } from "@/components/common/ErrorPanels";

export const Route = createFileRoute("/forbidden")({
  head: () => ({ meta: [{ title: "403 Forbidden — SmartPort AI" }] }),
  component: () => <ForbiddenPanel />,
});
