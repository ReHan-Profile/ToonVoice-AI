@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is required. Install Node.js LTS first.& pause & exit /b 1)
if not exist node_modules call npm install
if errorlevel 1 (echo Dependency installation failed.& pause & exit /b 1)
npm start
pause
