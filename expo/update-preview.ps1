param([string]$Message = "Preview update")
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
git pull origin main
bun install
$env:EAS_SKIP_AUTO_FINGERPRINT = "1"
npx expo export --platform android --no-bytecode
eas update --skip-bundler --channel preview --platform android --message $Message
