import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import TabBar from "../components/BrandIntake/TabBar";
import { ColorPickerPopover } from "../components/ui/ColorPickerPopover";

expect.extend({
  toHaveNoViolations(received) {
    const violations = received?.violations ?? [];
    return {
      message: () =>
        violations
          .map(
            (violation: { id: string; help: string }) =>
              `${violation.id}: ${violation.help}`
          )
          .join("\n"),
      pass: violations.length === 0,
    };
  },
});

declare module "vitest" {
  interface Assertion<T = unknown> {
    toHaveNoViolations(): T;
  }
}

describe("core accessibility controls", () => {
  it("renders the configuration tabs with tab semantics and keyboard navigation", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    const { container } = render(
      <>
        <TabBar activeTab="color" onTabChange={onTabChange} />
        <div
          aria-labelledby="theme-tab-color"
          id="theme-tab-panel-color"
          role="tabpanel"
        />
        <div
          aria-labelledby="theme-tab-typography"
          hidden
          id="theme-tab-panel-typography"
          role="tabpanel"
        />
        <div
          aria-labelledby="theme-tab-style"
          hidden
          id="theme-tab-panel-style"
          role="tabpanel"
        />
      </>
    );

    const tabs = screen.getAllByRole("tab");
    expect(
      screen.getByRole("tablist", { name: /theme configuration/i })
    ).toBeInTheDocument();
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");

    tabs[0].focus();
    await user.keyboard("{ArrowRight}");
    expect(onTabChange).toHaveBeenCalledWith("typography");
    await expect(axe(container)).resolves.toHaveNoViolations();
  });

  it("exposes the color picker trigger as a dialog control", async () => {
    const { container } = render(
      <ColorPickerPopover
        color="#2e7bab"
        label="Primary color"
        onChange={vi.fn()}
        showHexInput
      />
    );

    const trigger = screen.getByRole("button", { name: /primary color/i });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(axe(container)).resolves.toHaveNoViolations();
  });
});
