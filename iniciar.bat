@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao foi encontrado. Instale Node.js 18 ou superior.
  echo https://nodejs.org/
  pause
  exit /b 1
)
echo ============================================
echo Concurso+ 3.0 - servidor local
echo Abra http://127.0.0.1:3100 no navegador
echo Para encerrar, pressione CTRL+C.
echo ============================================
node server.js
pause
