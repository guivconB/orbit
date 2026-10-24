# 🌌 Orbit Dashboard

Um painel de produtividade pessoal, modular e infinitamente expansível desenvolvido com **Electron**, **React**, **TypeScript** e **Tailwind CSS**. Criado para rodar localmente no Windows e concentrar suas ferramentas diárias de foco e organização em um único lugar elegante.

---

## 🚀 Funcionalidades Principais

- 📦 **Instalador Oficial Windows (.exe)**: Empacotado via NSIS com instalação rápida em um clique e integração automática à bandeja do sistema (System Tray).
- 🖥️ **Inicialização com o Windows**: Opcional (Configurações > Sistema), abrindo em **Tela Cheia** ou em **Janela** (lembra tamanho e posição).
- 📜 **Histórico de Versões & Changelog Integrado**: Registro cronológico de todas as funcionalidades entregues da V1 até a V4, embutido diretamente nas configurações.
- 🧩 **Sistema Dinâmico de Plugins**: Carregue novos widgets e utilitários externos (arquivos `.html`) diretamente da pasta `Documentos/Orbit-Plugins` no seu computador. Eles rodam isolados do app (ver [Plugins](#-plugins)).
- ☁️ **Sincronização em Nuvem (Firebase)**: Login com e-mail e senha, backup automático do Bloco de Notas e das Tarefas e restauração em outro PC.
- 🤖 **Assistente de IA Integrado (Gemini)**: Chat embutido no painel (SDK `@google/genai`). A chave fica criptografada pelo Windows e nunca sai do processo principal.
- 🎵 **Player de Foco Híbrido**: Alternância instantânea entre Spotify e uma rádio Lo-Fi ao vivo no YouTube Music.
- 🖱️ **Grade Livre com Drag & Drop**: Arraste e solte widgets para reorganizar a interface como preferir.
- ⌨️ **Atalho Global no Windows (`Ctrl + Espaço` por padrão)**: Exiba ou oculte o Orbit de qualquer lugar. Pode ser trocado ou desativado em Configurações > Sistema.
- 🔔 **Notificações Nativas do Windows**: Alertas integrados ao sistema operacional para os ciclos do Pomodoro.
- 📊 **Heatmap de Hábitos (35 dias)**: Visualização em estilo GitHub para acompanhar sua consistência diária.
- 🎨 **Temas & Customização**: 4 temas modernos (Escuro Clássico, Oceano Profundo, Floresta, Crepúsculo) com redimensionamento de cartões (P, M, G).
- 💖 **Apoio Comunitário (Opcional)**: Módulo de apoio (Apoia.se / GitHub Sponsors) configurável e alternável nas opções de lançamento.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide-React, `@dnd-kit`
- **Desktop & Backend**: Electron, Node.js, SQLite (`better-sqlite3`)
- **Nuvem & IA**: Firebase Auth + Firestore, `@google/genai`
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
3. *(Opcional)* Configure o Firebase (ver [Sincronização na nuvem](#️-sincronização-na-nuvem)).
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

## 🖥️ Inicialização com o Windows & Modo Tela Cheia

Ao instalar e abrir a versão empacotada (`.exe`), o **Orbit** se registra automaticamente para iniciar junto com o Windows (`openAtLogin: true`):

- **Modo de abertura**: Em Configurações > Sistema, escolha **Tela cheia** (padrão) ou **Janela**. Em janela, o Orbit lembra tamanho, posição e se estava maximizado.
- **Iniciar com o Windows**: Ligado por padrão na versão instalada; pode ser desligado em Configurações > Sistema.
- **Uma instância só**: Abrir o Orbit de novo apenas traz a janela existente para frente.
- **Alternar Modo Janela / Tela Cheia**: Caso queira sair da tela cheia a qualquer momento, clique no ícone de **Tela Cheia** no canto superior direito do cabeçalho.
- **Segundo Plano (Bandeja do Sistema)**: Ao clicar no botão de fechar (`X`) ou pressionar o atalho global, o painel fica recolhido na bandeja do sistema (System Tray) perto do relógio do Windows e pode ser reaberto instantaneamente pelo atalho global ou clicando no ícone da bandeja.

> **Nota para quem atualizou o código:** Se você já havia instalado uma versão anterior no PC que iniciava oculta em segundo plano, basta rodar `npm run dist` novamente e executar o novo instalador em `release/Orbit Setup 4.0.0.exe` para atualizar o executável instalado e a configuração de inicialização do Windows.

---

## ☁️ Sincronização na Nuvem

1. Copie `src/firebase/config.example.ts` para `src/firebase/config.ts` e preencha com as chaves do seu projeto Firebase.
2. No Firebase Console, ative **Authentication > Sign-in method > E-mail/senha**.
3. Em **Firestore Database > Regras**, cole o conteúdo de [`firestore.rules`](firestore.rules) e publique. Assim cada usuário só acessa o próprio documento `users/{uid}`.
4. No Orbit, abra **Configurações > Sincronização na Nuvem** e entre (ou crie uma conta).

Ao entrar, se a nuvem tiver um backup mais novo que o deste PC, o Orbit pergunta se deve restaurar.

---

## 🧩 Plugins

Cada plugin é uma pasta em `Documentos/Orbit-Plugins/<nome>/index.html`. Ele roda num iframe isolado: não acessa o app, o `localStorage` nem os arquivos do PC. Para conversar com o Orbit, use `postMessage`:

```js
// Pedir o tema atual (também é enviado sempre que o tema muda)
parent.postMessage({ type: 'orbit:getTheme' }, '*');
window.addEventListener('message', (e) => {
  if (e.data?.type === 'orbit:theme') console.log(e.data.theme); // slate | ocean | emerald | rose
});

// Mostrar uma notificação do Windows
parent.postMessage({ type: 'orbit:notify', title: 'Pronto!', body: 'Tarefa concluída.' }, '*');
```

Scripts e estilos do plugin precisam estar dentro do próprio `index.html` (inline).

---

## 🧪 Verificação

```bash
npm run typecheck
```

> O `better-sqlite3` 13 já vem com binários prontos (N-API) que funcionam no Electron, por isso o build usa `npmRebuild: false` e não precisa das ferramentas de compilação do Visual Studio.

---

Feito com 💙 para produtividade máxima!
