@echo off
setlocal
cd /d "%~dp0"

set "BASH=C:\Program Files\Git\bin\bash.exe"
if not exist "%BASH%" set "BASH=C:\Program Files (x86)\Git\bin\bash.exe"
if not exist "%BASH%" (
  echo HATA: Git Bash bulunamadi. Git kurulu mu kontrol edin.
  exit /b 1
)

echo === 1/3 Foundry kuruluyor (2-3 dakika) ===
"%BASH%" -lc "curl -L https://foundry.paradigm.xyz | bash"
if errorlevel 1 exit /b 1

echo === 2/3 foundryup ===
"%BASH%" -lc "source ~/.bashrc 2>/dev/null; foundryup"
if errorlevel 1 exit /b 1

set "PATH=%USERPROFILE%\.foundry\bin;%PATH%"
forge --version
if errorlevel 1 (
  echo HATA: forge hala bulunamadi.
  exit /b 1
)

echo === 3/3 Kontrat deploy ===
if not exist .env.local (
  echo HATA: .env.local yok. Once: notepad .env.local
  exit /b 1
)
call npm.cmd run deploy
if errorlevel 1 (
  echo Deploy basarisiz.
  exit /b 1
)

echo.
echo TAMAM. Sonra canli site: deploy-live.cmd
pause
