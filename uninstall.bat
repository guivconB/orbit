@echo off
echo Procurando o desinstalador do Orbit...

set "UNINSTALLER_USER=%LOCALAPPDATA%\Programs\Orbit\Uninstall Orbit.exe"
set "UNINSTALLER_SYSTEM=%PROGRAMFILES%\Orbit\Uninstall Orbit.exe"

if exist "%UNINSTALLER_USER%" (
    echo Desinstalador encontrado. Iniciando desinstalacao...
    "%UNINSTALLER_USER%"
    goto end
)

if exist "%UNINSTALLER_SYSTEM%" (
    echo Desinstalador encontrado. Iniciando desinstalacao...
    "%UNINSTALLER_SYSTEM%"
    goto end
)

echo.
echo O desinstalador nao foi encontrado. O Orbit pode nao estar instalado no momento.
echo Voce tambem pode desinstalar manualmente acessando "Adicionar ou Remover Programas" no Windows.
echo.

:end
pause
