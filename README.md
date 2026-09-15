# 🌌 Orbit Dashboard (ex-Wise Franklin)

Um painel de utilidades pessoal, leve e customizável desenvolvido com **Electron**, **React** e **Tailwind CSS**. Criado para rodar localmente no Windows e concentrar suas ferramentas diárias de produtividade em um único lugar elegante.

## 🚀 Funcionalidades Atuais

- 🎨 **Temas Dinâmicos**: Personalize o visual escolhendo entre vários temas (Escuro Clássico, Oceano Profundo, Floresta, Crepúsculo).
- 🧩 **Layout Customizável**: Ative, desative e redimensione os widgets (P, M, G) para montar a grade de ferramentas perfeita para a sua rotina.
- 📝 **Scratchpad**: Um bloco de notas sempre à mão para salvar ideias rápidas sem precisar abrir outros programas.
- 🔗 **Links Rápidos**: Gerencie atalhos para os sites que você mais acessa.
- 📁 **Atalhos de Arquivos**: Um clique para abrir pastas ou arquivos do seu computador diretamente pelo painel.
- ✅ **Kanban (Tarefas/Ideias)**: Acompanhe o que precisa ser feito hoje ou guarde ideias para o futuro.
- 🍅 **Pomodoro**: Timer embutido com ciclos de Foco (25min) e Pausa (5min).
- ⛅ **Relógio e Clima**: Veja a hora, data e clima atual baseado na sua localização.
- 📈 **Rastreador de Hábitos**: Marque o que você cumpriu nos últimos 5 dias para manter sua ofensiva visual.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS v4, Lucide-React
- **Backend / Desktop**: Electron, Node.js
- **Banco de Dados**: SQLite (`better-sqlite3`) para persistência de dados offline e ultra-rápida.
- **Build**: Vite & tsup

## 📦 Como Rodar Localmente

1. Clone ou baixe este repositório.
2. Certifique-se de ter o [Node.js](https://nodejs.org/) instalado.
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Inicie em modo de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🏗️ Como Criar o Executável (.exe)
Para gerar o arquivo final e instalar no seu computador:
```bash
npm run build
```
O executável gerado estará localizado na pasta `dist` ou `release` (dependendo da sua configuração do `electron-builder`).

---
Feito com 💙 para produtividade máxima!
