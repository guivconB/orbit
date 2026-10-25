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

> ✅ **Implementada em 24/10/2026, junto com os pré-requisitos P1–P4.** Onde ficou cada parte:
> - **1.1** Tipos compartilhados em `shared/models.ts` e `shared/api.ts` (o preload é checado contra `ElectronAPI`). `main.ts` dividido em `electron/window.ts`, `electron/system.ts` e `electron/ipc/*.ts`. `strict: true` no front e no Electron.
> - **1.2** `src/hooks/useCollection.ts`: carrega, recarrega com o evento `data-changed` e faz atualização otimista com desfazer em caso de erro.
> - **1.3** `src/components/ui/WidgetShell.tsx` (`WidgetShell`, `IconButton`, `EmptyState`), usado em Scratchpad, Links, Arquivos, Tarefas e Hábitos. Pomodoro, Clima, IA e Player mantêm o layout próprio.
> - **1.4** `src/widgets/catalog.ts` (nomes e tamanhos) + `src/widgets/registry.tsx` (componentes). O padrão das configurações e a lista do modal saem do catálogo.
> - **1.5** `src/components/ScratchpadWidget.tsx`: grava com atraso de 400 ms, salva o pendente ao fechar, e o botão de expandir abre a nota em tela cheia (`Esc` fecha).
> - **1.6** Toasts (`src/lib/toast.ts` + `Toaster`), Vitest com 25 testes (datas, migrações, ações), `npm run check` e CI em `.github/workflows/ci.yml`.
> - **P1** `src/focus/FocusContext.tsx` (`useFocus`, `useMusic`). **P2** `src/actions/` (registro, validação, `useActions`, `toToolDeclarations`). **P3** evento `data-changed` + `onDataChanged` no preload + `useCloudSync`. **P4** migração v3 (`priority`, `due_date`, `position`).

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

## V5 — Caminhos A e B + Banco de Ideias (análise de viabilidade)

Legenda de viabilidade: ✅ viável como descrito · ⚠️ viável com ajuste · ❌ não dá como descrito.
Esforço: P (< 2h), M (meio dia), G (1+ dia). Itens que já existiam no guia estão indicados.

### Pré-requisitos compartilhados (fazer antes de A e B)

Quase tudo abaixo depende de 4 peças. Construir uma vez serve para todos os itens.

| # | Peça | Por quê | Usado por | Esforço |
|---|---|---|---|---|
| P1 | **Estado global do Pomodoro e do player** (`FocusContext`) | Hoje o timer e o player vivem dentro dos widgets (`useState` local). A IA, a paleta e o Modo Zen não conseguem iniciar o timer nem trocar a música | A1, Zen, Ctrl+K, sons ambiente | M |
| P2 | **Registro único de ações** (`src/actions/registry.ts`) | Uma lista de ações (`addTask`, `startFocus`, `playMusic`, `setTheme`, `toggleHabit`…) com nome, parâmetros e função. A **mesma** lista vira comandos do Ctrl+K e ferramentas da IA. Sem isso, cada recurso reimplementa as ações | A1, Ctrl+K, plugins | M |
| P3 | **Aviso de "dados mudaram"** (main → tela: `webContents.send('data-changed', 'tasks')`) | Quando a IA ou a paleta cria uma tarefa, o widget de Tarefas precisa recarregar sozinho | A1, A3, Ctrl+K, área de transferência | P |
| P4 | **Migração v3 do banco**: `tasks.priority`, `tasks.due_date`, `tasks.position` | "Coloca como prioridade" precisa de uma coluna de prioridade (hoje não existe) | A1, 2.4, Ctrl+K | P |

Também ajuda muito fazer antes a **Fase 1** (tipos, `useCollection`, `WidgetShell`, registro de widgets).

---

### 🧠 Caminho A — Orbit Brain (IA que age)

| Item | Viabilidade | Esforço | Observações |
|---|---|---|---|
| **A1. Controle do painel por linguagem natural** (= 3.1) | ✅ | M–G | O `@google/genai` já instalado suporta ferramentas (`config.tools[].functionDeclarations`, resposta em `functionCalls`) e o `gemini-flash-latest` as aceita |
| **A2. Daily Briefing** (= 3.2) | ✅ | P (depois de A1) | 1 chamada por dia, cabe no plano gratuito |
| **A3. Scratchpad com IA** | ✅ | P–M | Usa saída estruturada (`responseSchema`) para "extrair tarefas" vir como JSON confiável |

**A1 — como implementar**
1. Em `electron/ai.ts`, declarar as ferramentas a partir do registro de ações (P2): `add_task(title, status, priority?)`, `complete_task(id)`, `list_tasks(filter)`, `start_focus(minutes, music?)`, `play_music(provider: 'lofi' | 'spotify')`, `toggle_habit(name, date?)`, `set_theme(theme)`.
2. Laço manual de no máximo 5 rodadas: o modelo pede uma ferramenta → o app executa → devolve o resultado → o modelo responde em texto.
3. Ações de **dados** (tarefas, hábitos) rodam direto no main e disparam P3. Ações de **tela** (Pomodoro, música, tema) vão para a tela via IPC (`ai-action`) e são aplicadas pelo P1.
4. Ações destrutivas (apagar, concluir várias) pedem confirmação no chat antes de executar.
5. Mostrar no chat o que foi feito ("✅ Tarefa 'Estudar React' criada com prioridade alta").

**Ajustes necessários no exemplo "focar 40 min com música relaxante":**
- ⚠️ O Pomodoro hoje tem durações fixas (25/5). Precisa de durações livres (parte do 2.3).
- ⚠️ **Lo-Fi (YouTube):** dá para iniciar sozinho trocando o `src` do iframe para `autoplay=1` e ligando `autoplayPolicy: 'no-user-gesture-required'` na janela.
- ❌ **Spotify:** o embed não toca músicas completas por comando sem login do usuário no embed, e o controle por código é limitado. Para "música por comando", usar Lo-Fi ou os sons ambiente nativos (Ideia 3).

**A2 — Daily Briefing**
- Na primeira abertura do dia (`lastBriefingDate` no `localStorage`), juntar: tarefas abertas, hábitos de ontem não marcados, clima (o widget já busca, passar o resultado adiante) e as primeiras ~500 letras da nota.
- Pedir 3 linhas: prioridade do dia, hábito em risco e um aviso do clima.
- Mostrar num card no topo com o botão "dispensar". Deve ser **opcional** nas Configurações, porque envia a nota e as tarefas para o Google.

**A3 — Scratchpad com IA**
- Botões: **Resumir**, **Extrair tarefas**, **Organizar ideias**.
- "Extrair tarefas" devolve `[{ title, priority }]` via `responseSchema`. O app mostra a lista com caixas de seleção e só cria as marcadas.
- "Resumir" e "Organizar" mostram uma prévia com **Aplicar** e **Desfazer**, sem sobrescrever a nota direto.
- Funciona sobre o texto selecionado ou sobre a nota inteira.

---

### 🧩 Caminho B — Orbit Store (plugins)

**Bloqueio importante:** desde a Fase 0, plugins rodam em iframe isolado (sem acesso ao app, ao `localStorage`, ao sistema nem a sites sem CORS). Isso é o certo para segurança, mas significa que **nenhum dos plugins B1–B3 funciona só com HTML**. Antes é preciso a **API de plugins v2**:

| Peça | O que é | Esforço |
|---|---|---|
| `manifest.json` (= 3.10) | `id`, `name`, `version`, `icon`, `permissions: ["system", "network:g1.globo.com", "storage"]` | P |
| Ponte com pedido e resposta | `orbit.request('system.stats')` → resposta com o mesmo `id`. Uma lib `orbit-plugin.js` pequena que o plugin inclui | M |
| `storage` por plugin | Arquivo JSON por plugin no main. Substitui o `localStorage` que os plugins perderam na Fase 0 | P |
| `network` com lista permitida | O main busca a URL (`net.fetch`, sem CORS) **só** para os domínios declarados no manifest | P |
| Tela de permissões | Ao ativar o plugin: "Este plugin quer: ler uso de CPU/RAM, acessar g1.globo.com" | P |

| Item | Viabilidade | Esforço | Observações |
|---|---|---|---|
| **B1. Monitor de hardware** (= 3.6) | ⚠️ | M | **CPU, RAM e disco:** ✅ com `os` / `systeminformation`. **Bateria:** ✅ (`navigator.getBattery()` ou `systeminformation`). **GPU:** ⚠️ no Windows, só a NVIDIA expõe uso de forma confiável (via `nvidia-smi`); AMD/Intel ficam sem dados. Recomendo fazer como **widget nativo** e não como plugin: precisa de acesso ao sistema e é útil para todos |
| **B2. Leitor de notícias (RSS)** | ✅ (com a API v2) | M | O main busca e lê o feed (`fast-xml-parser`). Fontes: G1, TechCrunch, TabNews e Jovem Nerd publicam RSS; confirmar as URLs na hora de implementar. Cache de 15 min e abrir a notícia no navegador padrão |
| **B3. Finanças e cripto** | ✅ (com a API v2) | P–M | **Dólar, Euro e Bitcoin:** AwesomeAPI (`economia.awesomeapi.com.br`, grátis, sem chave). **Cripto:** CoinGecko (grátis, com limite). **Ações da B3:** brapi.dev (a maioria dos tickers exige token). ⚠️ "Tempo real" na prática significa atualizar a cada 1–5 min por causa dos limites das APIs gratuitas. Só exibir cotações, sem recomendação |
| **B4. Orbit Store** | ✅ | G | Catálogo `index.json` num repositório GitHub (`orbit-plugins`) com nome, versão, URL do `.zip` e **SHA-256**. O app baixa, confere o hash, extrai (`fflate`) em `Orbit-Plugins/` e mostra as permissões antes de ativar. Também precisa de atualizar e desinstalar. Só aceitar o catálogo oficial no início |

**Ordem dentro do Caminho B:** API v2 → B1 (como widget nativo) → B3 → B2 → B4 (quando já existirem 3 ou mais plugins para listar).

---

### 💡 Banco de Ideias da V5

| Ideia | Viabilidade | Esforço | Observações |
|---|---|---|---|
| **1. Barra de comandos `Ctrl+K`** (= 2.1) | ✅ | M | Usa o registro de ações (P2), então ganha os mesmos comandos da IA. **Calculadora:** usar um parser seguro (`expr-eval`). `eval` é proibido pela CSP, e isso é proposital. "Em qualquer lugar do Windows": o atalho global abre o Orbit já com a barra focada. Uma janela flutuante própria, estilo Raycast, fica para depois (G) |
| **2. Histórico da área de transferência** (= 3.5) | ⚠️ | P–M | O Electron não avisa quando o clipboard muda, então o main lê `clipboard.readText()` a cada ~1 s. Guardar os últimos 20 **só na memória** por padrão (copiar senhas é comum), com botão de pausar e limpar, e deixar **opcional e desligado** até a pessoa ativar. O Windows já tem `Win+V`: o diferencial do Orbit é a busca e fixar itens |
| **3. Sons ambiente nativos** | ✅ | P | **Ruído branco, rosa e marrom:** gerar pelo Web Audio API (zero arquivos, funciona offline). **Chuva, cafeteria, fogueira e ondas:** loops `.ogg` de ~1 MB cada com licença **CC0** (ex.: Freesound filtrado por CC0), em `public/sounds/`. Ter volume por som e permitir misturar dois |
| **4. Espaços de trabalho** (≈ 2.6) | ✅ | G | Migração: tabela `workspaces` + coluna `workspace_id` em `tasks`, `links`, `files` e `notes`; layout dos widgets por espaço nas configurações. Decidir se hábitos são globais (recomendo que sim). O backup na nuvem passa a separar por espaço. Fazer depois da Fase 1 |
| **5. Modo Zen** | ✅ | P (depois de P1) | Com o Pomodoro rodando: esmaecer os outros widgets (opacidade + `pointer-events: none`) ou abrir uma camada em tela cheia só com o timer, a música e a tarefa atual. Sai com `Esc` ou quando o ciclo termina |

---

## Fase 4 — Distribuição

- **Atualização automática:** `electron-updater` + GitHub Releases (`publish: { provider: 'github' }`). O `latest.yml` já é gerado.
- **Assinatura de código:** sem ela o SmartScreen avisa "app desconhecido". Opções: Azure Trusted Signing (mais barato) ou certificado OV.
- **Tamanho:** instalador tem 140 MB. Conferir que `firebase` só entra via import dinâmico e ativar `compression: maximum`.
- **Relatório de erros:** `electron-log` gravando em arquivo + botão "Abrir logs" nas Configurações.
- Versão exibida nas Configurações vinda de `app.getVersion()`, não fixa no código.

---

## Ordem sugerida

Atualizada em 24/10/2026 com os Caminhos A e B.

| Etapa | Entrega | Versão |
|---|---|---|
| ✅ 1 | Fase 0 (correções e segurança) + redesign | v4.1 |
| ✅ 2 | Fase 1 (fundação) + pré-requisitos P1–P4 | — |
| 3 | **Ctrl+K** + **A1 IA com ações** (as duas usam o mesmo registro de ações) + Pomodoro com durações livres (2.3) | **v5.0** |
| 4 | A2 Daily Briefing + A3 Scratchpad com IA + Modo Zen + Sons ambiente | v5.1 |
| 5 | 2.4 Tarefas (prioridade, prazo, reordenar) + 2.7 Onboarding + 3.8 Backup `.json` | v5.2 |
| 6 | API de plugins v2 + B1 Monitor (widget nativo) + B3 Finanças + B2 RSS | v5.3 |
| 7 | B4 Orbit Store + Fase 4 (atualização automática, assinatura) | v6.0 |
| depois | Espaços de trabalho, área de transferência, mini janela (2.2), layout livre (2.6) | — |

**Por que nesta ordem:** o Caminho A dá o maior salto percebido com pouca infraestrutura, e o Ctrl+K sai quase de graça junto. O Caminho B só faz sentido depois da API de plugins v2. A loja só compensa quando houver plugins para listar. A atualização automática precisa existir antes de distribuir para outras pessoas.

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
