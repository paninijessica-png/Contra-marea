# Contramarea — Publicación y distribución

**Titular:** Jessica Panini Cuenca · **Package id:** `com.jessicapaninicuenca.contramarea`
**Plataformas objetivo:** Android · iOS · Web · PC

---

## 0. ¿Hace falta un dominio o alojamiento para monetizar?

**No para las tiendas.** Esta es la duda más habitual y conviene dejarla clara:

| Vía de publicación | ¿Necesitas alojar el juego? | ¿Necesitas dominio propio? | ¿Monetizas? |
|---|---|---|---|
| **Google Play** (AAB) | **No** — el juego va dentro del binario | **No** | Sí: AdMob, Unity Ads, AppLovin, ironSource, Meta AN + IAP |
| **App Store** (IPA) | **No** — igual | **No** | Igual que Android |
| **Steam** | **No** | **No** | Sí, pero por **venta del juego** (Steam no admite redes de anuncios móviles) |
| **itch.io** | **No** — se sube el ZIP | **No** | Sí, por venta o donación |
| **Web** | **Sí**, por HTTPS | No (basta un subdominio gratuito) | Solo con anuncios web (AdSense), bastante menos rentable |

**La única URL pública que sí exigen Google Play y App Store es la de la política de privacidad**
—una página suelta, no el juego—. Puede alojarse gratis en GitHub Pages, Netlify, Google Sites o
cualquier servicio similar, sin comprar ningún dominio.

En resumen: **para ganar dinero con anuncios en móvil basta con publicar en las tiendas**; el
alojamiento web solo hace falta si además quieres la versión jugable desde el navegador.

---

## 1. Estado del entregable

| Plataforma | Estado | Qué falta |
|---|---|---|
| **Web** | ✅ **Listo para publicar** | Subir `src/` + `assets/` a un hosting estático |
| **Android** | 🟡 Proyecto listo | `cap add android` + firma + AAB |
| **iOS** | 🟡 Proyecto listo | Requiere macOS con Xcode + firma |
| **PC (Steam / itch.io)** | 🟡 Proyecto listo | `npm run dist` con electron-builder |

El juego es el mismo en las cuatro plataformas: un único código HTML5 sin dependencias. Web
funciona hoy mismo; las demás son envoltorios del mismo contenido.

---

## 2. Publicar en Web (hoy)

```bash
cd Marea
./run.sh                 # o: node tools/serve.js
# abrir http://127.0.0.1:8080/src/index.html
```

Para publicar: subir el contenido de `src/` **junto con `assets/`** a cualquier hosting estático
(Netlify, Vercel, Cloudflare Pages, GitHub Pages, itch.io). El juego ya es una **PWA instalable**
(incluye `manifest.webmanifest`), así que en móvil se instala a pantalla completa.

En itch.io: subir el ZIP y marcar "This file will be played in the browser" con
`src/index.html` como entrada.

### 2.1 Instalar en Android **hoy mismo**, sin compilar nada (PWA)

El juego ya es una **PWA instalable**: incluye `manifest.webmanifest`, service worker (`src/sw.js`)
y funciona sin conexión. Esto significa que **se puede instalar en un Android ahora mismo**, sin
Android Studio, sin SDK y sin firmar un APK:

1. Sube el contenido de `build/web/` a un hosting con **HTTPS** (Netlify, Vercel, Cloudflare Pages
o GitHub Pages — todos gratuitos). El HTTPS es obligatorio: los service workers no funcionan sin él.
2. Abre la URL en **Chrome para Android**.
3. Aparecerá el botón **«Instalar app»** en el menú del juego (o usa el menú de Chrome →
   *Añadir a pantalla de inicio*).
4. El juego queda como un icono más, **a pantalla completa**, sin barra del navegador y
   **jugable sin conexión**.

> **Comprobado automáticamente:** la prueba end-to-end verifica el manifiesto, el service worker
> activo, el caché del juego en el dispositivo y el **arranque sin conexión**.
>
> **Limitación honesta:** una PWA no se puede subir a Google Play. Para publicar en la tienda hace
> falta el AAB (§3). La PWA es la vía para tenerlo instalado y jugable **ya**, y para probarlo con
> personas reales antes de gastar en el alta de desarrollador.

---

## 3. Publicar en Android (Google Play)

```bash
cd Marea
npm install
npx cap add android
npx cap sync android
npx cap open android          # abre Android Studio
```

> **Requisitos que no están en este entorno:** Java (JDK 17+), el **Android SDK** y Gradle. Por eso
> el paquete incluye el proyecto configurado pero **no un `.apk` compilado**: la compilación y la
> firma deben hacerse en una máquina con Android Studio. Ver `DECISIONES.md` D-11.

En Android Studio:
1. Subir `targetSdkVersion` al nivel que exija Google Play ese año (Android Studio avisa).
2. **Generar el keystore de firma** y guardarlo en un lugar seguro — si se pierde, no se pueden
   publicar actualizaciones de la misma app:
   ```bash
   keytool -genkey -v -keystore contramarea.keystore -alias contramarea \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
3. `Build → Generate Signed Bundle / APK → Android App Bundle`.
4. En Play Console: crear la app con el package id `com.jessicapaninicuenca.contramarea`,
   completar Seguridad de los datos, clasificación de contenido y declaración de anuncios
   (ver `CUMPLIMIENTO.md` §3), subir el AAB y las capturas de `store/screenshots/`.

**Antes de compilar el build de producción:** poner `testMode: false` y las unidades de anuncio
reales en `src/js/config.js`.

---

## 4. Publicar en iOS (App Store)

Requiere **macOS con Xcode**.

```bash
npx cap add ios
npx cap sync ios
npx cap open ios              # abre Xcode
```

1. Configurar el *team* de firma con la cuenta de Apple Developer del titular.
2. Añadir la descripción de uso de **ATT** si se activan anuncios personalizados
   (ver `CUMPLIMIENTO.md` §1.7).
3. `Product → Archive → Distribute App → App Store Connect`.
4. En App Store Connect: completar **App Privacy**, subir capturas y la ficha de `store/`.

---

## 5. Publicar en PC

```bash
npm install
npm run desktop      # probar en local con Electron
npm run dist         # genera el instalable en build/
```

Para **Steam**: subir el contenido de `build/` con Steamworks; la tasa de alta es de 100 USD por
título. Para **itch.io**: subir el ZIP de Windows/Linux, que es gratuito.

---

## 6. Checklist de subida a tienda

- [ ] `testMode: false` y unidades de anuncio reales en `config.js`
- [ ] Política de privacidad alojada en una **URL pública**
- [ ] Icono 512×512 (Play) / 1024×1024 (App Store) — ya en `store/` y `assets/icons/`
- [ ] Gráfico destacado 1024×500 (Play) — `store/feature-graphic-1024x500.png`
- [ ] Capturas 1080×1920 — `store/screenshots/` (5 listas)
- [ ] Descripción corta y larga — `store/listing-es.md` / `listing-en.md`
- [ ] Palabras clave / ASO — `store/aso.md`
- [ ] Clasificación de contenido completada
- [ ] Declaración de anuncios: **sí contiene anuncios**
- [ ] Formulario de Seguridad de los datos completado
- [ ] Cuenta de desarrollador **a nombre del titular**
- [ ] Versión y número de compilación coherentes (`1.0.0` / `1`)
- [ ] Probado en un dispositivo físico (no solo en emulador)

---

## 7. Plan de lanzamiento (8 semanas)

| Semana | Hito |
|---|---|
| 1 | Cierre del producto y pruebas internas (hecho en este entregable) |
| 2 | Alta de cuentas de desarrollador, marca y política de privacidad publicada |
| 3 | Build nativo con los SDK de anuncios, modo prueba, pruebas en dispositivo |
| 4 | **Prueba cerrada en Google Play** (12+ probadores, 14 días) y TestFlight en iOS |
| 5 | Corrección de hallazgos, ajuste de dificultad y de frecuencia de anuncios |
| 6 | **Soft launch** en un país LATAM (p. ej. Ecuador o Bolivia) para medir D1/D7 y ARPDAU |
| 7 | Optimización de la ficha con los datos del soft launch (ASO y capturas) |
| 8 | **Lanzamiento global** en Android, iOS, web y PC |

> Google Play exige una **prueba cerrada con al menos 12 probadores durante 14 días** para cuentas
> personales nuevas antes de poder publicar en producción. Por eso la prueba cerrada está en la
> semana 4 y no al final: es el plazo más largo y condiciona la fecha.

---

## 8. Riesgos de publicación y mitigación

| Riesgo | Mitigación |
|---|---|
| Rechazo por falta de política de privacidad | Redactada (`src/privacy.html`); solo falta alojarla |
| Rechazo por anuncios mal integrados | Modo prueba activo y reglas de frecuencia ya implementadas |
| Bloqueo de cuenta de anuncios por clics propios | No tocar nunca anuncios reales; mantener modo prueba hasta el build final |
| Rechazo por similitud con otro juego | Informe de originalidad (84/100) listo como evidencia |
| Retraso por la prueba cerrada de Play | Iniciada en la semana 4, con 4 semanas de margen |
| Pérdida del keystore de firma | Generarlo una vez y guardarlo en un gestor de contraseñas |
