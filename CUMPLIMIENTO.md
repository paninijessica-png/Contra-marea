# Contramarea — Cumplimiento de monetización y tiendas

**Titular:** Jessica Panini Cuenca · **Package id:** `com.jessicapaninicuenca.contramarea`

Checklist de la **Fase 4**. Un punto pendiente **bloquea la entrega**. Marcar cada casilla con
evidencia antes de subir el build.

---

## 1. Consentimiento y privacidad del usuario

| # | Requisito | Estado | Evidencia |
|---|---|---|---|
| 1.1 | Diálogo de consentimiento **antes de cargar cualquier anuncio** | ✅ Implementado | `src/js/monetization.js` → `needsConsent()`, pantalla `screen-consent` |
| 1.2 | Opción de **rechazar anuncios personalizados** y seguir jugando | ✅ Implementado | Botón "Solo lo necesario" en la pantalla de consentimiento |
| 1.3 | La elección se guarda y se respeta en arranques posteriores | ✅ Implementado | `M.Save` → `consent` (probado en la prueba E2E) |
| 1.4 | Política de privacidad publicada y enlazada | ✅ Redactada | `src/privacy.html` — **falta alojarla en una URL pública** |
| 1.5 | Enlace a la política desde dentro de la app (Ajustes) | ✅ Implementado | Botón "Privacidad" en Ajustes |
| 1.6 | RGPD / UMP en el Espacio Económico Europeo | ⚠️ Pendiente | Requiere el SDK de UMP de Google en el build nativo (ver §6) |
| 1.7 | **ATT** (App Tracking Transparency) en iOS 14.5+ | ⚠️ Pendiente | Requiere el plugin nativo; el texto de uso está preparado en `config.js` |

## 2. Reglas de las redes de anuncios (evitar bloqueos de cuenta)

| # | Requisito | Estado |
|---|---|---|
| 2.1 | **Modo prueba activo** con unidades de prueba | ✅ `testMode: true` en `config.js` |
| 2.2 | Ningún clic ni impresión simulada en producción durante el desarrollo | ✅ Las unidades de prueba no generan ingresos ni riesgo |
| 2.3 | Anuncios **no incentivados** presentados como recompensa | ✅ El rewarded siempre entrega recompensa real y se anuncia como tal |
| 2.4 | Sin anuncios que imiten la interfaz del juego | ✅ Los anuncios del stub son claramente externos |
| 2.5 | Sin anuncios superpuestos a los controles de juego | ✅ Banner solo en menús |
| 2.6 | Frecuencia no abusiva | ✅ Intersticial cada 3 niveles, mínimo 90 s |
| 2.7 | Sin contenido para adultos ni categorías restringidas | ✅ Contenido apto para todos los públicos |
| 2.8 | Cumplimiento de la política de **Familias** (si se etiqueta para niños) | ⚠️ Decisión del titular: si se marca "Familias", hay que usar solo anuncios no personalizados y quitar el rewarded de gemas |

## 3. Google Play — requisitos de revisión

| # | Requisito | Estado |
|---|---|---|
| 3.1 | Formato **AAB** (no APK) | ⚠️ Pendiente de compilar |
| 3.2 | `targetSdkVersion` al nivel exigido por Google Play en el año de publicación | ⚠️ Configurar al compilar |
| 3.3 | Soporte **64 bits** | ✅ Capacitor/WebView lo cubre |
| 3.4 | Formulario de **Seguridad de los datos** | ⚠️ Completar en Play Console (ver §5) |
| 3.5 | **Política de privacidad** con URL pública | ⚠️ Alojar `src/privacy.html` |
| 3.6 | **Clasificación por contenido** (cuestionario IARC) | ⚠️ Completar: apto para todos |
| 3.7 | Declaración de **anuncios presentes** | ⚠️ Marcar "sí contiene anuncios" |
| 3.8 | Sin infracción de propiedad intelectual | ✅ Ver `ORIGINALIDAD.md` (84/100) |
| 3.9 | Función principal funcional sin registro | ✅ Juego completo sin cuenta |
| 3.10 | Icono 512×512 y gráfico destacado 1024×500 | ✅ Generados en `store/` |
| 3.11 | Capturas de pantalla reales | ✅ 5 capturas 1080×1920 en `store/screenshots/` |
| 3.12 | Sin uso de permisos innecesarios | ✅ Solo se declara acceso a red para anuncios |

## 4. Apple App Store — requisitos de revisión

| # | Requisito | Estado |
|---|---|---|
| 4.1 | **Detalles de privacidad de la app** (App Privacy) | ⚠️ Completar en App Store Connect |
| 4.2 | Prompt **ATT** con texto de uso claro | ⚠️ Pendiente en build nativo |
| 4.3 | Compras dentro de la app **solo** por StoreKit (sin enlaces de pago externos) | ✅ Implementado |
| 4.4 | Botón **Restaurar compras** | ✅ En Ajustes |
| 4.5 | Sin contenido de relleno ni app "mínima" (guía 4.2) | ✅ 24 niveles + modo infinito |
| 4.6 | Sin copia de otras apps (guía 4.1 / 5.x) | ✅ Ver `ORIGINALIDAD.md` |
| 4.7 | Capturas correctas por tamaño de dispositivo | ⚠️ Añadir las de iPad si se publica en iPad |
| 4.8 | Sin uso de APIs privadas | ✅ |
| 4.9 | Cuenta de desarrollador del titular | ⚠️ Requiere alta de la cuenta (ver `TITULARIDAD.md`) |

## 5. Declaración de Seguridad de los datos (borrador para Play Console)

| Pregunta | Respuesta |
|---|---|
| ¿La app recopila o comparte datos? | **Sí** (por los SDK de anuncios) |
| Datos recopilados por terceros | Identificador de publicidad, datos de uso e interacción con anuncios, diagnósticos |
| ¿Se comparten con terceros? | Sí, con las redes de anuncios declaradas |
| Datos cifrados en tránsito | Sí (HTTPS) |
| ¿El usuario puede solicitar la eliminación? | No aplica: el titular no almacena datos personales; el usuario borra los locales desde Ajustes |
| Datos personales sensibles | Ninguno |
| Datos de menores | No se recogen conscientemente |

## 6. Trabajo pendiente en el build nativo (no bloquea la entrega web)

Estos puntos requieren los SDK nativos y **no pueden completarse en el entorno web**:

1. Añadir el **SDK de UMP** de Google para el consentimiento RGPD y llamar a
   `requestConsentInfoUpdate` en el arranque nativo.
2. Añadir el **prompt ATT** en iOS antes de inicializar los SDK de anuncios.
3. Sustituir las unidades de prueba por las reales en `config.js` y poner `testMode: false`.
4. Inicializar los SDK de cada red (AppLovin MAX, ironSource, Unity Ads, Meta) con sus claves.
5. Verificar en dispositivo físico que el banner no aparece durante la partida.

El código ya está **estructurado para ese trabajo**: toda la integración vive en
`src/js/monetization.js` y las claves en `src/js/config.js`, sin tocar la lógica del juego.

## 7. Resultado del checklist

- **Bloqueantes resueltos en el entregable:** consentimiento, política de privacidad redactada,
  modo prueba, reglas de frecuencia, IAP conforme, material de tienda, originalidad verificada.
- **Pendientes que dependen del titular o del build nativo:** alojar la política de privacidad en
  una URL pública, alta de cuentas de desarrollador, completar formularios de tienda, añadir los
  SDK nativos de consentimiento/ATT y firmar los binarios.

Ninguno de los pendientes es un defecto del producto: todos requieren credenciales, cuentas o
cadenas de compilación que solo el titular puede aportar. El procedimiento está en `PUBLICACION.md`.
