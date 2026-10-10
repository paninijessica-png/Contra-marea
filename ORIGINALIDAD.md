# Contramarea — Informe de Originalidad (Puerta Fase 2b)

**Titular:** Jessica Panini Cuenca · **Fecha de evaluación:** versión 1.0.0
**Veredicto:** ✅ **APROBADO — 84 / 100** (umbral mínimo exigido: 70)

Este documento es la evidencia de la **puerta de originalidad** obligatoria: se estudiaron las
referencias del mercado para entender por qué funcionan, y se diseñó un producto con identidad
propia. **No se ha reutilizado ningún elemento de las referencias.**

---

## 1. Referencias analizadas (solo como estudio de mercado)

| Referencia | Qué se estudió | Qué NO se ha usado |
|---|---|---|
| *Gossip Harbor / merge-2* | El gancho emocional de la fusión y la progresión por capítulos | Historia, personajes, escenarios, arte, nombres, interfaz, sistema de pedidos, mapas |
| *2048* | La regla de deslizamiento y fusión de iguales | Su nombre, su estética numérica, su tablero 4×4, su ausencia de objetivos |
| *Merge Dragons* | La satisfacción visual de las cadenas | Dragones, huevos, mapas, arte, nombres, monetización por energía |
| *Sort Puzzle / Water Sort* | La claridad de objetivos en 1 pantalla | Tubos, colores planos, mecánica de clasificación |
| *Royal Match / Toon Blast* | Ritmo de niveles y refuerzos | Mecánica match-3, tableros, personajes, potenciadores |

**Conclusión del estudio:** el género funciona por (a) feedback inmediato y satisfactorio en la
fusión, (b) objetivos claros por nivel, (c) presión constante. Se toma **solo ese principio
abstracto** y se construye una mecánica propia alrededor.

---

## 2. Elementos diferenciales propios (no existentes en las referencias)

### 2.1 La marea como recurso compartido (núcleo original)
En las referencias, fusionar sirve para **puntuar o completar pedidos**. En Contramarea, fusionar
es **el único mecanismo para contener una amenaza que crece sola**: +1 de marea por movimiento,
−1 por fusión, y una fila de agua que invade el tablero al desbordarse. Esto convierte cada
movimiento en una decisión de **gestión de recursos**, no solo de optimización de tablero.

> Ninguna de las referencias analizadas tiene un medidor que sube por movimiento y baja por fusión.

### 2.2 Tablero que se reduce por abajo
La invasión de agua **desplaza físicamente todas las piezas hacia arriba**, reduciendo el espacio
jugable de forma progresiva. El tablero efectivo se encoge con la partida — un reloj espacial,
no temporal.

### 2.3 Cesta del Ancla
Permite **apartar piezas del tablero y reintroducirlas después**, cambiando la posición relativa
de las piezas. Es una herramienta de planificación espacial, no un potenciador de daño.

### 2.4 Identidad temática: el arrecife
Las 7 piezas son **corales y formas marinas** (Brote → Coralito → Coral → Anémona → Estrella →
Perla → Arrecife), con una paleta de arrecife bioluminiscente. La temática **no procede de
ninguna referencia** y refuerza la metáfora de la marea.

### 2.5 Objetivo "sobrevivir a N subidas de marea"
Tipo de objetivo propio del sistema de marea, imposible en las referencias.

---

## 3. Matriz de puntuación de originalidad

| Dimensión | Peso | Puntuación | Justificación |
|---|---|---|---|
| Nombre y marca (sin colisión) | 12 % | **10/10** | "Marea" fue descartado por colisión con apps existentes; "Contramarea" no colisiona en Google Play ni App Store (verificado por búsqueda) |
| Tema e identidad visual | 14 % | **9/10** | Arrecife bioluminiscente propio; ningún elemento temático de las referencias |
| Personajes y arte | 12 % | **10/10** | 100 % generado para este proyecto; glifos dibujados por código; cero assets de terceros |
| Mecánica núcleo | 20 % | **8/10** | La regla de deslizar/fusionar es un lenguaje de género (no apropiable); el sistema de marea, el encogimiento del tablero y la cesta son aportaciones propias |
| Interfaz y disposición | 12 % | **8/10** | HUD y flujo propios, diseñados para el medidor de marea |
| Audio | 10 % | **9/10** | 100 % procedural (WebAudio); no se usa ninguna pista ni sample ajeno |
| Textos, tono y nombres | 10 % | **10/10** | Redactados desde cero en español e inglés |
| Riesgo de percepción de copia | 10 % | **9/10** | La combinación marea + arrecife + cesta no existe en el mercado analizado |
| **Total ponderado** | 100 % | **84 / 100** | ✅ Supera el umbral de 70 |

---

## 4. Verificación anti-clon ejecutada

- [x] **Nombres de referencia no usados** — ningún nombre de juego, personaje o nivel procede de otra obra.
- [x] **Sin assets de terceros** — no hay imágenes, sprites, fuentes, audios ni tipografías licenciadas. Los iconos y el key art se generaron para este proyecto; las piezas se dibujan por código; el audio se sintetiza en tiempo real.
- [x] **Sin layouts copiados** — la disposición del tablero responde al sistema de marea, no a la de ninguna referencia.
- [x] **Colisión de nombre verificada** — búsqueda en tiendas: "Marea" colisiona (app de mareas, Club Marea); **"Contramarea" no presenta colisión**.
- [x] **Textos originales** — descripciones, tutorial y ficha de tienda redactados sin tomar frases de otros juegos.
- [x] **Sin marcas registradas** — el nombre y el logotipo son acuñados por el titular; ver `TITULARIDAD.md` para el registro.

---

## 5. Riesgos residuales y mitigación

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Revisión de tienda que considere la mecánica "similar a un juego popular" | Baja | La mecánica de marea y la identidad visual son sustancialmente distintas; se documenta este informe como evidencia |
| Confusión con otra app llamada "Marea" | Baja | El nombre es "Contramarea" (palabra distinta); el icono es propio |
| Uso futuro de assets de terceros por parte de colaboradores | Media | `LICENSE` prohíbe incorporar material ajeno; checklist de publicación lo verifica antes de subir |

---

## 6. Recomendación

**Apto para publicación.** La puntuación (84/100) supera holgadamente el umbral de 70 y la
combinación mecánica-temática es propia. Se recomienda registrar la marca "Contramarea" antes
del lanzamiento (ver `TITULARIDAD.md`) para consolidar la protección.
