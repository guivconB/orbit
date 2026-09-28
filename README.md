# 🌌 Orbit Dashboard

Um painel de utilidades pessoal, leve e infinitamente expansível desenvolvido com **Electron**, **React** e **Tailwind CSS**. Criado para rodar localmente no Windows e concentrar suas ferramentas diárias de produtividade em um único lugar elegante.

## 🚀 Funcionalidades da Versão 3.0

- 🧩 **Sistema Dinâmico de Plugins**: Carregue novos widgets e funcionalidades (arquivos `.html`) diretamente da pasta `Documentos/Orbit-Plugins` no seu computador.
- ☁️ **Sincronização em Nuvem (Firebase)**: Backup automático e offline-first do seu Bloco de Notas e Tarefas usando o Firestore.
- 🤖 **Assistente de IA Integrado (Gemini)**: Chat inteligente embutido no painel utilizando a API do Google Generative AI para tirar dúvidas e ajudar na rotina.
- 🎵 **Player de Foco Híbrido**: Alternância nativa entre o Spotify e uma rádio Lo-Fi no YouTube Music.
- 🖱️ **Drag and Drop**: Reordene os widgets livremente arrastando com o mouse para criar seu layout perfeito.
- 🎨 **Temas Dinâmicos**: Personalize o visual escolhendo entre vários temas e controlando o tamanho dos componentes (P, M, G).
- 📝 **Widgets Essenciais**: Pomodoro, Hábitos, Relógio e Clima, Atalhos de Pastas, Links, Scratchpad e Kanban de Tarefas/Ideias (Tudo integrado ao SQLite).

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS, Lucide-React, dnd-kit
- **Backend / Desktop**: Electron, Node.js, SQLite (`better-sqlite3`)
- **Nuvem e IA**: Firebase Firestore, Google Generative AI SDK
- **Build**: Vite & tsup

## 📦 Como Rodar Localmente

1. Clone ou baixe este repositório.
2. Certifique-se de ter o [Node.js](https://nodejs.org/) instalado.
3. Crie o arquivo `src/firebase/config.ts` baseado no `config.example.ts` e cole sua chave do Firebase.
4. Instale as dependências:
   ```bash
   npm install
   ```
5. Inicie em modo de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🚀 Iniciar com o Windows (Auto-start)
Para fazer o Orbit abrir sozinho em segundo plano (na bandeja de ícones perto do relógio) quando ligar o PC, abra o `PowerShell` e cole este comando substituindo os caminhos:
```powershell
$VbsPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Orbit.vbs"
$VbsContent = 'Set WshShell = CreateObject("WScript.Shell")' + "`r`n" + 'WshShell.Run "cmd.exe /c cd /d C:\CAMINHO\DO\PROJETO && npm start", 0, false'
Set-Content -Path $VbsPath -Value $VbsContent
```

## 🏗️ Como Criar o Executável (.exe)
Para gerar o arquivo final e instalar no seu computador:
```bash
npm run dist
```
O executável gerado estará localizado na pasta `release`. *Nota: Se você tiver problemas com permissões de anti-vírus no Windows ao gerar o `.exe`, basta usar o comando `npm start` para rodar a versão de produção leve sem precisar empacotar!*

---
Feito com 💙 para produtividade máxima!
