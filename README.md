# Contramarea

**Puzzle casual original — fusiona el arrecife y detén la marea.**

- **Titular / Desarrollador:** Jessica Panini Cuenca
- **Package id:** `com.jessicapaninicuenca.contramarea`
- **Versión:** 1.0.0
- **Género:** Casual / Puzzle (merge con marea ascendente)
- **Plataformas objetivo:** Android · iOS · Web · PC

---

## ¿Qué es?

Un puzzle de fusión sobre una rejilla de 5×5. Deslizas y las piezas iguales se
combinan en corales cada vez mayores. **La marea sube un punto por movimiento y
cada fusión la empuja hacia atrás**: si la marea llega al máximo, inunda el
arrecife. La tensión del juego es esa — no basta con fusionar, hay que fusionar
*para contener el agua*.

Piezas: Brote → Coralito → Coral → Anémona → Estrella → Perla → **Arrecife**.

### Cómo se juega
- **Móvil:** desliza el dedo sobre el tablero.
- **Teclado:** flechas o WASD.
- **Poderes:** Corriente (barre las piezas nivel 1), Bajamar (baja la marea 3) y Ancla (guarda 2 piezas para soltarlas después).
- 24 niveles con 4 tipos de objetivo + modo **Mar abierto** sin límite.

---

## Jugar sin instalar nada (doble clic)

**Descomprime el ZIP y haz doble clic en `src/index.html`.** Se abre en el navegador y se juega.
No hace falta servidor, ni internet, ni instalar nada. También vale `build/web/index.html`.

*Comprobado automáticamente* (`node tools/test_local_file.js`): arranca, se juega, guarda el
progreso y no genera ningún error en consola abriéndolo con `file://`.

> Nota: jugando así no se instala como app (eso requiere servirse por HTTPS), pero el juego
> es idéntico y funciona al 100 %.

## Ejecutarlo con servidor local (opcional)

```bash
cd Marea
./run.sh          # Linux / macOS
run.bat           # Windows
```

o manualmente:

```bash
node tools/serve.js       # http://127.0.0.1:8080/src/index.html
```

---

## Instalarlo en tu Android ahora mismo (sin compilar nada)

El juego es una **PWA instalable** (manifiesto + service worker + funcionamiento sin conexión),
así que se instala en Android en 2 minutos y sin herramientas de desarrollo:

1. Sube el contenido de `build/web/` a un hosting **con HTTPS** (Netlify, Vercel, Cloudflare Pages
o GitHub Pages — todos gratuitos).
2. Abre esa URL en **Chrome para Android**.
3. Aparecerá el botón **«Instalar app»** en el menú del juego (o Chrome → *Añadir a pantalla de inicio*).
4. Queda como un icono más, a pantalla completa y **jugable sin conexión**.

> Una PWA no se puede subir a Google Play: para eso hace falta el AAB de la sección siguiente.
> La PWA sirve para tenerlo instalado y jugable ya, y para probarlo con personas reales.

---

## Compilar para cada plataforma

### Android (Google Play → AAB)

El proyecto Android **ya está generado y configurado** en `android/`: no hace falta
`npx cap add android`. Incluye `minSdkVersion 24`, `targetSdkVersion 36`, el plugin de
AdMob enlazado, el meta-data con el ID de prueba de Google y los iconos integrados.

**Guía paso a paso completa: [`docs/GUIA-ANDROID.md`](docs/GUIA-ANDROID.md)**

```bash
# APK de pruebas para instalar en tu teléfono
./tools/build_apk.sh
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# AAB firmado para Google Play (requiere keystore, ver la guía)
cd android && ./gradlew bundleRelease
```

Requiere **JDK 21** y **Android Studio** con la plataforma SDK de API 36. Android Studio
incluye el JDK, así que no hace falta instalar Java aparte salvo que compiles desde la terminal.

**¿Sin Android Studio?** Compílalo en la nube con GitHub Actions:
[`docs/GITHUB-ACTIONS.md`](docs/GITHUB-ACTIONS.md). Sube el proyecto a GitHub y el workflow
`.github/workflows/android.yml` instala JDK 21 y el Android SDK, compila el APK y te lo deja
como archivo descargable. No hace falta instalar nada en el ordenador.

- `applicationId`: `com.jessicapaninicuenca.contramarea`.
- **Antes de publicar:** `testMode: false` en `src/js/config.js`, IDs reales de AdMob e ID de
  aplicación real en `AndroidManifest.xml` (la guía lo detalla).

### iOS (App Store)
```bash
npm install
npx cap add ios
npx cap sync ios
npx cap open ios        # Xcode → Product > Archive
```
Requiere macOS con Xcode. Añade la descripción de uso de ATT si activas anuncios personalizados.

### PC (Steam / itch.io)
```bash
npm install
npm run desktop         # Electron
npm run dist            # empaqueta instalable con electron-builder
```

### Web
Sube el contenido de `src/` (junto con `assets/`) a cualquier hosting estático.
Es un PWA: incluye `manifest.webmanifest` y funciona a pantalla completa en móvil.

---

## Estructura

```
Marea/
├── src/                  # juego (HTML + CSS + JS, sin dependencias)
│   ├── index.html
│   ├── privacy.html      # política de privacidad (requisito de tiendas)
│   ├── manifest.webmanifest
│   ├── css/style.css
│   └── js/               # config · save · audio · monetization · engine · render · ui · main
├── assets/               # iconos en todos los tamaños
├── store/                # capturas reales, gráfico destacado, textos de ficha y ASO
├── docs/                 # diseño, monetización, cumplimiento, originalidad, titularidad, publicación
├── tools/                # servidor local, QA del motor, calibrador, prueba E2E
├── package.json · capacitor.config.json · electron/
└── run.sh · run.bat
```

---

## Pruebas

```bash
node tools/test_engine.js       # 35 aserciones del motor + balance de los 24 niveles
node tools/smoke_test.js        # 41 aserciones end-to-end en Chromium real + capturas
node tools/test_local_file.js   # 14 aserciones abriendo el juego con file:// (doble clic)
node tools/test_admob_bridge.js # 33 aserciones del puente AdMob con plugin simulado
node tools/calibrate.js      # recalibra la dificultad de los niveles
```

---

© 2025 Jessica Panini Cuenca. Todos los derechos reservados.
Contramarea es una obra original: nombre, arte, mecánicas y textos son propios y
no derivan de ningún otro juego. Ver `docs/ORIGINALIDAD.md`.
