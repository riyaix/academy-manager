import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "../../../app/store/appStore";

export function useSettingsStore() {
  return useAppStore(
    useShallow((state) => ({
      brandColor: state.brandColor,
      setBrandColor: state.setBrandColor,
      logoDataUrl: state.logoDataUrl,
      setLogoDataUrl: state.setLogoDataUrl,
      organization: state.organization,
      setOrganization: state.setOrganization,
      fontSize: state.fontSize,
      setFontSize: state.setFontSize,
      colorScheme: state.colorScheme,
      setColorScheme: state.setColorScheme,
      taxIdSeparator: state.taxIdSeparator,
      setTaxIdSeparator: state.setTaxIdSeparator,
      autoBackupEnabled: state.autoBackupEnabled,
      setAutoBackupEnabled: state.setAutoBackupEnabled,
      autoBackupFolderPath: state.autoBackupFolderPath,
      setAutoBackupFolderPath: state.setAutoBackupFolderPath,
      lastAutoBackupAt: state.lastAutoBackupAt,
      appName: state.appName,
      setAppName: state.setAppName,
      appSubtitle: state.appSubtitle,
      setAppSubtitle: state.setAppSubtitle,
    })),
  );
}
