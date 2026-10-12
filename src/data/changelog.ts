export interface VersionLog {
  version: string;
  name: string;
  date: string;
  status: 'current' | 'released';
  summary: string;
  features: {
    category: string;
    items: string[];
  }[];
}

export const CHANGELOG_DATA: VersionLog[] = [
  {
    version: 'v4.0.0',
    name: 'Preparação para Produção & Polimento',
    date: 'Outubro 2026',
    status: 'current',
    summary: 'Arquitetura consolidada para distribuição em larga escala com compilação para instalador Windows oficial, modo de apoio e histórico de versões.',
    features: [
      {
        category: '📦 Empacotamento & Build',
        items: [
          'Compilação oficial para executável Windows (.exe / NSIS Installer) testada e validada.',
          'Proteção contra travamento de processos em segundo plano durante a compilação.',
          'Isolamento total de credenciais de produção no .gitignore (blindagem de API Keys).'
        ]
      },
      {
        category: '📜 Transparência & Documentação',
        items: [
          'Histórico de versões e log de funcionalidades integrado discretamente nas configurações.',
          'Guia de boas-vindas (Onboarding) para novos usuários com tour interativo.',
          'Modo de apoio comunitário (Apoia.se / GitHub Sponsors) personalizável e alternável.'
        ]
      }
    ]
  },
  {
    version: 'v3.0.0',
    name: 'Expansão, Nuvem & Inteligência Artificial',
    date: 'Setembro 2026',
    status: 'released',
    summary: 'Transformação do Orbit em uma plataforma expansível com ecossistema de plugins, integração com nuvem do Google e IA nativa.',
    features: [
      {
        category: '🧩 Sistema de Plugins',
        items: [
          'Carregamento dinâmico de widgets externos direto da pasta Documentos/Orbit-Plugins.',
          'Suporte a widgets HTML/JS isolados com renderização segura via srcDoc.',
          'Plugin demonstrativo de Calculadora integrado.'
        ]
      },
      {
        category: '☁️ Cloud Sync (Firebase)',
        items: [
          'Backup silencioso e em tempo real para o Google Firestore com debounce.',
          'Sincronização do Bloco de Notas (Scratchpad) e Tarefas (Kanban).',
          'Arquitetura offline-first: funciona 100% sem internet e sincroniza ao reconectar.'
        ]
      },
      {
        category: '🤖 Inteligência Artificial',
        items: [
          'Assistente Gemini Pro embutido no painel utilizando Google Generative AI SDK.',
          'Configuração de API Key direto pela interface sem alterar código.'
        ]
      },
      {
        category: '🎵 Foco & Música',
        items: [
          'Player de foco híbrido com alternância instantânea entre Spotify e rádio Lo-Fi do YouTube Music.'
        ]
      }
    ]
  },
  {
    version: 'v2.0.0',
    name: 'Evolução Desktop & Customização Total',
    date: 'Setembro 2026',
    status: 'released',
    summary: 'Rebranding para Orbit Dashboard com integração profunda aos recursos nativos do sistema operacional Windows.',
    features: [
      {
        category: '🪟 Integração com o Windows',
        items: [
          'Ícone na Bandeja do Sistema (System Tray) com opção de ocultar/restaurar.',
          'Atalho de teclado global (Ctrl + Espaço) para exibir o painel em qualquer tela.',
          'Notificações nativas do Windows disparadas ao final dos ciclos de Pomodoro.',
          'Modo Tela Cheia Imersivo ocupando 100% do monitor.',
          'Script automatizado para inicialização junto com o Windows.'
        ]
      },
      {
        category: '🎯 Grade & Layout',
        items: [
          'Sistema livre de arrastar e soltar (Drag and Drop) usando @dnd-kit.',
          'Redimensionamento dinâmico de cartões (Pequeno, Médio, Grande).',
          'Heatmap (mapa de calor) de 35 dias no Rastreador de Hábitos.'
        ]
      }
    ]
  },
  {
    version: 'v1.0.0',
    name: 'Gênesis (Wise Franklin Base)',
    date: 'Setembro 2026',
    status: 'released',
    summary: 'Versão inicial do painel de utilidades local focada em produtividade essencial e desempenho ultraleve.',
    features: [
      {
        category: '🛠️ Widgets Essenciais',
        items: [
          'Scratchpad: Bloco de notas rápido com salvamento automático.',
          'Links Rápidos: Gerenciador de atalhos web categorizados.',
          'Atalhos de Arquivos: Execução de arquivos e pastas locais com um clique.',
          'Kanban: Quadro de Tarefas a Fazer e Ideias.',
          'Timer Pomodoro: Ciclos de 25 minutos de foco e 5 de pausa.',
          'Relógio & Clima: Previsão do tempo e hora em tempo real.',
          'Rastreador de Hábitos: Check-in dos últimos 5 dias.'
        ]
      },
      {
        category: '🎨 Personalização & Base',
        items: [
          'Banco de dados local ultra-rápido SQLite (better-sqlite3).',
          '4 Temas de cores elegantes (Escuro Clássico, Oceano Profundo, Floresta, Crepúsculo).'
        ]
      }
    ]
  }
];
