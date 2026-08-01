import { ScrollArea } from "@sora-lattice/ui/components/scroll-area";
import { AccountAccess } from "./account-access";
import { AnalyticsCard } from "./analytics-card";
import { ClaimableBalance } from "./claimable-balance";
import { ContributionHistory } from "./contribution-history";
import { DividendIncome } from "./dividend-income";
import { EmptyDistributeTrack } from "./empty-distribute-track";
import { NewMilestone } from "./new-milestone";
import { NotificationSettings } from "./notification-settings";
import { Payments } from "./payments";
import { PayoutThreshold } from "./payout-threshold";
import { PowerUsage } from "./power-usage";
import { QrConnect } from "./qr-connect";
import { SavingsTargets } from "./savings-targets";
import { SidebarNav } from "./sidebar-nav";
import { TransferFunds } from "./transfer-funds";
import { UIElements } from "./ui-elements";

/**
 * shadcn/ui homepage CardsDemo — Base UI Rhea.
 *
 * Column count + which stacks are visible follow the *preview panel* width
 * via @container (not the viewport). Mirrors upstream shadcn:
 *   1 col → UIElements
 *   2 cols → + QrConnect
 *   3 cols → + ContributionHistory
 *   4 cols → + EmptyDistributeTrack
 *   5 cols → + NewMilestone
 * so a 3-col layout never leaves a blank trailing cell.
 */
export function CardsDemo() {
  return (
    <ScrollArea className="h-full min-h-0">
      <div
        className="@container relative flex w-full max-w-none flex-col gap-(--gap) bg-muted p-6 font-sans [--gap:--spacing(6)] sm:p-8 dark:bg-background"
        data-slot="demo"
      >
        <div className="relative z-10 mx-auto grid w-full @min-[1200px]:grid-cols-4 @min-[1500px]:grid-cols-5 @min-[640px]:grid-cols-2 @min-[900px]:grid-cols-3 grid-cols-1 gap-(--gap) **:data-[slot=card]:w-full">
          <div className="flex flex-col items-start gap-(--gap)">
            <UIElements />
            <SidebarNav />
            <SavingsTargets />
          </div>
          <div className="@min-[900px]:flex hidden flex-col gap-(--gap)">
            <ContributionHistory />
            <ClaimableBalance />
            <DividendIncome />
          </div>
          <div className="@min-[1500px]:flex hidden flex-col gap-(--gap)">
            <NewMilestone />
            <PayoutThreshold />
            <AccountAccess />
          </div>
          <div className="@min-[640px]:flex hidden flex-col gap-(--gap)">
            <QrConnect />
            <TransferFunds />
            <Payments />
          </div>
          <div className="@min-[1200px]:flex hidden flex-col gap-(--gap)">
            <EmptyDistributeTrack />
            <AnalyticsCard />
            <NotificationSettings />
            <PowerUsage />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-1 h-16 bg-linear-to-b from-muted to-transparent dark:hidden" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-12 bg-linear-to-t from-muted/90 to-transparent dark:from-background/80" />
      </div>
    </ScrollArea>
  );
}

export default CardsDemo;
