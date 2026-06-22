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

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  Write-Host "Vercel CLI kuruluyor..."
  npm.cmd install -g vercel
}

if (-not (Test-Path ".vercel\project.json")) {
  Write-Host "Vercel projesi baglaniyor (nfttest)..."
  vercel link --project nfttest --yes
}

$envVars = @{
  "NEXT_PUBLIC_SITE_URL" = "https://nfttest-sepia.vercel.app"
  "NEXT_PUBLIC_WC_PROJECT_ID" = "16d697592f940601c12c6b51f2a64f48"
  "NEXT_PUBLIC_MONAD_TESTNET_RPC" = "https://testnet-rpc.monad.xyz"
  "NEXT_PUBLIC_BASE_SEPOLIA_RPC" = "https://sepolia.base.org"
  "NEXT_PUBLIC_MONAD_WETH_ADDRESS" = "0xEE8c0E9f1BFFb4Eb878d8f15f368A02a35481242"
  "NEXT_PUBLIC_MONAD_NFT_ADDRESS" = "0xd7846b1d5fd3d47ab8db58e7cc388c358df3554d"
  "NEXT_PUBLIC_BASE_NFT_ADDRESS" = "0xd7846b1d5fd3d47ab8db58e7cc388c358df3554d"
}

foreach ($envName in $envVars.Keys) {
  foreach ($target in @("production", "preview", "development")) {
    vercel env rm $envName $target -y 2>$null
  }
}

foreach ($entry in $envVars.GetEnumerator()) {
  $value = $entry.Value
  foreach ($target in @("production", "preview", "development")) {
    $value | vercel env add $entry.Key $target
  }
  Write-Host "  $($entry.Key) = $value"
}

Write-Host "`n=== [3/3] Production deploy ===" -ForegroundColor Cyan
vercel --prod --yes

Write-Host "`nTAMAM: https://nfttest-sepia.vercel.app" -ForegroundColor Green
