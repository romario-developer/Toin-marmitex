# Script para commit automático com input interativo
# Versão corrigida - sem erros de sintaxe

# Configuração inicial
$ErrorActionPreference = "Continue"

# Função para exibir mensagens coloridas
function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Cabeçalho
Clear-Host
Write-ColorMessage "============================================================" "Cyan"
Write-ColorMessage "           SCRIPT DE COMMIT AUTOMATICO" "Cyan"
Write-ColorMessage "============================================================" "Cyan"
Write-Host ""

# Verifica se é um repositório Git
if (-not (Test-Path ".git")) {
    Write-ColorMessage "ERRO: Este diretorio nao e um repositorio Git!" "Red"
    Write-ColorMessage "Certifique-se de estar na pasta raiz do projeto." "Yellow"
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-ColorMessage "Repositorio Git detectado!" "Green"
Write-Host ""

# Mostra status atual
Write-ColorMessage "Status atual do repositorio:" "Yellow"
Write-ColorMessage "----------------------------------------" "Gray"
git status
Write-Host ""

# Limpeza de cache
Write-ColorMessage "Limpando arquivos de cache do WhatsApp..." "Yellow"

$cacheFolders = @(
    "backend/tokens",
    "backend/.wwebjs_auth", 
    "backend/.wwebjs_cache"
)

foreach ($folder in $cacheFolders) {
    if (Test-Path $folder) {
        try {
            Remove-Item -Recurse -Force $folder -ErrorAction Stop
            Write-ColorMessage "  Removido: $folder" "Green"
        }
        catch {
            Write-ColorMessage "  Nao foi possivel remover: $folder" "Yellow"
        }
    }
    else {
        Write-ColorMessage "  Nao encontrado: $folder" "Gray"
    }
}

Write-Host ""

# Atualiza .gitignore
Write-ColorMessage "Atualizando .gitignore..." "Yellow"

$gitignoreContent = @"
node_modules/
.env
.DS_Store
tokens/
.wwebjs_auth/
.wwebjs_cache/
uploads/*.jpg
uploads/*.jpeg
uploads/*.png
uploads/*.gif
!uploads/.gitkeep
"@

try {
    $gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8 -Force
    Write-ColorMessage "  .gitignore atualizado com sucesso!" "Green"
}
catch {
    Write-ColorMessage "  Aviso: Nao foi possivel atualizar .gitignore" "Yellow"
    Write-ColorMessage "     Continuando mesmo assim..." "Yellow"
}

Write-Host ""

# Adiciona arquivos
Write-ColorMessage "Adicionando arquivos ao staging..." "Yellow"
try {
    git add .
    Write-ColorMessage "  Arquivos adicionados ao staging!" "Green"
}
catch {
    Write-ColorMessage "  Erro ao adicionar arquivos ao staging!" "Red"
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""

# Solicita mensagem de commit
Write-ColorMessage "MENSAGEM DO COMMIT" "Cyan"
Write-ColorMessage "-------------------------" "Gray"

do {
    $commitMessage = Read-Host "Digite a mensagem do commit"
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        Write-ColorMessage "A mensagem nao pode estar vazia! Tente novamente." "Red"
        Write-Host ""
    }
} while ([string]::IsNullOrWhiteSpace($commitMessage))

Write-Host ""
Write-ColorMessage "Mensagem escolhida: '$commitMessage'" "Green"
Write-Host ""

# Confirmação
Write-ColorMessage "CONFIRMACAO" "Yellow"
Write-ColorMessage "Deseja prosseguir com o commit e push?" "White"
$confirmacao = Read-Host "Digite 's' para SIM ou 'n' para NAO"

if ($confirmacao -ne 's' -and $confirmacao -ne 'S') {
    Write-ColorMessage "Operacao cancelada pelo usuario." "Red"
    Read-Host "Pressione Enter para sair"
    exit 0
}

Write-Host ""

# Realiza commit
Write-ColorMessage "Realizando commit..." "Yellow"
try {
    git commit -m "$commitMessage"
    if ($LASTEXITCODE -eq 0) {
        Write-ColorMessage "  Commit realizado com sucesso!" "Green"
    }
    else {
        Write-ColorMessage "  Erro no commit. Verifique se ha alteracoes para commitar." "Red"
        Read-Host "Pressione Enter para sair"
        exit 1
    }
}
catch {
    Write-ColorMessage "  Erro inesperado durante o commit!" "Red"
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""

# Push para GitHub
Write-ColorMessage "Enviando para o GitHub..." "Yellow"
try {
    git push
    if ($LASTEXITCODE -eq 0) {
        Write-ColorMessage "  Push realizado com sucesso!" "Green"
        Write-Host ""
        Write-ColorMessage "SUCESSO! Todas as alteracoes foram enviadas para o GitHub." "Green"
    }
    else {
        Write-ColorMessage "  Erro no push. Verifique sua conexao e permissoes." "Red"
    }
}
catch {
    Write-ColorMessage "  Erro inesperado durante o push!" "Red"
}

Write-Host ""
Write-ColorMessage "============================================================" "Cyan"
Write-ColorMessage "                SCRIPT FINALIZADO" "Cyan"
Write-ColorMessage "============================================================" "Cyan"

Read-Host "Pressione Enter para sair"