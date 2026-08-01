"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@sora-lattice/ui/components/alert-dialog";
import { Badge } from "@sora-lattice/ui/components/badge";
import { Button } from "@sora-lattice/ui/components/button";
import { ButtonGroup } from "@sora-lattice/ui/components/button-group";
import { Card, CardContent } from "@sora-lattice/ui/components/card";
import { Checkbox } from "@sora-lattice/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sora-lattice/ui/components/dropdown-menu";
import { Field, FieldGroup } from "@sora-lattice/ui/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@sora-lattice/ui/components/input-group";
import {
  RadioGroup,
  RadioGroupItem,
} from "@sora-lattice/ui/components/radio-group";
import { Switch } from "@sora-lattice/ui/components/switch";
import { Textarea } from "@sora-lattice/ui/components/textarea";
import { ArrowRight, ChevronUp, Search } from "lucide-react";

export function UIElements() {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-6">
        <div className="flex gap-2">
          <Button>
            Button <ArrowRight data-icon="inline-end" strokeWidth={1.5} />
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
        </div>
        <FieldGroup>
          <Field>
            <InputGroup>
              <InputGroupInput placeholder="Name" />
              <InputGroupAddon align="inline-end">
                <InputGroupText>
                  <Search strokeWidth={1.5} />
                </InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <Field className="flex-1">
            <Textarea className="resize-none" placeholder="Message" />
          </Field>
        </FieldGroup>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <Badge>Badge</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge className="hidden sm:flex" variant="outline">
              Outline
            </Badge>
          </div>
          <RadioGroup
            aria-label="Fruit preference"
            className="ml-auto flex w-fit gap-3"
            defaultValue="apple"
          >
            <RadioGroupItem aria-label="Apple" value="apple" />
            <RadioGroupItem aria-label="Banana" value="banana" />
          </RadioGroup>
          <div className="flex gap-3">
            <Checkbox aria-label="Enable email alerts" defaultChecked />
            <Checkbox
              aria-label="Enable push alerts"
              className="hidden sm:flex"
            />
          </div>
          <Switch
            aria-label="Enable compact notifications"
            className="flex sm:hidden"
            defaultChecked
          />
        </div>
        <div className="flex items-center gap-4">
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline" />}>
              <span className="hidden md:flex">Alert Dialog</span>
              <span className="flex md:hidden">Dialog</span>
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Allow accessory to connect?</AlertDialogTitle>
                <AlertDialogDescription>
                  Do you want to allow the USB accessory to connect to this
                  device and your data?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Don&apos;t allow</AlertDialogCancel>
                <AlertDialogAction>Allow</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <ButtonGroup className="ml-auto">
            <Button variant="outline">Button Group</Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    aria-label="Open quick actions"
                    size="icon"
                    variant="outline"
                  />
                }
              >
                <ChevronUp strokeWidth={1.5} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40" side="top">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                  <DropdownMenuItem>Mute Conversation</DropdownMenuItem>
                  <DropdownMenuItem>Mark as Read</DropdownMenuItem>
                  <DropdownMenuItem>Block User</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive">
                    Delete Conversation
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
          <Switch
            aria-label="Enable advanced setting"
            className="hidden sm:flex"
            defaultChecked
          />
        </div>
      </CardContent>
    </Card>
  );
}
