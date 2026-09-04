# Análisis del Proyecto Facturador

**Fecha:** 17 de julio de 2026  
**Alcance:** Revisión integral desde cuatro perspectivas — desarrollo senior, seguridad, autónomo con academia en España y UI/UX.  
**Versión analizada:** 0.1.0 (Tauri 2 + React 19 + Vite 7)

---

## Resumen ejecutivo

**Facturador** es una aplicación de escritorio (Tauri) orientada a la gestión integral de una academia privada: alumnos, cursos, grupos, matrículas, calendario, facturación en lote y manual, historial con PDF, dashboard analítico y personalización de marca.

Es un **MVP funcional y ambicioso** con una visión de producto clara y una interfaz cuidada. El código demuestra conocimiento del dominio (agrupación familiar por DNI, cuotas mensuales, aforo de grupos, morosidad). Sin embargo, hoy es más un **gestor operativo interno** que un sistema de facturación legalmente válido en España.

| Dimensión | Valoración | Comentario breve |
|-----------|------------|------------------|
| Desarrollo / arquitectura | 6.5/10 | Buena base React, pero monolito con prop drilling, bugs de integración y sin tests |
| Seguridad / privacidad | 4/10 | Datos sensibles en `localStorage` sin cifrar, sin copias de seguridad ni control de acceso |
| Cumplimiento fiscal España | 3/10 | PDFs informativos, no facturas legales; sin VeriFactu, IVA/IRPF en documentos ni numeración fiable |
| UI/UX | 7.5/10 | Diseño coherente, flujos pensados para el día a día; algunos fallos de navegación y accesibilidad |
| Valor para academia | 8/10 | Resuelve dolores reales: mensualidades, hermanos, grupos, calendario, morosidad |

**Veredicto:** Excelente punto de partida para **gestionar la academia**. No sustituye todavía a un software de facturación homologado ni a la contabilidad del autónomo. Con correcciones focalizadas (bugs, PDF fiscal, persistencia nativa, backup) puede convertirse en herramienta de producción para uso interno.

---

## 1. Visión general del producto

### Qué hace bien

- **Flujo mensual completo:** grupos → matrículas activas → facturación en lote → historial → seguimiento de cobros.
- **Agrupación familiar inteligente:** varios alumnos con el mismo DNI (hermanos) se facturan al titular en una sola factura.
- **Modelo de datos académico:** separación tutor/alumno, cursos con cuota, grupos con horario y aforo, matrículas con altas/bajas.
- **Dashboard operativo:** KPIs, gráficos (Recharts), clases del día, avisos de pago pendiente.
- **Utilidades prácticas:** exportación CSV/PDF de clientes, lista de asistencia imprimible, calendario semanal/mensual.
- **Personalización:** logo, color corporativo, tipografía y tamaño de fuente.

### Stack técnico

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, Lucide, jsPDF, Recharts |
| Desktop | Tauri 2 (casi sin uso del backend Rust) |
| Persistencia | `localStorage` vía hook `useLocalStorage` |
| Líneas de código (src) | ~3.720 |

Tauri está configurado pero **no aporta valor real todavía**: el backend Rust solo expone un comando `greet` de plantilla. Toda la lógica y los datos viven en el frontend web.

---

## 2. Análisis como desarrollador senior

### Fortalezas

1. **Dominio bien modelado en la práctica.** Los conceptos de academia (grupo, matrícula, cuota, titular vs alumno) están reflejados en componentes y flujos, no solo en nombres.
2. **UI componentizada por módulos funcionales.** Cada sección del menú lateral corresponde a un componente con responsabilidad clara.
3. **Uso razonable de React moderno:** `useMemo` para filtros y gráficos, estados locales donde corresponde.
4. **Formato español en formularios:** DNI con separadores configurables, CP que infiere ciudad, teléfono con máscara.
5. **Dependencias actuales y apropiadas** para el tamaño del proyecto.

### Debilidades arquitectónicas

#### Monolito con prop drilling extremo

`App.jsx` concentra **todo el estado global** (~15 claves de `localStorage`) y lo pasa en cascada a los hijos. Esto escala mal y ya produce inconsistencias:

```jsx
// App.jsx pasa setVistaActiva
<Dashboard setVistaActiva={setVistaActiva} ... />

// DashboardAcademia.jsx espera navegarConAccion (no existe)
function DashboardAcademia({ ..., navegarConAccion }) {
  <button onClick={() => navegarConAccion('factura', 'lote')}>
```

**Impacto:** Los botones de acción rápida del dashboard (emitir mensualidad, nuevo alumno, crear grupo, etc.) **no funcionan** en runtime.

#### Props muertas / configuración desconectada

| Configuración en App | ¿Se usa realmente? |
|---------------------|-------------------|
| `metodosPago` → FormularioFactura | Pasado pero **no declarado** en el componente |
| `gastosFijos`, `irpfDefecto`, `moneda` → Dashboard | Pasados pero **no usados** en Dashboard |
| `tipoImpuestos`, `ivaDefecto`, `irpfDefecto` | Solo en Ajustes; **no en PDFs ni totales** |
| `datosAcademia` | Solo en Ajustes; **no aparece en facturas PDF** |

La configuración fiscal y de empresa existe en la UI pero **no llega al documento de factura**, que es donde más importa.

#### Numeración de facturas frágil

```javascript
const num = facturas.filter(f => f.id && f.id.includes(`F-${año}-`)).length + correlativoActual + 1;
```

Problemas:
- En lote, cada factura llama `generarIdFactura(index)` con índices 0, 1, 2… pero todas leen el **mismo** `facturas.length` inicial → **riesgo de IDs duplicados**.
- Si se borran facturas del año, la numeración puede **reutilizar números** (ilegal fiscalmente).
- No hay serie única ni control de huecos/anulaciones según normativa.

#### Sin protección contra doble facturación

No existe comprobación de si un grupo/alumno ya fue facturado para el mes indicado (`mesCobro`). Un clic repetido en "Generar facturas" puede duplicar cobros del mismo periodo.

#### Persistencia solo en `localStorage`

- Límite de ~5–10 MB según navegador/motor web.
- El logo en base64 (`Ajustes`) puede llenar el almacenamiento rápidamente.
- Inconsistencia: `DisenoFactura` guarda el logo como `blob:` URL (no persistente tras recargar de forma fiable), mientras `Ajustes` usa `FileReader` → base64.
- Sin migraciones de esquema: un cambio de estructura de datos puede romper datos existentes.

#### Tauri infrautilizado

Oportunidad perdida de usar Rust para:
- SQLite / archivo JSON cifrado en disco
- Backups automáticos
- Diálogos nativos de guardar/abrir
- Impresión directa
- Almacenamiento seguro de credenciales

#### Calidad de código

| Aspecto | Estado |
|---------|--------|
| Tests | ❌ Ninguno |
| TypeScript | ❌ No |
| README | ❌ No |
| Linting/formato en CI | ❌ No visible |
| Manejo de errores | `alert()` / `confirm()` básicos |
| Historial de alumno | **Datos mock** hardcodeados en `GestionClientes` |

#### Componentes muy grandes

Varios archivos superan 400–600 líneas (`GestionClientes`, `GestionGrupos`, `DashboardAcademia`, `FormularioFactura`). Funcionan, pero dificultan mantenimiento y pruebas.

### Recomendaciones técnicas prioritarias

1. **Corregir `navegarConAccion`** — implementar en `App.jsx` una función que cambie vista y, opcionalmente, modo/sub-acción.
2. **Centralizar generación de PDF** en un módulo `generarFacturaPDF(factura, config)` que reciba `datosAcademia`, impuestos y logo.
3. **Secuenciador de facturas** con contador persistente independiente del array (nunca reutilizar números).
4. **Capa de datos en Tauri:** SQLite + comandos `load_db` / `save_db` / `export_backup`.
5. **Context API o Zustand** para estado global en lugar de 15 props por componente.
6. **Tests unitarios** mínimos: numeración, agrupación por DNI, cálculo de totales, filtros.

---

## 3. Análisis de seguridad y privacidad

### Datos sensibles almacenados

La aplicación guarda en `localStorage` sin cifrado:

- DNI/NIE de tutores y alumnos
- Direcciones postales completas
- Teléfonos y emails
- Datos de menores (nombre, edad)
- Historial financiero (facturas, importes, estados de pago)
- Logo de empresa (base64)

### Riesgos identificados

| Riesgo | Severidad | Detalle |
|--------|-----------|---------|
| Sin cifrado en reposo | Alta | Cualquiera con acceso al PC lee `localStorage` desde DevTools o copiando perfil del webview |
| Sin autenticación | Media-Alta | No hay usuario/contraseña ni bloqueo de sesión |
| Sin copia de seguridad | Alta | Borrado accidental, corrupción o actualización mala = pérdida total de datos |
| RGPD / LOPDGDD | Alta | Datos de menores sin base legal documentada, sin política de privacidad, sin exportación/borrado RGPD, sin registro de tratamiento |
| CSP desactivada | Media | `"csp": null` en `tauri.conf.json` |
| Exportación CSV sin control | Media | Fichero con DNIs en texto plano, sin auditoría de quién exporta |
| Validación DNI | Baja | Formato visual sí; **no valida letra de control** del DNI/NIE |
| Nombres en archivos PDF | Baja | `factura.id_nombreCliente.pdf` puede exponer datos en carpeta Descargas compartida |

### Aspectos positivos

- Aplicación **100% local** (sin envío a servidores externos por defecto).
- Permisos Tauri mínimos (`core:default`, `opener:default`).
- No se detectaron API keys ni secretos en el código.

### Recomendaciones de seguridad

1. **Persistencia cifrada** vía Tauri (`tauri-plugin-stronghold` o SQLite con SQLCipher).
2. **PIN o contraseña** al abrir la app (imprescindible si hay datos de menores).
3. **Backup automático** diario a carpeta elegida por el usuario (JSON cifrado o `.db`).
4. **Política de privacidad** integrada + consentimiento en alta de alumno.
5. **Exportación RGPD:** botón "Exportar / eliminar datos de este alumno".
6. **Activar CSP** en producción.
7. **Validar DNI/NIE** con algoritmo oficial antes de guardar.

---

## 4. Análisis fiscal y operativo (autónomo con academia en España)

### Lo que el proyecto entiende bien del contexto español

- **IVA 0% por defecto** en ajustes ("Exento de IVA") — coherente con muchas actividades de **enseñanza reglada/no reglada** (art. 20 Ley 37/1992 del IVA), aunque hay matices según tipo de centro y titulación.
- **IRPF 20%** como "reserva" en ajustes — refleja la cultura del autónomo de apartar para el trimestre (aunque no se aplica en facturas).
- **Métodos de pago españoles:** domiciliación, Bizum, TPV, transferencia.
- **Formato de identificación:** CIF/NIF con puntos, DNI configurable.
- **Dirección española** desglosada (tipo vía, piso, puerta, CP).
- **Terminología adaptada:** "Alumnos / Clientes", cuotas, mensualidades, morosidad → "Avisos de Pago".

### Lo que falta para uso fiscal real

#### Factura legal vs. recibo interno

El PDF generado en `HistorialFacturas.jsx` incluye:
- Número y fecha
- Cliente (nombre, DNI, dirección, teléfono)
- Líneas de concepto
- Total

**No incluye (obligatorio o habitual en factura española):**
- Datos completos del **emisor** (tu academia: nombre, NIF/CIF, domicilio fiscal) — están en `datosAcademia` pero no se usan
- Desglose de **base imponible, IVA, IRPF** (aunque sea 0% o exento, debe indicarse)
- Mención de **exención de IVA** con artículo legal si aplica
- **Forma de pago** y vencimiento
- Régimen de IVA / operación
- Para autónomos: posible mención de **retención IRPF** si facturas a empresas

#### VeriFactu y normativa 2025–2026

Desde 2025, España exige que el software de facturación garantice **integridad, trazabilidad y verificabilidad** (sistema VeriFactu / Ley 11/2021, RD 1007/2023). Este proyecto:

- ❌ No genera hash encadenado de facturas
- ❌ No envía/registra en AEAT
- ❌ No impide alteración de facturas emitidas (se puede cambiar estado, no hay auditoría)
- ❌ Permite "anular" sin nota de abono o factura rectificativa formal

**Para un autónomo con academia:** usar esto como único sistema de facturación ante Hacienda **no es adecuado** hoy. Sirve como gestor de cobros internos; las facturas legales deberían generarse en software homologado (Holded, Quipu, A3, etc.) o cumplir VeriFactu.

#### Numeración y series

La normativa exige numeración **correlativa, única y sin huecos injustificados** por serie. El sistema actual no garantiza esto.

#### Modelo tutor/alumno y facturación

La agrupación por DNI para hermanos es **excelente operativamente**, pero fiscalmente conviene clarificar:
- ¿Facturas al padre/madre como pagador? (habitual en academias)
- ¿Un alumno = un registro cliente o una familia = un cliente? Hoy mezcla ambos (cada hijo es `COD_CLI` pero se agrupa por DNI en lote).

#### Menores y protección de datos

Academias con niños deben cumplir RGPD con especial diligencia (art. 8, consentimiento parental, información clara). La app guarda edad y nombre del menor sin flujo de consentimiento.

#### Contabilidad del autónomo

El dashboard muestra ingresos cobrados/pendientes pero **no:**
- Gastos deducibles (solo `gastosFijos` en estado, sin UI ni uso)
- Modelo 303 / 130
- Libro de ingresos y gastos
- Conciliación bancaria
- Diferencia entre facturado y cobrado a efectos fiscales (devengo vs caja)

### Recomendación práctica para el autónomo

| Uso | ¿Adecuado? |
|-----|------------|
| Gestión diaria de alumnos, grupos y calendario | ✅ Sí |
| Generar listados de cuotas mensuales | ✅ Sí |
| Control de quién ha pagado | ✅ Sí |
| Emitir PDF para enviar al cliente como "recibo de pago" | ⚠️ Con mejoras (datos emisor, IVA) |
| Factura legal ante Hacienda / VeriFactu | ❌ No todavía |
| Sustituir al gestor / software contable | ❌ No |

---

## 5. Análisis UI/UX

### Fortalezas

1. **Jerarquía visual clara:** sidebar oscuro fijo + área de contenido clara; se entiende dónde estás.
2. **Lenguaje del usuario:** textos en español natural orientado a academia, no jerga técnica.
3. **Flujos guiados:** facturación en lote en 3 pasos numerados; formularios con labels explícitos.
4. **Feedback visual:** toasts de éxito, badges de estado (Pagada/Pendiente/Anulada), colores semánticos.
5. **Densidad de información bien balanceada** en dashboard: KPIs arriba, detalle abajo.
6. **Micro-interacciones:** hover en tarjetas, `hover:scale` en CTA principal, estados disabled en botones.
7. **Personalización de accesibilidad visual:** tamaño de fuente (pequeña/normal/grande) y familia tipográfica — poco común y muy útil para uso diario prolongado.
8. **Estados vacíos** con iconos e instrucciones ("Selecciona al menos un grupo").
9. **Previsualización antes de facturar en lote** — reduce errores y da confianza.

### Problemas de UX

| Problema | Impacto |
|----------|---------|
| Botones del dashboard rotos (`navegarConAccion`) | Alto — flujo principal interrumpido |
| Ventana por defecto 800×600 | Alto — dashboard y tablas quedan comprimidos |
| Tabla de clientes con 16 columnas | Medio — scroll horizontal excesivo en portátiles |
| `alert()` / `confirm()` nativos | Medio — rompen la estética y no son accesibles |
| Logo: dos pantallas (`Ajustes` vs `Diseño`) con comportamientos distintos | Medio — confusión |
| Historial de alumno con datos falsos | Medio — el usuario cree ver datos reales |
| Sin indicador de "guardado" continuo | Bajo — en realidad guarda solo, pero "Guardar Cambios" en Ajustes sugiere que hay que pulsar |
| Emojis in select de estado | Resuelto — usar iconos `lucide-react` y texto plano en `<select>` |
| Checkbox dentro de div clickable en selección de grupos | Bajo — doble activación, accesibilidad |

### Accesibilidad (a11y)

- Falta `aria-label` en botones solo con icono (descargar, marcar pagada).
- Contraste generalmente bueno (Tailwind gray/blue).
- Navegación por teclado no optimizada en modales y tablas.
- Sin modo oscuro (la sidebar es oscura pero el contenido no).

### Sugerencias UX prioritarias

1. Arreglar navegación desde dashboard.
2. Ventana mínima **1280×800** o responsive más agresivo.
3. Vista "resumida" de clientes + panel lateral de detalle (master-detail).
4. Modal custom para confirmaciones en lugar de `confirm()`.
5. Unificar diseño de factura solo en un sitio (eliminar duplicidad Ajustes / Diseño).
6. Onboarding inicial: "Configura tus datos fiscales" la primera vez.

---

## 6. Mapa de módulos

```
┌─────────────────────────────────────────────────────────────┐
│                        App.jsx (estado global)              │
│  localStorage: clientes, productos, facturas, grupos,       │
│  matrículas, ajustes, logo, impuestos...                    │
└─────────────────────────────────────────────────────────────┘
         │
         ├── DashboardAcademia    → KPIs, gráficos, alertas, CTA mensualidad
         ├── FormularioFactura    → Lote (grupos) + manual
         ├── HistorialFacturas    → Filtros, estados, PDF
         ├── GestionClientes      → CRUD, export CSV/PDF
         ├── GestionProductos     → Catálogo de cursos/cuotas
         ├── GestionGrupos        → Grupos, matrículas, asistencia PDF
         ├── Calendario           → Vista semanal/mensual/diaria
         ├── DisenoFactura        → Logo y color (parcialmente duplicado)
         └── Ajustes              → Empresa, impuestos, tipografía, DNI
```

---

## 7. Bugs y deuda técnica confirmados

| # | Severidad | Descripción |
|---|-----------|-------------|
| 1 | 🔴 Crítico | `navegarConAccion` no definido; dashboard no navega |
| 2 | 🔴 Crítico | PDF de factura sin datos del emisor (`datosAcademia`) |
| 3 | 🔴 Crítico | IVA/IRPF configurados pero no aplicados en facturas ni PDF |
| 4 | 🟠 Alto | Posibles IDs de factura duplicados en generación en lote |
| 5 | 🟠 Alto | Sin prevención de doble facturación del mismo mes/grupo |
| 6 | 🟠 Alto | Logo: `blob:` URL en Diseño vs base64 en Ajustes — inconsistencia |
| 7 | 🟡 Medio | Historial académico del alumno es mock, no datos reales |
| 8 | 🟡 Medio | `metodosPago`, `gastosFijos`, `irpfDefecto` pasados pero no usados |
| 9 | 🟡 Medio | IDs de cliente/producto basados en último elemento del array (frágil si se borra/reordena) |
| 10 | 🟢 Bajo | Comando Rust `greet` sin eliminar (código muerto) |
| 11 | 🟢 Bajo | Sin README ni documentación de desarrollo |

---

## 8. Roadmap sugerido

### Fase 1 — Estabilización (1–2 semanas)

- [ ] Corregir navegación del dashboard
- [ ] Unificar generación de PDF con datos de empresa e impuestos
- [ ] Arreglar numeración secuencial de facturas
- [ ] Aviso si ya existen facturas del mismo `mesCobro` para un grupo
- [ ] Unificar almacenamiento del logo (siempre base64 o siempre fichero vía Tauri)
- [ ] Ventana por defecto más grande

### Fase 2 — Producción interna (3–4 semanas)

- [ ] Persistencia SQLite vía Tauri
- [ ] Backup / restauración manual y automática
- [ ] Exportación/importación completa de datos (JSON)
- [ ] Historial real de cursos por alumno (desde matrículas)
- [ ] PIN de acceso a la aplicación

### Fase 3 — Cumplimiento España (según necesidad)

- [ ] Evaluar obligación VeriFactu según tu régimen y facturación
- [ ] Integración con software contable o API de facturación homologada
- [ ] Factura rectificativa en lugar de simple "Anulada"
- [ ] Menciones legales IVA en PDF
- [ ] Flujo RGPD: consentimiento y exportación de datos

### Fase 4 — Producto (opcional)

- [ ] Recordatorios de pago por email (con consentimiento)
- [ ] Domiciliación SEPA / referencia de mandato
- [ ] App multi-usuario (profesores vs administración)
- [ ] Sincronización en la nube cifrada

---

## 9. Conclusión final

Has construido algo **genuinamente útil** para el día a día de una academia: el flujo de mensualidades en lote con agrupación de hermanos, el calendario de grupos y el panel de morosidad demuestran que conoces el problema real, no solo el código.

Como **producto de gestión académica**, está en un buen camino. Como **sistema de facturación para un autónomo en España**, necesita trabajo en cumplimiento legal, integridad de facturas y trazabilidad antes de confiar en él para Hacienda.

La prioridad inmediata no es añadir más funciones, sino **cerrar las brechas entre lo que la UI promete y lo que el sistema entrega** (navegación, PDFs completos, impuestos, numeración) y **proteger los datos** que ya gestionas.

---

*Documento generado tras revisión estática del código fuente. No se han ejecutado pruebas de runtime ni auditoría dinámica.*
