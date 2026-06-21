@echo off
cd /d "%~dp0"
set "PATH=%USERPROFILE%\.foundry\bin;%PATH%"
title akln-nft deploy

echo.
echo === akln-nft kontrat deploy ===
echo.

call node --use-system-ca scripts\check-balances.mjs
if errorlevel 2 (
  echo.
  echo GAS EKSIK - ekrandaki adrese MON + ETH gonderin.
  pause
  exit /b 1
)

echo.
echo Monad (ETH odemeli kontrat)...
call npm.cmd run deploy:monad
if errorlevel 1 goto FAIL

echo.
echo Base (ETH odemeli kontrat)...
call npm.cmd run deploy:base
if errorlevel 1 goto FAIL

echo.
echo DEPLOY BASARILI
findstr "NEXT_PUBLIC_MONAD_NFT_ADDRESS NEXT_PUBLIC_BASE_NFT_ADDRESS" .env.local
echo.
echo Simdi deploy-live.cmd calistirin.
pause
exit /b 0

:FAIL
echo.
echo DEPLOY BASARISIZ - deploy cuzdanina gas gerekli.
pause
exit /b 1
