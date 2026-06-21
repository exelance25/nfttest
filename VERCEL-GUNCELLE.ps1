# SADECE akln-nft projesi — baska klasorde calistirmayin
$root = $PSScriptRoot
if ($root -notmatch "akln-nft") {
  Write-Host "HATA: Bu script sadece akln-nft klasorunde calisir." -ForegroundColor Red
  Write-Host "Dogru yol: C:\Users\omerr\.cursor\projects\empty-window\akln-nft"
  exit 1
}
Set-Location $root
Write-Host "Proje: akln-nft (nfttest)" -ForegroundColor Yellow
Write-Host "Klasor: $root`n"
$env:Path = "$env:USERPROFILE\.foundry\bin;$env:Path"

Write-Host "`n=== [1/3] GitHub push ===" -ForegroundColor Cyan
cmd /c deploy-live.cmd

Write-Host "`n=== [2/3] Vercel env ===" -ForegroundColor Cyan
$monad = "0xd7846b1d5fd3d47ab8db58e7cc388c358df3554d"
$base  = "0xd7846b1d5fd3d47ab8db58e7cc388c358df3554d"

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  Write-Host "Vercel CLI kuruluyor..."
  npm.cmd install -g vercel
}

if (-not (Test-Path ".vercel\project.json")) {
  Write-Host "Vercel projesi baglaniyor (nfttest)..."
  vercel link --project nfttest --yes
}

foreach ($envName in @("NEXT_PUBLIC_MONAD_NFT_ADDRESS", "NEXT_PUBLIC_BASE_NFT_ADDRESS")) {
  vercel env rm $envName production -y 2>$null
  vercel env rm $envName preview -y 2>$null
  vercel env rm $envName development -y 2>$null
}

$monad | vercel env add NEXT_PUBLIC_MONAD_NFT_ADDRESS production
$monad | vercel env add NEXT_PUBLIC_MONAD_NFT_ADDRESS preview
$monad | vercel env add NEXT_PUBLIC_MONAD_NFT_ADDRESS development
$base  | vercel env add NEXT_PUBLIC_BASE_NFT_ADDRESS production
$base  | vercel env add NEXT_PUBLIC_BASE_NFT_ADDRESS preview
$base  | vercel env add NEXT_PUBLIC_BASE_NFT_ADDRESS development

Write-Host "`n=== [3/3] Production deploy ===" -ForegroundColor Cyan
vercel --prod --yes

Write-Host "`nTAMAM: https://nfttest-sepia.vercel.app" -ForegroundColor Green
