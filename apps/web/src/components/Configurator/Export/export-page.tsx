import { Select as BaseSelect } from "@base-ui/react/select";
import {
  type BrandConfig,
  type ColorSpace,
  type ExportFormat,
  exportTokens,
  flattenSkillFiles,
  generateDesignTokens,
  generateSkills,
  initialConfig,
  type SkillArtifact,
  skillEntryMarkdown,
  type TokenSet,
} from "@soralabsoss/generator";
import { strToU8, zipSync } from "fflate";
import { ArrowLeft, Check, ChevronDown, Copy, Download } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { decodeBrandConfig, encodeBrandConfig } from "../../../lib/config-url";
import { siteImages } from "../../../lib/site-images";
import { Select } from "../../ui/select";
import { FileIcon, type FileIconKind } from "./file-icon";
import { highlight, type Lang } from "./highlight";

// ---------------------------------------------------------------------------
// Asset descriptors
// ---------------------------------------------------------------------------

type TokenAssetId = ExportFormat;
type SkillAssetId = `skill-${SkillArtifact["id"]}`;
type AssetId = TokenAssetId | SkillAssetId;

interface AssetDescriptor {
  description: string;
  filename: string;
  group: "tokens" | "skills";
  iconKind: FileIconKind;
  id: AssetId;
  lang: Lang;
  takesColorSpace: boolean;
  title: string;
}

const TOKEN_ASSETS: AssetDescriptor[] = [
  {
    description: "Custom properties for light & dark themes",
    filename: "tokens.css",
    group: "tokens",
    iconKind: "css",
    id: "css",
    lang: "css",
    takesColorSpace: true,
    title: "CSS variables",
  },
  {
    description: "Design Token Community Group format",
    filename: "tokens.json",
    group: "tokens",
    iconKind: "json",
    id: "dtcg",
    lang: "json",
    takesColorSpace: true,
    title: "DTCG tokens",
  },
  {
    description: "Tailwind v4 colors & semantic tokens",
    filename: "tailwind.config.js",
    group: "tokens",
    iconKind: "js",
    id: "tailwind",
    lang: "js",
    takesColorSpace: true,
    title: "Tailwind config",
  },
  {
    description: "Drop-in Tailwind v4 / shadcn theme CSS",
    filename: "shadcn.css",
    group: "tokens",
    iconKind: "css",
    id: "shadcn",
    lang: "css",
    takesColorSpace: true,
    title: "shadcn/ui",
  },
];

const COLOR_SPACE_OPTIONS = [
  { label: "oklch", value: "oklch" },
  { label: "hex", value: "hex" },
  { label: "rgb", value: "rgb" },
  { label: "hsl", value: "hsl" },
];

// ---------------------------------------------------------------------------
// Token-derived file-icon colors
// ---------------------------------------------------------------------------

// Each file kind maps to a semantic role from the generated token system, so
// the icons reflect whatever palette the user configured rather than fixed
// blues/ambers.
const ICON_TOKEN_BY_KIND: Record<FileIconKind, string> = {
  css: "--color-background-primary",
  js: "--color-background-accent",
  json: "--color-background-warning",
  md: "--color-background-success",
};

const VAR_REF = /^var\(\s*(--[\w-]+)\s*\)$/;

/** Follow `var(--x)` indirection in a token map until a literal color is reached. */
function resolveTokenValue(
  tokens: Record<string, string>,
  name: string
): string {
  let value = tokens[name];
  for (let i = 0; i < 8 && value; i++) {
    const m = value.match(VAR_REF);
    if (!m) {
      return value;
    }
    value = tokens[m[1]];
  }
  return value ?? "#888888";
}

/** Trigger a browser download for an in-memory blob via a synthetic anchor. */
function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  // Defer cleanup: revoking the URL or removing the anchor synchronously can
  // cancel the download before the browser has dereferenced the blob URL.
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 0);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ExportPage: React.FC = () => {
  // Read & decode the BrandConfig from the URL on mount; fall back to defaults.
  const [config, setConfig] = useState<BrandConfig>(initialConfig);
  const [decodeFailed, setDecodeFailed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("c");
    if (!raw) {
      return;
    }
    const decoded = decodeBrandConfig(raw);
    if (decoded) {
      setConfig(decoded);
    } else {
      setDecodeFailed(true);
    }
  }, []);

  // Recompute tokens when config changes (and load fonts to match the system).
  const tokenSet = useMemo<TokenSet>(
    () => ({
      dark: generateDesignTokens(config, true).tokens,
      light: generateDesignTokens(config, false).tokens,
    }),
    [config]
  );

  useEffect(() => {
    for (const family of [config.headingFont, config.primaryFont]) {
      if (!family) {
        continue;
      }
      const id = `export-font-${family.replace(/\s+/g, "+")}`;
      if (document.getElementById(id)) {
        continue;
      }
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, "+")}:wght@400;600;700&display=swap`;
      document.head.appendChild(link);
    }
  }, [config.headingFont, config.primaryFont]);

  const skills = useMemo(
    () => generateSkills(config, tokenSet),
    [config, tokenSet]
  );
  const skillAssets: AssetDescriptor[] = useMemo(
    () =>
      skills.map((s) => ({
        description: s.description,
        filename: `${s.rootDir}/SKILL.md`,
        group: "skills",
        iconKind: "md",
        id: `skill-${s.id}` as SkillAssetId,
        lang: "md",
        takesColorSpace: false,
        title: s.title,
      })),
    [skills]
  );

  const allAssets = useMemo(
    () => [...TOKEN_ASSETS, ...skillAssets],
    [skillAssets]
  );

  // Per-kind colors derived from the generated tokens. Resolved from the
  // light token set so the icons stay legible against the white preview card.
  const iconColors = useMemo<Record<FileIconKind, string>>(
    () => ({
      css: resolveTokenValue(tokenSet.light, ICON_TOKEN_BY_KIND.css),
      js: resolveTokenValue(tokenSet.light, ICON_TOKEN_BY_KIND.js),
      json: resolveTokenValue(tokenSet.light, ICON_TOKEN_BY_KIND.json),
      md: resolveTokenValue(tokenSet.light, ICON_TOKEN_BY_KIND.md),
    }),
    [tokenSet]
  );

  // Default selection: the canonical CSS export.
  const [selectedId, setSelectedId] = useState<AssetId>(TOKEN_ASSETS[0].id);
  const selectedAsset = useMemo(
    () => allAssets.find((a) => a.id === selectedId) ?? TOKEN_ASSETS[0],
    [allAssets, selectedId]
  );

  const [colorSpace, setColorSpace] = useState<ColorSpace>("oklch");
  const [copiedId, setCopiedId] = useState<AssetId | null>(null);

  const generateContent = useCallback(
    (asset: AssetDescriptor): string => {
      if (asset.group === "skills") {
        const skill = skills.find((s) => `skill-${s.id}` === asset.id);
        return skill ? skillEntryMarkdown(skill) : "";
      }
      return exportTokens(tokenSet, asset.id as ExportFormat, colorSpace, {
        includeSemantic: true,
      });
    },
    [skills, tokenSet, colorSpace]
  );

  const content = useMemo(
    () => generateContent(selectedAsset),
    [generateContent, selectedAsset]
  );
  const highlighted = useMemo(
    () => highlight(content, selectedAsset.lang),
    [content, selectedAsset.lang]
  );

  const handleCopy = useCallback(
    async (asset: AssetDescriptor) => {
      const text = generateContent(asset);
      await navigator.clipboard.writeText(text);
      setCopiedId(asset.id);
      setTimeout(
        () => setCopiedId((id) => (id === asset.id ? null : id)),
        2000
      );
    },
    [generateContent]
  );

  const handleDownload = useCallback(
    (asset: AssetDescriptor) => {
      if (asset.group === "skills") {
        const skill = skills.find((s) => `skill-${s.id}` === asset.id);
        if (!skill) {
          return;
        }
        const files: Record<string, Uint8Array> = {};
        for (const file of skill.files) {
          files[`${skill.rootDir}/${file.path}`] = strToU8(file.content);
        }
        const zipped = zipSync(files, { level: 6 });
        saveBlob(
          new Blob([zipped], { type: "application/zip" }),
          `${skill.name}.zip`
        );
        return;
      }
      const blob = new Blob([generateContent(asset)], {
        type: asset.lang === "json" ? "application/json" : "text/plain",
      });
      saveBlob(blob, asset.filename);
    },
    [generateContent, skills]
  );

  // Bundle every token + skill package file into one zip (Agent Skills folders).
  const handleDownloadAll = useCallback(() => {
    const files: Record<string, Uint8Array> = {};
    for (const asset of TOKEN_ASSETS) {
      files[asset.filename] = strToU8(generateContent(asset));
    }
    for (const { path, content } of flattenSkillFiles(skills)) {
      files[path] = strToU8(content);
    }
    const zipped = zipSync(files, { level: 6 });
    saveBlob(
      new Blob([zipped], { type: "application/zip" }),
      "sora-lattice-export.zip"
    );
  }, [generateContent, skills]);

  // `encodeURIComponent` is required: the LZ alphabet contains `+`, which
  // URLSearchParams decodes as a space — leaving it raw silently corrupts
  // the param on read.
  const encodedConfig = useMemo(
    () => encodeURIComponent(encodeBrandConfig(config)),
    [config]
  );

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return `${window.location.origin}/generate/export?c=${encodedConfig}`;
  }, [encodedConfig]);

  // Round-trip the encoded config back to the configurator so the user lands
  // on their last configuration instead of the defaults.
  const backHref = `/generate?c=${encodedConfig}`;

  const [shareCopied, setShareCopied] = useState(false);
  const handleShareCopy = useCallback(async () => {
    if (!shareUrl) {
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }, [shareUrl]);

  const isCopied = copiedId === selectedAsset.id;

  // Mobile dropdown options — same list/order as the sidebar, with the file
  // icon rendered inline so the type stays scannable in the trigger.
  const mobileAssetOptions = useMemo(
    () =>
      allAssets.map((a) => ({
        icon: (
          <FileIcon
            className="shrink-0"
            color={iconColors[a.iconKind]}
            kind={a.iconKind}
            size={20}
          />
        ),
        label: a.title,
        value: a.id,
      })),
    [allAssets, iconColors]
  );

  return (
    <div className="export-page relative min-h-dvh overflow-x-hidden bg-gray text-charcoal">
      <div className="relative z-10">
        {/* Top bar */}
        <header
          className="export-anim flex items-center justify-between px-6 py-5 md:px-10"
          style={{ animationDelay: "0.8s" }}
        >
          <a
            className="inline-flex items-center gap-2 text-charcoal/70 text-sm transition-colors hover:text-charcoal"
            href={backHref}
          >
            <ArrowLeft size={16} />
            Back to configurator
          </a>
          <a aria-label="Sora Lattice home" href="/">
            <img
              alt="Sora Lattice"
              className="h-7 w-7 transition-opacity hover:opacity-70"
              src={siteImages.logoIcon}
            />
          </a>
        </header>

        {/* Hero */}
        <section
          className="export-anim mx-auto max-w-5xl px-6 pt-8 pb-8 text-center md:px-10 md:pt-16 md:pb-10"
          style={{ animationDelay: "1.9s" }}
        >
          <h2 className="mb-6 text-charcoal">Ready to ship</h2>
          <p className="mx-auto max-w-2xl text-base text-charcoal/80 leading-relaxed md:text-lg">
            A complete token set plus three Agent Skills packages (SKILL.md +
            references), scoped to{" "}
            <em className="font-medium text-charcoal not-italic">
              {config.headingFont}
            </em>{" "}
            &{" "}
            <em className="font-medium text-charcoal not-italic">
              {config.primaryFont}
            </em>
            , anchored on
            <span
              aria-hidden
              className="mx-1.5 inline-block h-3 w-3 rounded-full align-middle ring-1 ring-charcoal/10"
              style={{ backgroundColor: config.primaryColor }}
            />
            <code className="font-mono text-charcoal/80 text-sm">
              {config.primaryColor.toLowerCase()}
            </code>
            .
          </p>

          {decodeFailed && (
            <p className="mt-6 inline-block rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-700 text-xs">
              Couldn't read configuration from the URL — showing defaults.
            </p>
          )}
        </section>

        {/* Share + bulk-download actions */}
        <section
          className="export-anim mx-auto max-w-2xl px-6 pb-10 md:px-10"
          style={{ animationDelay: "2.05s" }}
        >
          <div className="flex items-center justify-center gap-3">
            <CopyButton
              className="btn btn-secondary btn-sm border-none"
              copied={shareCopied}
              copiedIcon={<Check size={16} strokeWidth={2.5} />}
              copiedLabel="Copied"
              idleIcon={<Copy size={16} />}
              idleLabel="Copy URL"
              onClick={handleShareCopy}
            />
            <button
              className="btn btn-secondary btn-sm gap-2 border-none"
              onClick={handleDownloadAll}
              type="button"
            >
              <Download size={16} /> Download all
            </button>
          </div>
        </section>

        {/* Main: left nav + preview card */}
        <section
          className="export-anim mx-auto max-w-7xl px-6 pb-20 md:px-10 md:pb-28"
          style={{ animationDelay: "2.2s" }}
        >
          <article className="overflow-hidden rounded-2xl border border-charcoal/5 bg-white shadow-[0_4px_14px_-6px_rgba(20,30,50,0.10)]">
            <div className="grid md:grid-cols-[14rem_minmax(0,1fr)]">
              {/* Left nav — md+ only. On mobile the asset switcher lives in the preview header as a dropdown. */}
              <nav
                aria-label="Export assets"
                className="hidden border-charcoal/8 px-2 md:block md:border-r md:py-6"
              >
                <NavGroup
                  assets={TOKEN_ASSETS}
                  iconColors={iconColors}
                  label="Theme artifacts"
                  onSelect={setSelectedId}
                  selectedId={selectedId}
                />
                <NavGroup
                  assets={skillAssets}
                  className="mt-7"
                  iconColors={iconColors}
                  label="System skills"
                  onSelect={setSelectedId}
                  selectedId={selectedId}
                />
              </nav>

              {/* Preview */}
              <div className="min-w-0">
                <header className="px-5 py-4 md:px-6 md:py-5">
                  <div className="flex items-center gap-3">
                    {/* Mobile: title doubles as the asset dropdown trigger */}
                    <MobileTitleDropdown
                      className="min-w-0 flex-1 md:hidden"
                      iconColors={iconColors}
                      onSelect={setSelectedId}
                      options={mobileAssetOptions}
                      selectedAsset={selectedAsset}
                      selectedId={selectedId}
                    />
                    {/* Desktop: static title */}
                    <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
                      <FileIcon
                        className="shrink-0"
                        color={iconColors[selectedAsset.iconKind]}
                        kind={selectedAsset.iconKind}
                        size={32}
                      />
                      <div className="min-w-0">
                        <h4 className="truncate font-medium text-base text-charcoal">
                          {selectedAsset.title}
                        </h4>
                        <code className="block truncate font-mono text-charcoal/80 text-xs">
                          {selectedAsset.filename}
                        </code>
                      </div>
                    </div>
                    {/* Desktop actions */}
                    <div className="hidden shrink-0 items-center gap-2 md:flex">
                      {selectedAsset.takesColorSpace && (
                        <Select
                          onValueChange={(v) => setColorSpace(v as ColorSpace)}
                          options={COLOR_SPACE_OPTIONS}
                          size="compact"
                          triggerClassName="!w-24 !py-1.5 !px-2.5 !text-xs !rounded-lg"
                          value={colorSpace}
                        />
                      )}
                      <CopyButton
                        className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-charcoal/5 px-3 py-1.5 font-medium text-charcoal text-xs transition-colors hover:bg-charcoal/10"
                        copied={isCopied}
                        copiedIcon={<Check size={13} strokeWidth={2.5} />}
                        copiedLabel="Copied"
                        idleIcon={<Copy size={13} />}
                        idleLabel="Copy"
                        onClick={() => handleCopy(selectedAsset)}
                      />
                      <button
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-charcoal/5 px-3 py-1.5 font-medium text-charcoal text-xs transition-colors hover:bg-charcoal/10"
                        onClick={() => handleDownload(selectedAsset)}
                        type="button"
                      >
                        <Download size={13} /> Download
                      </button>
                    </div>
                  </div>
                  {/* Mobile actions row — each item fills the available width */}
                  <div className="mt-3 flex items-center gap-2 border-charcoal/8 border-t pt-3 md:hidden">
                    {selectedAsset.takesColorSpace && (
                      <div className="flex-1">
                        <Select
                          onValueChange={(v) => setColorSpace(v as ColorSpace)}
                          options={COLOR_SPACE_OPTIONS}
                          size="compact"
                          triggerClassName="!py-1.5 !px-2.5 !text-xs !rounded-lg"
                          value={colorSpace}
                        />
                      </div>
                    )}
                    <CopyButton
                      className="flex flex-1 cursor-pointer items-center justify-center rounded-lg bg-charcoal/5 px-3 py-1.5 font-medium text-charcoal text-xs transition-colors hover:bg-charcoal/10"
                      copied={isCopied}
                      copiedIcon={<Check size={13} strokeWidth={2.5} />}
                      copiedLabel="Copied"
                      idleIcon={<Copy size={13} />}
                      idleLabel="Copy"
                      onClick={() => handleCopy(selectedAsset)}
                    />
                    <button
                      className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-charcoal/5 px-3 py-1.5 font-medium text-charcoal text-xs transition-colors hover:bg-charcoal/10"
                      onClick={() => handleDownload(selectedAsset)}
                      type="button"
                    >
                      <Download size={13} /> Download
                    </button>
                  </div>
                </header>

                <div className="-mt-4 p-4 md:p-5">
                  <pre className="max-h-[72vh] overflow-auto whitespace-pre rounded-xl bg-gray p-4 font-mono text-[12px] leading-[1.65]">
                    {highlighted}
                  </pre>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>

      <style>{`
        .export-anim {
          opacity: 0;
          animation: fadeInUp 1.6s cubic-bezier(0.17, 0.84, 0.44, 1) forwards;
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .export-anim {
            animation: none;
            opacity: 1;
          }
        }

        /* Copy button: both faces share one grid cell so the button width is
           fixed to the wider label and never jumps when the state flips. */
        .copy-btn-stack {
          display: inline-grid;
        }
        .copy-btn-face {
          grid-area: 1 / 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          white-space: nowrap;
          transition: opacity 0.14s ease, transform 0.14s ease, filter 0.14s ease;
        }
        /* The entering face is delayed by one duration so it blurs/scales in
           only after the leaving face has finished blurring/scaling out. */
        .copy-btn-face--in {
          opacity: 1;
          transform: scale(1);
          filter: blur(0);
          transition-delay: 0.1s;
        }
        .copy-btn-face--out {
          opacity: 0;
          transform: scale(0.9);
          filter: blur(4px);
          pointer-events: none;
          transition-delay: 0s;
        }
        @media (prefers-reduced-motion: reduce) {
          .copy-btn-face {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Copy button — cross-fades between an idle and a "copied" face
// ---------------------------------------------------------------------------

interface CopyButtonProps {
  className?: string;
  copied: boolean;
  copiedIcon: React.ReactNode;
  copiedLabel: string;
  idleIcon: React.ReactNode;
  idleLabel: string;
  onClick: () => void;
}

const CopyButton: React.FC<CopyButtonProps> = ({
  copied,
  onClick,
  className = "",
  idleIcon,
  copiedIcon,
  idleLabel,
  copiedLabel,
}) => (
  <button
    aria-live="polite"
    className={className}
    onClick={onClick}
    type="button"
  >
    <span className="copy-btn-stack">
      <span
        aria-hidden={copied}
        className={`copy-btn-face ${copied ? "copy-btn-face--out" : "copy-btn-face--in"}`}
      >
        {idleIcon}
        {idleLabel}
      </span>
      <span
        aria-hidden={!copied}
        className={`copy-btn-face ${copied ? "copy-btn-face--in" : "copy-btn-face--out"}`}
      >
        {copiedIcon}
        {copiedLabel}
      </span>
    </span>
  </button>
);

// ---------------------------------------------------------------------------
// Left-nav group
// ---------------------------------------------------------------------------

interface NavGroupProps {
  assets: AssetDescriptor[];
  className?: string;
  iconColors: Record<FileIconKind, string>;
  label: string;
  onSelect: (id: AssetId) => void;
  selectedId: AssetId;
}

const NavGroup: React.FC<NavGroupProps> = ({
  label,
  assets,
  selectedId,
  onSelect,
  iconColors,
  className = "",
}) => {
  if (assets.length === 0) {
    return null;
  }
  return (
    <div className={className}>
      <p className="mb-2 px-3 font-medium text-[12px] text-charcoal/80">
        {label}
      </p>
      <ul className="flex flex-col gap-0.5">
        {assets.map((asset) => {
          const isSelected = asset.id === selectedId;
          return (
            <li key={asset.id}>
              <button
                aria-current={isSelected ? "true" : undefined}
                className={[
                  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors",
                  isSelected
                    ? "bg-charcoal/[0.06] text-charcoal"
                    : "text-charcoal/80 hover:bg-charcoal/[0.03] hover:text-charcoal",
                ].join(" ")}
                onClick={() => onSelect(asset.id)}
                type="button"
              >
                <FileIcon
                  className="shrink-0"
                  color={iconColors[asset.iconKind]}
                  kind={asset.iconKind}
                  size={22}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm leading-tight ${isSelected ? "font-medium" : ""}`}
                  >
                    {asset.title}
                  </p>
                  <code className="mt-0.5 block truncate font-mono text-[10px] text-charcoal/80 leading-tight">
                    {asset.filename}
                  </code>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Mobile title-as-dropdown switcher
// ---------------------------------------------------------------------------

interface MobileTitleDropdownProps {
  className?: string;
  iconColors: Record<FileIconKind, string>;
  onSelect: (id: AssetId) => void;
  options: Array<{ value: string; label: string; icon: React.ReactNode }>;
  selectedAsset: AssetDescriptor;
  selectedId: AssetId;
}

const MobileTitleDropdown: React.FC<MobileTitleDropdownProps> = ({
  options,
  selectedAsset,
  selectedId,
  onSelect,
  iconColors,
  className = "",
}) => {
  const items = options.map((o) => ({ label: o.label, value: o.value }));

  return (
    <div className={className}>
      <BaseSelect.Root
        items={items}
        modal={false}
        onValueChange={(v) => {
          if (v) {
            onSelect(v as AssetId);
          }
        }}
        value={selectedId}
      >
        <BaseSelect.Trigger className="flex w-full cursor-pointer items-center gap-3 text-left">
          <FileIcon
            className="shrink-0"
            color={iconColors[selectedAsset.iconKind]}
            kind={selectedAsset.iconKind}
            size={32}
          />
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-medium text-base text-charcoal">
              {selectedAsset.title}
            </h4>
            <code className="block truncate font-mono text-charcoal/80 text-xs">
              {selectedAsset.filename}
            </code>
          </div>
          <BaseSelect.Icon className="shrink-0 text-charcoal/50 transition-transform data-popup-open:rotate-180">
            <ChevronDown size={16} />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>

        <BaseSelect.Portal>
          <BaseSelect.Positioner
            alignItemWithTrigger={false}
            className="z-60"
            side="bottom"
            sideOffset={8}
            style={{ width: "var(--trigger-width)" }}
          >
            <BaseSelect.Popup
              className="max-h-60 origin-top touch-pan-y overflow-y-auto overscroll-contain rounded-xl border border-charcoal/10 bg-white p-1.5 shadow-lg outline-none transition-[transform,opacity] duration-150 ease-out data-ending-style:scale-[0.95] data-starting-style:scale-[0.95] data-ending-style:opacity-0 data-starting-style:opacity-0"
              data-lenis-prevent
            >
              {options.map((option) => (
                <BaseSelect.Item
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-charcoal/5 data-highlighted:bg-charcoal/5 data-selected:font-medium data-selected:text-forest-green"
                  key={option.value}
                  value={option.value}
                >
                  {option.icon}
                  <BaseSelect.ItemText className="flex-1">
                    {option.label}
                  </BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator>
                    <Check size={14} strokeWidth={2.5} />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
};

export default ExportPage;
