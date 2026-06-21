@echo off
cd /d "%~dp0"
if not "%CD:~-8%"=="akln-nft" (
  echo HATA: Sadece akln-nft klasorunde calisir.
  pause
  exit /b 1
)
echo Proje: akln-nft / nfttest
echo.
echo Vercel production redeploy...
where vercel >nul 2>&1 || npm.cmd install -g vercel
vercel link --project nfttest --yes 2>nul
vercel --prod --yes
echo.
echo Bitti: https://nfttest-sepia.vercel.app
echo 2 dakika bekleyip Ctrl+F5 ile yenileyin.
pause
