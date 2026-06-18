# Push AKLN NFT to https://github.com/exelance25/nfttest.git
# Runs secret scan before any commit/push.
Set-Location $PSScriptRoot
$ErrorActionPreference = "Stop"

git remote set-url origin https://github.com/exelance25/nfttest.git
Write-Host "Remote:" -ForegroundColor Cyan
git remote -v

Write-Host "`nSecret scan..." -ForegroundColor Cyan
node scripts/check-secrets.mjs
if ($LASTEXITCODE -ne 0) { exit 1 }

# Never stage .env* secrets — explicit add only
git add -A
git reset HEAD -- .env .env.local .env.production .env.production.local 2>$null

Write-Host "`nStaged files:" -ForegroundColor Cyan
git status --short

$forbidden = git diff --cached --name-only | Where-Object {
  $_ -match '^\.env(\.local|\.production)?$' -or $_ -like 'contracts/broadcast/*'
}
if ($forbidden) {
  Write-Host "[SECURITY] Blocked — sensitive files staged:" -ForegroundColor Red
  $forbidden | ForEach-Object { Write-Host "  $_" }
  git reset HEAD -- $forbidden 2>$null
  exit 1
}

$changes = git diff --cached --name-only
if ($changes) {
  node scripts/check-secrets.mjs
  if ($LASTEXITCODE -ne 0) { exit 1 }
  git commit -m "AKLN NFT test mint app"
} else {
  Write-Host "No staged changes to commit." -ForegroundColor Yellow
}

git push -u origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host "Retrying push as HEAD:main..." -ForegroundColor Yellow
  git push -u origin HEAD:main
}

Write-Host "Done." -ForegroundColor Green
