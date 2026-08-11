import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title = "Data unavailable from backend.",
  description = "Once your API is connected, live records will appear here.",
  action,
}: {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-cyan mb-4">
        {icon ?? <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}