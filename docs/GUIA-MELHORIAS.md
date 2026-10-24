# Orbit — Guia de Melhorias e Implementação

Base analisada: v4.0.0 (`def569f`), ~2.900 linhas (Electron + React 19 + SQLite + Firebase + Gemini).
Ordem = prioridade. **Status: Fase 0 implementada em 23/10/2026.** Cada item: **problema → correção**. Esforço: P (< 2h), M (meio dia), G (1+ dia).

---

## Fase 0 — Bugs e segurança (fazer primeiro)

### 0.1 Chave do Gemini é apagada sozinha — P
`AIAssistantWidget.tsx:7` chama `useSettings()` de novo. São **duas cópias independentes** do estado. Quando você salva a chave no widget e depois muda tema/arrasta um card, o `App` regrava o `localStorage` sem a chave.
**Correção:** transformar `useSettings` em Context.
```tsx
// src/context/SettingsContext.tsx
const SettingsContext = createContext<ReturnType<typeof useSettingsState> | null>(null);
export const SettingsProvider = ({ children }) => (
  <SettingsContext.Provider value={useSettingsState()}>{children}</SettingsContext.Provider>
);
export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings fora do SettingsProvider');
  return ctx;
};
```
Envolver `<App/>` em `main.tsx`; remover a prop `settingsData` do `SettingsModal`.

### 0.2 Assistente de IA quebrado — P
`AIAssistantWidget.tsx:38` usa `gemini-1.5-flash` (descontinuado) e o SDK `@google/generative-ai` (obsoleto).
**Correção:** `npm i @google/genai && npm rm @google/generative-ai`, modelo `gemini-2.5-flash` (ou o atual), e mostrar o erro real em vez de "verifique sua chave".
```ts
const ai = new GoogleGenAI({ apiKey });
const chat = ai.chats.create({ model: 'gemini-2.5-flash', history });
const res = await chat.sendMessage({ message: userText });
```
Melhor ainda: fazer a chamada no **processo main** (ver 0.4) para a chave não ficar no renderer.

### 0.3 Plugins podem controlar o PC — M
`App.tsx:177`: `sandbox="allow-scripts allow-same-origin"` + `srcDoc` = o plugin roda **na mesma origem do app** e acessa `window.parent.electronAPI` → pode chamar `openFile` com qualquer caminho (executar `.exe`).
**Correção:**
1. Remover `allow-same-origin` (fica `sandbox="allow-scripts"`).
2. API para plugins só via `postMessage` com whitelist (ex.: `getTheme`, `notify`).
3. Validar no main: `open-file` só abre caminhos que estão na tabela `files`.
```ts
ipcMain.handle('open-file', (_e, id: number) => {
  const row = getDb().prepare('SELECT path FROM files WHERE id = ?').get(id);
  return row ? shell.openPath(row.path) : false;
});
```

### 0.4 Outras falhas de segurança — P
| Onde | Problema | Correção |
|---|---|---|
| `main.ts:37` | `shell.openExternal(url)` aceita qualquer protocolo (`file:`, `ms-settings:`…) | Só abrir se `new URL(url).protocol` for `http:`/`https:` |
| `index.html` | CSP com `'unsafe-eval'` | Remover `unsafe-eval`; adicionar `default-src 'self'`, `connect-src` com os domínios usados, `frame-src` Spotify/YouTube |
| `BrowserWindow` | sem `sandbox: true` | Adicionar `sandbox: true` em `webPreferences` |
| Gemini key | texto puro no `localStorage` | Guardar no main com `safeStorage.encryptString` |
| IPC handlers | sem validação de tipo | Validar argumentos (zod ou checagem manual) |

### 0.5 Firebase aberto para qualquer um — M
`sync.ts:6`: documento fixo `users/my_orbit`, sem login. Quem tiver a config (vai junto no `.exe`) lê e escreve seus dados.
**Correção:**
1. Ativar Auth (Anônimo ou Google) e usar `users/{uid}`.
2. Regras do Firestore:
```
match /users/{uid} { allow read, write: if request.auth != null && request.auth.uid == uid; }
```
3. A sincronização hoje é só "envia": `fetchCloudBackup` nunca é chamado. Implementar restauração (ao abrir, se a nuvem for mais nova que o local, perguntar).
4. `KanbanWidget.tsx:32`: `if (tasks.length > 0)` → apagar todas as tarefas nunca sincroniza. Remover a condição (sincronizar após a 1ª carga).

### 0.6 Hábitos marcados no dia errado — P
`HabitsWidget.tsx:22,78,191`: `toISOString()` usa UTC. No Brasil, depois das 21h o "hoje" vira amanhã.
```ts
// src/lib/date.ts
export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
```

### 0.7 Banco de dados — P
`database.ts`:
- `verbose: console.log` (linha 9) loga cada query em produção → só em dev.
- `ON DELETE CASCADE` não funciona sem `db.pragma('foreign_keys = ON')` → logs órfãos ao excluir hábito.
- Adicionar `db.pragma('journal_mode = WAL')`.
- Índice único: `CREATE UNIQUE INDEX IF NOT EXISTS ux_habit_day ON habit_logs(habit_id, date)`.
- Migrações versionadas com `PRAGMA user_version` (hoje qualquer coluna nova exige gambiarra).
```ts
const migrations = [
  (db) => db.exec(`/* v1: schema atual */`),
  (db) => db.exec(`ALTER TABLE tasks ADD COLUMN due_date TEXT; ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0;`),
];
const v = db.pragma('user_version', { simple: true }) as number;
db.transaction(() => { migrations.slice(v).forEach(m => m(db)); db.pragma(`user_version = ${migrations.length}`); })();
```

### 0.8 Comportamento da janela — P
- Sem `app.requestSingleInstanceLock()` → abrir duas vezes cria 2 bandejas e 2 conexões no SQLite. Adicionar lock e, no `second-instance`, mostrar a janela.
- `main.ts:271`: força `openAtLogin: true` a cada abertura, ignorando o usuário. Tornar opção nas Configurações (padrão ligado só na 1ª execução).
- `main.ts:15`: `fullscreen: true` forçado. Lembrar tamanho/posição/estado da última sessão.
- `main.ts:282`: `Ctrl+Espaço` conflita com troca de idioma/IME do Windows e o retorno de `register` não é checado. Tornar atalho configurável e avisar se falhar.
- **Pomodoro some em segundo plano:** janela escondida na bandeja → Chromium reduz timers → o cronômetro atrasa. Usar `backgroundThrottling: false` **e** calcular pelo horário de término (ver 2.3).

### 0.9 Build/empacotamento — P
- `npmRebuild: false` com `better-sqlite3` (módulo nativo): confirmar que o `.exe` instalado abre o banco; se não, usar `electron-builder install-app-deps` no `postinstall`.
- Ícone é `.jpg` → criar `build/icon.ico` (256×256) para instalador, bandeja e atalho.
- Apagar `release/Orbit Setup 0.0.0.exe`, `stdout.log`, `stderr.log`, `fix-encoding.cjs` (script de uso único).
- `index.html`: `lang="pt-BR"` e `<title>Orbit</title>`.

---

## Fase 1 — Fundação do código (deixa o resto mais rápido)

### 1.1 Tipagem e IPC — M
- Mover a interface `window.electronAPI` de `App.tsx` para `src/types/electron.d.ts` e tirar todos os `any[]`.
- Criar `src/types/models.ts` com `Task`, `Link`, `FileItem`, `Habit` compartilhados entre `electron/` e `src/`.
- Separar `main.ts` (314 linhas) em `electron/ipc/{tasks,links,files,habits,notes,plugins}.ts`.
- Trocar `require('fs')`/`require('electron')` dentro dos handlers por `import` no topo.

### 1.2 Camada de dados no front — M
Todo widget repete `load → setState → chamar IPC → load de novo`. Criar um hook genérico:
```ts
function useCollection<T>(get: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const reload = useCallback(() => get().then(setItems), [get]);
  useEffect(() => { reload(); }, [reload]);
  return { items, setItems, reload };
}
```
Com atualização otimista (atualiza a tela antes da resposta do banco) — remove o "piscar" ao marcar tarefas.

### 1.3 Componente base de widget — P
O cartão (`bg-widget rounded-xl p-4 shadow-lg border…` + cabeçalho + botão +) está copiado em 9 arquivos. Criar `<WidgetShell title icon actions>{children}</WidgetShell>`. Facilita mudar o visual inteiro de uma vez (Fase 2).

### 1.4 Registro de widgets — P
Hoje um widget novo exige editar `App.tsx`, `useSettings.ts` e `SettingsModal.tsx`. Centralizar:
```ts
// src/widgets/registry.ts
export const WIDGETS = [
  { id: 'kanban', name: 'Tarefas', icon: ListTodo, component: KanbanWidget, defaultSize: 'small' },
  ...
] as const;
```

### 1.5 Scratchpad — P
`App.tsx:111` grava no SQLite a cada tecla. Aplicar debounce de ~400 ms. O ícone `Maximize2` (`App.tsx:149`) não faz nada → implementar modo foco ou remover.

### 1.6 Qualidade — P
- `tsconfig`: `"strict": true`, `"noUnusedLocals": true`.
- Testes com Vitest para `lib/date.ts`, migrações e regras de streak.
- GitHub Actions: `npm ci && npm run lint && npx tsc --noEmit && npx vitest run`.
- Feedback de erro visível: toast simples (`sonner` ou componente próprio) em vez de `console.error`.

---

## Fase 2 — Experiência (o que deixa o app "menos chato")

### 2.1 Paleta de comandos (Ctrl+K) — M ⭐ maior impacto
Uma caixa de busca que faz tudo pelo teclado:
`> tarefa Comprar café` · `> hábito` · `> link github` · `> pomodoro 50` · `> tema oceano` · busca em notas/tarefas/links/arquivos.
Lib: `cmdk`. Combinar com o atalho global: `Ctrl+Espaço` abre o Orbit **já com a paleta focada** → captura rápida em 2 segundos de qualquer lugar do Windows.

### 2.2 Modo compacto / mini janela — M
Tela cheia toda vez cansa. Criar uma segunda janela pequena (`alwaysOnTop`, sem moldura, ~360×520) com: próxima tarefa, pomodoro, hábitos do dia. Opção nas Configurações: "Abrir em: Tela cheia / Janela / Mini".

### 2.3 Pomodoro de verdade — M
- Calcular pelo horário de término (`endsAt = Date.now() + dur`), não decrementando a cada segundo.
- Durações configuráveis, pausa longa a cada 4 ciclos, contador de ciclos do dia.
- Vincular a uma tarefa ("focando em: X") e salvar sessões numa tabela `focus_sessions`.
- Tempo restante no título da bandeja (`tray.setToolTip`) e na barra de tarefas (`win.setProgressBar`).
- Som ao terminar.

### 2.4 Tarefas (hoje é só uma lista) — M
- Editar com duplo clique; reordenar arrastando (já tem `@dnd-kit`).
- Data de vencimento, prioridade, filtro "Hoje".
- "Limpar concluídas" e mover concluídas para o fim.
- Ou virar Kanban de verdade (A fazer / Fazendo / Feito), já que o nome promete isso.

### 2.5 Hábitos — P
- Sequência atual e recorde (🔥 12 dias), % do mês.
- Lembrete diário opcional por notificação.
- Heatmap de 12 semanas no tamanho G.

### 2.6 Layout e visual — M
- Linhas fixas de 400 px (`auto-rows-[400px]`) desperdiçam espaço: widgets pequenos (relógio) ficam enormes. Permitir altura 1/2/3 e largura 1/2/3 independentes, ou migrar para `react-grid-layout` (redimensionar arrastando a borda).
- Vários painéis/abas ("Trabalho", "Pessoal") com layouts diferentes.
- Tema claro + "seguir o Windows" (`nativeTheme.shouldUseDarkColors`). Cor de destaque escolhível.
- Saudação no topo ("Boa noite, Gui — 3 tarefas, 2 hábitos pendentes").
- Animações leves (já tem `framer-motion` instalado e não usado).
- Confirmação ou "Desfazer" ao excluir.

### 2.7 Primeira execução — P
O `OnboardingModal` só abre pelas Configurações. Abrir sozinho na 1ª execução (flag `onboardingDone`) e oferecer dados de exemplo.

### 2.8 Clima — P
`ClockWeatherWidget.tsx:34` usa `http://ip-api.com` (sem HTTPS, uso comercial proibido). Usar só a busca de cidade do Open-Meteo e pedir a cidade no onboarding. Adicionar previsão de 3 dias e máx/mín.

---

## Fase 3 — Funcionalidades novas

| # | Funcionalidade | Por quê | Esforço |
|---|---|---|---|
| 3.1 | **IA com ações** (function calling): "cria 3 tarefas pra amanhã", "como foi minha semana?" | Transforma o chat genérico em algo que usa os dados do Orbit | M |
| 3.2 | Resumo do dia por IA ao abrir o app | Motivo para abrir todo dia | P (depois de 3.1) |
| 3.3 | Várias notas com Markdown (lista lateral + preview) | Scratchpad único é limitado | M |
| 3.4 | Agenda (Google Calendar via link `.ics` público) | Muito pedido em dashboards | M |
| 3.5 | Histórico da área de transferência | Utilidade forte no Windows | M |
| 3.6 | Monitor do sistema (CPU, RAM, disco) | Barato com `os` / `systeminformation` | P |
| 3.7 | Estatísticas semanais (foco, tarefas, hábitos) | Usa os dados de 2.3/2.4/2.5 | M |
| 3.8 | Exportar/Importar backup `.json` | Segurança sem depender do Firebase | P |
| 3.9 | Player de música: playlist/vídeo configurável | Hoje fixos no código | P |
| 3.10 | Plugins com `manifest.json` (nome, ícone, versão, permissões) | Base para uma loja futura | M |

---

## Fase 4 — Distribuição

- **Atualização automática:** `electron-updater` + GitHub Releases (`publish: { provider: 'github' }`). O `latest.yml` já é gerado.
- **Assinatura de código:** sem ela o SmartScreen avisa "app desconhecido". Opções: Azure Trusted Signing (mais barato) ou certificado OV.
- **Tamanho:** instalador tem 140 MB. Conferir que `firebase` só entra via import dinâmico e ativar `compression: maximum`.
- **Relatório de erros:** `electron-log` gravando em arquivo + botão "Abrir logs" nas Configurações.
- Versão exibida nas Configurações vinda de `app.getVersion()`, não fixa no código.

---

## Ordem sugerida

| Semana | Entrega |
|---|---|
| 1 | Fase 0 completa → lançar **v4.1** (correções) |
| 2 | Fase 1 (fundação) |
| 3 | 2.1 Paleta de comandos + 2.3 Pomodoro + 2.7 Onboarding → **v5.0** |
| 4 | 2.2 Mini janela + 2.4 Tarefas + 2.6 Layout |
| 5+ | 3.1 IA com ações, 3.8 Backup, Fase 4 |

## Checklist rápido da Fase 0 (concluída)
- [x] SettingsContext (0.1)
- [x] Novo SDK/modelo Gemini (0.2)
- [x] Iframe de plugin sem `allow-same-origin` + `open-file` por id (0.3)
- [x] `openExternal` só http/https, CSP sem `unsafe-eval`, `sandbox: true` (0.4)
- [x] Firebase com Auth + regras + restauração (0.5)
- [x] `localDate()` nos hábitos (0.6)
- [x] `foreign_keys`, WAL, índice único, migrações, sem verbose (0.7)
- [x] Single instance, autostart opcional, atalho configurável, `backgroundThrottling: false` (0.8)
- [x] `icon.png` 256px no instalador, limpar arquivos soltos (0.9). `npmRebuild: false` está correto: o better-sqlite3 13 já traz binário N-API compatível com o Electron
