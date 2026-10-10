# Contramarea — Registro de Decisiones

Documento de trazabilidad: **qué se decidió, por qué y con qué alternativa descartada.**
Cubre la Fase 0 (contrato de entrega) y los supuestos tomados al operar con autonomía total.

---

## D-01 · Concepto elegido por el director
**Decisión:** puzzle de fusión con marea ascendente (arrecife).
**Motivo:** el usuario delegó el concepto ("tú decide") pidiendo algo original, impactante y viral
dentro de casual/puzzle.
**Alternativas descartadas:** *sort puzzle* (mercado saturado y muy clonado), *match-3* (coste de
contenido y arte muy alto para 8 semanas), *merge-2 con historia* (exige guion y arte de personajes
continuos, inviable en plazo y más expuesto a comparaciones con referencias).
**Fundamento de mercado:** los puzzles *hybridcasual* son la ola de 2025 y el formato de fusión
mantiene el mayor crecimiento del género; ver `DISENO.md` y la investigación de la Fase 1.

## D-02 · Nombre: "Marea" descartado → "Contramarea"
**Decisión:** publicar como **Contramarea** (inglés: *Countertide*).
**Motivo:** la verificación de colisión encontró apps activas llamadas "Marea" (app de mareas,
Club Marea). Reutilizar el nombre habría comprometido la marca y la titularidad.
**Evidencia:** búsqueda en Google Play / App Store — "Contramarea" no presenta colisión.

## D-03 · Tecnología: HTML5 + Canvas 2D, cero dependencias
**Decisión:** no usar Godot ni Unity.
**Motivo:**
1. Un solo código cubre **Web hoy mismo** y sirve de base para **Android/iOS** (Capacitor) y **PC** (Electron), las cuatro plataformas pedidas.
2. **Verificable de verdad** en este entorno: el motor es lógica pura y se prueba con Node (35 pruebas) y el juego completo con un Chromium headless (36 pruebas end-to-end).
3. Sin dependencias externas → sin licencias de terceros que comprometan la titularidad ni el cumplimiento de tiendas.
4. Peso final < 1 MB, arranque instantáneo, ideal para un puzzle casual.
**Contrapartida asumida:** no hay exportación nativa directa a APK/IPA desde este entorno; se
entrega el proyecto Capacitor configurado y el procedimiento exacto de compilación (`PUBLICACION.md`).
**Alternativas descartadas:** Godot 4 (mejor para 2D complejo, pero su binario de exportación no
está disponible aquí y añade ~40 MB), Unity (peso y licencia desproporcionados para este alcance).

## D-04 · Modelo de monetización: híbrido anuncios + IAP
**Decisión:** rewarded video como eje, intersticial limitado, banner solo en menús e IAP sin
anuncios + gemas.
**Motivo:** es el modelo con mejor relación ingreso/experiencia para casual en LATAM, donde el
eCPM de rewarded es sensiblemente superior al de otros formatos y la conversión a IAP es baja.
**Reglas anti-abuso fijadas:** intersticial solo cada 3 niveles y nunca antes de 90 s; **el banner
jamás aparece durante la partida**; los anuncios recompensados son siempre opcionales.
Ver `MONETIZACION.md`.

## D-05 · Redes de anuncios integradas
**Decisión:** AdMob, Unity Ads, AppLovin MAX, ironSource/LevelPlay y Meta Audience Network,
mediadas a través de una **capa adaptadora única**.
**Motivo:** el usuario pidió compatibilidad con las cinco. La capa adaptadora aísla cada SDK, de
modo que añadir o quitar una red no toca el juego, y permite **modo prueba** obligatorio hasta
tener los identificadores reales.

## D-06 · Calibración automática de la dificultad
**Decisión:** generar los 24 objetivos con un calibrador (`tools/calibrate.js`) en lugar de
fijarlos a mano.
**Motivo:** garantiza que **ningún nivel sea imposible** y que la curva descienda de forma medible
(~100 % → 11–30 % de victoria de la IA). Evita el error clásico de publicar niveles rotos.

## D-07 · Modo prueba activado por defecto
**Decisión:** `testMode: true` con unidades de anuncio de prueba de Google.
**Motivo:** **regla obligatoria** de las redes de anuncios — hacer clic en anuncios reales durante
el desarrollo provoca el bloqueo de la cuenta. Debe permanecer activo hasta el build de producción.

## D-08 · Idiomas: español e inglés
**Decisión:** ambos desde el lanzamiento, conmutables en caliente.
**Motivo:** español para el público objetivo LATAM; inglés para no cerrar el mercado global y
facilitar la revisión de tienda.

## D-09 · Guardado local, sin cuentas ni servidores
**Decisión:** progreso en almacenamiento local del dispositivo.
**Motivo:** elimina el tratamiento de datos personales en servidores propios, lo que **simplifica
el cumplimiento** (RGPD, data safety, privacidad) y acelera la aprobación en tienda. A cambio se
renuncia a la sincronización entre dispositivos, aceptable para un casual.

## D-10 · Ejecución de las fases por el director
**Decisión:** el director ejecutó directamente las fases del pipeline en lugar de lanzar cada
agente especialista en hilos separados.
**Motivo:** en este entorno, invocar a los especialistas abre ejecuciones independientes que no
devuelven su resultado a esta sesión; el encargo requería un **entregable único y verificable**.
Se aplicaron los marcos de trabajo de los especialistas (investigación de mercado, dirección
visual, monetización, QA, publicación y marketing) y se documenta la evidencia de cada fase.
**Reversible:** en una ejecución futura, cada fase puede delegarse al especialista
correspondiente usando el roster del agente.

## D-11 · Alcance del entregable
**Decisión:** entregar **producto final jugable y publicable**, con los binarios de tienda
pendientes de firma.
**Motivo:** compilar y firmar un AAB/IPA requiere credenciales y cadenas de herramientas del
titular (Android SDK, Xcode, keystore, certificados). Se entrega el proyecto listo, el
procedimiento exacto y todo el material de tienda, de modo que la firma sea el único paso manual.
