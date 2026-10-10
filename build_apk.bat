@echo off
REM ===========================================================================
REM Contramarea - compila un APK de DEPURACION instalable en tu telefono.
REM No pasa por Google Play: es un APK de pruebas con anuncios de prueba.
REM
REM   tools\build_apk.bat
REM
REM Requisitos: JDK 21, Android SDK y el proyecto android\ generado.
REM ===========================================================================
setlocal
cd /d "%~dp0.."

echo.
echo ==^> 1/3  Sincronizando el juego con el proyecto Android
call npx cap sync android
if errorlevel 1 exit /b 1

echo.
echo ==^> 2/3  Compilando el APK de depuracion (la primera vez tarda varios minutos)
cd android
call gradlew.bat assembleDebug
if errorlevel 1 exit /b 1

set APK=app\build\outputs\apk\debug\app-debug.apk

echo.
echo ==^> 3/3  Listo
dir "%APK%"
echo.
echo   Instalar por USB (con la depuracion USB activada):
echo       adb install -r android\%APK%
echo.
echo   O copia el archivo al telefono y abrelo desde el gestor de archivos.
echo.
endlocal
