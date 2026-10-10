/* Contramarea — Configuración, textos y catálogos.
 * Titular: Jessica Panini Cuenca · package id: com.jessicapaninicuenca.contramarea */
window.MAREA = window.MAREA || {};
(function (M) {
  'use strict';

  M.CONFIG = {
    version: '1.0.0',
    packageId: 'com.jessicapaninicuenca.contramarea',
    owner: 'Jessica Panini Cuenca',
    title: { es: 'Contramarea', en: 'Countertide' },
    tagline: {
      es: 'Fusiona el arrecife. Detén la marea.',
      en: 'Merge the reef. Hold back the tide.'
    },

    /* Paleta original (no derivada de ningún juego existente). */
    palette: {
      deep: '#071e26',
      sea: '#0d3b4a',
      sea2: '#12566b',
      foam: '#d9f7ff',
      sand: '#f4d9a8',
      accent: '#ff7a59',
      gold: '#ffc247',
      danger: '#ff4d6d',
      ink: '#04222b',
      panel: 'rgba(6, 40, 52, 0.86)'
    },

    /* ---- Publicidad -------------------------------------------------------
     * testMode = true usa SIEMPRE unidades de prueba. Antes de publicar,
     * cambia testMode a false y coloca tus IDs reales (nunca en el código
     * fuente versionado: cárgalos desde config remota o variables de build).
     * -------------------------------------------------------------------- */
    testMode: true,
    /* Dispositivos de prueba (opcional). Con testMode=true, los IDs que
     * aparezcan aquí reciben anuncios de prueba reales en vez de producción.
     * Android: el ID sale en logcat al arrancar — "Use RequestConfiguration...
     * setTestDeviceIds(Arrays.asList(\"XXXXXXXX\"))".
     * NUNCA dejar dispositivos reales aquí en la build de producción. */
    testDevices: [],
    adUnits: {
      admob: {
        banner: 'ca-app-pub-3940256099942544/6300978111',
        interstitial: 'ca-app-pub-3940256099942544/1033173712',
        rewarded: 'ca-app-pub-3940256099942544/5224354917'
      },
      unity_ads: { gameId: 'TEST_GAME_ID', rewarded: 'Rewarded_Android', interstitial: 'Interstitial_Android', banner: 'Banner_Android' },
      applovin: { sdkKey: 'TEST_SDK_KEY', rewarded: 'YOUR_REWARDED_AD_UNIT', interstitial: 'YOUR_INTERSTITIAL_AD_UNIT', banner: 'YOUR_BANNER_AD_UNIT' },
      iron_source: { appKey: 'TEST_APP_KEY', rewarded: 'DefaultRewardedVideo', interstitial: 'DefaultInterstitial' },
      meta_audience: { placementId: 'YOUR_PLACEMENT_ID' }
    },

    /* Reglas de frecuencia: cumplen las políticas de las redes y de las tiendas. */
    ads: {
      interstitialEveryLevels: 3,      // solo cada 3 niveles completados
      interstitialMinSeconds: 90,      // nunca dos seguidos en menos de 90 s
      bannerMenuOnly: true,            // el banner NUNCA aparece durante el juego
      neverDuringGameplay: true,
      childDirected: false,            // true → desactiva anuncios personalizados
      requireConsentBeforeAds: true    // GDPR/UMP antes de cargar cualquier anuncio
    },

    /* ---- Compras dentro de la app --------------------------------------- */
    iap: [
      { id: 'contramarea.no_ads', type: 'non_consumable', price: '2.99 USD', gems: 0, title: { es: 'Sin anuncios', en: 'Remove Ads' }, desc: { es: 'Elimina los anuncios intersticiales y el banner para siempre.', en: 'Removes interstitials and banner forever.' } },
      { id: 'contramarea.starter', type: 'non_consumable', price: '4.99 USD', gems: 350, title: { es: 'Pack de bienvenida', en: 'Starter Pack' }, desc: { es: '350 gemas + Ancla permanente + sin anuncios.', en: '350 gems + permanent Anchor + no ads.' } },
      { id: 'contramarea.gems_100', type: 'consumable', price: '1.99 USD', gems: 100, title: { es: '100 gemas', en: '100 gems' }, desc: { es: 'Puñado de gemas para poderes.', en: 'A handful of gems for powers.' } },
      { id: 'contramarea.gems_500', type: 'consumable', price: '7.99 USD', gems: 500, title: { es: '500 gemas', en: '500 gems' }, desc: { es: 'Mejor relación cantidad/precio.', en: 'Best value per gem.' } },
      { id: 'contramarea.gems_1500', type: 'consumable', price: '19.99 USD', gems: 1500, title: { es: '1500 gemas', en: '1500 gems' }, desc: { es: 'Para jugadores que van en serio.', en: 'For players who mean it.' } }
    ],

    /* ---- Poderes --------------------------------------------------------- */
    powers: [
      { id: 'current', cost: 40, icon: 'wave', title: { es: 'Corriente', en: 'Current' }, desc: { es: 'Barre todas las piezas de nivel 1 del tablero.', en: 'Sweeps every tier-1 piece off the board.' } },
      { id: 'lowtide', cost: 60, icon: 'moon', title: { es: 'Bajamar', en: 'Low Tide' }, desc: { es: 'Baja la marea 3 puntos.', en: 'Pushes the tide back by 3.' } },
      { id: 'anchor', cost: 30, icon: 'anchor', title: { es: 'Ancla', en: 'Anchor' }, desc: { es: 'Guarda hasta 2 piezas para soltarlas después.', en: 'Stores up to 2 pieces to drop later.' } }
    ],

    /* ---- Textos ---------------------------------------------------------- */
    i18n: {
      es: {
        play: 'Jugar', levels: 'Niveles', shop: 'Tienda', settings: 'Ajustes',
        continue: 'Continuar', retry: 'Reintentar', next: 'Siguiente', menu: 'Menú',
        back: 'Volver', close: 'Cerrar', buy: 'Comprar', restore: 'Restaurar compras',
        watch: 'Ver anuncio', free: 'Gratis', locked: 'Bloqueado',
        movesLeft: 'Movimientos', tide: 'Marea', score: 'Puntos', gems: 'Gemas',
        objective: 'Objetivo', levelComplete: '¡Nivel superado!', flooded: '¡El agua cubrió el arrecife!',
        stuck: 'Sin movimientos posibles', outOfMoves: 'Se acabaron los movimientos',
        tapToStart: 'Desliza para mover', rotate: 'Gira el dispositivo',
        consentTitle: 'Tu privacidad', consentBody: 'Usamos datos para mostrarte anuncios. Puedes aceptar o rechazar los anuncios personalizados. El juego funciona igual.',
        accept: 'Aceptar', reject: 'Rechazar', privacy: 'Política de privacidad',
        sound: 'Sonido', language: 'Idioma', resetProgress: 'Borrar progreso',
        confirmReset: '¿Borrar todo el progreso? No se puede deshacer.',
        rewardedReady: 'Anuncio listo', loadingAd: 'Cargando anuncio…',
        adNotReady: 'El anuncio no está disponible ahora', thanks: '¡Gracias!',
        noAds: 'Sin anuncios activo', gemsAdded: 'Gemas añadidas',
        notEnoughGems: 'No tienes suficientes gemas',
        objectiveTier: 'Alcanza {0}', objectiveScore: 'Consigue {0} puntos',
        objectiveMerges: 'Haz {0} fusiones', objectiveSurvive: 'Sobrevive a {0} subidas de marea',
        endless: 'Mar abierto', endlessDesc: 'Juega sin límite. ¿Cuánto aguantas?',
        endlessOver: 'Fin del mar abierto', bestScore: 'Mejor puntuación',
        install: 'Instalar app', installed: '¡App instalada!'
      },
      en: {
        play: 'Play', levels: 'Levels', shop: 'Shop', settings: 'Settings',
        continue: 'Continue', retry: 'Retry', next: 'Next', menu: 'Menu',
        back: 'Back', close: 'Close', buy: 'Buy', restore: 'Restore purchases',
        watch: 'Watch ad', free: 'Free', locked: 'Locked',
        movesLeft: 'Moves', tide: 'Tide', score: 'Score', gems: 'Gems',
        objective: 'Goal', levelComplete: 'Level cleared!', flooded: 'The water covered the reef!',
        stuck: 'No moves left', outOfMoves: 'Out of moves',
        tapToStart: 'Swipe to move', rotate: 'Rotate your device',
        consentTitle: 'Your privacy', consentBody: 'We use data to show you ads. You can accept or reject personalised ads. The game works either way.',
        accept: 'Accept', reject: 'Reject', privacy: 'Privacy policy',
        sound: 'Sound', language: 'Language', resetProgress: 'Reset progress',
        confirmReset: 'Erase all progress? This cannot be undone.',
        rewardedReady: 'Ad ready', loadingAd: 'Loading ad…',
        adNotReady: 'Ad not available right now', thanks: 'Thank you!',
        noAds: 'No ads active', gemsAdded: 'Gems added',
        notEnoughGems: 'Not enough gems',
        objectiveTier: 'Reach {0}', objectiveScore: 'Score {0} points',
        objectiveMerges: 'Make {0} merges', objectiveSurvive: 'Survive {0} tide rises',
        endless: 'Open sea', endlessDesc: 'Play without limits. How long can you last?',
        endlessOver: 'Open sea over', bestScore: 'Best score',
        install: 'Install app', installed: 'App installed!'
      }
    }
  };

  M.t = function (key, lang) {
    var l = lang || M.Save.get().settings.lang || 'es';
    var table = M.CONFIG.i18n[l] || M.CONFIG.i18n.es;
    return table[key] != null ? table[key] : (M.CONFIG.i18n.es[key] != null ? M.CONFIG.i18n.es[key] : key);
  };

  M.objectiveText = function (objective, lang) {
    var l = lang || M.Save.get().settings.lang || 'es';
    var names = { es: { tier: ['Brote', 'Coralito', 'Coral', 'Anémona', 'Estrella', 'Perla', 'Arrecife'], merges: 'fusiones', score: 'puntos', survive: 'subidas de marea' },
                  en: { tier: ['Sprout', 'Coralbud', 'Coral', 'Anemone', 'Starfish', 'Pearl', 'Reef'], merges: 'merges', score: 'points', survive: 'tide rises' } }[l];
    if (objective.type === 'tier') {
      return (l === 'es' ? 'Alcanza ' : 'Reach ') + names.tier[Math.min(6, objective.value - 1)];
    }
    if (objective.type === 'score') return (l === 'es' ? 'Consigue ' : 'Score ') + objective.value + ' ' + names.score;
    if (objective.type === 'merges') return (l === 'es' ? 'Haz ' : 'Make ') + objective.value + ' ' + names.merges;
    return (l === 'es' ? 'Sobrevive a ' : 'Survive ') + objective.value + ' ' + names.survive;
  };
})(window.MAREA);
