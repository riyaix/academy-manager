import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { type LucideIcon, HelpCircle, Search } from "lucide-react";
import { ThemeToggle } from "../core/components/ThemeToggle";
import { useWindowTitle } from "../core/hooks/useWindowTitle";
import { useKeyboardShortcuts } from "../core/hooks/useKeyboardShortcuts";
import { useAppStore } from "./store/appStore";
import { useNavigation } from "./navigation/useNavigation";
import { navItemsFromFeatures, registeredFeatures } from "./navigation/registry";
import type { ViewId } from "./navigation/types";
import { FeatureViewport } from "./FeatureViewport";
import { useAppearanceEffects } from "../features/settings/hooks/useAppearanceEffects";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { GlobalSearchModal } from "../core/components/GlobalSearchModal";

type NavButtonProps = {
  id: ViewId;
  icon: LucideIcon;
  label: string;
  activeView: ViewId;
  onNavigate: (viewId: ViewId) => void;
};

function NavButton({ id, icon: Icon, label, activeView, onNavigate }: NavButtonProps) {
  const isActive = activeView === id;
  return (
    <button
      type="button"
      onClick={() => onNavigate(id)}
      aria-current={isActive ? "page" : undefined}
      className={`w-full flex items-center px-4 py-3 min-h-[44px] rounded-lg transition-colors font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sidebar-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-sidebar)] ${
        isActive
          ? "bg-[var(--color-sidebar-accent)] text-[var(--color-sidebar)] shadow-md"
          : "text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-elevated)]"
      }`}
    >
      <Icon className="w-5 h-5 mr-3 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
      {label}
    </button>
  );
}

type ActionNavButtonProps = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
};

function ActionNavButton({ icon: Icon, label, onClick }: ActionNavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center px-4 py-3 min-h-[44px] rounded-lg transition-colors font-medium cursor-pointer text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sidebar-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-sidebar)]"
    >
      <Icon className="w-5 h-5 mr-3 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
      {label}
    </button>
  );
}

export function AppShell() {
  const { t } = useTranslation();
  const { activeView, navigateTo } = useNavigation();
  const appName = useAppStore((state) => state.appName);
  const appSubtitle = useAppStore((state) => state.appSubtitle);
  const onboardingCompleted = useAppStore((state) => state.onboardingCompleted);
  const navigationItems = navItemsFromFeatures(registeredFeatures);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useWindowTitle(appName);
  useAppearanceEffects();

  const shortcuts = useMemo(
    () => [
      {
        id: "search",
        keys: "Ctrl+K",
        descriptionKey: "shortcuts.globalSearch",
        handler: () => setShowSearch(true),
        allowInInput: true,
      },
      {
        id: "new-student",
        keys: "Ctrl+N",
        descriptionKey: "shortcuts.newStudent",
        handler: () => navigateTo("students", "nuevo"),
      },
      {
        id: "new-payment",
        keys: "Ctrl+Shift+N",
        descriptionKey: "shortcuts.newPaymentRecord",
        handler: () => navigateTo("billing", "manual"),
      },
      {
        id: "dashboard",
        keys: "Ctrl+1",
        descriptionKey: "shortcuts.goDashboard",
        handler: () => navigateTo("dashboard"),
      },
      {
        id: "students",
        keys: "Ctrl+2",
        descriptionKey: "shortcuts.goStudents",
        handler: () => navigateTo("students"),
      },
      {
        id: "billing",
        keys: "Ctrl+3",
        descriptionKey: "shortcuts.goBilling",
        handler: () => navigateTo("billing"),
      },
      {
        id: "settings",
        keys: "Ctrl+,",
        descriptionKey: "shortcuts.goSettings",
        handler: () => navigateTo("settings"),
      },
      {
        id: "help",
        keys: "Ctrl+?",
        descriptionKey: "shortcuts.showHelp",
        handler: () => setShowShortcuts(true),
        allowInInput: true,
      },
    ],
    [navigateTo],
  );

  useKeyboardShortcuts(shortcuts, onboardingCompleted);

  const renderNavSection = (section: "main" | "billing" | "academy" | "config") => {
    const items = navigationItems.filter((item) => item.section === section);
    if (items.length === 0) return null;

    return (
      <>
        {section !== "main" && (
          <div
            className="border-t border-[var(--color-sidebar-border)] my-4 pt-2"
            role="separator"
          />
        )}
        {items.map((item) => (
          <NavButton
            key={item.id}
            id={item.id}
            icon={item.icon}
            label={t(item.labelKey)}
            activeView={activeView}
            onNavigate={navigateTo}
          />
        ))}
      </>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-dvh max-h-dvh overflow-hidden bg-[var(--color-surface)] font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--color-sidebar-accent)] focus:px-4 focus:py-3 focus:text-[var(--color-sidebar)] focus:shadow-lg"
      >
        {t("a11y.skipToContent")}
      </a>

      <aside
        className="w-full lg:w-64 lg:h-dvh lg:max-h-dvh bg-[var(--color-sidebar)] text-[var(--color-sidebar-text)] flex flex-col shadow-xl z-20 shrink-0 overflow-hidden"
        aria-label={t("a11y.mainNavigation")}
      >
        <div className="p-4 sm:p-6 shrink-0">
          <p
            className="text-2xl font-extrabold text-[var(--color-sidebar-accent)] tracking-tight mb-0 truncate"
            title={appName}
          >
            {appName}
          </p>
          <p
            className="text-xs text-[var(--color-sidebar-muted)] font-medium uppercase tracking-wider mt-1 truncate"
            title={appSubtitle}
          >
            {appSubtitle}
          </p>
        </div>

        <nav
          className="flex-1 min-h-0 px-4 space-y-2 mt-2 overflow-y-auto pb-4"
          aria-label={t("a11y.mainNavigation")}
        >
          {renderNavSection("main")}
          {renderNavSection("billing")}
          {renderNavSection("academy")}
          {renderNavSection("config")}
          <ActionNavButton
            icon={Search}
            label={t("nav.search")}
            onClick={() => setShowSearch(true)}
          />
        </nav>

        <div className="shrink-0 border-t border-[var(--color-sidebar-border)] px-4 pt-3 pb-4 space-y-1">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex w-full items-center justify-start gap-2 rounded-lg px-3 py-2 min-h-[44px] text-sm font-semibold text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sidebar-accent)] cursor-pointer"
            onClick={() => setShowShortcuts(true)}
          >
            <HelpCircle className="h-4 w-4 shrink-0" aria-hidden />
            {t("shortcuts.title")}
          </button>
        </div>
      </aside>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 flex flex-col min-w-0 outline-none"
      >
        <div className="w-full flex-1">
          <FeatureViewport />
        </div>
      </main>

      {!onboardingCompleted ? <OnboardingWizard /> : null}
      <KeyboardShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
      />
      <GlobalSearchModal
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onNavigate={navigateTo}
      />
    </div>
  );
}
