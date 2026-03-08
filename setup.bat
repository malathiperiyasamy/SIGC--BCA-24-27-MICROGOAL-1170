@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Project Setup and Verification Script
echo ========================================
echo.

set "ERROR_COUNT=0"
set "WARNING_COUNT=0"

:: ========================================
:: Step 1: Check Node.js Installation
:: ========================================
echo Checking Node.js installation...
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VERSION=%%i
    echo [OK] Node.js is installed: !NODE_VERSION!
) else (
    echo [ERROR] Node.js is NOT installed. Please install Node.js from https://nodejs.org/
    set /a ERROR_COUNT+=1
    goto :end_check
)

:: ========================================
:: Step 2: Check npm Installation
:: ========================================
echo Checking npm installation...
where npm >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('npm --version 2^>nul') do set NPM_VERSION=%%i
    echo [OK] npm is installed: !NPM_VERSION!
) else (
    echo [ERROR] npm is NOT installed. npm should come with Node.js.
    set /a ERROR_COUNT+=1
    goto :end_check
)

:: ========================================
:: Step 3: Check MongoDB Installation
:: ========================================
echo Checking MongoDB installation...
where mongod >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('mongod --version 2^>^&1 ^| findstr /i "version"') do set MONGO_VERSION=%%i
    echo [OK] MongoDB is installed: !MONGO_VERSION!
    
    :: Check if MongoDB service is running
    sc query MongoDB >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        sc query MongoDB | findstr /i "RUNNING" >nul 2>&1
        if %ERRORLEVEL% EQU 0 (
            echo [OK] MongoDB service is running
        ) else (
            echo [WARNING] MongoDB is installed but service is not running
            echo   You may need to start MongoDB manually or it may be running as a process
            set /a WARNING_COUNT+=1
        )
    ) else (
        :: Check if mongod process is running
        tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
        if %ERRORLEVEL% EQU 0 (
            echo [OK] MongoDB process is running
        ) else (
            echo [WARNING] MongoDB is installed but may not be running
            echo   Start MongoDB with: mongod --dbpath ^<your-data-path^>
            echo   Or use MongoDB Atlas (cloud) and update MONGO_URL in .env file
            set /a WARNING_COUNT+=1
        )
    )
) else (
    echo [WARNING] MongoDB is NOT installed or not in PATH
    echo   Please install MongoDB from https://www.mongodb.com/try/download/community
    echo   Or use MongoDB Atlas (cloud) and update MONGO_URL in .env file
    set /a WARNING_COUNT+=1
)

:: ========================================
:: Step 4: Check Project Structure
:: ========================================
echo.
echo Checking project structure...
if exist "Backend\package.json" (
    echo [OK] package.json found
) else (
    echo [ERROR] package.json not found in Backend directory
    set /a ERROR_COUNT+=1
    goto :end_check
)

if exist "Backend\Index.js" (
    echo [OK] Index.js found
) else (
    echo [WARNING] Index.js not found in Backend directory
    set /a WARNING_COUNT+=1
)

:: ========================================
:: Step 5: Check for .env file
:: ========================================
echo.
echo Checking environment configuration...
if exist "Backend\.env" (
    echo [OK] .env file found
) else (
    echo [WARNING] .env file not found
    echo   Creating .env file template...
    (
        echo PORT=8000
        echo MONGO_URL=mongodb://localhost:27017/your-database-name
    ) > "Backend\.env"
    echo [INFO] .env template created. Please update MONGO_URL with your MongoDB connection string
    set /a WARNING_COUNT+=1
)

:: ========================================
:: Step 6: Install Dependencies
:: ========================================
echo.
echo Installing npm dependencies...
if exist "Backend\node_modules" (
    echo [INFO] node_modules directory exists
    echo   Checking if dependencies need to be updated...
) else (
    echo [INFO] node_modules directory not found, will install dependencies
)

cd Backend
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Cannot access Backend directory
    set /a ERROR_COUNT+=1
    goto :end_check
)

echo   Running npm install...
call npm install
if %ERRORLEVEL% EQU 0 (
    echo [OK] Dependencies installed successfully
) else (
    echo [ERROR] Failed to install dependencies
    set /a ERROR_COUNT+=1
    cd ..
    goto :end_check
)

cd ..

:: ========================================
:: Step 7: Verify Installation
:: ========================================
echo.
echo Verifying installation...
if exist "Backend\node_modules\express" (
    echo [OK] Express.js installed
) else (
    echo [ERROR] Express.js not found in node_modules
    set /a ERROR_COUNT+=1
)

if exist "Backend\node_modules\mongoose" (
    echo [OK] Mongoose installed
) else (
    echo [ERROR] Mongoose not found in node_modules
    set /a ERROR_COUNT+=1
)

if exist "Backend\node_modules\dotenv" (
    echo [OK] dotenv installed
) else (
    echo [ERROR] dotenv not found in node_modules
    set /a ERROR_COUNT+=1
)

if exist "Backend\node_modules\bcryptjs" (
    echo [OK] bcryptjs installed
) else (
    echo [ERROR] bcryptjs not found in node_modules
    set /a ERROR_COUNT+=1
)

if exist "Backend\node_modules\jsonwebtoken" (
    echo [OK] jsonwebtoken installed
) else (
    echo [ERROR] jsonwebtoken not found in node_modules
    set /a ERROR_COUNT+=1
)

if exist "Backend\node_modules\joi" (
    echo [OK] joi installed
) else (
    echo [ERROR] joi not found in node_modules
    set /a ERROR_COUNT+=1
)

if exist "Backend\node_modules\cors" (
    echo [OK] cors installed
) else (
    echo [ERROR] cors not found in node_modules
    set /a ERROR_COUNT+=1
)

:: ========================================
:: Summary
:: ========================================
:end_check
echo.
echo ========================================
echo   Setup Summary
echo ========================================
echo.

if %ERROR_COUNT% EQU 0 (
    if %WARNING_COUNT% EQU 0 (
        echo [SUCCESS] All checks passed! Project is ready to use.
        echo.
        echo Next steps:
        echo   1. Update Backend\.env with your MongoDB connection string
        echo   2. Make sure MongoDB is running (or use MongoDB Atlas)
        echo   3. Start the server with: cd Backend ^&^& node Index.js
    ) else (
        echo [WARNING] Setup completed with %WARNING_COUNT% warning(s).
        echo   Please review the warnings above.
        echo.
        echo Next steps:
        echo   1. Update Backend\.env with your MongoDB connection string
        echo   2. Make sure MongoDB is running (or use MongoDB Atlas)
        echo   3. Start the server with: cd Backend ^&^& node Index.js
    )
) else (
    echo [ERROR] Setup failed with %ERROR_COUNT% error(s).
    echo   Please fix the errors above before proceeding.
    exit /b 1
)

echo.
echo ========================================
pause
