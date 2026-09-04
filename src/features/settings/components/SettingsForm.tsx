import {
  Building2,
  Palette,
  Image as ImageIcon,
  Type,
  MapPin,
  Trash2,
  Settings2,
  Archive,
  LoaderCircle,
  FolderOpen,
  Clock,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/plugin-dialog";
import { useToast } from "../../../core/components/Toast";
import { useConfirm } from "../../../core/components/ConfirmDialog";
import { exportBackup, importBackup } from "../../../core/backup";
import { readImageAsDataUrl } from "../../../core/utils/image";
import { formatTaxIdentifier } from "../../../domain/tax-id";
import { useSettingsStore } from "../hooks/useSettingsStore";

export function SettingsForm() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [pestaña, setPestaña] = useState("empresa");
  const [exportingBackup, setExportingBackup] = useState(false);
  const [importingBackup, setImportingBackup] = useState(false);

  const {
    brandColor,
    setBrandColor,
    logoDataUrl,
    setLogoDataUrl,
    organization,
    setOrganization,
    fontSize,
    setFontSize,
    colorScheme,
    setColorScheme,
    autoBackupEnabled,
    setAutoBackupEnabled,
    autoBackupFolderPath,
    setAutoBackupFolderPath,
    lastAutoBackupAt,
  } = useSettingsStore();

  const paletaColores = [
    "#0f766e",
    "#115e59",
    "#1d4e4a",
    "#365314",
    "#44403c",
    "#9a3412",
    "#9f1239",
    "#1e3a5f",
  ];

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setLogoDataUrl(dataUrl);
    } catch {
      toast({ message: t("settings.logoUploadError"), variant: "error" });
    }
  };

  const guardarAjustes = () => {
    toast({ message: t("settings.saved"), variant: "success" });
  };

  const handleChooseAutoBackupFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: t("backup.autoBackupChooseFolder"),
    });

    if (!selected || Array.isArray(selected)) return;
    setAutoBackupFolderPath(selected);
    toast({ message: t("backup.autoBackupFolderSaved"), variant: "success" });
  };

  const handleExportBackup = async () => {
    setExportingBackup(true);
    try {
      const result = await exportBackup();
      if (result.status === "success") {
        toast({ message: t("backup.exportSuccess"), variant: "success" });
      } else if (result.status === "error") {
        toast({
          message: t("backup.exportError", { message: result.message }),
          variant: "error",
        });
      }
    } finally {
      setExportingBackup(false);
    }
  };

  const handleImportBackup = async () => {
    setImportingBackup(true);
    try {
      const result = await importBackup(async (metadata) =>
        confirm({
          title: t("backup.importConfirmTitle"),
          message: t("backup.importConfirmMessage", {
            exportedAt: new Date(metadata.exportedAt).toLocaleString(i18n.language),
            schemaVersion: metadata.schemaVersion,
            appVersion: metadata.appVersion,
          }),
          confirmLabel: t("backup.importConfirmButton"),
          variant: "danger",
        }),
      );

      if (result.status === "success") {
        toast({ message: t("backup.importSuccess"), variant: "success" });
      } else if (result.status === "error") {
        toast({
          message: t("backup.importError", { message: result.message }),
          variant: "error",
        });
      }
    } finally {
      setImportingBackup(false);
    }
  };

  const formatearTelefono = (valor: string) => {
    if (!valor) return ""; // FIX: Prevención si viene nulo
    let val = valor.replace(/\D/g, "");
    if (val.length > 9) val = val.slice(0, 9);
    if (val.length > 6) return `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;
    if (val.length > 3) return `${val.slice(0, 3)} ${val.slice(3)}`;
    return val;
  };

  const formatearIdentificacion = formatTaxIdentifier;

  return (
    <div className="bg-[var(--color-surface-elevated)] w-full p-6 md:p-8 rounded-xl shadow-sm border border-[var(--color-border)] flex flex-col min-h-[85vh] relative">
      <div className="flex flex-col md:flex-row items-center mb-6 border-b border-[var(--color-border)] pb-5 shrink-0 gap-6">
        <button
          onClick={guardarAjustes}
          className="w-full md:w-auto bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-on-primary)] px-8 py-3 rounded-lg text-lg font-bold shadow-md transition-colors cursor-pointer"
        >
          {t("settings.saveChanges")}
        </button>
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">{t("settings.title")}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{t("settings.subtitle")}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row bg-[var(--color-surface-muted)] p-1.5 rounded-lg border border-[var(--color-border)] w-full sm:w-fit mb-8 shrink-0">
        <button
          onClick={() => setPestaña("empresa")}
          className={`flex-1 sm:flex-none flex justify-center items-center px-8 py-3 rounded-md text-base font-bold transition-colors cursor-pointer ${pestaña === "empresa" ? "bg-[var(--color-surface-elevated)] text-[var(--color-primary)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}
        >
          <Building2 className="w-5 h-5 mr-2" /> {t("settings.tabs.companyAppearance")}
        </button>
        <button
          onClick={() => setPestaña("preferencias")}
          className={`flex-1 sm:flex-none flex justify-center items-center px-8 py-3 rounded-md text-base font-bold transition-colors cursor-pointer ${pestaña === "preferencias" ? "bg-[var(--color-surface-elevated)] text-[var(--color-primary)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}
        >
          <Settings2 className="w-5 h-5 mr-2" /> {t("settings.tabs.systemPreferences")}
        </button>
      </div>

      {/* PESTAÑA 1: EMPRESA */}
      {pestaña === "empresa" && (
        <div className="flex-1 flex flex-col xl:flex-row gap-8">
          <div className="w-full xl:w-1/2 flex flex-col gap-6">
            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm bg-[var(--color-surface-elevated)]">
              <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] p-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[var(--color-text-muted)]" />
                <h3 className="font-bold text-[var(--color-text)]">{t("settings.company.title")}</h3>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="font-bold text-[var(--color-text)] text-sm mb-1 block">
                    {t("settings.company.legalName")}
                  </label>
                  <input
                    type="text"
                    value={organization?.legalName || ""}
                    onChange={(e) => setOrganization({ ...organization, legalName: e.target.value })}
                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)] font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--color-text)] text-sm mb-1 block">
                    {t("settings.company.taxId")}
                  </label>
                  <input
                    type="text"
                    value={organization?.taxId || ""}
                    onChange={(e) =>
                      setOrganization({
                        ...organization,
                        taxId: formatearIdentificacion(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    placeholder={t("settings.company.taxIdPlaceholder")}
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--color-text)] text-sm mb-1 block">
                    {t("settings.company.phone")}
                  </label>
                  <input
                    type="tel"
                    value={organization?.phone || ""}
                    onChange={(e) =>
                      setOrganization({
                        ...organization,
                        phone: formatearTelefono(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    placeholder={t("settings.company.phonePlaceholder")}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="font-bold text-[var(--color-text)] text-sm mb-1 block">
                    {t("settings.company.email")}
                  </label>
                  <input
                    type="email"
                    value={organization?.email || ""}
                    onChange={(e) => setOrganization({ ...organization, email: e.target.value })}
                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="md:col-span-2 bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]">
                  <h4 className="font-bold text-sm text-[var(--color-text)] mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-[var(--color-text-muted)]" /> {t("settings.company.addressTitle")}
                  </h4>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-4">
                      <select
                        value={organization?.streetType || "Calle"}
                        onChange={(e) =>
                          setOrganization({ ...organization, streetType: e.target.value })
                        }
                        className="w-full border border-[var(--color-border)] rounded-lg p-2 outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm bg-[var(--color-surface-elevated)] cursor-pointer"
                      >
                        <option value="Calle">{t("settings.company.streetTypes.street")}</option>
                        <option value="Avenida">{t("settings.company.streetTypes.avenue")}</option>
                        <option value="Plaza">{t("settings.company.streetTypes.square")}</option>
                      </select>
                    </div>
                    <div className="col-span-12 md:col-span-8">
                      <input
                        type="text"
                        value={organization?.streetName || ""}
                        onChange={(e) =>
                          setOrganization({ ...organization, streetName: e.target.value })
                        }
                        className="w-full border border-[var(--color-border)] rounded-lg p-2 outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                        placeholder={t("settings.company.streetNamePlaceholder")}
                      />
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <input
                        type="text"
                        value={organization?.streetNumber || ""}
                        onChange={(e) =>
                          setOrganization({ ...organization, streetNumber: e.target.value })
                        }
                        className="w-full border border-[var(--color-border)] rounded-lg p-2 outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                        placeholder={t("settings.company.numberPlaceholder")}
                      />
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <input
                        type="text"
                        value={organization?.unit || ""}
                        onChange={(e) =>
                          setOrganization({ ...organization, unit: e.target.value })
                        }
                        className="w-full border border-[var(--color-border)] rounded-lg p-2 outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                        placeholder={t("settings.company.unitPlaceholder")}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <input
                        type="text"
                        value={organization?.postalCode || ""}
                        onChange={(e) => setOrganization({ ...organization, postalCode: e.target.value })}
                        className="w-full border border-[var(--color-border)] rounded-lg p-2 outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                        placeholder={t("settings.company.postalCodePlaceholder")}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <input
                        type="text"
                        value={organization?.city || ""}
                        onChange={(e) =>
                          setOrganization({ ...organization, city: e.target.value })
                        }
                        className="w-full border border-[var(--color-border)] rounded-lg p-2 outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                        placeholder={t("settings.company.cityPlaceholder")}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <input
                        type="text"
                        value={organization?.province || ""}
                        onChange={(e) =>
                          setOrganization({ ...organization, province: e.target.value })
                        }
                        className="w-full border border-[var(--color-border)] rounded-lg p-2 outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                        placeholder={t("settings.company.provincePlaceholder")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full xl:w-1/2 flex flex-col gap-6">
            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm bg-[var(--color-surface-elevated)]">
              <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] p-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-[var(--color-text-muted)]" />
                <h3 className="font-bold text-[var(--color-text)]">{t("settings.appearance.receiptTitle")}</h3>
              </div>

              <div className="p-5 space-y-6">
                <div>
                  <label className="font-bold text-[var(--color-text)] text-sm mb-2 block">
                    {t("settings.appearance.logoLabel")}
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 border-2 border-dashed border-[var(--color-border)] rounded-xl flex items-center justify-center bg-[var(--color-surface)] overflow-hidden relative group shrink-0">
                      {logoDataUrl ? (
                        <>
                          <img
                            src={logoDataUrl}
                            alt={t("settings.appearance.logoAlt")}
                            className="w-full h-full object-contain p-2"
                          />
                          <div
                            onClick={() => setLogoDataUrl(null)}
                            className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all"
                          >
                            <Trash2 className="w-6 h-6 text-[var(--color-on-primary)]" />
                          </div>
                        </>
                      ) : (
                        <ImageIcon className="w-8 h-8 text-[var(--color-text-muted)]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        id="logoUpload"
                        accept="image/png, image/jpeg"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="logoUpload"
                        className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer inline-block shadow-sm"
                      >
                        {t("settings.appearance.uploadImage")}
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[var(--color-text)] text-sm mb-2 block">
                    {t("settings.appearance.brandColor")}
                  </label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {paletaColores.map((color) => (
                      <button
                        key={color}
                        onClick={() => setBrandColor(color)}
                        className={`w-8 h-8 rounded-full shadow-sm cursor-pointer transition-all ${brandColor === color ? "ring-2 ring-offset-2 ring-[var(--color-text)] scale-110" : "opacity-80 hover:opacity-100"}`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    <div className="w-px h-8 bg-[var(--color-surface-muted)] mx-2"></div>
                    <div className="relative border border-[var(--color-border)] rounded-lg overflow-hidden shadow-sm flex items-center bg-[var(--color-surface-elevated)] h-10 w-10">
                      <input
                        type="color"
                        value={
                          (brandColor || "#0f766e").startsWith("#") ? brandColor : "#0f766e"
                        }
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="absolute inset-0 w-16 h-16 -top-2 -left-2 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: PREFERENCIAS */}
      {pestaña === "preferencias" && (
        <div className="flex-1 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm bg-[var(--color-surface-elevated)]">
              <div className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] p-4 flex items-center gap-2">
                <Type className="w-5 h-5 text-[var(--color-text-muted)]" aria-hidden />
                <h3 className="font-bold text-[var(--color-text)] mb-0">{t("settings.typography.title")}</h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-[var(--color-text-muted)]">{t("settings.typography.description")}</p>
                <p className="mt-3 text-2xl font-bold text-[var(--color-text)]" aria-hidden>
                  Aa
                </p>
              </div>
            </div>

            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm bg-[var(--color-surface-elevated)]">
              <div className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] p-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-[var(--color-text-muted)]" aria-hidden />
                <h3 className="font-bold text-[var(--color-text)] mb-0">{t("settings.theme.title")}</h3>
              </div>
              <div className="p-5">
                <div
                  className="grid grid-cols-3 gap-3 bg-[var(--color-surface-muted)] p-1.5 rounded-xl border border-[var(--color-border)]"
                  role="radiogroup"
                  aria-label={t("settings.theme.title")}
                >
                  {[
                    { id: "system", icon: Monitor, labelKey: "settings.theme.system" },
                    { id: "light", icon: Sun, labelKey: "settings.theme.light" },
                    { id: "dark", icon: Moon, labelKey: "settings.theme.dark" },
                  ].map(({ id, icon: Icon, labelKey }) => {
                    const selected = (colorScheme || "system") === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setColorScheme(id)}
                        className={`flex flex-col items-center justify-center gap-1 p-3 min-h-[64px] rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                          selected
                            ? "bg-[var(--color-surface-elevated)] shadow-md border border-[var(--color-border)] text-[var(--color-primary)]"
                            : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]/60"
                        }`}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                        <span className="text-[10px] font-semibold uppercase">{t(labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm bg-[var(--color-surface-elevated)]">
              <div className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] p-4 flex items-center gap-2">
                <Type className="w-5 h-5 text-[var(--color-text-muted)]" aria-hidden />
                <h3 className="font-bold text-[var(--color-text)] mb-0">{t("language.label")}</h3>
              </div>
              <div className="p-5">
                <label htmlFor="settings-language" className="sr-only">
                  {t("language.label")}
                </label>
                <select
                  id="settings-language"
                  value={i18n.language.startsWith("en") ? "en" : "es"}
                  onChange={(e) => void i18n.changeLanguage(e.target.value)}
                  className="w-full min-h-[44px] border border-[var(--color-border)] rounded-lg px-3 py-2 bg-[var(--color-surface-elevated)] text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer"
                >
                  <option value="es">{t("language.es")}</option>
                  <option value="en">{t("language.en")}</option>
                </select>
              </div>
            </div>

            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm bg-[var(--color-surface-elevated)]">
              <div className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] p-4 flex items-center gap-2">
                <Type className="w-5 h-5 text-[var(--color-text-muted)]" aria-hidden />
                <h3 className="font-bold text-[var(--color-text)] mb-0">{t("settings.fontSize.title")}</h3>
              </div>
              <div className="p-5">
                <div
                  className="grid grid-cols-3 gap-3 bg-[var(--color-surface-muted)] p-1.5 rounded-xl border border-[var(--color-border)]"
                  role="radiogroup"
                  aria-label={t("settings.fontSize.title")}
                >
                  {[
                    { id: "small", sampleClass: "text-xs", labelKey: "settings.fontSize.small" },
                    { id: "normal", sampleClass: "text-base", labelKey: "settings.fontSize.normal" },
                    { id: "large", sampleClass: "text-xl", labelKey: "settings.fontSize.large" },
                  ].map(({ id, sampleClass, labelKey }) => {
                    const selected =
                      fontSize === id ||
                      (id === "small" && fontSize === "pequeña") ||
                      (id === "large" && fontSize === "grande");
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setFontSize(id)}
                        className={`flex flex-col items-center justify-center p-3 min-h-[64px] rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                          selected
                            ? "bg-[var(--color-surface-elevated)] shadow-md border border-[var(--color-border)] text-[var(--color-primary)]"
                            : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]/60"
                        }`}
                      >
                        <span className={`${sampleClass} font-bold mb-1`} aria-hidden>
                          Aa
                        </span>
                        <span className="text-[10px] font-semibold uppercase">{t(labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm bg-[var(--color-surface-elevated)]">
              <div className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] p-4 flex items-center gap-2">
                <Archive className="w-5 h-5 text-[var(--color-text-muted)]" aria-hidden />
                <h3 className="font-bold text-[var(--color-text)] mb-0">{t("backup.title")}</h3>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <p className="text-sm text-[var(--color-text-muted)]">{t("backup.description")}</p>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text)]">{t("backup.autoBackupTitle")}</p>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t("backup.autoBackupDescription")}</p>
                    </div>
                    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={autoBackupEnabled}
                        onChange={(event) => setAutoBackupEnabled(event.target.checked)}
                        aria-label={t("backup.autoBackupTitle")}
                      />
                      <span className="h-6 w-11 rounded-full bg-[var(--color-border)] transition-colors peer-checked:bg-[var(--color-primary)]" aria-hidden />
                      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-[var(--color-surface-elevated)] shadow transition-transform peer-checked:translate-x-5" aria-hidden />
                    </label>
                  </div>

                  {autoBackupEnabled ? (
                    <div className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-4">
                      <button
                        type="button"
                        onClick={() => void handleChooseAutoBackupFolder()}
                        className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-sm font-bold text-[var(--color-text)] shadow-sm transition-colors hover:bg-[var(--color-surface)]"
                      >
                        <FolderOpen className="h-4 w-4" aria-hidden />
                        {t("backup.autoBackupChooseFolder")}
                      </button>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {autoBackupFolderPath
                          ? t("backup.autoBackupFolderValue", { path: autoBackupFolderPath })
                          : t("backup.autoBackupFolderMissing")}
                      </p>
                      <p className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                        <Clock className="h-4 w-4" aria-hidden />
                        {lastAutoBackupAt
                          ? t("backup.autoBackupLastRun", {
                              date: new Date(lastAutoBackupAt).toLocaleString(i18n.language),
                            })
                          : t("backup.autoBackupNeverRun")}
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => void handleExportBackup()}
                    disabled={exportingBackup || importingBackup}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-base font-bold text-[var(--color-on-primary)] shadow-md transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {exportingBackup ? (
                      <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />
                    ) : (
                      <Archive className="h-5 w-5" aria-hidden />
                    )}
                    {exportingBackup ? t("backup.exporting") : t("backup.exportButton")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleImportBackup()}
                    disabled={exportingBackup || importingBackup}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-6 py-3 text-base font-bold text-[var(--color-text)] shadow-sm transition-colors hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {importingBackup ? (
                      <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />
                    ) : (
                      <Archive className="h-5 w-5" aria-hidden />
                    )}
                    {importingBackup ? t("backup.importing") : t("backup.importButton")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
