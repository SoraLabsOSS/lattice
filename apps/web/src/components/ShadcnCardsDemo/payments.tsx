import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@sora-lattice/ui/components/breadcrumb";
import { Button } from "@sora-lattice/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@sora-lattice/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@sora-lattice/ui/components/dropdown-menu";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@sora-lattice/ui/components/item";
import {
  Calendar,
  ChevronRight,
  MoreHorizontal,
  RefreshCw,
  Settings,
} from "lucide-react";

export function Payments() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      aria-label="Account options"
                      size="icon-sm"
                      variant="ghost"
                    />
                  }
                >
                  <MoreHorizontal strokeWidth={1.5} />
                  <span className="sr-only">Account options</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuGroup>
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>Statements</DropdownMenuItem>
                    <DropdownMenuItem>Documents</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Payments</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          <div className="w-full" role="listitem">
            <Item render={<a href="#" />} variant="muted">
              <ItemMedia variant="icon">
                <Settings strokeWidth={1.5} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Change transfer limit</ItemTitle>
                <ItemDescription>
                  Adjust how much you can send from your balance.
                </ItemDescription>
              </ItemContent>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground"
                strokeWidth={1.5}
              />
            </Item>
          </div>
          <div className="w-full" role="listitem">
            <Item render={<a href="#" />} variant="muted">
              <ItemMedia variant="icon">
                <Calendar strokeWidth={1.5} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Scheduled transfers</ItemTitle>
                <ItemDescription>
                  Set up a transfer to send at a later date.
                </ItemDescription>
              </ItemContent>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground"
                strokeWidth={1.5}
              />
            </Item>
          </div>
          <div className="w-full" role="listitem">
            <Item render={<a href="#" />} variant="muted">
              <ItemMedia variant="icon">
                <RefreshCw strokeWidth={1.5} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Recurring card payments</ItemTitle>
                <ItemDescription>
                  Manage your repeated card transactions.
                </ItemDescription>
              </ItemContent>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground"
                strokeWidth={1.5}
              />
            </Item>
          </div>
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
