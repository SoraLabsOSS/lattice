"use client";

import { Button } from "@sora-lattice/ui/components/button";

/** Smoke-test island for `@sora-lattice/ui` workspace package. */
export function ShadcnButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button">Default</Button>
      <Button type="button" variant="secondary">
        Secondary
      </Button>
      <Button type="button" variant="outline">
        Outline
      </Button>
      <Button type="button" variant="ghost">
        Ghost
      </Button>
      <Button type="button" variant="destructive">
        Destructive
      </Button>
    </div>
  );
}
