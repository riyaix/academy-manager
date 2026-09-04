import React from "react";
import ReactDOM from "react-dom/client";
/* Fontsource via JS so Vite emits @font-face + woff2 (CSS @import under Tailwind v4 drops them). */
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/atkinson-hyperlegible/400-italic.css";
import "@fontsource/atkinson-hyperlegible/700-italic.css";
import App from "./App";
import "./index.css";
import { clearLegacyDomainStorage } from "./core/storage/clearLegacyDomainStorage";
import { I18nProvider } from "./app/providers/I18nProvider";
import { UiProvider } from "./app/providers/UiProvider";
import { NavigationProvider } from "./app/navigation/NavigationProvider";
import { DatabaseProvider } from "./app/providers/DatabaseProvider";
import { applyAppFont } from "./core/theme/fonts";
import { applyColorScheme, readStoredColorScheme } from "./core/theme/colorScheme";

clearLegacyDomainStorage();
applyAppFont();
applyColorScheme(readStoredColorScheme());

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <I18nProvider>
      <UiProvider>
        <DatabaseProvider>
          <NavigationProvider>
            <App />
          </NavigationProvider>
        </DatabaseProvider>
      </UiProvider>
    </I18nProvider>
  </React.StrictMode>,
);
