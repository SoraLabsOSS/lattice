import fs from "node:fs";
import path from "node:path";

const srcDir = "E:/ui/apps/v4/app/(app)/(root)/cards";
const destDir = "E:/Trellis/apps/web/src/components/ShadcnCardsDemo";

fs.mkdirSync(destDir, { recursive: true });

const files = fs
  .readdirSync(srcDir)
  .filter((f) => f.endsWith(".tsx") && f !== "index.tsx");

const iconMap: Record<string, string> = {
  ActivityIcon: "Activity",
  Add01Icon: "Plus",
  Analytics01Icon: "BarChart3",
  AnalyticsUpIcon: "TrendingUp",
  ArrowDataTransferHorizontalIcon: "ArrowLeftRight",
  ArrowRight01Icon: "ChevronRight",
  ArrowRight02Icon: "ArrowRight",
  ArrowUp01Icon: "ChevronUp",
  BankIcon: "Landmark",
  BookOpen02Icon: "BookOpen",
  Calendar03Icon: "Calendar",
  Cancel01Icon: "X",
  ChartBarLineIcon: "LineChart",
  CreditCardIcon: "CreditCard",
  File02Icon: "FileText",
  Globe02Icon: "Globe",
  HelpCircleIcon: "HelpCircle",
  Message01Icon: "MessageCircle",
  MoreHorizontalCircle01Icon: "MoreHorizontal",
  Notification03Icon: "Bell",
  PaintBoardIcon: "Palette",
  PieChartIcon: "PieChart",
  RefreshIcon: "RefreshCw",
  Search01Icon: "Search",
  Settings01Icon: "Settings",
  ShieldIcon: "Shield",
  SquareLock02: "Lock",
  SquareLock02Icon: "Lock",
  Target02Icon: "Target",
  UserIcon: "User",
  Wallet01Icon: "Wallet",
};

for (const file of files) {
  let code = fs.readFileSync(path.join(srcDir, file), "utf8");

  code = code.replaceAll(
    "@/styles/base-rhea/ui/",
    "@sora-lattice/ui/components/"
  );
  code = code.replaceAll('"@/lib/utils"', '"@sora-lattice/ui/lib/utils"');
  code = code.replaceAll("'@/lib/utils'", "'@sora-lattice/ui/lib/utils'");

  const usedIcons = new Set<string>();

  code = code.replace(
    /import\s*\{[\s\S]*?\}\s*from\s*"@hugeicons\/core-free-icons"\s*\n?/g,
    ""
  );
  code = code.replace(
    /import\s*\{\s*HugeiconsIcon\s*\}\s*from\s*"@hugeicons\/react"\s*\n?/g,
    ""
  );

  code = code.replace(
    /<HugeiconsIcon\s+icon=\{(\w+)\}\s*([\s\S]*?)\/>/g,
    (_match, icon: string, rest: string) => {
      const lucide = iconMap[icon] || icon.replace(/Icon$/, "");
      usedIcons.add(lucide);
      const attrs = rest
        .replace(/strokeWidth=\{2\}\s*/g, "")
        .replace(/\n\s*/g, " ")
        .trim();
      return `<${lucide}${attrs ? ` ${attrs}` : ""} strokeWidth={1.5} />`;
    }
  );

  // Soften style-sera / 4xl breakpoints that don't exist in Trellis
  code = code.replaceAll("4xl:", "sm:");
  code = code.replace(/className="[^"]*style-sera:[^"]*"/g, (m) =>
    m
      .replace(/\s*style-sera:[^\s"]+/g, "")
      .replace(/\s*hidden style-sera:[^\s"]+/g, "")
  );
  code = code.replace(
    /<span className="hidden md:flex style-sera:md:hidden">[\s\S]*?<\/span>\s*<span className="flex md:hidden style-sera:md:flex">[\s\S]*?<\/span>/g,
    "Alert Dialog"
  );
  code = code.replace(
    /<span className="style-sera:hidden">([\s\S]*?)<\/span>\s*<span className="hidden style-sera:block">[\s\S]*?<\/span>/g,
    "$1"
  );

  if (usedIcons.size > 0) {
    const icons = [...usedIcons].sort().join(", ");
    const importLine = `import { ${icons} } from "lucide-react";\n`;
    if (code.startsWith('"use client"')) {
      code = code.replace(
        /^"use client";?\n/,
        `"use client";\n\n${importLine}`
      );
    } else {
      code = `${importLine}\n${code}`;
    }
  }

  fs.writeFileSync(path.join(destDir, file), code);
  console.log("wrote", file);
}

console.log("done", files.length);
