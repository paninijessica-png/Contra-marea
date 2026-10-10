# Contramarea — Guía para compilar en Android desde cero

Esta guía lleva desde un ordenador sin nada instalado hasta un **APK de prueba
instalado en tu teléfono** y, más abajo, hasta un **AAB firmado listo para
Google Play**.

El proyecto Android ya está generado en la carpeta `android/` y configurado.
No hace falta volver a ejecutar `npx cap add android`.

> **¿Prefieres no instalar nada en tu ordenador?** El APK también se puede compilar
> en la nube con GitHub Actions, sin Android Studio ni JDK locales. Está explicado en
> [`GITHUB-ACTIONS.md`](GITHUB-ACTIONS.md). Las secciones 1 y 2 de esta guía solo hacen
> falta si compilas en tu propia máquina.

---

## 0. Qué ya está hecho

| Elemento | Estado |
|---|---|
| Proyecto Android (`android/`) | Generado con Capacitor 8.5.3 |
| `minSdkVersion` | **24** (Android 7.0) |
| `compileSdkVersion` / `targetSdkVersion` | **36** (Android 16) |
| ID de aplicación | `com.jessicapaninicuenca.contramarea` |
| Meta-data de AdMob | ID de **prueba** de Google |
| Permiso `AD_ID` | Declarado (Android 13+) |
| Plugin de AdMob | `@capacitor-community/admob` 8.2.1 enlazado |
| Iconos | Integrados en las 5 densidades + adaptativo |
| Assets del juego | Copiados dentro del APK (funciona sin internet) |

El ID de prueba configurado es `ca-app-pub-3940256099942544~3347511713`.
**Nunca genera ingresos** y es el correcto para probar. Se cambia antes de publicar.

---

## 1. Instalar Android Studio y el JDK

### 1.1 Descargar Android Studio

Descárgalo de <https://developer.android.com/studio> y ejecuta el instalador.
En el asistente, deja marcadas las opciones por defecto: instala el **Android SDK**,
el **Android SDK Platform-Tools** y el **Android SDK Build-Tools**.

> **El JDK ya viene incluido.** Android Studio trae su propio JDK (JetBrains
> Runtime) en la carpeta `jbr`. No hace falta instalar Java aparte si vas a
> compilar desde la propia aplicación. Solo lo necesitas si vas a usar la
> terminal — y en ese caso apunta `JAVA_HOME` a ese mismo `jbr` (paso 1.3).

### 1.2 Instalar la plataforma SDK de API 36

Abre Android Studio → **More Actions** → **SDK Manager** → pestaña
**SDK Platforms** → marca **Android 16 (API 36)** → **Apply**.

En la pestaña **SDK Tools**, comprueba que están instalados:
*Android SDK Build-Tools*, *Android SDK Platform-Tools* y *Android SDK Command-line Tools*.

> Sin la plataforma API 36 la compilación falla con
> `Failed to find target with hash string 'android-36'`.

### 1.3 Configurar JAVA_HOME (solo si compilas desde la terminal)

**Windows** (PowerShell):

```powershell
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Android\Android Studio\jbr", "User")
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
```

**macOS** (añádelo a `~/.zshrc`):

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
```

**Linux** (añádelo a `~/.bashrc`):

```bash
export JAVA_HOME="/opt/android-studio/jbr"
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
```

Cierra y vuelve a abrir la terminal. Comprueba:

```bash
java -version     # debe decir 21.x
```

> Capacitor 8 exige **JDK 21 o superior**. Con Java 17 la compilación falla con
> `invalid source release: 21`.

---

## 2. Dar permiso de ejecución a Gradle (macOS y Linux)

Al copiar el proyecto, el script `gradlew` pierde el bit de ejecución. Es un
paso de una sola vez:

```bash
cd android
chmod +x gradlew
```

En Windows no hace falta: se usa `gradlew.bat`.

---

## 3. Compilar el APK de depuración

### Opción A — desde la terminal (recomendada)

Desde la raíz del proyecto:

```bash
./tools/build_apk.sh
```

O a mano, paso a paso:

```bash
npx cap sync android      # copia el juego dentro del proyecto Android
cd android
./gradlew assembleDebug   # la primera vez tarda varios minutos
```

En Windows:

```bat
tools\build_apk.bat
```

El APK queda en:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Opción B — desde Android Studio

1. **Open** → selecciona la carpeta `android/` (no la raíz del proyecto).
2. Espera a que termine la sincronización de Gradle (barra inferior).
3. Menú **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
4. Cuando avise, pulsa **locate** para abrir la carpeta del APK.

---

## 4. Instalarlo en tu teléfono

### Por USB (lo más cómodo)

1. En el teléfono: **Ajustes** → **Acerca del teléfono** → toca 7 veces
   **Número de compilación** para activar las opciones de desarrollador.
2. **Ajustes** → **Opciones de desarrollador** → activa **Depuración USB**.
3. Conecta el teléfono y acepta el aviso de "¿Permitir depuración USB?".
4. Instala:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Sin cable

Copia el archivo `app-debug.apk` al teléfono (por correo, Drive o cable) y ábrelo
desde el gestor de archivos. Android pedirá permitir la instalación desde esa
fuente: **Ajustes** → **Instalar aplicaciones desconocidas** → permite tu gestor
de archivos.

> Android no te dejará publicar este APK en Google Play — eso es exactamente lo
> que queremos: es un APK de pruebas, sin firmar para distribución, que solo
> sirve para instalar a mano.

---

## 5. Comprobar que los anuncios funcionan

Con el APK instalado, conecta el teléfono y mira el registro:

```bash
adb logcat | grep -i "Ads\|AdMob\|Contramarea"
```

Qué deberías ver:

- El juego arranca y muestra el **formulario de consentimiento de Google** (si
  estás en la UE). Es el formulario oficial, no una pantalla propia.
- Si aceptas, aparece el menú. El **banner** se muestra solo en los menús.
- Al terminar 3 niveles aparece un **intersticial**.
- Al pulsar el botón de recompensa se ofrece un **vídeo de prueba**.

Los anuncios de prueba siempre llevan la etiqueta **"Test Ad"**. Si ves anuncios
reales, algo está mal: revisa que `CONFIG.testMode` siga en `true`.

Para probar anuncios reales en tu móvil sin arriesgar la cuenta de AdMob, busca
en el logcat la línea:

```
Use RequestConfiguration... setTestDeviceIds(Arrays.asList("XXXXXXXXXXXXXXXX"))
```

Copia ese código en `src/js/config.js` → `testDevices: ["XXXXXXXXXXXXXXXX"]`.

---

## 6. Firmar la versión de producción

> **Antes de este paso**: abre `src/js/config.js` y pon `testMode: false`,
> coloca tus IDs reales de AdMob y sustituye el ID de aplicación de prueba en
> `android/app/src/main/AndroidManifest.xml` por el de tu app.
> Ejecuta `npx cap sync android` después.

### 6.1 Crear el keystore

El keystore es la llave con la que firmas la app. **Si lo pierdes, no podrás
volver a actualizar la app en Google Play.** Guárdalo en dos sitios y no lo
subas nunca a un repositorio.

```bash
cd android
keytool -genkeypair -v \
  -keystore contramarea-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias contramarea
```

Te pedirá:
- **Contraseña del almacén**: invéntate una fuerte y apúntala.
- **Nombre y apellidos**: `Jessica Panini Cuenca` (es el titular).
- **Unidad organizativa / Organización**: tu nombre o el de tu empresa.
- **Ciudad, provincia, código de país**: tus datos.

### 6.2 Guardar las credenciales fuera del código

Crea `android/keystore.properties`:

```properties
storeFile=contramarea-release.jks
storePassword=TU_CONTRASENA
keyAlias=contramarea
keyPassword=TU_CONTRASENA
```

Y asegúrate de que **no** se sube al repositorio. Añade a `android/.gitignore`:

```
*.jks
keystore.properties
```

### 6.3 Enlazar la firma en Gradle

En `android/app/build.gradle`, antes de `android {`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file("keystore.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Dentro de `android {`, añade el bloque `signingConfigs` y úsalo en `release`:

```gradle
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
```

### 6.4 Compilar el AAB firmado

```bash
cd android
./gradlew bundleRelease
```

Salida:

```
android/app/build/outputs/bundle/release/app-release.aab
```

Ese es el archivo que se sube a Google Play Console.

---

## 7. Publicar en Google Play

1. Crea una cuenta de desarrollador en <https://play.google.com/console>
   (pago único de 25 USD).
2. **Crear aplicación** → nombre **Contramarea** → idioma español → juego → gratis.
3. Rellena **Ficha de la tienda**: descripción, capturas e icono. Ya los tienes
   listos en `store/` (textos en `listing-es.md` y `listing-en.md`, capturas en
   `store/screenshots/`).
4. En **Contenido de la aplicación** declara:
   - **Contiene anuncios**: sí.
   - **Política de privacidad**: la URL pública donde alojes `src/privacy.html`.
   - **Seguridad de los datos**: se usa el identificador de publicidad.
5. Sube el `.aab` en **Producción** (o antes en **Prueba cerrada**).
6. Google Play gestiona la firma final (**Play App Signing**): tu keystore es la
   *clave de subida*. Guárdalo igualmente, lo necesitarás para cada actualización.

> **Cuenta personal nueva:** Google exige una prueba cerrada con al menos 12
> probadores durante 14 días antes de poder publicar en producción. Cuenta con
> ese plazo.

> **Cada actualización** necesita un `versionCode` mayor. Está en
> `android/app/build.gradle`:
> ```gradle
> versionCode 2      // súbelo en cada envío
> versionName "1.0.1"
> ```

---

## 8. Problemas frecuentes

| Mensaje | Causa y solución |
|---|---|
| `Failed to find target with hash string 'android-36'` | Falta la plataforma API 36. SDK Manager → SDK Platforms → Android 16 (API 36). |
| `invalid source release: 21` | El JDK es anterior al 21. Apunta `JAVA_HOME` al `jbr` de Android Studio. |
| `Permission denied: ./gradlew` | `chmod +x gradlew` dentro de `android/`. |
| La app se cierra al abrir con `Missing application ID` | Falta el `<meta-data>` de AdMob en `AndroidManifest.xml`. |
| `SDK location not found` | Define `ANDROID_HOME` o crea `android/local.properties` con `sdk.dir=/ruta/al/Android/Sdk`. |
| `Out of memory` en Gradle | Añade `org.gradle.jvmargs=-Xmx4g` a `android/gradle.properties`. |
| El APK instala pero no muestra anuncios | Normal en el emulador o sin red. Los anuncios de prueba tardan unos segundos en cargar. |
| `Execution failed for task ':app:processDebugGoogleServices'` | No aplica: este proyecto no usa Firebase. |
| Los cambios del juego no aparecen en el APK | Falta `npx cap sync android` antes de compilar. |

---

## 9. Resumen de comandos

```bash
# Compilar un APK de pruebas e instalarlo
./tools/build_apk.sh
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Compilar el AAB firmado para Google Play
cd android && ./gradlew bundleRelease

# Ver los registros del teléfono
adb logcat | grep -i "Ads\|Contramarea"
```
