@echo off
echo ========================================
echo    MarmiteX - Setup Automatico
echo ========================================
echo.

echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js encontrado

echo.
echo [2/6] Verificando MongoDB...
mongosh --version >nul 2>&1
if %errorlevel% neq 0 (
    echo AVISO: MongoDB CLI nao encontrado
    echo Certifique-se de que o MongoDB esta instalado e rodando
)
echo ✓ Verificacao do MongoDB concluida

echo.
echo [3/6] Instalando dependencias do Backend...
cd backend
if not exist package.json (
    echo ERRO: package.json nao encontrado no backend!
    pause
    exit /b 1
)
npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha na instalacao das dependencias do backend
    pause
    exit /b 1
)
echo ✓ Dependencias do backend instaladas

echo.
echo [4/6] Configurando arquivo .env...
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo ✓ Arquivo .env criado a partir do .env.example
        echo IMPORTANTE: Edite o arquivo .env com suas configuracoes!
    ) else (
        echo AVISO: .env.example nao encontrado
    )
) else (
    echo ✓ Arquivo .env ja existe
)

echo.
echo [5/6] Instalando dependencias do Frontend...
cd ../frontend
if not exist package.json (
    echo ERRO: package.json nao encontrado no frontend!
    pause
    exit /b 1
)
npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha na instalacao das dependencias do frontend
    pause
    exit /b 1
)
echo ✓ Dependencias do frontend instaladas

echo.
echo [6/6] Criando pastas necessarias...
cd ../backend
if not exist uploads mkdir uploads
if not exist sessions mkdir sessions
if not exist logs mkdir logs
echo ✓ Pastas criadas

cd ..
echo.
echo ========================================
echo        INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Proximos passos:
echo 1. Configure o arquivo backend/.env com suas credenciais
echo 2. Certifique-se de que o MongoDB esta rodando
echo 3. Execute: npm run dev (para desenvolvimento)
echo.
echo Para iniciar o projeto:
echo   Backend:  cd backend && npm start
echo   Frontend: cd frontend && npm run dev
echo.
pause