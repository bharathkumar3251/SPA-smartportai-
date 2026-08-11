import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useNavigate } from "@tanstack/react-router";
import { ROLES } from "@/lib/roles";
import { LayoutDashboard, Map as MapIcon, Brain, BarChart3, FileText, Settings } from "lucide-react";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const go = (to: string) => { onOpenChange(false); navigate({ to }); };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/app")}><LayoutDashboard className="w-4 h-4 mr-2" />Overview</CommandItem>
          <CommandItem onSelect={() => go("/app/live-map")}><MapIcon className="w-4 h-4 mr-2" />Live Map</CommandItem>
          <CommandItem onSelect={() => go("/app/ai")}><Brain className="w-4 h-4 mr-2" />AI Predictions</CommandItem>
          <CommandItem onSelect={() => go("/app/analytics")}><BarChart3 className="w-4 h-4 mr-2" />Analytics</CommandItem>
          <CommandItem onSelect={() => go("/app/reports")}><FileText className="w-4 h-4 mr-2" />Reports</CommandItem>
          <CommandItem onSelect={() => go("/app/settings")}><Settings className="w-4 h-4 mr-2" />Settings</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Role Workspaces">
          {ROLES.map((r) => (
            <CommandItem key={r.id} onSelect={() => go(r.home)}>
              <r.icon className="w-4 h-4 mr-2" />{r.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}