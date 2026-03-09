import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Upload,
  Camera,
  Users,
  Settings,
  Bell,
  BarChart3,
  MessageCircle,
  MonitorPlay,
  MapPin,
  ShieldCheck,
  Shield,
  Building2,
  Truck,
  Flame,
  AlertTriangle,
  Navigation,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

function getMenuForRole(role: string): MenuGroup[] {
  switch (role) {
    case "admin":
      return [
        {
          label: "Administration",
          items: [
            { title: "Admin Dashboard", url: "/admin", icon: ShieldCheck },
            { title: "Alerts", url: "/alerts", icon: Bell },
          ],
        },
        {
          label: "System",
          items: [
            { title: "Settings", url: "/settings", icon: Settings },
          ],
        },
      ];

    case "police":
      return [
        {
          label: "Police",
          items: [
            { title: "Police Dashboard", url: "/police", icon: Shield },
            { title: "Alerts", url: "/alerts", icon: Bell },
          ],
        },
        {
          label: "System",
          items: [
            { title: "Settings", url: "/settings", icon: Settings },
          ],
        },
      ];

    case "ambulance":
      return [
        {
          label: "Ambulance",
          items: [
            { title: "Ambulance Dashboard", url: "/ambulance", icon: Truck },
            { title: "Alerts", url: "/alerts", icon: Bell },
          ],
        },
        {
          label: "System",
          items: [
            { title: "Settings", url: "/settings", icon: Settings },
          ],
        },
      ];

    case "hospital":
      return [
        {
          label: "Hospital",
          items: [
            { title: "Hospital Dashboard", url: "/hospital", icon: Building2 },
            { title: "Alerts", url: "/alerts", icon: Bell },
          ],
        },
        {
          label: "System",
          items: [
            { title: "Settings", url: "/settings", icon: Settings },
          ],
        },
      ];

    case "fire":
      return [
        {
          label: "Fire Department",
          items: [
            { title: "Fire Dashboard", url: "/responders", icon: Flame },
            { title: "Alerts", url: "/alerts", icon: Bell },
          ],
        },
        {
          label: "System",
          items: [
            { title: "Settings", url: "/settings", icon: Settings },
          ],
        },
      ];

    default:
      return [
        {
          label: "Monitoring",
          items: [
            { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
            { title: "Upload Media", url: "/upload", icon: Upload },
            { title: "Live Monitoring", url: "/live", icon: MonitorPlay },
            { title: "Alerts", url: "/alerts", icon: Bell },
            { title: "Map View", url: "/map", icon: MapPin },
            { title: "SafeRoute Planning", url: "/saferoute", icon: Navigation },
          ],
        },
        {
          label: "Management",
          items: [
            { title: "Cameras", url: "/cameras", icon: Camera },
            { title: "Contacts", url: "/contacts", icon: Users },
            { title: "Analytics", url: "/analytics", icon: BarChart3 },
          ],
        },
        {
          label: "Responders",
          items: [
            { title: "Responders", url: "/responders", icon: AlertTriangle },
            { title: "Hospital", url: "/hospital", icon: Building2 },
          ],
        },
        {
          label: "System",
          items: [
            { title: "AI Assistant", url: "/assistant", icon: MessageCircle },
            { title: "Settings", url: "/settings", icon: Settings },
          ],
        },
      ];
  }
}

export function AppSidebar({ userRole }: { userRole?: string }) {
  const [location] = useLocation();
  const menuGroups = getMenuForRole(userRole || "dispatcher");

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold">SAFEROUTE CM</span>
            <span className="text-xs text-muted-foreground">Road Safety System</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span>System Online</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
