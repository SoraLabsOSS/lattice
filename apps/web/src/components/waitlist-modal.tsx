import { Dialog } from "@base-ui/react/dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const popupVariants = {
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1] as [number, number, number, number],
    },
    y: 8,
  },
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      damping: 28,
      mass: 0.8,
      stiffness: 400,
      type: "spring" as const,
    },
    y: 0,
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "submitting" | "success" | "error";

const STORAGE_KEY = "sora-lattice:waitlist:email";

export const WaitlistModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOpen = () => {
      setStatus("idle");
      setErrorMessage("");
      setOpen(true);
      document.body.classList.add("modal-open");
      (window as { lenis?: { stop?: () => void } }).lenis?.stop?.();
    };
    window.addEventListener("openWaitlist", handleOpen);
    return () => window.removeEventListener("openWaitlist", handleOpen);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    document.body.classList.remove("modal-open");
    (window as { lenis?: { start?: () => void } }).lenis?.start?.();
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, handleClose]);

  // Focus the email field once the popup mounts
  useEffect(() => {
    if (!open || status !== "idle") {
      return;
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, [open, status]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = email.trim();
      if (!EMAIL_RE.test(trimmed)) {
        setStatus("error");
        setErrorMessage("Please enter a valid email address.");
        return;
      }

      setStatus("submitting");
      setErrorMessage("");

      try {
        // Persist locally so the email isn't lost before the backend exists.
        // Wire up a real endpoint here when the beta API is ready.
        window.localStorage.setItem(STORAGE_KEY, trimmed);
        window.dispatchEvent(
          new CustomEvent("waitlistSignup", { detail: { email: trimmed } })
        );
        await new Promise((resolve) => setTimeout(resolve, 450));
        setStatus("success");
      } catch {
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
      }
    },
    [email]
  );

  return (
    <Dialog.Root
      onOpenChange={(next) => (next ? setOpen(true) : handleClose())}
      open={open}
    >
      <AnimatePresence>
        {open && (
          <Dialog.Portal keepMounted>
            <Dialog.Backdrop
              className="fixed inset-0 z-50"
              render={
                <motion.div
                  animate="visible"
                  exit="hidden"
                  initial="hidden"
                  transition={{ duration: 0.2 }}
                  variants={backdropVariants}
                />
              }
              style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            />
            <Dialog.Popup
              className="fixed top-0 left-0 z-50 flex h-screen w-screen items-center justify-center p-4"
              render={
                <motion.div
                  animate="visible"
                  exit="exit"
                  initial="hidden"
                  variants={popupVariants}
                />
              }
            >
              <div className="flex w-full max-w-md flex-col rounded-3xl bg-white p-6 shadow-2xl md:p-8">
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex flex-col gap-2 pr-6">
                    <Dialog.Title
                      render={() => (
                        <h4 className="text-charcoal">
                          Join the beta waitlist
                        </h4>
                      )}
                    />
                    <p className="text-charcoal/80 text-sm md:text-base">
                      We'll email you when the paid beta launches, with a
                      first-100-customer discount included.
                    </p>
                  </div>
                  <Dialog.Close
                    aria-label="Close waitlist dialog"
                    className="shrink-0 cursor-pointer rounded-lg p-1 text-charcoal/40 transition-colors hover:bg-charcoal/5 hover:text-charcoal/70"
                  >
                    <X size={18} />
                  </Dialog.Close>
                </div>

                {status === "success" ? (
                  <div className="flex flex-col items-start gap-3 py-2">
                    <div
                      aria-hidden="true"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-green-50 text-forest-green"
                    >
                      <Check className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <p className="text-base text-charcoal">
                      You're on the list. We'll be in touch.
                    </p>
                    <button
                      className="btn btn-secondary btn-sm mt-2"
                      onClick={handleClose}
                      type="button"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form
                    className="flex flex-col gap-4"
                    noValidate
                    onSubmit={handleSubmit}
                  >
                    <label
                      className="font-medium text-base text-charcoal"
                      htmlFor="waitlist-email"
                    >
                      Email address
                    </label>
                    <Input
                      aria-describedby={
                        status === "error" ? "waitlist-email-error" : undefined
                      }
                      aria-invalid={status === "error"}
                      autoComplete="email"
                      disabled={status === "submitting"}
                      id="waitlist-email"
                      onChange={(e) => {
                        setEmail(e.currentTarget.value);
                        if (status === "error") {
                          setStatus("idle");
                          setErrorMessage("");
                        }
                      }}
                      placeholder="you@studio.com"
                      ref={inputRef as React.Ref<HTMLElement>}
                      size="compact"
                      type="email"
                      value={email}
                    />
                    {status === "error" && (
                      <p
                        className="text-red-600 text-sm"
                        id="waitlist-email-error"
                      >
                        {errorMessage}
                      </p>
                    )}
                    <button
                      className="btn btn-primary btn-sm w-full disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={status === "submitting"}
                      type="submit"
                    >
                      {status === "submitting" ? "Joining…" : "Join waitlist"}
                    </button>
                    <p className="text-charcoal/80 text-xs">
                      No spam. We'll only email you about the beta launch.
                    </p>
                  </form>
                )}
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};
