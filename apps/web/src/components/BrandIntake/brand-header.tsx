import { useStore } from "@nanostores/react";
import { Upload } from "lucide-react";
import type React from "react";
import { useRef } from "react";
import { $brandConfig, updateConfig } from "./store";

const BrandHeader: React.FC = () => {
  const config = useStore($brandConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const url = URL.createObjectURL(file);
    updateConfig({ logoUrl: url });
  };

  return (
    <div className="flex shrink-0 items-center gap-3 border-charcoal/10 border-b px-6 py-4">
      {/* Logo upload - compact avatar */}
      <button
        aria-label="Upload logo"
        className="group relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-charcoal/15 border-dashed transition-colors hover:border-forest-green/30 hover:bg-forest-green/5"
        onClick={() => fileInputRef.current?.click()}
        type="button"
      >
        {config.logoUrl ? (
          <img
            alt="Logo"
            className="h-full w-full object-cover"
            src={config.logoUrl}
          />
        ) : (
          <Upload
            className="text-charcoal/30 transition-colors group-hover:text-forest-green"
            size={16}
          />
        )}
      </button>
      <input
        accept="image/svg+xml,image/png,image/jpeg"
        className="hidden"
        onChange={handleLogoUpload}
        ref={fileInputRef}
        type="file"
      />
    </div>
  );
};

export default BrandHeader;
