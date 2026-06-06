@echo off
setlocal enabledelayedexpansion

title Website Project Setup
cls

echo.
echo ============================================
echo    Website Folder Structure Generator
echo ============================================
echo.

set /p projectName="Enter project name: "

for /f "tokens=*" %%A in ("!projectName!") do set projectName=%%A

if "!projectName!"=="" (
    echo.
    echo Error: Project name cannot be empty.
    echo.
    pause
    exit /b 1
)

if exist "!projectName!" (
    echo.
    echo Error: Folder "!projectName!" already exists.
    echo.
    pause
    exit /b 1
)

mkdir "!projectName!"
cd /d "!projectName!"

mkdir assets\css
mkdir assets\js
mkdir assets\images
mkdir assets\fonts
mkdir components
mkdir pages

(
    echo ^<!DOCTYPE html^>
    echo ^<html lang="en"^>
    echo ^<head^>
    echo     ^<meta charset="UTF-8"^>
    echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
    echo     ^<title^>!projectName!^</title^>
    echo     ^<link rel="stylesheet" href="assets/css/styles.css"^>
    echo ^</head^>
    echo ^<body^>
    echo     ^<header^>
    echo         ^<nav^>
    echo             ^<h1^>!projectName!^</h1^>
    echo         ^</nav^>
    echo     ^</header^>
    echo.
    echo     ^<main^>
    echo         ^<section^>
    echo             ^<h2^>Welcome^</h2^>
    echo             ^<p^>Your project is ready to go!^</p^>
    echo         ^</section^>
    echo     ^</main^>
    echo.
    echo     ^<footer^>
    echo         ^<p^>&copy; 2026 !projectName!. All rights reserved.^</p^>
    echo     ^</footer^>
    echo.
    echo     ^<script src="assets/js/app.js"^>^</script^>
    echo ^</body^>
    echo ^</html^>
) > index.html

(
    echo /* Reset and Base Styles */
    echo * {
    echo     margin: 0;
    echo     padding: 0;
    echo     box-sizing: border-box;
    echo }
    echo.
    echo body {
    echo     font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    echo     line-height: 1.6;
    echo     color: #333;
    echo     background-color: #f4f4f4;
    echo }
    echo.
    echo header {
    echo     background-color: #333;
    echo     color: #fff;
    echo     padding: 1rem 0;
    echo }
    echo.
    echo header h1 {
    echo     margin: 0 2rem;
    echo }
    echo.
    echo main {
    echo     max-width: 1200px;
    echo     margin: 2rem auto;
    echo     padding: 0 1rem;
    echo }
    echo.
    echo footer {
    echo     background-color: #333;
    echo     color: #fff;
    echo     text-align: center;
    echo     padding: 1rem 0;
    echo     margin-top: 3rem;
    echo }
) > assets\css\styles.css

(
    echo document.addEventListener^('DOMContentLoaded', function^(^) {
    echo     console.log^('!projectName! loaded'^);
    echo }^);
) > assets\js\app.js

(
    echo # !projectName!
    echo.
    echo ## Struktur
    echo.
    echo !projectName!/
    echo ├── index.html
    echo ├── README.md
    echo ├── assets/
    echo │   ├── css/styles.css
    echo │   ├── js/app.js
    echo │   ├── images/
    echo │   └── fonts/
    echo ├── components/
    echo └── pages/
) > README.md

cd ..

echo.
echo ============================================
echo    Ferdig!
echo ============================================
echo.
echo Prosjekt "!projectName!" er opprettet med:
echo.
echo   !projectName!/
echo   ├── index.html
echo   ├── README.md
echo   ├── assets/
echo   │   ├── css/styles.css
echo   │   ├── js/app.js
echo   │   ├── images/
echo   │   └── fonts/
echo   ├── components/
echo   └── pages/
echo.
pause
