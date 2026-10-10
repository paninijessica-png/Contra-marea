@echo off
REM Contramarea - arranca el juego en local.
REM Uso: run.bat   (luego abre http://127.0.0.1:8080/src/index.html)
cd /d "%~dp0"
if "%PORT%"=="" set PORT=8080
echo Contramarea - servidor local en http://127.0.0.1:%PORT%/src/index.html
node tools\serve.js %PORT%
pause
