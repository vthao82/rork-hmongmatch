param()
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
git pull origin main
bun install
npx expo export --platform web
Set-Location ..
firebase deploy --only hosting
