import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownRight,
  ArrowUpRight,
  AtSign,
  Bell,
  Bold,
  ChevronDown,
  ChevronUp,
  Cloud,
  Coffee,
  CreditCard,
  Globe,
  Grid3X3,
  Image,
  Italic,
  LayoutDashboard,
  Music,
  Music2,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Square,
  Strikethrough,
  Type,
  Upload,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import qrcodePng from "../../assets/qrcode.png";
import Alert from "./alert";
import Avatar from "./avatar";
import Badge from "./badge";
import Button from "./button";
import Card from "./card";
import Checkbox from "./checkbox";
import Input from "./input";
import Toggle from "./toggle";
import {
  bg,
  border,
  fg,
  font,
  radius,
  shadow,
  space,
  transition,
} from "./tokens";

// ---------------------------------------------------------------------------
// Scoped hover styles
// ---------------------------------------------------------------------------

const SAMPLER_STYLES = `
  .cs-icon-btn:hover { background-color: var(--color-background-raisedHover) !important; }
  .cs-tree-row:hover { background-color: var(--color-background-raisedHover) !important; }
  .cs-link:hover { text-decoration: underline; }
`;

// ---------------------------------------------------------------------------
// Section wrapper — provides consistent spacing and optional title
// ---------------------------------------------------------------------------

const Section: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: space.md }}>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Tree View
// ---------------------------------------------------------------------------

interface TreeNode {
  children?: TreeNode[];
  icon: React.FC<{ size?: number; style?: React.CSSProperties }>;
  label: string;
}

const TREE_DATA: TreeNode[] = [
  {
    children: [
      {
        children: [
          { icon: Image, label: "Image" },
          { icon: Image, label: "Image" },
        ],
        icon: Grid3X3,
        label: "Grid",
      },
      { icon: Type, label: "Text" },
    ],
    icon: Square,
    label: "Box",
  },
];

const TreeRow: React.FC<{ node: TreeNode; depth?: number }> = ({
  node,
  depth = 0,
}) => {
  const [open, setOpen] = useState(true);
  const Icon = node.icon;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        className="cs-tree-row"
        onClick={() => hasChildren && setOpen(!open)}
        style={{
          alignItems: "center",
          background: "none",
          border: "none",
          borderRadius: radius.badge,
          color: fg.onBase,
          cursor: hasChildren ? "pointer" : "default",
          display: "flex",
          fontFamily: "inherit",
          fontSize: "12px",
          gap: "6px",
          paddingBottom: "5px",
          paddingLeft: `${12 + depth * 16}px`,
          paddingRight: "12px",
          paddingTop: "5px",
          transition: transition.interactive,
          width: "100%",
        }}
        type="button"
      >
        {hasChildren && (
          <ChevronDown
            size={10}
            style={{
              color: fg.onBaseFaint,
              flexShrink: 0,
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: transition.interactive,
            }}
          />
        )}
        {!hasChildren && <span style={{ width: "10px" }} />}
        <Icon size={13} style={{ color: fg.onBaseMuted, flexShrink: 0 }} />
        <span>{node.label}</span>
      </button>
      {hasChildren &&
        open &&
        node.children?.map((child, i) => (
          <TreeRow depth={depth + 1} key={`${child.label}-${i}`} node={child} />
        ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Icon Button
// ---------------------------------------------------------------------------

const IconButton: React.FC<{
  icon: React.FC<{ size?: number }>;
  label: string;
  active?: boolean;
}> = ({ icon: Icon, label, active }) => (
  <button
    aria-label={label}
    className="cs-icon-btn"
    style={{
      alignItems: "center",
      backgroundColor: active ? bg.primarySubtle : "transparent",
      border: "none",
      borderRadius: radius.action,
      color: active ? fg.primary : fg.onBaseMuted,
      cursor: "pointer",
      display: "flex",
      height: "30px",
      justifyContent: "center",
      padding: 0,
      transition: transition.interactive,
      width: "30px",
    }}
    type="button"
  >
    <Icon size={14} />
  </button>
);

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

const Toolbar: React.FC = () => (
  <Card
    style={{
      alignItems: "center",
      display: "flex",
      flexWrap: "wrap",
      gap: "2px",
      padding: `${space.sm} ${space.lg}`,
    }}
  >
    <IconButton icon={Plus} label="Add" />
    <IconButton icon={Grid3X3} label="Grid" />
    <IconButton icon={Square} label="Frame" />
    <Divider />
    <IconButton active icon={Type} label="Text" />
    <IconButton icon={Bold} label="Bold" />
    <IconButton icon={Italic} label="Italic" />
    <IconButton icon={Strikethrough} label="Strikethrough" />
    <Divider />
    <IconButton icon={AlignLeft} label="Align left" />
    <IconButton icon={AlignCenter} label="Align center" />
    <IconButton icon={AlignRight} label="Align right" />
    <div style={{ marginLeft: "auto" }}>
      <Button size="sm" variant="outline">
        Actions <ChevronDown size={10} />
      </Button>
    </div>
  </Card>
);

const Divider: React.FC = () => (
  <div
    style={{
      backgroundColor: border.neutral,
      flexShrink: 0,
      height: "18px",
      margin: "0 4px",
      width: "1px",
    }}
  />
);

// ---------------------------------------------------------------------------
// User Card
// ---------------------------------------------------------------------------

const UserCard: React.FC<{
  name: string;
  email: string;
  colorIndex: number;
}> = ({ name, email, colorIndex }) => (
  <Card style={{ alignItems: "center", display: "flex", gap: space.md }}>
    <Avatar
      colorIndex={colorIndex}
      initials={name
        .split(" ")
        .map((w) => w[0])
        .join("")}
      size="lg"
    />
    <div>
      <div style={{ color: fg.onBase, fontSize: "13px", fontWeight: 600 }}>
        {name}
      </div>
      <div
        style={{ color: fg.onBaseMuted, fontSize: "11px", marginTop: "2px" }}
      >
        {email}
      </div>
    </div>
  </Card>
);

// ---------------------------------------------------------------------------
// Sign Up Form
// ---------------------------------------------------------------------------

const SignUpForm: React.FC = () => (
  <Card>
    <h3
      style={{
        color: fg.onBase,
        fontFamily: font.secondary,
        fontSize: "20px",
        fontWeight: "var(--font-heading-weight)" as unknown as number,
        margin: 0,
        marginBottom: space.lg,
        textAlign: "center",
      }}
    >
      Sign up
    </h3>
    <div style={{ display: "flex", flexDirection: "column", gap: space.md }}>
      <Input label="Full name" placeholder="Enter your name" size="sm" />
      <Input
        label="Email"
        placeholder="Enter your email address"
        size="sm"
        type="email"
      />
      <Input
        label="Password"
        placeholder="Enter your password"
        size="sm"
        type="password"
      />
      <Button
        size="sm"
        style={{ marginTop: "4px", width: "100%" }}
        variant="primary"
      >
        Create account
      </Button>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: space.md,
        }}
      >
        <div
          style={{ backgroundColor: border.neutral, flex: 1, height: "1px" }}
        />
        <span
          style={{
            color: fg.onBaseFaint,
            fontSize: "10px",
            fontWeight: 500,
            textTransform: "uppercase",
          }}
        >
          Or
        </span>
        <div
          style={{ backgroundColor: border.neutral, flex: 1, height: "1px" }}
        />
      </div>
      <Button size="sm" style={{ width: "100%" }} variant="outline">
        <svg
          aria-hidden="true"
          fill="currentColor"
          height="13"
          viewBox="0 0 24 24"
          width="13"
        >
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
        Continue with GitHub
      </Button>
    </div>
  </Card>
);

// ---------------------------------------------------------------------------
// Avatar Group
// ---------------------------------------------------------------------------

const AvatarGroup: React.FC = () => {
  const people = [
    { colorIndex: 0, initials: "SK" },
    { colorIndex: 1, initials: "JD" },
    { colorIndex: 2, initials: "V" },
    { colorIndex: 3, initials: "BG" },
  ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: space.md }}>
      {people.map((p, i) => (
        <Avatar
          colorIndex={p.colorIndex}
          initials={p.initials}
          key={i}
          size="lg"
        />
      ))}
      <div
        style={{
          alignItems: "center",
          backgroundColor: bg.raisedHover,
          borderRadius: radius.action,
          color: fg.onBaseMuted,
          display: "flex",
          height: "40px",
          justifyContent: "center",
          transition: transition.theme,
          width: "40px",
        }}
      >
        <Users size={15} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Rich Text
// ---------------------------------------------------------------------------

const _RichTextBlock: React.FC = () => (
  <Card>
    <p
      style={{
        color: fg.onBase,
        fontFamily: font.primary,
        fontSize: "12px",
        lineHeight: 1.65,
        margin: 0,
      }}
    >
      Susan Kare is an American{" "}
      <span
        className="cs-link"
        style={{ color: fg.primary, cursor: "pointer", fontWeight: 600 }}
      >
        graphic designer
      </span>{" "}
      and artist, who contributed{" "}
      <span
        className="cs-link"
        style={{ color: fg.primary, cursor: "pointer", fontWeight: 600 }}
      >
        interface
      </span>{" "}
      elements and{" "}
      <span
        className="cs-link"
        style={{ color: fg.primary, cursor: "pointer", fontWeight: 600 }}
      >
        typefaces
      </span>{" "}
      for the first Apple Macintosh personal computer from 1983 to 1986.
    </p>
  </Card>
);

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------

const ChecklistBlock: React.FC<{
  items: { text: React.ReactNode; checked: boolean }[];
  onToggle: (idx: number) => void;
}> = ({ items, onToggle }) => (
  <Card>
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {items.map((item, i) => (
        <Checkbox
          checked={item.checked}
          key={i}
          label={item.text}
          onChange={() => onToggle(i)}
        />
      ))}
    </div>
  </Card>
);

// ---------------------------------------------------------------------------
// Balance Card
// ---------------------------------------------------------------------------

const BalanceCard: React.FC = () => {
  const rows = [
    { label: "Pending", value: "$1,240.50" },
    { label: "Processing", value: "$320.00" },
    { label: "Available", value: "$8,410.12" },
  ];
  return (
    <Card>
      <div
        style={{
          color: fg.onBaseMuted,
          fontSize: "11px",
          fontWeight: 500,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        Current Balance
      </div>
      <div
        style={{
          color: fg.onBase,
          fontFamily: font.secondary,
          fontSize: "28px",
          fontWeight: "var(--font-heading-weight)" as unknown as number,
          letterSpacing: "-0.02em",
          marginBottom: space.md,
          marginTop: "4px",
        }}
      >
        $9,970.62
      </div>
      <div
        style={{
          borderTop: `1px solid ${border.neutral}`,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          paddingTop: space.md,
        }}
      >
        {rows.map((r) => (
          <div
            key={r.label}
            style={{
              display: "flex",
              fontSize: "12px",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: fg.onBaseMuted }}>{r.label}</span>
            <span style={{ color: fg.onBase, fontWeight: 600 }}>{r.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Transaction List
// ---------------------------------------------------------------------------

interface Transaction {
  amount: number;
  date: string;
  icon: React.FC<{ size?: number }>;
  merchant: string;
  tint: string;
}

const TRANSACTIONS: Transaction[] = [
  {
    amount: -6.5,
    date: "Today, 08:42",
    icon: Coffee,
    merchant: "Blue Bottle Coffee",
    tint: bg.warningSubtle,
  },
  {
    amount: 2450.0,
    date: "Yesterday",
    icon: Wallet,
    merchant: "Acme Payroll",
    tint: bg.successSubtle,
  },
  {
    amount: -42.8,
    date: "Mar 12",
    icon: Music,
    merchant: "Vinyl Records Co.",
    tint: bg.accentSubtle,
  },
  {
    amount: -28.15,
    date: "Mar 10",
    icon: ShoppingBag,
    merchant: "Daily Provisions",
    tint: bg.infoSubtle,
  },
];

const TransactionList: React.FC = () => (
  <Card style={{ padding: 0 }}>
    <div
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "space-between",
        padding: `${space.lg} ${space.lg} ${space.md}`,
      }}
    >
      <div style={{ color: fg.onBase, fontSize: "13px", fontWeight: 600 }}>
        Recent Transactions
      </div>
      <span
        className="cs-link"
        style={{
          color: fg.primary,
          cursor: "pointer",
          fontSize: "11px",
          fontWeight: 600,
        }}
      >
        View all
      </span>
    </div>
    <div style={{ display: "flex", flexDirection: "column" }}>
      {TRANSACTIONS.map((tx, i) => {
        const Icon = tx.icon;
        const positive = tx.amount > 0;
        return (
          <div
            key={i}
            style={{
              alignItems: "center",
              borderTop: `1px solid ${border.neutral}`,
              display: "flex",
              gap: "10px",
              padding: `10px ${space.lg}`,
            }}
          >
            <div
              style={{
                alignItems: "center",
                backgroundColor: tx.tint,
                borderRadius: radius.action,
                color: fg.onBase,
                display: "flex",
                flexShrink: 0,
                height: "30px",
                justifyContent: "center",
                width: "30px",
              }}
            >
              <Icon size={14} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: fg.onBase,
                  fontSize: "12px",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {tx.merchant}
              </div>
              <div
                style={{
                  color: fg.onBaseMuted,
                  fontSize: "11px",
                  marginTop: "2px",
                }}
              >
                {tx.date}
              </div>
            </div>
            <div
              style={{
                alignItems: "center",
                color: positive ? fg.success : fg.critical,
                display: "flex",
                flexShrink: 0,
                fontSize: "12px",
                fontWeight: 600,
                gap: "2px",
              }}
            >
              {positive ? (
                <ArrowUpRight size={12} />
              ) : (
                <ArrowDownRight size={12} />
              )}
              {positive ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  </Card>
);

// ---------------------------------------------------------------------------
// Navigation List
// ---------------------------------------------------------------------------

interface NavItem {
  badge?: string;
  icon: React.FC<{ size?: number }>;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { badge: "12", icon: CreditCard, label: "Transactions" },
  { icon: Wallet, label: "Accounts" },
  { badge: "3", icon: Bell, label: "Notifications" },
  { icon: Settings, label: "Settings" },
];

const NavList: React.FC = () => {
  const [active, setActive] = useState("Dashboard");
  return (
    <Card style={{ padding: `${space.sm} 0` }}>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.label;
        return (
          <button
            className="cs-tree-row"
            key={item.label}
            onClick={() => setActive(item.label)}
            style={{
              alignItems: "center",
              background: isActive ? bg.primarySubtle : "none",
              border: "none",
              color: isActive ? fg.primary : fg.onBase,
              cursor: "pointer",
              display: "flex",
              fontFamily: "inherit",
              fontSize: "12px",
              fontWeight: isActive ? 600 : 500,
              gap: "10px",
              padding: `8px ${space.lg}`,
              textAlign: "left",
              transition: transition.interactive,
              width: "100%",
            }}
            type="button"
          >
            <Icon size={14} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span
                style={{
                  backgroundColor: isActive ? bg.primary : bg.raisedHover,
                  borderRadius: radius.badge,
                  color: isActive ? fg.onPrimary : fg.onBaseMuted,
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "2px 6px",
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Donut Stat Card
// ---------------------------------------------------------------------------

const DonutStatCard: React.FC = () => {
  const progress = 0.68;
  const size = 96;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Card>
      <div style={{ alignItems: "center", display: "flex", gap: space.md }}>
        <div
          style={{
            flexShrink: 0,
            height: size,
            position: "relative",
            width: size,
          }}
        >
          <svg height={size} width={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              fill="none"
              r={r}
              stroke={border.neutral}
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              fill="none"
              r={r}
              stroke={fg.primary}
              strokeDasharray={c}
              strokeDashoffset={c * (1 - progress)}
              strokeLinecap="round"
              strokeWidth={stroke}
              style={{ transition: transition.chart }}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </svg>
          <div
            style={{
              alignItems: "center",
              color: fg.onBase,
              display: "flex",
              fontFamily: font.secondary,
              fontSize: "14px",
              fontWeight: "var(--font-heading-weight)" as unknown as number,
              inset: 0,
              justifyContent: "center",
              position: "absolute",
            }}
          >
            {Math.round(progress * 100)}%
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: fg.onBaseMuted,
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Monthly Goal
          </div>
          <div
            style={{
              color: fg.onBase,
              fontFamily: font.secondary,
              fontSize: "22px",
              fontWeight: "var(--font-heading-weight)" as unknown as number,
              letterSpacing: "-0.02em",
              margin: "4px 0",
            }}
          >
            $24,000
          </div>
          <div
            style={{
              alignItems: "center",
              color: fg.success,
              display: "flex",
              fontSize: "11px",
              fontWeight: 600,
              gap: "2px",
            }}
          >
            <ArrowUpRight size={11} /> +12.4% vs last month
          </div>
        </div>
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Horizontal Bar Chart
// ---------------------------------------------------------------------------

const BarChartCard: React.FC = () => {
  const data = [
    { label: "Initech", value: 3842 },
    { label: "Hooli", value: 2540 },
    { label: "Vandelay", value: 1910 },
    { label: "Soylent", value: 860 },
  ];
  const max = Math.max(...data.map((d) => d.value));
  return (
    <Card>
      <div
        style={{
          alignItems: "baseline",
          display: "flex",
          justifyContent: "space-between",
          marginBottom: space.md,
        }}
      >
        <div style={{ color: fg.onBase, fontSize: "13px", fontWeight: 600 }}>
          Q2 Income
        </div>
        <div style={{ color: fg.onBaseMuted, fontSize: "11px" }}>By client</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {data.map((d) => (
          <div
            key={d.label}
            style={{ display: "flex", flexDirection: "column", gap: "4px" }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "11px",
                justifyContent: "space-between",
              }}
            >
              <span style={{ color: fg.onBaseMuted }}>{d.label}</span>
              <span style={{ color: fg.onBase, fontWeight: 600 }}>
                ${d.value.toLocaleString()}
              </span>
            </div>
            <div
              style={{
                backgroundColor: bg.sunkenStrong,
                borderRadius: radius.badge,
                height: "6px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: bg.primary,
                  height: "100%",
                  transition: transition.chart,
                  width: `${(d.value / max) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Empty-state CTA Card
// ---------------------------------------------------------------------------

const EmptyStateCard: React.FC<{
  icon: React.FC<{ size?: number }>;
  title: string;
  description: string;
  buttonLabel: string;
  variant?: "primary" | "critical";
}> = ({ icon: Icon, title, description, buttonLabel, variant = "primary" }) => (
  <Card style={{ padding: `${space.lg} ${space.lg}`, textAlign: "center" }}>
    <div
      style={{
        alignItems: "center",
        backgroundColor: variant === "primary" ? bg.sunken : bg.criticalSubtle,
        borderRadius: "999px",
        color: variant === "primary" ? fg.onSunken : fg.onCriticalSubtle,
        display: "flex",
        height: "40px",
        justifyContent: "center",
        margin: "0 auto",
        width: "40px",
      }}
    >
      <Icon size={18} />
    </div>
    <div
      style={{
        color: fg.onBase,
        fontSize: "14px",
        fontWeight: 600,
        marginTop: space.md,
      }}
    >
      {title}
    </div>
    <div
      style={{
        color: fg.onBaseMuted,
        fontSize: "12px",
        lineHeight: 1.5,
        marginLeft: "auto",
        marginRight: "auto",
        marginTop: "6px",
        maxWidth: "260px",
      }}
    >
      {description}
    </div>
    <Button
      size="sm"
      style={{ marginTop: space.md }}
      variant={variant === "primary" ? "primary" : "critical"}
    >
      {buttonLabel}
    </Button>
  </Card>
);

// ---------------------------------------------------------------------------
// QR Connect Card
// ---------------------------------------------------------------------------

const QRCodeArt: React.FC<{ size?: number }> = ({ size = 140 }) => (
  <img
    alt=""
    aria-hidden="true"
    height={size}
    src={qrcodePng.src}
    style={{ display: "block" }}
    width={size}
  />
);

const QRConnectCard: React.FC = () => (
  <Card style={{ textAlign: "center" }}>
    <div
      style={{
        backgroundColor: bg.base,
        border: `1px solid ${border.neutral}`,
        borderRadius: radius.sub,
        display: "inline-block",
        padding: space.md,
      }}
    >
      <QRCodeArt size={140} />
    </div>
    <div
      style={{
        color: fg.onBase,
        fontSize: "14px",
        fontWeight: 600,
        marginTop: space.md,
      }}
    >
      Scan to pair this device
    </div>
    <div
      style={{
        color: fg.onBaseMuted,
        fontSize: "12px",
        lineHeight: 1.5,
        marginLeft: "auto",
        marginRight: "auto",
        marginTop: "6px",
        maxWidth: "260px",
      }}
    >
      Open the mobile app and scan this code to link your account.
    </div>
    <Button
      size="sm"
      style={{ marginTop: space.md, width: "100%" }}
      variant="outline"
    >
      Got it
    </Button>
  </Card>
);

// ---------------------------------------------------------------------------
// Social Links Form
// ---------------------------------------------------------------------------

const SocialLinksForm: React.FC = () => (
  <Card>
    <div
      style={{
        color: fg.onBase,
        fontSize: "14px",
        fontWeight: 700,
        marginBottom: space.md,
      }}
    >
      Social Links
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: space.md }}>
      <Input
        defaultValue="spotify.com/artist/3j…2k"
        icon={Music2}
        label="Spotify Artist URL"
        placeholder="spotify.com/artist/…"
        size="sm"
      />
      <Input
        defaultValue="@julianduryea_music"
        icon={AtSign}
        label="Instagram Handle"
        placeholder="@handle"
        size="sm"
      />
      <Input
        icon={Cloud}
        label="SoundCloud URL"
        placeholder="soundcloud.com/username"
        size="sm"
      />
      <Input
        icon={Globe}
        label="Website"
        placeholder="https://yoursite.com"
        size="sm"
      />
    </div>
    <div
      style={{
        display: "flex",
        gap: "8px",
        justifyContent: "flex-end",
        marginTop: space.lg,
      }}
    >
      <Button size="sm" variant="outline">
        Discard
      </Button>
      <Button size="sm" variant="primary">
        Save Changes
      </Button>
    </div>
  </Card>
);

// ---------------------------------------------------------------------------
// Notifications Preferences
// ---------------------------------------------------------------------------

interface NotifOption {
  description: string;
  key: string;
  label: string;
}

const NOTIF_OPTIONS: NotifOption[] = [
  {
    description: "Deposits, withdrawals, and transfers.",
    key: "transactions",
    label: "Transaction alerts",
  },
  {
    description: "Login attempts and account changes.",
    key: "security",
    label: "Security alerts",
  },
  {
    description: "Updates at 25%, 50%, 75%, and 100%.",
    key: "goals",
    label: "Goal milestones",
  },
  {
    description: "Daily portfolio summary and price alerts.",
    key: "market",
    label: "Market updates",
  },
];

const PrefCheckbox: React.FC<{ checked: boolean; onChange: () => void }> = ({
  checked,
  onChange,
}) => (
  <button
    aria-checked={checked}
    onClick={onChange}
    role="checkbox"
    style={{
      alignItems: "center",
      backgroundColor: checked ? bg.primary : "transparent",
      border: checked ? "none" : `1.5px solid ${border.strong}`,
      borderRadius: radius.badge,
      cursor: "pointer",
      display: "flex",
      flexShrink: 0,
      height: "16px",
      justifyContent: "center",
      marginTop: "1px",
      padding: 0,
      transition: transition.interactive,
      width: "16px",
    }}
    type="button"
  >
    {checked && (
      <svg
        fill="none"
        height="10"
        stroke={fg.onPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
        viewBox="0 0 24 24"
        width="10"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )}
  </button>
);

const NotificationsCard: React.FC = () => {
  const [selected, setSelected] = useState<Record<string, boolean>>({
    goals: true,
    market: false,
    security: true,
    transactions: true,
  });
  const allOn = NOTIF_OPTIONS.every((o) => selected[o.key]);

  const toggle = (key: string) =>
    setSelected((p) => ({ ...p, [key]: !p[key] }));
  const toggleAll = () => {
    const next = !allOn;
    setSelected(Object.fromEntries(NOTIF_OPTIONS.map((o) => [o.key, next])));
  };

  return (
    <Card>
      <div style={{ color: fg.onBase, fontSize: "14px", fontWeight: 700 }}>
        Notifications
      </div>
      <div
        style={{
          color: fg.onBaseMuted,
          fontSize: "12px",
          marginBottom: space.lg,
          marginTop: "4px",
        }}
      >
        Choose what you want to be notified about.
      </div>

      <div style={{ alignItems: "center", display: "flex", gap: "8px" }}>
        <PrefCheckbox checked={allOn} onChange={toggleAll} />
        <span style={{ color: fg.onBase, fontSize: "12px", fontWeight: 600 }}>
          Select all
        </span>
      </div>

      <div
        style={{
          borderLeft: `1px solid ${border.neutral}`,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginLeft: "7px",
          marginTop: "12px",
          paddingBottom: "4px",
          paddingLeft: space.md,
          paddingTop: "4px",
        }}
      >
        {NOTIF_OPTIONS.map((opt) => (
          <div
            key={opt.key}
            style={{ alignItems: "flex-start", display: "flex", gap: "8px" }}
          >
            <PrefCheckbox
              checked={!!selected[opt.key]}
              onChange={() => toggle(opt.key)}
            />
            <div>
              <div
                style={{ color: fg.onBase, fontSize: "12px", fontWeight: 600 }}
              >
                {opt.label}
              </div>
              <div
                style={{
                  color: fg.onBaseMuted,
                  fontSize: "11px",
                  lineHeight: 1.4,
                  marginTop: "2px",
                }}
              >
                {opt.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        size="sm"
        style={{ marginTop: space.lg, width: "100%" }}
        variant="primary"
      >
        Save Preferences
      </Button>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Tabbed FAQ Card
// ---------------------------------------------------------------------------

interface FAQItem {
  answer: string;
  question: string;
}

const FAQ_TABS: Record<string, FAQItem[]> = {
  Billing: [
    {
      answer: "You are billed monthly on the day you upgraded.",
      question: "How does billing work?",
    },
    {
      answer:
        "Yes, you can change or cancel at any time from Settings → Billing.",
      question: "Can I change plans later?",
    },
  ],
  General: [
    {
      answer:
        "We use bank-level AES-256 encryption, SOC 2 Type II certified infrastructure, and never store your credentials. All connections use read-only access tokens. We are a SEC registered investment advisor.",
      question: "How secure is my financial data with Ledger?",
    },
    {
      answer:
        "Use the Connect button on the accounts page and follow the prompts.",
      question: "How do I connect my bank or investment accounts?",
    },
    {
      answer: "Yes — CSV and PDF exports are available from the Reports tab.",
      question: "Can I export my data for tax purposes?",
    },
  ],
  Goals: [
    {
      answer: "Goals update in real time as transactions clear.",
      question: "How are goals tracked?",
    },
  ],
};

const FAQCard: React.FC = () => {
  const tabs = Object.keys(FAQ_TABS);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [openIndex, setOpenIndex] = useState(0);
  const items = FAQ_TABS[activeTab];

  return (
    <div
      style={{
        backgroundColor: bg.base,
        border: `1px solid ${border.neutral}`,
        borderRadius: radius.container,
        padding: space.md,
        transition: transition.theme,
      }}
    >
      <div
        style={{
          backgroundColor: bg.sunken,
          borderRadius: radius.field,
          display: "flex",
          gap: "4px",
          marginBottom: space.md,
          padding: "4px",
        }}
      >
        {tabs.map((t) => {
          const active = t === activeTab;
          return (
            <button
              key={t}
              onClick={() => {
                setActiveTab(t);
                setOpenIndex(0);
              }}
              style={{
                background: active ? bg.raised : "transparent",
                border: "none",
                borderRadius: radius.field,
                boxShadow: active ? shadow.raised : "none",
                color: active ? fg.onBase : fg.onBaseMuted,
                cursor: "pointer",
                flex: 1,
                fontFamily: "inherit",
                fontSize: "12px",
                fontWeight: active ? 600 : 500,
                padding: `${space.sm} ${space.lg}`,
                transition: transition.interactive,
              }}
              type="button"
            >
              {t}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {items.map((item, i) => {
          const open = openIndex === i;
          return (
            <div
              key={item.question}
              style={{
                backgroundColor: bg.raised,
                border: `1px solid ${border.neutral}`,
                borderRadius: radius.sub,
                overflow: "hidden",
                transition: transition.theme,
              }}
            >
              <button
                onClick={() => setOpenIndex(open ? -1 : i)}
                style={{
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  color: fg.onBase,
                  cursor: "pointer",
                  display: "flex",
                  fontFamily: "inherit",
                  fontSize: "12px",
                  fontWeight: 600,
                  gap: space.md,
                  justifyContent: "space-between",
                  padding: `10px ${space.lg}`,
                  textAlign: "left",
                  width: "100%",
                }}
                type="button"
              >
                <span>{item.question}</span>
                {open ? (
                  <ChevronUp
                    size={14}
                    style={{ color: fg.onBaseMuted, flexShrink: 0 }}
                  />
                ) : (
                  <ChevronDown
                    size={14}
                    style={{ color: fg.onBaseMuted, flexShrink: 0 }}
                  />
                )}
              </button>
              {open && (
                <div
                  style={{
                    color: fg.onBaseMuted,
                    fontSize: "12px",
                    lineHeight: 1.6,
                    padding: `0 ${space.lg} ${space.lg}`,
                  }}
                >
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button
        size="sm"
        style={{
          borderRadius: radius.field,
          marginTop: space.md,
          width: "100%",
        }}
        variant="outline"
      >
        Contact Support
      </Button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Composed Preview
// ---------------------------------------------------------------------------

const PreviewComponents: React.FC = () => {
  const [toggleA, setToggleA] = useState(false);
  const [toggleB, setToggleB] = useState(true);
  const [checks, setChecks] = useState([
    {
      checked: false,
      text: (
        <span>
          Respond to comment{" "}
          <span
            className="cs-link"
            style={{ color: fg.primary, cursor: "pointer", fontWeight: 600 }}
          >
            #384
          </span>{" "}
          from Travis
        </span>
      ),
    },
    {
      checked: false,
      text: (
        <span>
          Invite{" "}
          <span
            className="cs-link"
            style={{ color: fg.primary, cursor: "pointer", fontWeight: 600 }}
          >
            Acme Co.
          </span>{" "}
          team to Slack
        </span>
      ),
    },
    {
      checked: false,
      text: (
        <span>
          Create a report{" "}
          <span
            className="cs-link"
            style={{ color: fg.primary, cursor: "pointer", fontWeight: 600 }}
          >
            requested
          </span>{" "}
          by Danilo
        </span>
      ),
    },
    { checked: true, text: "Close Q2 finances" },
    { checked: true, text: "Review invoice #3456" },
  ]);

  const handleToggleCheck = (idx: number) => {
    setChecks((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, checked: !c.checked } : c))
    );
  };

  return (
    <>
      <style>{SAMPLER_STYLES}</style>
      <div
        style={{
          backgroundColor: bg.base,
          color: fg.onBase,
          fontFamily: font.primary,
          height: "100%",
          overflow: "auto",
          transition: transition.theme,
        }}
      >
        <div
          style={{
            alignContent: "start",
            display: "grid",
            gap: 32,
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
            minHeight: "100%",
            padding: space.lg,
          }}
        >
          {/* ── Column 1: Inputs, tree, badges, toggles, user cards ── */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: space.md }}
          >
            {/* Search + Button */}
            <Section>
              <div
                style={{
                  alignItems: "flex-end",
                  display: "flex",
                  gap: space.md,
                }}
              >
                <div style={{ flex: 1 }}>
                  <Input
                    aria-label="Search"
                    icon={Search}
                    placeholder="Search"
                    size="sm"
                  />
                </div>
                <Button size="sm" variant="primary">
                  Submit
                </Button>
              </div>
            </Section>

            {/* Alert */}
            <Alert variant="info">Please upgrade to the new version.</Alert>

            {/* Tree View */}
            <Card style={{ padding: `${space.sm} 0` }}>
              {TREE_DATA.map((node, i) => (
                <TreeRow key={i} node={node} />
              ))}
            </Card>

            {/* Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: space.md }}>
              <Badge variant="primary">Fully-featured</Badge>
              <Badge variant="default">Built with Sora Lattice</Badge>
              <Badge variant="success">Open source</Badge>
              <Badge variant="warning">Beta</Badge>
              <Badge variant="critical">Critical</Badge>
            </div>

            {/* Icon Buttons + Toggles */}
            <Card
              style={{
                alignItems: "center",
                display: "flex",
                flexWrap: "wrap",
                gap: "4px",
                padding: `${space.sm} ${space.lg}`,
              }}
            >
              <IconButton
                icon={() => (
                  <svg
                    fill="none"
                    height="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="14"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )}
                label="Star"
              />
              <IconButton
                icon={() => (
                  <svg
                    fill="none"
                    height="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="14"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                )}
                label="Bookmark"
              />
              <IconButton
                icon={() => (
                  <svg
                    fill="none"
                    height="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="14"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                )}
                label="Settings"
              />
              <IconButton
                icon={() => (
                  <svg
                    fill="none"
                    height="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="14"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                )}
                label="Favorite"
              />
              <IconButton
                icon={() => (
                  <svg
                    fill="none"
                    height="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="14"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" x2="12" y1="2" y2="15" />
                  </svg>
                )}
                label="Share"
              />
              <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                <Toggle checked={toggleA} onChange={setToggleA} />
                <Toggle checked={toggleB} onChange={setToggleB} />
              </div>
            </Card>

            {/* Avatar Group */}
            <Card>
              <AvatarGroup />
            </Card>

            {/* User Cards */}
            <UserCard
              colorIndex={0}
              email="emily.adams@example.com"
              name="Emily Adams"
            />

            {/* Empty-state CTA */}
            <EmptyStateCard
              buttonLabel="Create Release"
              description="Upload your first master to start reaching listeners on Spotify, Apple Music, and more."
              icon={Upload}
              title="Distribute Track"
              variant="critical"
            />

            {/* Social Links form */}
            <SocialLinksForm />

            {/* Bar Chart */}
            <BarChartCard />
          </div>

          {/* ── Column 2: Balance, Toolbar, Transactions, FAQ, Sign-up ── */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: space.md }}
          >
            <BalanceCard />
            <Toolbar />
            <TransactionList />
            <FAQCard />
            <SignUpForm />
          </div>

          {/* ── Column 3: Stat, nav, avatars, rich text, checklist ── */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: space.md }}
          >
            {/* Donut Stat */}
            <DonutStatCard />

            {/* Checklist */}
            <ChecklistBlock items={checks} onToggle={handleToggleCheck} />

            {/* Navigation */}
            <NavList />

            {/* QR pairing */}
            <QRConnectCard />

            {/* Invite teammates CTA */}
            <EmptyStateCard
              buttonLabel="Send invites"
              description="Collaborate on releases with up to five teammates on the Pro plan."
              icon={UserPlus}
              title="Invite your team"
            />

            {/* Notifications preferences */}
            <NotificationsCard />
          </div>
        </div>
      </div>
    </>
  );
};

export default PreviewComponents;
