@echo off
setlocal
cd /d "%~dp0"
title Blogging Website

echo Starting the Blogging Website. Please wait...
echo.

where winget >nul 2>nul
if errorlevel 1 set "NO_WINGET=1"

call :find_python
if not defined PYTHON (
    call :install Python.Python.3.12 "Python"
    call :refresh_path
    call :find_python
)
if not defined PYTHON goto :missing_python

where npm >nul 2>nul
if errorlevel 1 (
    call :install OpenJS.NodeJS.LTS "Node.js"
    call :refresh_path
)
where npm >nul 2>nul
if errorlevel 1 goto :missing_node

call :ensure_docker
if errorlevel 1 goto :end

echo.
echo The website will open in your browser in a moment.
echo Keep this window open while you use the website. Close it to stop.
echo.

%PYTHON% run.py --open
if errorlevel 1 (
    echo.
    echo Something went wrong. Please send a screenshot of this window to the developer.
    pause
)
goto :end


:find_python
set "PYTHON="
py -3 --version >nul 2>nul && set "PYTHON=py -3" && exit /b
python --version >nul 2>nul && set "PYTHON=python" && exit /b
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set PYTHON="%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
exit /b


:install
if defined NO_WINGET exit /b
echo Installing %~2 (first time only). If Windows asks for permission, click Yes.
winget install -e --id %1 --silent --accept-package-agreements --accept-source-agreements
exit /b


:refresh_path
for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')"`) do set "PATH=%%p"
exit /b


:ensure_docker
where docker >nul 2>nul
if errorlevel 1 (
    call :install Docker.DockerDesktop "Docker Desktop"
    call :refresh_path
)
where docker >nul 2>nul
if errorlevel 1 goto :restart_needed

docker info >nul 2>nul
if not errorlevel 1 exit /b 0

if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
echo Waiting for Docker to start. If Docker asks you to accept its terms, click Accept.
for /l %%i in (1,1,90) do (
    docker info >nul 2>nul && exit /b 0
    timeout /t 2 /nobreak >nul
)
goto :restart_needed


:restart_needed
echo.
echo Docker is not ready yet. Please restart your computer,
echo then double-click start.bat again.
echo.
pause
exit /b 1


:missing_python
echo.
echo Python could not be installed automatically.
echo Please install it from https://www.python.org/downloads/
echo (tick "Add python.exe to PATH"), then double-click start.bat again.
echo.
pause
goto :end


:missing_node
echo.
echo Node.js could not be installed automatically.
echo Please install it from https://nodejs.org, then double-click start.bat again.
echo.
pause
goto :end


:end
endlocal
