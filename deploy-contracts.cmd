@echo off
cd /d "%~dp0"
echo === NFT kontrat deploy (ETH odemeli) ===
echo Monad: NFT fiyati ETH (WETH) — MON ile satilmaz
echo Base: NFT fiyati native ETH
echo DEPLOYER_PRIVATE_KEY .env.local icinde olmali.
echo.
if not exist .env.local (
  echo HATA: .env.local yok. Once setup-env.cmd calistirin.
  exit /b 1
)
call npm.cmd run deploy
if errorlevel 1 (
  echo.
  echo Kontrat deploy basarisiz - forge ve DEPLOYER_PRIVATE_KEY kontrol edin.
  exit /b 1
)
echo.
echo Kontrat adresleri .env.local guncellendi.
echo Simdi canli site icin: deploy-live.cmd
echo Done.
