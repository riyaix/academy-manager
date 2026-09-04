/** Legacy localStorage keys used before SQLite — cleared on startup. */
export const LEGACY_DOMAIN_STORAGE_KEYS = [
  "app_nombre",
  "app_subtitulo",
  "app_tipo_impuestos",
  "app_iva",
  "app_irpf",
  "app_moneda",
  "app_metodos",
  "app_payment_record_seq",
  "app_color",
  "app_logo",
  "app_separador_dni",
  "db_clientes",
  "db_productos",
  "db_facturas",
  "db_grupos",
  "db_matriculas",
  "app_gastos_fijos",
  "app_datos_academia",
  "app_tamano_fuente",
  "app_fuente_global",
] as const;

/** Remove all pre-SQLite domain keys from localStorage. */
export function clearLegacyDomainStorage(): void {
  if (typeof window === "undefined") return;

  try {
    for (const key of LEGACY_DOMAIN_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore quota / privacy errors
  }
}
