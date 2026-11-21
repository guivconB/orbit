# Orbit

Painel de produtividade pessoal para Windows, modular (widgets e plugins), que inicia com o sistema e fica na bandeja.

## Stack

- **Desktop:** Electron. `electron/main.ts` e `electron/preload.ts` são compilados pelo `tsup` para `dist-electron/`. Os handlers de IPC ficam em `electron/ipc/` (um arquivo por domínio) e os argumentos são validados em `electron/validate.ts`.
- **Dados:** SQLite via `better-sqlite3` no processo principal, em `%APPDATA%\Orbit\database.sqlite`. O schema evolui por `electron/migrations.ts`: toda mudança de tabela entra como migração nova, nunca editando uma antiga.
- **Front:** React 19 + TypeScript + Tailwind CSS v4 + Framer Motion + `@dnd-kit`. Tokens de tema em `src/index.css` (tema "Deep Orbit Glass", grade de 8px, Plus Jakarta Sans + JetBrains Mono). Widgets registrados em `src/widgets/registry.tsx` e `catalog.ts`.
- **Ações:** `src/actions/` é o registro único de ações. A paleta Ctrl+K (`src/palette/`) e o assistente de IA (`src/ai/agent.ts`, usado como ferramentas do Gemini) consomem o mesmo registro: uma ação nova aparece nos dois.
- **Nuvem e IA:** Firebase Auth + Firestore (`src/firebase/sync.ts`, offline-first com debounce de 2 s). O Gemini usa `@google/genai` e roda no processo principal (`electron/ai.ts`).

## Comandos

- `npm run dev`: Vite + Electron (ou `start.bat`).
- `npm run check`: `oxlint` + `tsc` + `vitest`. Rodar depois de qualquer mudança.
- `npm run dist`: instalador NSIS em `release/`.

## Regras que não devem ser quebradas

1. **Chaves e segredos:** a chave do Gemini é criptografada com `safeStorage` e só é usada no processo principal. Nunca expô-la ao renderer nem ao `localStorage`. `src/firebase/config.ts` está no `.gitignore`; o modelo versionado é `config.example.ts`.
2. **Plugins:** são HTML carregados de `Documentos\Orbit-Plugins\` em iframe com sandbox, sem `allow-same-origin`. Não afrouxar o isolamento. O que um plugin precisar deve vir de uma API de plugins controlada (planejada como "API de plugins v2").
3. **Inicialização com o Windows:** só registrar o autostart quando `app.isPackaged`. Em modo dev o Electron registra o `electron.exe` genérico e o Windows abre a tela padrão do Electron. Nunca apontar para `release\win-unpacked\` (é apagado nos builds); a instalação fica em `%LOCALAPPDATA%\Programs\Orbit`.
4. **Empacotamento:** `npmRebuild: false` é intencional (o `better-sqlite3` usa binários Node-API). Os scripts `predist`/`prepack` encerram o `Orbit.exe` aberto na bandeja, que senão trava arquivos em `release/` com `EPERM`.
5. **Versão:** ao lançar versão nova, atualizar juntos `package.json`, o selo em `App.tsx` e `SettingsModal.tsx` e a entrada no topo de `src/data/changelog.ts`.

## Decisões já tomadas

- SQLite embutido em vez de MongoDB: o app tem que abrir instantaneamente e funcionar 100% offline.
- A integração com Google Calendar foi removida (OAuth em app desktop gerava atrito demais). Não reintroduzir sem pedido explícito.
- O layout dos widgets (tamanho P/M/G, ordem, visibilidade) fica nas preferências; os dados ficam no SQLite e no Firestore.

## Roadmap

`docs/GUIA-MELHORIAS.md` é a fonte de verdade. As etapas 1 a 3 estão feitas (até a v5.0). Próximas: v5.1 (Daily Briefing, Scratchpad com IA, Modo Zen, sons ambiente) → v5.2 (tarefas com prioridade e prazo, onboarding, backup `.json`) → v5.3 (API de plugins v2 e widgets de monitor, finanças e RSS) → v6.0 (Orbit Store e atualização automática).

Ideias para retenção ainda não priorizadas no guia: mini janela flutuante sempre visível (tarefa atual + Pomodoro), rituais de início e fim do dia, XP e sequências, sons de feedback.
