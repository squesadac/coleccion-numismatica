@echo off
REM Abre el sitio en el navegador para verlo en esta computadora.
cd /d "%~dp0"
start "" http://localhost:8765/
python -m http.server 8765
