@echo off
title 🥘 Iniciando Projeto Marmitex

echo Iniciando Backend (API + Bot)...
start cmd /k "cd backend && npm install && node server.js"

echo Iniciando Painel Admin (React)...
start cmd /k "cd admin && npm install && npm run dev"

echo Projeto Marmitex em execução.
pause
