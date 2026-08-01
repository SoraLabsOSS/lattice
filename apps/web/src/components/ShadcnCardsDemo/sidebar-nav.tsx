import { Card } from "@sora-lattice/ui/components/card";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@sora-lattice/ui/components/sidebar";
import { cn } from "@sora-lattice/ui/lib/utils";
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CreditCard,
  FileText,
  Globe,
  HelpCircle,
  Landmark,
  LineChart,
  MessageCircle,
  Palette,
  PieChart,
  Shield,
  Target,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import type * as React from "react";

function SidebarSection({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("w-full overflow-hidden rounded-3xl py-0", className)}>
      <SidebarProvider className="min-h-0">
        <Sidebar className="w-full bg-transparent" collapsible="none">
          <SidebarContent className="gap-0 overflow-hidden">
            <SidebarGroup>
              <SidebarGroupLabel>{label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">{children}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </Card>
  );
}

export function SidebarNav() {
  return (
    <div className="grid w-full grid-cols-2 gap-4 xl:gap-6">
      <SidebarSection
        className="xl:col-start-1 xl:row-start-2"
        label="Overview"
      >
        <SidebarMenuItem>
          <SidebarMenuButton isActive>
            <BarChart3 strokeWidth={1.5} />
            Analytics
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <ArrowLeftRight strokeWidth={1.5} />
            Transactions
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <TrendingUp strokeWidth={1.5} />
            Investments
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Landmark strokeWidth={1.5} />
            Accounts
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <PieChart strokeWidth={1.5} />
            Spending
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarSection>

      <SidebarSection
        className="xl:col-start-1 xl:row-start-1"
        label="Planning"
      >
        <SidebarMenuItem>
          <SidebarMenuButton>
            <FileText strokeWidth={1.5} />
            Documents
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Wallet strokeWidth={1.5} />
            Budget
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <LineChart strokeWidth={1.5} />
            Reports
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Target strokeWidth={1.5} />
            Goals
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Calendar strokeWidth={1.5} />
            Calendar
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarSection>

      <SidebarSection
        className="flex xl:col-start-2 xl:row-start-1"
        label="Support"
      >
        <SidebarMenuItem>
          <SidebarMenuButton>
            <HelpCircle strokeWidth={1.5} />
            Help Center
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <BookOpen strokeWidth={1.5} />
            Docs
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <MessageCircle strokeWidth={1.5} />
            Contact Us
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Activity strokeWidth={1.5} />
            Status
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Globe strokeWidth={1.5} />
            Community
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarSection>

      <SidebarSection
        className="flex xl:col-start-2 xl:row-start-2"
        label="Account"
      >
        <SidebarMenuItem>
          <SidebarMenuButton>
            <User strokeWidth={1.5} />
            Profile
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton isActive>
            <CreditCard strokeWidth={1.5} />
            Billing
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Bell strokeWidth={1.5} />
            Notifications
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Shield strokeWidth={1.5} />
            Security
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Palette strokeWidth={1.5} />
            Appearance
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarSection>
    </div>
  );
}
