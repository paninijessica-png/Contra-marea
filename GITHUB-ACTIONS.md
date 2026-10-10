# Contramarea — Compilar el APK en la nube con GitHub Actions

Con esto puedes obtener el APK **sin instalar Android Studio ni el JDK** en tu
ordenador. GitHub compila el proyecto en sus servidores y te devuelve el APK
como archivo descargable.

El workflow ya está creado en `.github/workflows/android.yml`.

---

## Qué hace el workflow

| Paso | Detalle |
|---|---|
| 1 | Instala **JDK 21** (Temurin) |
| 2 | Instala **Node.js 22** |
| 3 | Instala el **Android SDK**: plataforma API 36 + build-tools 36.0.0 |
| 4 | Instala las dependencias del proyecto |
| 5 | Ejecuta `npx cap sync android` para meter el juego dentro del APK |
| 6 | Compila con `./gradlew assembleDebug` |
| 7 | **Verifica** que el APK contiene el juego (no solo que existe) |
| 8 | Lo publica como artefacto descargable |

Duración típica: **4–8 minutos** la primera vez, menos después gracias a la caché
de Gradle.

---

## Paso 1 — Crear el repositorio en GitHub

1. Entra en <https://github.com/new>
2. **Repository name**: `contramarea`
3. Elige **Private** si no quieres que el código sea público.

> **Público vs privado:** los repositorios públicos tienen minutos de Actions
> ilimitados. Los privados, en cuenta gratuita, tienen 2.000 minutos al mes —
> de sobra para este proyecto (unas 8 min por compilación). Si te preocupa que
> el código quede a la vista, usa privado.

4. **No** marques "Add a README" ni ninguna plantilla. Debe quedar vacío.

---

## Paso 2 — Subir el proyecto

Desde la carpeta `Marea` en tu ordenador:

```bash
cd Marea

# Permiso de ejecución para Gradle (importante: git guarda este permiso)
chmod +x android/gradlew

git init
git add .
git commit -m "Contramarea 1.0.0"
git branch -M main

# Sustituye TU_USUARIO por tu nombre de usuario de GitHub
git remote add origin https://github.com/TU_USUARIO/contramarea.git
git push -u origin main
```

> En Windows, `chmod` no existe. Ejecuta antes:
> `git update-index --chmod=+x android/gradlew` (después del `git add`).
> El workflow hace `chmod` de todas formas, así que tampoco es bloqueante.

En cuanto termine el `push`, el workflow arranca solo.

---

## Paso 3 — Descargar el APK

1. Abre tu repositorio en GitHub → pestaña **Actions**.
2. Verás la ejecución **"Compilar APK de Android"** en marcha.
3. Espera el check verde.
4. Entra en la ejecución y baja hasta **Artifacts**.
5. Descarga **`contramarea-apk-debug`**. Es un ZIP que contiene `app-debug.apk`.

Los artefactos se conservan **30 días**.

---

## Paso 4 — Instalarlo en el teléfono

No hace falta ordenador:

1. Descarga el artefacto **directamente en el teléfono** (desde el navegador,
   en la página de la ejecución).
2. Descomprime el ZIP con el gestor de archivos.
3. Toca `app-debug.apk`.
4. Android pedirá permitir la instalación desde esa fuente:
   **Ajustes** → **Instalar aplicaciones desconocidas** → permite tu gestor de archivos.
5. Instalar.

---

## Lanzarlo a mano cuando quieras

No hace falta tocar código. En el repositorio:

**Actions** → **Compilar APK de Android** → botón **Run workflow** → **Run workflow**.

Funciona también desde el navegador del teléfono, así que puedes generar un APK
nuevo y descargarlo sin encender el ordenador.

---

## Qué se compila automáticamente

El workflow se dispara solo cuando cambia algo relevante:

- `src/**` — el juego
- `android/**` — la configuración nativa
- `package.json` — las dependencias
- el propio workflow

Si solo editas la documentación, no gasta minutos de compilación.

---

## Cosas que conviene saber

**Es un APK de depuración.** Sirve para instalar a mano y probar, no para
Google Play. Lleva los **anuncios de prueba** de AdMob (`testMode: true`), así
que no genera ingresos ni riesgo para tu cuenta.

**El APK funciona sin internet.** El juego va empaquetado dentro; solo los
anuncios necesitan conexión.

**Para publicar en Google Play** necesitarás un AAB firmado, que requiere tu
keystore. La guía de firma está en [`GUIA-ANDROID.md`](GUIA-ANDROID.md), sección 6.

**Cada APK nuevo se instala encima del anterior.** Android lo permite porque
todos usan la misma clave de depuración de GitHub Actions. Si en algún momento
cambia, habrá que desinstalar el anterior primero.

---

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `Permission denied: ./gradlew` | El workflow ya hace `chmod +x`. Si persiste, ejecuta `git update-index --chmod=+x android/gradlew` y vuelve a subir. |
| `Failed to find target with hash string 'android-36'` | Revisa que la línea `packages:` del workflow incluya `platforms;android-36`. |
| El APK instala pero sale en blanco | Falta `npx cap sync android` antes de compilar. El workflow ya lo hace; si lo quitaste, vuelve a ponerlo. |
| `Out of memory` en Gradle | El workflow ya sube la memoria a 4 GB. Si aun así falla, aumenta `-Xmx4g` a `-Xmx6g`. |
| El workflow no aparece en la pestaña Actions | Comprueba que el archivo está en `.github/workflows/android.yml` y que hiciste `git push`. |
| No veo "Artifacts" | Solo aparece cuando la ejecución termina correctamente. |

---

## Siguiente paso opcional: compilar también el AAB de producción

Cuando tengas el keystore, se puede ampliar el workflow para que genere el AAB
firmado. Haría falta:

1. Guardar el keystore en **Settings → Secrets and variables → Actions**,
   codificado en base64 (nunca en el repositorio).
2. Guardar las contraseñas como secretos.
3. Añadir un paso que decodifique el keystore y ejecute `./gradlew bundleRelease`.

Pídemelo cuando tengas el keystore creado y lo dejo montado.
