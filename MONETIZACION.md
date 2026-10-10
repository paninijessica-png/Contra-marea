# Contramarea — Monetización

**Titular:** Jessica Panini Cuenca · **Región principal:** LATAM · **Modelo:** híbrido (anuncios + IAP)

---

## 1. Estrategia

Contramarea monetiza con **anuncios recompensados como eje** y una capa de **compras dentro de la
aplicación** para quien quiere jugar sin interrupciones. Es el modelo que mejor equilibra ingreso
y experiencia en un puzzle casual para LATAM: el anuncio recompensado es **siempre una elección
del jugador**, lo que protege la retención y evita el rechazo en tienda.

| Formato | Dónde aparece | Frecuencia | Por qué |
|---|---|---|---|
| **Rewarded video** | El jugador lo pide (poder extra, revivir, duplicar recompensa) | Libre | Máximo eCPM y experiencia positiva |
| **Intersticial** | Solo al **completar** un nivel | Cada **3 niveles**, mínimo 90 s entre dos | Nunca interrumpe una partida en curso |
| **Banner** | **Solo en menús** (menú principal, niveles, tienda) | Persistente en menú | No molesta; nunca durante el juego |
| **IAP** | Tienda | — | Ingreso directo y eliminación de anuncios |

### Reglas de oro (implementadas en `src/js/monetization.js`)
1. **El banner nunca se muestra durante la partida.**
2. **El intersticial nunca interrumpe** un nivel en curso ni aparece antes de 90 s del anterior.
3. **El anuncio recompensado es siempre opcional** y su recompensa se entrega solo si el vídeo
   se completó.
4. **Ningún anuncio se carga antes de registrar el consentimiento** del usuario.
5. **Modo prueba obligatorio** durante el desarrollo.

---

## 2. Redes integradas

Todas se conectan a través de una **capa adaptadora única** (`src/js/monetization.js`), de modo que
el juego nunca habla directamente con un SDK. Añadir o retirar una red no toca la lógica del juego.

| Red | Rol | Formato |
|---|---|---|
| **Google AdMob / Ad Manager** | Red principal y mediación | rewarded, intersticial, banner |
| **Unity Ads** | Mediación (relleno) | rewarded, intersticial, banner |
| **AppLovin MAX** | Mediación (mejor eCPM en LATAM) | rewarded, intersticial, banner |
| **ironSource / LevelPlay** | Mediación | rewarded, intersticial |
| **Meta Audience Network** | Mediación (relleno social) | rewarded, intersticial, banner |

> **Importante:** los identificadores de `src/js/config.js` son **unidades de PRUEBA**
> (`ca-app-pub-3940256099942544/...` y valores `TEST_*`). Deben sustituirse por los reales
> **solo en el build de producción**, nunca durante el desarrollo.

---

## 3. Catálogo de compras (IAP)

| Producto | ID | Tipo | Precio | Qué da |
|---|---|---|---|---|
| **Sin anuncios** | `contramarea.no_ads` | No consumible | 2,99 USD | Elimina intersticiales y banner para siempre |
| **Pack de bienvenida** | `contramarea.starter` | No consumible | 4,99 USD | 350 gemas + Ancla permanente + sin anuncios |
| **100 gemas** | `contramarea.gems_100` | Consumible | 1,99 USD | 100 gemas |
| **500 gemas** | `contramarea.gems_500` | Consumible | 7,99 USD | 500 gemas (mejor relación) |
| **1500 gemas** | `contramarea.gems_1500` | Consumible | 19,99 USD | 1500 gemas |

**Reglas de cumplimiento aplicadas:**
- Todos los precios se muestran **tal como los devuelve la tienda** en producción (nunca inventados en la app).
- **Restaurar compras** está disponible en Ajustes (obligatorio en iOS).
- Las compras no consumibles se entregan **una sola vez** y se restauran al reinstalar.
- La compra "Sin anuncios" **no elimina los anuncios recompensados** (siguen siendo opcionales y con recompensa): así lo espera el jugador y así se describe en la ficha.

---

## 4. Economía de gemas

**Fuentes (jugando):**
- Completar un nivel: 20 gemas + 10 por cada estrella extra.
- Primera victoria de un nivel: +30 gemas.
- Anuncio recompensado en el menú: 25 gemas (con límite diario).
- Objetivo diario completado: 50 gemas.

**Usos:** Corriente 40 · Ancla 30 · Bajamar 60 · Revivir tras derrota (rewarded o 100 gemas).

**Principio de diseño:** un jugador que juega 3 niveles al día puede permitirse **un poder al día**
sin pagar. Las gemas compradas **aceleran**, no desbloquean contenido: no hay niveles, piezas ni
funciones bloqueadas tras un pago. Esto evita la percepción de *pay-to-win* y cumple las políticas
de tienda sobre mecánicas engañosas.

---

## 5. Proyección de ingresos (escenario LATAM)

Supuestos conservadores para el primer mes tras el lanzamiento:

| Concepto | Valor asumido |
|---|---|
| Instalaciones orgánicas mes 1 | 5.000 – 20.000 |
| DAU medio | 8 % de las instalaciones |
| Sesiones/día por usuario | 2,5 |
| Impresiones rewarded/DAU/día | 2,0 |
| Impresiones intersticiales/DAU/día | 1,2 |
| eCPM rewarded LATAM | 2 – 4 USD |
| eCPM intersticial LATAM | 1 – 2,5 USD |
| Conversión a IAP | 1 – 2 % |
| Ticket medio IAP | 3,5 USD |

Con 1.000 DAU el escenario arroja aproximadamente **60–110 USD/mes** de anuncios más
**35–70 USD/mes** de IAP → **ARPDAU de 0,10–0,18 USD**, dentro del rango alto del género.
La palanca principal de crecimiento no es el eCPM sino el **volumen de DAU**: de ahí la
prioridad del plan de marketing (`store/` y Fase 7).

---

## 6. Cableado real de AdMob (Android / iOS)

El puente ya está escrito en `src/js/monetization.js` (`AdMobBridge`) contra el plugin
comunitario **`@capacitor-community/admob` v8**, que **incluye el SDK de Google Mobile Ads**.
No hay que añadir ninguna dependencia nativa de anuncios por separado: hacerlo provocaría
un conflicto de versiones.

### 6.1 Instalación

```bash
npm install                      # instala @capacitor-community/admob ^8.2.0
npx cap add android              # una sola vez, genera android/
npx cap sync android             # copia src/ y enlaza el plugin
```

Requisitos del plugin v8: **Capacitor 8.5+**, **Android API 24+**, **iOS 15+**, **JDK 21**.

### 6.2 ID de aplicación en AndroidManifest.xml

En `android/app/src/main/AndroidManifest.xml`, dentro de `<application>`:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"/>
```

El valor es el **ID de aplicación** de AdMob (lleva `~`), distinto de los **IDs de bloque**
que van en `config.js` (llevan `/`). Sin este meta-data la app **falla al arrancar**.

En iOS, el equivalente en `ios/App/App/Info.plist` es la clave `GADApplicationIdentifier`.

### 6.3 Flujo de consentimiento implementado

El orden es obligatorio para cumplir GDPR/UMP y es el que ejecuta `AdMobBridge`:

1. `requestConsentInfo()` — en cada arranque.
2. `showConsentForm()` — solo si `status === 'REQUIRED'` y hay formulario.
3. `initialize()` — solo cuando `canRequestAds === true`.
4. Cargar anuncios.

Si `canRequestAds` es `false`, **no se pide ningún anuncio**. Si `initialize()` falla
(en Android espera hasta 5 s a la vista nativa del banner), el juego arranca igual y
reintenta hasta 3 veces sin bloquear al jugador.

Para que el usuario pueda cambiar su elección, exponer en Ajustes:

```js
M.Monetization.consent.showPrivacyOptions(function (r) { /* ... */ });
```

### 6.4 Modo prueba

Con `CONFIG.testMode: true` (valor por defecto) todas las peticiones llevan `isTesting: true`
y se usan las unidades de demostración de Google: nunca se generan clics reales ni tráfico
inválido, que es motivo de suspensión de cuenta.

Para probar anuncios de producción en un móvil físico sin arriesgar la cuenta, añadir el ID
del dispositivo a `CONFIG.testDevices` y mantener `testMode: true`. El ID aparece en logcat:
`Use RequestConfiguration... setTestDeviceIds(Arrays.asList("XXXXXXXX"))`.

**Antes de publicar:** `testMode: false`, IDs reales y `testDevices: []`.

### 6.5 Requisitos de Google Play

- `targetSdk`: desde el 31 de agosto de 2026 las **apps nuevas deben apuntar a Android 16
  (API 36)**. Ajustarlo en `android/variables.gradle` y confirmar el valor vigente en Play Console.
- `minSdkVersion`: 24 o superior (lo exige el plugin v8).
- Declarar en **Seguridad de los datos** que la app usa el **identificador de publicidad**.
- Marcar la app como **"contiene anuncios"** en la ficha de la tienda.
- Si la app se dirige a menores, poner `CONFIG.ads.childDirected: true`: fuerza anuncios no
  personalizados y el etiquetado COPPA.

### 6.6 Prueba automatizada del puente

```bash
node tools/test_admob_bridge.js
```

Inyecta un plugin AdMob simulado antes de que arranque el juego y verifica el orden de
consentimiento, que no se pida nada sin permiso, las opciones del banner, la entrega única
del recompensado y que un fallo de `initialize()` no rompa el juego. **33 comprobaciones.**

---

## 7. Verificación antes de publicar

- [ ] `testMode: true` → **cambiar a `false`** y sustituir las unidades de prueba por las reales.
- [ ] `testDevices: []` en producción.
- [ ] ID de aplicación de AdMob presente en `AndroidManifest.xml`.
- [ ] `node tools/test_admob_bridge.js` en verde (33/33).
- [ ] `targetSdk` según el requisito vigente de Google Play (API 36 desde 31/08/2026).
- [ ] Comprobar que el banner **no** se muestra en la pantalla de juego.
- [ ] Comprobar que el intersticial respeta los 3 niveles y los 90 s.
- [ ] Verificar "Restaurar compras" con una cuenta de pruebas de Google Play / sandbox de Apple.
- [ ] Confirmar que la compra "Sin anuncios" elimina intersticial y banner, y **no** los recompensados.
- [ ] Declarar en la tienda que la app **contiene anuncios**.
- [ ] Enlazar la política de privacidad (`src/privacy.html`) en la ficha y dentro de la app.
