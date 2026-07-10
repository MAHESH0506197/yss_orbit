@echo off
setlocal enabledelayedexpansion
cd /d C:\PROJECT\yss_orbit

echo ======================================
echo Git Repository Health Check
echo ======================================

git status >nul 2>&1
if errorlevel 1 (
    echo ERROR: Not a git repository!
    pause
    exit /b 1
)

echo.
echo ======================================
echo Current Branch
echo ======================================
for /f "tokens=*" %%a in ('git branch --show-current') do set CURRENT_BRANCH=%%a
echo You are on branch: !CURRENT_BRANCH!

echo.
echo ======================================
echo Pull Latest Changes
echo ======================================
git pull origin !CURRENT_BRANCH!
if errorlevel 1 (
    echo ERROR: Failed to pull latest changes. You may have a merge conflict. Please resolve it first!
    pause
    exit /b 1
)

echo.
echo ======================================
echo Stage All Changes
echo ======================================
git add .

echo.
echo ======================================
echo Repository Status
echo ======================================
git status -s
for /f "tokens=*" %%A in ('git status -s') do set CHANGES=%%A
if "!CHANGES!"=="" (
    echo.
    echo No changes found to commit. Your local files are already up to date!
    echo.
    echo ======================================
    echo Push To GitHub ^(Checking for unpushed commits^)
    echo ======================================
    git push origin !CURRENT_BRANCH!
    echo.
    echo SUCCESS - Local and GitHub are synchronized.
    pause
    exit /b 0
)

echo.
:prompt
set msg=
set /p msg=Enter commit message: 
if "!msg!"=="" (
    echo Error: Commit message cannot be empty. Please enter a valid message!
    goto prompt
)

git commit -m "!msg!"
if errorlevel 1 (
    echo ERROR: Commit failed.
    pause
    exit /b 1
)

echo.
echo ======================================
echo Push To GitHub
echo ======================================
git push origin !CURRENT_BRANCH!
if errorlevel 1 (
    echo ERROR: Failed to push to GitHub. Please check your internet connection and permissions.
    pause
    exit /b 1
)

echo.
echo ======================================
echo Final Verification
echo ======================================
git log --oneline -1

echo.
echo SUCCESS - Local and GitHub are synchronized!
pause