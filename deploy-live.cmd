@echo off

cd /d "%~dp0"

git remote set-url origin https://github.com/exelance25/nfttest.git

echo Remote: https://github.com/exelance25/nfttest.git

echo.

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

  git -c user.name=exelance25 -c user.email=exelance25@users.noreply.github.com commit -m "fix: Vercel build — eslint config and ignore lint during builds"

) else (

  echo No staged changes to commit.

)

echo.

git push -u origin main

if errorlevel 1 git push -u origin HEAD:main

echo.

echo Vercel otomatik deploy baslar: https://nfttest-sepia.vercel.app

echo Done.

