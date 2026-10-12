# 🌌 Orbit Dashboard

Um painel de produtividade pessoal, modular e infinitamente expansível desenvolvido com **Electron**, **React**, **TypeScript** e **Tailwind CSS**. Criado para rodar localmente no Windows e concentrar suas ferramentas diárias de foco e organização em um único lugar elegante.

---

## 🚀 Funcionalidades Principais

- 📦 **Instalador Oficial Windows (.exe)**: Empacotado via NSIS com instalação rápida em um clique e integração automática à bandeja do sistema (System Tray).
- 📜 **Histórico de Versões & Changelog Integrado**: Registro cronológico de todas as funcionalidades entregues da V1 até a V4, embutido diretamente nas configurações.
- 🧩 **Sistema Dinâmico de Plugins**: Carregue novos widgets e utilitários externos (arquivos `.html`) diretamente da pasta `Documentos/Orbit-Plugins` no seu computador.
- ☁️ **Sincronização em Nuvem (Firebase)**: Backup automático e silencioso (offline-first) do seu Bloco de Notas e Tarefas usando o Firestore.
- 🤖 **Assistente de IA Integrado (Gemini)**: Chat inteligente embutido no painel utilizando o Google Generative AI SDK para brainstorming e organização diária.
- 🎵 **Player de Foco Híbrido**: Alternância instantânea entre Spotify e uma rádio Lo-Fi ao vivo no YouTube Music.
- 🖱️ **Grade Livre com Drag & Drop**: Arraste e solte widgets para reorganizar a interface como preferir.
- ⌨️ **Atalho Global no Windows (`Ctrl + Espaço`)**: Exiba ou oculte o Orbit instantaneamente em qualquer tela ou aplicativo.
- 🔔 **Notificações Nativas do Windows**: Alertas integrados ao sistema operacional para os ciclos do Pomodoro.
- 📊 **Heatmap de Hábitos (35 dias)**: Visualização em estilo GitHub para acompanhar sua consistência diária.
- 🎨 **Temas & Customização**: 4 temas modernos (Escuro Clássico, Oceano Profundo, Floresta, Crepúsculo) com redimensionamento de cartões (P, M, G).
- 💖 **Apoio Comunitário (Opcional)**: Módulo de apoio (Apoia.se / GitHub Sponsors) configurável e alternável nas opções de lançamento.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide-React, `@dnd-kit`
- **Desktop & Backend**: Electron, Node.js, SQLite (`better-sqlite3`)
- **Nuvem & IA**: Firebase Firestore, `@google/generative-ai`
- **Build & Empacotamento**: Vite, tsup, `electron-builder`

---

## 📦 Como Rodar Localmente

1. Clone ou baixe este repositório:
   ```bash
   git clone https://github.com/guivconB/orbit.git
   cd orbit
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. *(Opcional)* Configure o Firebase duplicando o arquivo `src/firebase/config.example.ts` para `src/firebase/config.ts` com suas credenciais.
4. Inicie em modo de desenvolvimento:
   ```bash
   npm run dev
   ```

---

## 🏗️ Como Gerar o Executável (.exe)

Para gerar o instalador oficial do Windows:
```bash
npm run dist
```
O instalador `.exe` será gerado automaticamente na pasta `release/` (ex: `release/Orbit Setup 4.0.0.exe`).

> **Dica:** Você também pode rodar a versão de produção descompactada sem precisar instalar executando:
> ```bash
> npm start
> ```

---

Feito com 💙 para produtividade máxima!
