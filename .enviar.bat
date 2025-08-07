@echo off
set /p mensagem=Digite a mensagem do commit: 

echo.
echo Adicionando arquivos ao Git...
git add .

echo.
echo Criando commit com a mensagem:
echo "%mensagem%"
git commit -m "%mensagem%"

echo.
echo Enviando para o GitHub...
git push origin main

echo.
echo Projeto enviado com sucesso! 🚀
pause