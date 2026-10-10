# Contramarea — Documento de Diseño (GDD)

**Titular:** Jessica Panini Cuenca · **Package id:** `com.jessicapaninicuenca.contramarea` · **Versión:** 1.0.0

---

## 1. Concepto

**Contramarea** es un puzzle casual de fusión donde el tablero está siendo invadido por el mar.
Cada movimiento hace subir la marea; cada fusión la empuja hacia atrás. El jugador no solo
optimiza puntuación: **administra una amenaza que crece sola**.

> **Gancho de 3 segundos:** "Fusiona el arrecife antes de que suba la marea."

Es un puzzle de reglas simples con una presión constante y visible (el agua subiendo), lo que
genera la tensión "una partida más" típica de los éxitos casuales, sin depender de una IP ajena.

### Público objetivo
- **Primario:** mujeres 25–45, jugadoras de casual/puzzle, LATAM hispanohablante.
- **Secundario:** jugadores casuales globales (versión en inglés incluida).
- **Sesión media:** 3–6 minutos · **Sesiones/día:** 2–4.

### Pilares de diseño
1. **Legible en 1 segundo** — el agua subiendo comunica la tensión sin tutorial.
2. **Satisfacción de fusión** — animación, sonido y brillo en cada combinación.
3. **Dominio creciente** — el jugador aprende a "empujar la marea" con cadenas largas.

---

## 2. Mecánica núcleo

### Tablero
Rejilla de **5 × 5** casillas. Cada casilla contiene una pieza o está vacía.

### Movimiento
El jugador **desliza** (móvil) o usa **flechas/WASD** (escritorio y web). Todas las piezas
se desplazan en esa dirección hasta el borde o hasta chocar con otra pieza.

### Fusión
Dos piezas **del mismo nivel** que chocan se combinan en **una pieza del nivel siguiente**
(regla clásica de fusión; cada pieza puede fusionarse una sola vez por movimiento).

### La marea (el diferenciador)
| Evento | Efecto sobre la marea |
|---|---|
| Movimiento válido | **+1** |
| Cada fusión del movimiento | **−1** |
| Marea alcanza el máximo | **Sube una fila de agua** y la marea vuelve a 0 |

Cuando la marea llega al máximo, entra una fila nueva por abajo y **todo el tablero sube una
casilla**. Si la fila superior ya estaba ocupada → **el arrecife se inunda (derrota)**.

Esto invierte la lógica habitual del género: fusionar no es solo para puntuar, **es la única
forma de contener el agua**. Una cadena de 4 fusiones en un solo movimiento baja la marea
neta 3 puntos — el momento "wow" que el jugador busca repetir.

### Puntuación
```
puntos_del_movimiento = (Σ 10 × nivel_resultante_de_cada_fusión) × max(1, nº de fusiones)
```
El multiplicador por número de fusiones premia las **cadenas**, no las fusiones sueltas.

### Piezas (7 niveles, temática de arrecife)
| Nivel | Nombre | Color |
|---|---|---|
| 1 | Brote | verde agua |
| 2 | Coralito | verde mar |
| 3 | Coral | azul cian |
| 4 | Anémona | azul violeta |
| 5 | Estrella | violeta |
| 6 | Perla | ámbar |
| 7 | **Arrecife** | coral / naranja |

### Fin de partida
- **Victoria:** se cumple el objetivo del nivel.
- **Derrota:** el arrecife se inunda (marea al máximo con la fila superior ocupada),
  se agotan los movimientos sin cumplir el objetivo, o no queda ningún movimiento posible.

---

## 3. Poderes

Se compran con **gemas** (ganadas jugando o compradas con IAP) o se desbloquean viendo un
**anuncio recompensado** (rewarded video).

| Poder | Coste | Efecto |
|---|---|---|
| **Corriente** | 40 gemas | Barre todas las piezas de nivel 1 del tablero (y repuebla si lo deja vacío) |
| **Bajamar** | 60 gemas | Baja la marea 3 puntos |
| **Ancla** | 30 gemas | Guarda hasta 2 piezas en la cesta para soltarlas cuando convenga |

El **Ancla** es la herramienta de planificación: permite apartar una pieza alta y liberar
espacio, o guardar la pieza que falta para cerrar una cadena grande.

---

## 4. Progresión

- **24 niveles** agrupados en 3 tramos de dificultad (marea más rápida, más piezas iniciales
  y piezas de mayor nivel en el agua a medida que se avanza).
- **4 tipos de objetivo:** alcanzar un nivel de pieza, conseguir N fusiones, lograr X puntos,
  o sobrevivir a N subidas de marea.
- **Estrellas (1–3)** por nivel según los movimientos sobrantes: 3★ ≥ 40 % restante,
  2★ ≥ 15 %, 1★ al cumplir el objetivo.
- **Modo Mar Abierto:** partida infinita sin objetivo, para practicar y para el jugador que
  ya terminó la campaña (retención a largo plazo).

La dificultad se **calibró automáticamente** con una IA heurística que juega los 24 niveles
400 veces cada uno (`tools/calibrate.js`), fijando cada objetivo en el punto donde la IA gana
la tasa de victoria objetivo. Curva resultante: **~100 % en el nivel 1 → ~11–30 % en los
finales**, sin ningún nivel imposible.

---

## 5. Interfaz

- **HUD superior:** puntos, movimientos restantes, medidor de marea (x/máx), gemas, pausa.
- **Objetivo del nivel** siempre visible arriba del tablero.
- **Barra inferior:** los 3 poderes con su coste y la cesta del ancla (2 huecos).
- **Pantallas:** menú, selección de niveles, tienda, ajustes, resultado, consentimiento.
- **Idiomas:** español e inglés, conmutables en Ajustes en caliente.

---

## 6. Dirección de arte y sonido

- **Paleta:** fondo marino profundo (`#071e26`), acentos turquesa y coral. Alto contraste para
  legibilidad en pantallas pequeñas y bajo sol.
- **Piezas:** formas vectoriales dibujadas por código (sin sprites externos), con brillo propio
  y animación de "pop" al fusionarse.
- **Agua:** línea de marea que sube dentro del tablero, con destello al entrar una fila nueva.
- **Audio:** 100 % **procedural con WebAudio** (sin archivos de audio de terceros): tono de
  fusión que sube con el nivel de la pieza, "whoosh" al subir la marea, ambiente suave.
- **Háptica:** vibración corta en fusiones grandes (en dispositivos compatibles).

---

## 7. Rendimiento y compatibilidad

- Un solo canvas 2D, sin librerías ni dependencias externas.
- Orientación vertical en móvil; se adapta a cualquier resolución (web y escritorio incluidos).
- Funciona **sin conexión** (PWA instalable). Peso total del juego: menos de 1 MB.
- Guardado local automático (progreso, estrellas, gemas, ajustes, consentimiento).

---

## 8. Métricas de éxito previstas

| Métrica | Objetivo |
|---|---|
| Retención D1 | ≥ 35 % |
| Retención D7 | ≥ 12 % |
| Sesión media | ≥ 5 min |
| Niveles jugados/sesión | ≥ 3 |
| ARPDAU (LATAM, mixto ads + IAP) | 0,02–0,06 USD |
| Conversión a IAP | 1–2 % |
| Ratio de finalización del nivel 1 | ≥ 85 % |

Estos objetivos se validan en la fase de *soft launch* (ver `PUBLICACION.md`).
