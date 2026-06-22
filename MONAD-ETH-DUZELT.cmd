@echo off
title NFT - Monad ETH Duzelt
cd /d "%~dp0"
set "PATH=%USERPROFILE%\.foundry\bin;%PATH%"

echo.
echo ========================================
echo   MONAD NFT - DOGRU ETH ILE YENIDEN DEPLOY
echo   Odeme tokeni: 0x05a816... (cuzdandaki ETH)
echo   Eski yanlis WETH adresi kullanilmayacak
echo ========================================
echo.

if not exist .env.local (
  echo HATA: .env.local yok - DEPLOYER_PRIVATE_KEY gerekli
  pause
  exit /b 1
)

findstr /R /C:"^DEPLOYER_PRIVATE_KEY=0x[0-9a-fA-F][0-9a-fA-F]*" .env.local >nul
if errorlevel 1 findstr /R /C:"^DEPLOYER_PRIVATE_KEY=[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]" .env.local >nul
if errorlevel 1 (
  echo.
  echo HATA: .env.local icinde DEPLOYER_PRIVATE_KEY yok veya bos.
  echo Vercel .env.local dosyasini silmis olabilir.
  echo.
  echo Cozum:
  echo   notepad .env.local
  echo   En alta ekle: DEPLOYER_PRIVATE_KEY=0xSENIN_OZEL_ANAHTARIN
  echo   Kaydet, kapat, bu scripti tekrar calistir.
  echo.
  pause
  exit /b 1
)

echo [1/3] Bakiye kontrol...
call node --use-system-ca scripts\check-balances.mjs
if errorlevel 2 (
  echo GAS EKSIK - deploy cuzdanina MON gonderin
  pause
  exit /b 1
)

echo.
echo [2/3] Monad kontrat deploy (ETH token ile)...
call npm.cmd run deploy:monad
if errorlevel 1 (
  echo DEPLOY BASARISIZ
  pause
  exit /b 1
)

echo.
echo Yeni Monad kontrat:
findstr "NEXT_PUBLIC_MONAD_NFT_ADDRESS" .env.local
echo.

echo [3/3] Build + GitHub + Vercel...
call cmd /c CANLIYA-AL.cmd
