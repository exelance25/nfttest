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
  $savedDeployerKey = $null
  if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
      if ($_ -match '^DEPLOYER_PRIVATE_KEY=(.+)$') {
        $savedDeployerKey = $matches[1].Trim().Trim('"')
      }
    }
  }
  vercel link --project nfttest --yes
  if ($savedDeployerKey) {
    $lines = @()
    if (Test-Path ".env.local") { $lines = Get-Content ".env.local" }
    $lines = $lines | Where-Object { $_ -notmatch '^DEPLOYER_PRIVATE_KEY=' }
    $lines += "DEPLOYER_PRIVATE_KEY=$savedDeployerKey"
    Set-Content -Path ".env.local" -Value $lines -Encoding UTF8
    Write-Host "DEPLOYER_PRIVATE_KEY korundu (.env.local)" -ForegroundColor Green
  }
}

$envVars = @{
  "NEXT_PUBLIC_SITE_URL" = "https://nfttest-sepia.vercel.app"
  "NEXT_PUBLIC_WC_PROJECT_ID" = "16d697592f940601c12c6b51f2a64f48"
  "NEXT_PUBLIC_MONAD_TESTNET_RPC" = "https://testnet-rpc.monad.xyz"
  "NEXT_PUBLIC_BASE_SEPOLIA_RPC" = "https://sepolia.base.org"
  "NEXT_PUBLIC_MONAD_ETH_ADDRESS" = "0x05a816Ef3330924F0A70b040A656E80D3D03363C"
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
