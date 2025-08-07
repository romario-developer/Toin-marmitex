@echo off
setlocal

:: Define o repositório remoto fixo
git remote remove origin >nul 2>&1
git remote add origin https://github.com/romario-developer/Toin-marmitex.git

:: Solicita ao usuário a mensagem do commit
set /p commit_msg=Digite a mensagem do commit: 

echo.
echo Adicionando arquivos ao Git...
git add .

echo.
echo Criando commit com a mensagem:
echo "%commit_msg%"
git commit -m "%commit_msg%"

echo.
echo Enviando para o repositório remoto...
git branch -M main
git push -u origin main

echo.
echo Projeto enviado com sucesso para:
echo https://github.com/romario-developer/Toin-marmitex
pause
