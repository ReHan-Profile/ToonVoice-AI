@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is required. Install Node.js LTS first.& pause & exit /b 1)
if not exist node_modules call npm install
if errorlevel 1 (echo Dependency installation failed.& pause & exit /b 1)
npm run dist:win
if errorlevel 1 (echo Build failed. Check the error above.& pause & exit /b 1)
echo Installer created in the dist folder.
pause
