@echo off

cd /d "%~dp0"

set "PATH=%USERPROFILE%\.foundry\bin;%PATH%"

set "LOG=%~dp0deploy-log.txt"



echo === akln-nft kontrat deploy ===> "%LOG%"

echo Klasor: %CD%>> "%LOG%"

echo.>> "%LOG%"



forge --version >> "%LOG%" 2>&1

if errorlevel 1 (

  echo.

  echo HATA: forge bulunamadi.

  echo Git Bash: source ~/.bashrc  sonra  foundryup

  echo Detay: deploy-log.txt

  pause

  exit /b 1

)



if not exist .env.local (

  echo HATA: .env.local yok.

  pause

  exit /b 1

)



echo.

echo 1/3 Bakiye kontrolu...

call node --use-system-ca scripts\check-balances.mjs >> "%LOG%" 2>&1

if errorlevel 2 (

  echo.

  echo YETERSIZ GAS — deploy-log.txt dosyasina bakin.

  type "%LOG%"

  pause

  exit /b 1

)



echo.

echo 2/3 Monad kontrat (NFT fiyati ETH/WETH — MON degil)...

call npm.cmd run deploy:monad >> "%LOG%" 2>&1

set MONAD_OK=%ERRORLEVEL%



echo.

echo 3/3 Base kontrat (native ETH)...

call npm.cmd run deploy:base >> "%LOG%" 2>&1

set BASE_OK=%ERRORLEVEL%



echo.>> "%LOG%"

if %MONAD_OK%==0 if %BASE_OK%==0 (

  echo DEPLOY BASARILI>> "%LOG%"

  echo.

  echo DEPLOY BASARILI

  echo Yeni adresler .env.local icinde.

  echo Sonra deploy-live.cmd calistirin ^(GitHub push icin onay gerekir^).

) else (

  echo DEPLOY BASARISIZ>> "%LOG%"

  echo.

  echo DEPLOY BASARISIZ — son satirlar:

  powershell -NoProfile -Command "Get-Content -Path '%LOG%' -Tail 25"

)

echo.

echo Tam log: deploy-log.txt

pause

