@echo off
cd /d "%~dp0"
echo Remote: https://github.com/exelance25/nfttest.git
git remote set-url origin https://github.com/exelance25/nfttest.git
echo.
echo Secret scan...
node scripts\check-secrets.mjs
if errorlevel 1 exit /b 1
echo.
git add -A
git reset HEAD -- .env .env.local .env.production .env.production.local 2>nul
git status --short
echo.
git diff --cached --quiet
if errorlevel 1 (
  node scripts\check-secrets.mjs
  if errorlevel 1 exit /b 1
  git -c user.name=exelance25 -c user.email=exelance25@users.noreply.github.com commit -m "AKLN NFT test mint app"
) else (
  echo No staged changes to commit.
)
echo.
git push -u origin main
if errorlevel 1 git push -u origin HEAD:main
echo Done.
