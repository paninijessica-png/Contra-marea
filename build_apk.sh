#!/usr/bin/env bash
# ============================================================================
# Contramarea — compila un APK de DEPURACIÓN instalable en tu teléfono.
# No pasa por Google Play: es un APK de pruebas con anuncios de prueba.
#
#   ./tools/build_apk.sh
#
# Requisitos: JDK 21, Android SDK y el proyecto android/ generado.
# ============================================================================
set -e
cd "$(dirname "$0")/.."

echo
echo "==> 1/3  Sincronizando el juego con el proyecto Android"
npx cap sync android

echo
echo "==> 2/3  Compilando el APK de depuración (la primera vez tarda varios minutos)"
cd android
./gradlew assembleDebug

APK="app/build/outputs/apk/debug/app-debug.apk"

echo
echo "==> 3/3  Listo"
ls -lh "$APK"
echo
echo "  Instalar por USB (con la depuración USB activada):"
echo "      adb install -r android/$APK"
echo
echo "  O copia el archivo al teléfono y ábrelo desde el gestor de archivos."
echo
