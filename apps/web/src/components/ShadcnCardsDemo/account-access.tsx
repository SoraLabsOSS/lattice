import { Button } from "@sora-lattice/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sora-lattice/ui/components/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@sora-lattice/ui/components/field";
import { Input } from "@sora-lattice/ui/components/input";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@sora-lattice/ui/components/item";
import { AlertCircle, ChevronRight, Lock } from "lucide-react";

export function AccountAccess() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Access</CardTitle>
        <CardDescription>
          Update your credentials or re-authenticate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email-address">Email Address</FieldLabel>
            <Input
              id="email-address"
              placeholder="artist@studio.inc"
              type="email"
            />
          </Field>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="current-password">
                Current Password
              </FieldLabel>
              <a
                className="font-medium text-muted-foreground text-xs uppercase tracking-wider hover:text-foreground"
                href="#"
              >
                Forgot?
              </a>
            </div>
            <Input
              id="current-password"
              placeholder="••••••••••••••••••••••••"
              type="password"
            />
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <Button className="w-full">
          <Lock strokeWidth={1.5} />
          Update Security
        </Button>
        <Item render={<a href="#" />} variant="muted">
          <ItemMedia variant="icon">
            <AlertCircle className="text-destructive" strokeWidth={1.5} />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Danger Zone</ItemTitle>
            <ItemDescription className="line-clamp-1">
              Archive account and remove catalog
            </ItemDescription>
          </ItemContent>
          <ChevronRight className="size-4" strokeWidth={1.5} />
        </Item>
      </CardFooter>
    </Card>
  );
}
