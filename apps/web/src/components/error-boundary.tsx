import { Component, type ErrorInfo, type ReactNode } from "react";
import { resetConfig } from "./BrandIntake/store";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Guards the Configurator (which recomputes design tokens synchronously on
 * every keystroke via third-party color math) so an unexpected crash there
 * shows a recoverable fallback instead of a blank page.
 */
export class ConfiguratorErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // biome-ignore lint/suspicious/noConsole: surfaced to the browser console for debugging, not user-facing
    console.error("Configurator crashed:", error, info.componentStack);
  }

  handleReset = () => {
    resetConfig();
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
          <h1 className="font-serif text-2xl text-charcoal">
            Something went wrong
          </h1>
          <p className="max-w-md text-charcoal/70 text-sm">
            The configurator hit an unexpected error. Resetting to the default
            theme usually fixes it.
          </p>
          <button
            className="rounded-full bg-forest-green px-6 py-2.5 font-medium text-white transition-colors hover:bg-forest-green-600"
            onClick={this.handleReset}
            type="button"
          >
            Reset to defaults
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
