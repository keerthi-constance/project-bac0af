import { Link, useRouterState } from "@tanstack/react-router";
import { Vault } from "lucide-react";
import { NAV_ITEMS } from "./nav";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-3 py-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Vault className="size-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">VaultCore</p>
              <p className="mono truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                DSA Banking Terminal
              </p>
            </div>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={pathname === item.to} tooltip={item.label}>
                    <Link to={item.to} className="flex items-center gap-2">
                      <item.icon className="size-4" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}