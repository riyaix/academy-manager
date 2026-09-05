import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/plugin-dialog";
import { Building2, ChevronRight, FolderOpen, Globe, Sparkles } from "lucide-react";
import { Button } from "../../core/components/Button";
import { Modal } from "../../core/components/Modal";
import { useToast } from "../../core/components/Toast";
import { isTauriRuntime } from "../../core/storage/runtime";
import { useAppStore } from "../store/appStore";

type OnboardingStep = "welcome" | "locale" | "backup";

export function OnboardingWizard() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const appName = useAppStore((state) => state.appName);
  const organization = useAppStore((state) => state.organization);
  const autoBackupEnabled = useAppStore((state) => state.autoBackupEnabled);
  const autoBackupFolderPath = useAppStore((state) => state.autoBackupFolderPath);
  const setAppName = useAppStore((state) => state.setAppName);
  const setOrganization = useAppStore((state) => state.setOrganization);
  const setAutoBackupEnabled = useAppStore((state) => state.setAutoBackupEnabled);
  const setAutoBackupFolderPath = useAppStore((state) => state.setAutoBackupFolderPath);
  const setOnboardingCompleted = useAppStore((state) => state.setOnboardingCompleted);

  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [name, setName] = useState(appName);
  const [locale, setLocale] = useState<"es" | "en">(i18n.language === "en" ? "en" : "es");
  const [backupEnabled, setBackupEnabled] = useState(autoBackupEnabled);
  const [backupFolder, setBackupFolder] = useState(autoBackupFolderPath ?? "");

  const steps: OnboardingStep[] = ["welcome", "locale", "backup"];
  const stepIndex = steps.indexOf(step);

  const canContinue = useMemo(() => {
    if (step === "welcome") return name.trim().length > 0;
    if (step === "backup" && backupEnabled && isTauriRuntime()) {
      return Boolean(backupFolder.trim());
    }
    return true;
  }, [backupEnabled, backupFolder, name, step]);

  const finish = useCallback(() => {
    const trimmedName = name.trim();
    setAppName(trimmedName);
    setOrganization({ ...organization, legalName: trimmedName });
    void i18n.changeLanguage(locale);
    setAutoBackupEnabled(backupEnabled);
    if (backupFolder.trim()) {
      setAutoBackupFolderPath(backupFolder.trim());
    }
    setOnboardingCompleted(true);
    toast({ message: t("onboarding.completeToast"), variant: "success" });
  }, [
    backupEnabled,
    backupFolder,
    i18n,
    locale,
    name,
    organization,
    setAppName,
    setAutoBackupEnabled,
    setAutoBackupFolderPath,
    setOnboardingCompleted,
    setOrganization,
    t,
    toast,
  ]);

  const handleChooseFolder = async () => {
    if (!isTauriRuntime()) {
      toast({ message: t("backup.desktopOnly"), variant: "warning" });
      return;
    }

    const selected = await open({
      directory: true,
      multiple: false,
      title: t("backup.autoBackupChooseFolder"),
    });

    if (!selected || Array.isArray(selected)) return;
    setBackupFolder(selected);
  };

  const handleNext = () => {
    if (step === "backup") {
      finish();
      return;
    }
    setStep(steps[stepIndex + 1]);
  };

  const handleSkip = useCallback(() => {
    setOnboardingCompleted(true);
  }, [setOnboardingCompleted]);

  return (
    <Modal
      open
      onClose={handleSkip}
      title={t("onboarding.title")}
      size="lg"
      closeOnBackdrop={false}
      hideCloseButton
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          {steps.map((item, index) => (
            <div key={item} className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  index <= stepIndex
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                    : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                }`}
              >
                {index + 1}
              </span>
              {index < steps.length - 1 ? (
                <ChevronRight className="h-4 w-4 text-[var(--color-border)]" aria-hidden />
              ) : null}
            </div>
          ))}
        </div>

        {step === "welcome" ? (
          <section className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-[var(--color-info-surface)] p-4 text-[var(--color-text)]">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div>
                <h3 className="font-semibold">{t("onboarding.welcomeTitle")}</h3>
                <p className="mt-1 text-sm text-[var(--color-primary)]">
                  {t("onboarding.welcomeBody")}
                </p>
              </div>
            </div>
            <label className="block text-sm font-semibold text-[var(--color-text)]">
              {t("onboarding.orgNameLabel")}
              <div className="relative mt-1">
                <Building2
                  className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]"
                  aria-hidden
                />
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] py-2 pl-10 pr-3 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder={t("settings.company.defaultName")}
                />
              </div>
            </label>
          </section>
        ) : null}

        {step === "locale" ? (
          <section className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-[var(--color-surface)] p-4">
              <Globe
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-text-muted)]"
                aria-hidden
              />
              <div>
                <h3 className="font-semibold text-[var(--color-text)]">
                  {t("onboarding.localeTitle")}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {t("onboarding.localeBody")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(["es", "en"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLocale(value)}
                  className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                    locale === value
                      ? "border-[var(--color-primary)] bg-[var(--color-info-surface)] text-[var(--color-text)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-border)]"
                  }`}
                >
                  <span className="font-semibold">{t(`language.${value}`)}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {step === "backup" ? (
          <section className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-[var(--color-surface)] p-4">
              <FolderOpen
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-text-muted)]"
                aria-hidden
              />
              <div>
                <h3 className="font-semibold text-[var(--color-text)]">
                  {t("onboarding.backupTitle")}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {t("onboarding.backupBody")}
                </p>
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm font-medium text-[var(--color-text)]">
              <input
                type="checkbox"
                checked={backupEnabled}
                onChange={(event) => setBackupEnabled(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              {t("onboarding.backupEnable")}
            </label>
            {backupEnabled ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="secondary"
                  leftIcon={<FolderOpen className="h-4 w-4" aria-hidden />}
                  onClick={() => void handleChooseFolder()}
                >
                  {t("backup.autoBackupChooseFolder")}
                </Button>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {backupFolder
                    ? t("backup.autoBackupFolderValue", { path: backupFolder })
                    : t("backup.autoBackupFolderMissing")}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleSkip}>
            {t("onboarding.skip")}
          </Button>
          <div className="flex gap-2">
            {stepIndex > 0 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(steps[stepIndex - 1])}
              >
                {t("common.back")}
              </Button>
            ) : null}
            <Button type="button" onClick={handleNext} disabled={!canContinue}>
              {step === "backup" ? t("onboarding.finish") : t("common.forward")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
