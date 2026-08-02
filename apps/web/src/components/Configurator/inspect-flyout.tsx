import type { PrimitiveMapping } from "@soralabsoss/generator";
import { AnimatePresence } from "framer-motion";
import {
  Box,
  Circle,
  Clock,
  Palette,
  Pencil,
  Sparkles,
  Type,
} from "lucide-react";
import type React from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { InspectTokenEditor } from "./inspect-token-editor";
import {
  CATEGORY_LABELS,
  getEditLabel,
  isEditableToken,
  type TokenCategory,
  type TokenInfo,
} from "./inspect-utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FLYOUT_W = 300;
const FLYOUT_MAX_H = 320;
const MARGIN = 12;
const GAP = 8;
/** Invisible hit-area padding so the cursor can easily reach the flyout */
const SAFE_ZONE = 12;

const CATEGORY_ICONS: Partial<
  Record<TokenCategory, React.FC<{ size: number }>>
> = {
  color: Palette,
  gradient: Sparkles,
  radius: Circle,
  shadow: Box,
  spacing: Box,
  transition: Clock,
  typography: Type,
};

const CATEGORY_ORDER: TokenCategory[] = [
  "color",
  "gradient",
  "spacing",
  "radius",
  "shadow",
  "transition",
  "typography",
];

/** CSS easing for the flyout slide */
const SLIDE_EASE = "cubic-bezier(0.16, 1, 0.3, 1)"; // ease-out-expo
const SLIDE_DURATION = "0.8s";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface InspectFlyoutProps {
  /** Container element — used to seed the initial position at its centre */
  containerRef: React.RefObject<HTMLElement | null>;
  editingToken: string | null;
  isDarkMode: boolean;
  onCloseEditor: () => void;
  onEditToken: (tokenName: string) => void;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
  semanticMap: Record<string, PrimitiveMapping>;
  /** null when no element is highlighted — flyout holds its last position */
  targetRect: DOMRect | null;
  tokens: TokenInfo[];
  /** Whether the flyout content should be visible (opaque + interactive) */
  visible: boolean;
}

export const InspectFlyout: React.FC<InspectFlyoutProps> = ({
  visible,
  tokens,
  targetRect,
  containerRef,
  isDarkMode,
  semanticMap,
  editingToken,
  onEditToken,
  onCloseEditor,
  onMouseEnter,
  onMouseLeave,
}) => {
  const flyoutRef = useRef<HTMLDivElement>(null);
  // Seed at the centre of the dashboard container
  const [position, setPosition] = useState(() => {
    const el = containerRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      return {
        left: r.left + r.width / 2 - FLYOUT_W / 2,
        top: r.top + r.height / 2,
      };
    }
    return {
      left: window.innerWidth / 2 - FLYOUT_W / 2,
      top: window.innerHeight / 2,
    };
  });
  const [editAnchorRect, setEditAnchorRect] = useState<DOMRect | null>(null);

  // Group tokens by category
  const grouped = useMemo(() => {
    const map = new Map<TokenCategory, TokenInfo[]>();
    for (const t of tokens) {
      const list = map.get(t.category) || [];
      list.push(t);
      map.set(t.category, list);
    }
    return CATEGORY_ORDER.filter((cat) => map.has(cat)).map((cat) => ({
      category: cat,
      tokens: map.get(cat)!,
    }));
  }, [tokens]);

  // Reposition when target changes — skip when null so we hold last position
  useLayoutEffect(() => {
    if (!targetRect) {
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default: below-right of target
    let top = targetRect.bottom + GAP;
    let left = targetRect.left;

    // Flip vertically if not enough space below
    if (top + FLYOUT_MAX_H > vh - MARGIN) {
      top = targetRect.top - FLYOUT_MAX_H - GAP;
      if (top < MARGIN) {
        top = MARGIN;
      }
    }

    // Flip horizontally if not enough space to the right
    if (left + FLYOUT_W > vw - MARGIN) {
      left = vw - FLYOUT_W - MARGIN;
    }
    if (left < MARGIN) {
      left = MARGIN;
    }

    setPosition({ left, top });
  }, [targetRect]);

  return createPortal(
    <>
      {/* Invisible safe-zone wrapper — extends the flyout hit area so the
          cursor can travel from the highlighted element to the flyout without
          accidentally dismissing it.
          Uses plain CSS transitions for position so the element never resets
          to 0,0 — it simply holds its last position when invisible. */}
      <div
        className="fixed z-[9999] box-border"
        data-inspect-overlay
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          left: position.left - SAFE_ZONE,
          opacity: visible ? 1 : 0,
          padding: SAFE_ZONE,
          pointerEvents: visible ? "auto" : "none",
          top: position.top - SAFE_ZONE,
          transition: `top ${SLIDE_DURATION} ${SLIDE_EASE}, left ${SLIDE_DURATION} ${SLIDE_EASE}, opacity 0.18s ease`,
          width: FLYOUT_W + SAFE_ZONE * 2,
        }}
      >
        <div
          className="overflow-hidden rounded-xl border border-charcoal/10 bg-white shadow-xl"
          data-inspect-overlay
          onMouseDown={(e) => e.stopPropagation()}
          ref={flyoutRef}
          style={{
            maxHeight: FLYOUT_MAX_H,
            width: FLYOUT_W,
          }}
        >
          <div
            className="overflow-y-auto p-3"
            style={{ maxHeight: FLYOUT_MAX_H }}
          >
            {grouped.map(({ category, tokens: catTokens }) => {
              const Icon = CATEGORY_ICONS[category];
              return (
                <div className="mb-3 last:mb-0" key={category}>
                  {/* Category header */}
                  <div className="mb-1.5 flex items-center gap-1.5">
                    {Icon && <Icon size={10} />}
                    <span className="font-bold text-[10px] text-charcoal/50 uppercase tracking-wider">
                      {CATEGORY_LABELS[category]}
                    </span>
                  </div>

                  {/* Token rows */}
                  {catTokens.map((token) => (
                    <TokenRow
                      isDarkMode={isDarkMode}
                      isEditing={editingToken === token.tokenName}
                      key={token.tokenName}
                      onEdit={(anchorRect) => {
                        setEditAnchorRect(anchorRect);
                        onEditToken(token.tokenName);
                      }}
                      semanticMap={semanticMap}
                      token={token}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Token editor popover */}
      <AnimatePresence>
        {editingToken && editAnchorRect && (
          <InspectTokenEditor
            anchorRect={editAnchorRect}
            isDarkMode={isDarkMode}
            key={editingToken}
            onClose={onCloseEditor}
            onMouseEnter={onMouseEnter}
            semanticMap={semanticMap}
            tokenName={editingToken}
          />
        )}
      </AnimatePresence>
    </>,
    document.body
  );
};

// ---------------------------------------------------------------------------
// TokenRow
// ---------------------------------------------------------------------------

const CATEGORY_GLYPH: Record<TokenCategory, string> = {
  color: "C",
  gradient: "G",
  radius: "R",
  shadow: "H",
  spacing: "S",
  transition: "M",
  typography: "T",
};

const TOKEN_DISPLAY_REPLACERS: Array<[RegExp, string]> = [
  [/^color-(background|foreground|border|chart)-/, "$1/"],
  [/^color-/, ""],
  [/^spacing-/, ""],
  [/^space-/, ""],
  [/^dimension-/, "dim/"],
  [/^shape-radius-/, ""],
  [/^radius-/, ""],
  [/^font-family-/, ""],
  [/^shadow-/, ""],
  [/^transition-/, ""],
  [/^gradient-/, "gradient/"],
];

function formatTokenDisplayName(tokenName: string): string {
  let name = tokenName;
  for (const [pattern, replacement] of TOKEN_DISPLAY_REPLACERS) {
    name = name.replace(pattern, replacement);
  }
  return name;
}

const TokenRow: React.FC<{
  token: TokenInfo;
  isDarkMode: boolean;
  semanticMap: Record<string, PrimitiveMapping>;
  isEditing: boolean;
  onEdit: (anchorRect: DOMRect) => void;
}> = ({ token, isDarkMode, semanticMap, isEditing, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);
  const editBtnRef = useRef<HTMLButtonElement>(null);
  const editable = isEditableToken(token.tokenName, isDarkMode, semanticMap);
  const editLabel = getEditLabel(token.tokenName, isDarkMode, semanticMap);
  const displayName = formatTokenDisplayName(token.tokenName);
  const isColor = token.category === "color" || token.category === "gradient";

  return (
    <div
      className={`-mx-1.5 flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors ${
        isHovered ? "bg-charcoal/5" : ""
      } ${isEditing ? "bg-charcoal/8" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Swatch or indicator */}
      {isColor ? (
        <div
          className="h-4 w-4 shrink-0 rounded border border-charcoal/10"
          style={{ backgroundColor: token.resolvedValue }}
        />
      ) : (
        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-charcoal/5">
          <span className="text-[8px] text-charcoal/40">
            {CATEGORY_GLYPH[token.category]}
          </span>
        </div>
      )}

      {/* Token name + value */}
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-[11px] text-charcoal leading-tight">
          {displayName}
        </div>
        <div className="truncate font-mono text-[9px] text-charcoal/40 leading-tight">
          {token.resolvedValue}
          {editLabel && (
            <span className="ml-1 text-charcoal/30">({editLabel})</span>
          )}
        </div>
      </div>

      {/* Edit button — ramp colors + style override knobs */}
      {editable && (isHovered || isEditing) && (
        <button
          className={`shrink-0 cursor-pointer rounded p-1 transition-colors ${
            isEditing
              ? "bg-forest-green/10 text-forest-green"
              : "text-charcoal/50 hover:bg-charcoal/10"
          }`}
          onClick={() => {
            if (editBtnRef.current) {
              onEdit(editBtnRef.current.getBoundingClientRect());
            }
          }}
          ref={editBtnRef}
          type="button"
        >
          <Pencil size={10} />
        </button>
      )}
    </div>
  );
};
