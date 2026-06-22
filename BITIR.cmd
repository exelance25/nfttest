@echo off

cd /d "%~dp0"

set "PATH=%USERPROFILE%\.foundry\bin;%PATH%"

title akln-nft - BITIR



echo.

echo ========================================

echo   akln-nft - TEK TIKLA BITIR

echo   Proje: %CD%

echo ========================================

echo.



if not exist .env.local (

  echo HATA: .env.local yok

  pause

  exit /b 1

)



echo [1/3] Bakiye kontrol...

call node --use-system-ca scripts\check-balances.mjs

if errorlevel 2 (

  echo.

  echo GAS EKSIK - faucet adresine token gonderin, sonra tekrar calistirin.

  pause

  exit /b 1

)



echo.

echo [2/3] Kontrat deploy (Monad ETH + Base ETH)...

call npm.cmd run deploy:monad

if errorlevel 1 (

  echo Monad deploy basarisiz - deploy-log.txt kontrol edin

  pause

  exit /b 1

)

call npm.cmd run deploy:base

if errorlevel 1 (

  echo Base deploy basarisiz

  pause

  exit /b 1

)



echo.

echo [3/3] GitHub + Vercel (canli site)...

echo ONAY: GitHub'a push yapilacak.

pause

call deploy-live.cmd



echo.

echo TAMAM. Site: https://nfttest-sepia.vercel.app

echo Vercel env'de yeni kontrat adreslerini guncellemeyi unutmayin.

pause

