@echo off
title NFT - Canliya Al
cd /d "%~dp0"

echo.
echo ========================================
echo   NFT - CANLIYA AL (build + push + Vercel)
echo   Proje: %CD%
echo ========================================
echo.

echo [1/3] Build testi...
call npm.cmd run build
if errorlevel 1 (
  echo.
  echo BUILD BASARISIZ - yukaridaki hatayi okuyun.
  pause
  exit /b 1
)
echo BUILD OK
echo.

echo [2/3] GitHub push + [3/3] Vercel deploy...
powershell -ExecutionPolicy Bypass -File "%~dp0VERCEL-GUNCELLE.ps1"

echo.
echo Site: https://nfttest-sepia.vercel.app
echo Kontrol: baslik "NFT", Monad fiyati "0.0001 ETH" olmali.
pause
