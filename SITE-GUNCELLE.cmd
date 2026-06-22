@echo off
title NFT - Site Guncelle (yeni Monad kontrat)
cd /d "%~dp0"

echo.
echo ========================================
echo   SITE GUNCELLE - yeni Monad kontrat
echo   Kontrat: 0x0e589888301cef33c0e38dc8a75e6c851433ab56
echo ========================================
echo.

echo [1/2] GitHub push...
call deploy-live.cmd
if errorlevel 1 (
  echo Push basarisiz
  pause
  exit /b 1
)

echo.
echo [2/2] Vercel env + deploy...
powershell -ExecutionPolicy Bypass -File "%~dp0VERCEL-GUNCELLE.ps1"

echo.
echo TAMAM. Siteyi yenile, NFT Monad mint dene.
pause
