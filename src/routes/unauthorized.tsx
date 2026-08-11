import { createFileRoute } from "@tanstack/react-router";
import { UnauthorizedPanel } from "@/components/common/ErrorPanels";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({ meta: [{ title: "401 Unauthorized — SmartPort AI" }] }),
  component: () => <UnauthorizedPanel />,
});
