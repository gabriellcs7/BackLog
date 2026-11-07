# 🎮 BackLog · Your Gaming Story

<p align="center">
  <img src="imagens/logo_transparente.png" alt="BackLog Logo" width="320">
</p>

<p align="center">
  <strong>Great games. Better memories. Your gaming story belongs here.</strong><br>
  Uma aplicação web cinematográfica, local-first e com recursos sociais opcionais para catalogar, registrar e compartilhar sua jornada gamer.
</p>

<p align="center">
  <a href="https://github.com/gabriellcs7/BackLog"><img src="https://img.shields.io/badge/GitHub-gabriellcs7%2FBackLog-181717?logo=github&logoColor=white" alt="Repositório GitHub"></a>
  <img src="https://img.shields.io/badge/JavaScript-ES6%2B%20Vanilla-yellow?logo=javascript&logoColor=black" alt="JavaScript ES6+">
  <img src="https://img.shields.io/badge/HTML5-Semântico-orange?logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-Custom%20Properties-blue?logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/Offline-LocalStorage-success" alt="LocalStorage">
  <img src="https://img.shields.io/badge/Cloud-Supabase%20%7C%20PostgreSQL-3ECF8E?logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Catálogo-40%20Títulos%20Canônicos-purple" alt="40 Jogos">
  <img src="https://img.shields.io/badge/Build%20Tools-Zero%20(Pure%20Web)-brightgreen" alt="Zero Build Tools">
</p>

<p align="center">
  <img src="imagens/backlog-showcase-banner.png" alt="BackLog Showcase Banner" width="100%" style="border-radius: 12px; border: 1px solid #2c2d2c;">
</p>

---

## 📖 1. Visão Geral & Filosofia

O **BackLog** é uma plataforma gamer moderna e focada em experiência do usuário, projetada para quem valoriza a preservação de memórias e a organização da própria biblioteca de jogos. Sem formulários obrigatórios para começar, anúncios ou algoritmos invasivos, o BackLog adota a filosofia **Local-First com Nuvem Opcional**:

- **Modo Local (Offline / Guest):** Funciona imediatamente no navegador direto dos arquivos estáticos. Todo o perfil, Top 4 de favoritos, listas personalizadas, diário de jogatina e avaliações pessoais ficam salvos de forma 100% privada no `localStorage` do seu dispositivo.
- **Modo Conectado (Supabase Cloud):** Conecte uma conta para desbloquear o ecossistema social completo: sincronização na nuvem, perfis públicos com bio, listas compartilháveis, feed comunitário por jogo com curtidas (*likes*) e comentários, tudo protegido por políticas de segurança a nível de linha (*Row Level Security - RLS*) no PostgreSQL.

---

## ✨ 2. Principais Funcionalidades

### 🎮 Coleção e Backlog
- 🗃️ **Gestão Granular em 6 Níveis:** Classifique seus jogos entre *Played* (Jogado), *Playing* (Jogando), *Completed* (Zerado), *Platinum* (Platinado), *Dropped* (Dropado) e *Want to play* (Quero jogar).
- 📑 **Seções Dedicadas no Backlog:** A aba *My backlog* organiza sua coleção automaticamente em três áreas independentes com contadores em tempo real: **Played** (inclui Zerados, Platinados e Dropados), **Playing** e **Want to play**.
- ⚡ **Pesquisa Global com Atalho Rápido:** Pressione <kbd>/</kbd> em qualquer página para focar imediatamente na barra de busca, com normalização de acentos e diacríticos (`normalize('NFD')`) e suporte a apelidos (*aliases*).
- 🎯 **Filtros Combinados & Ordenação:** Navegue por gêneros (*Ação*, *Aventura*, *Terror*, *RPG*, *Sandbox*, *MOBA*, *Shooter*), alterne entre catálogo geral e coleção pessoal, e ordene de A–Z, Z–A ou por destaques.
- 🔗 **Sincronização de Estado na URL:** Compartilhe buscas e filtros preservados diretamente no endereço (`?q=...&saved=1&genre=...&status=...&sort=...`) via `history.replaceState`.

### 📅 Diário de Jogos (Gaming Diary)
- 🗓️ **Linha do Tempo Cronológica:** Cada avaliação ou review gera um registro temporal com data personalizável (hoje por padrão ou datas retroativas).
- 📊 **Métricas Pessoais:** Painel no topo exibindo total de registros salvos (**Entries**), jogos distintos registrados (**Games**) e total de dias de jogatina (**Days Logged**).
- 🔍 **Filtros do Diário:** Pesquisa rápida por título, filtro por mês e separação entre resenhas escritas e notas numéricas.
- 🛠️ **Edição e Exclusão Segura:** Altere datas de registros passados ou remova entradas específicas sem apagar a review original nem alterar o status do jogo na coleção.
- 🎯 **Auto-Status:** Registrar uma entrada no diário define o jogo como *Played* caso ele ainda não tenha status definido, preservando status já atribuídos.

### 👤 Perfil do Jogador & Listas
- 🌟 **The Favorite Four (Top 4):** Escolha seus quatro jogos mais marcantes para brilharem juntos no topo do perfil, sem hierarquia ou ranking.
- 📋 **Listas Personalizadas de Jogos:** Crie maratonas temáticas (ex: *"Melhores Histórias"*, *"Maratona de Terror"*), com visibilidade pública ou privada, seletor visual de jogos e filtro para listar apenas títulos já jogados.
- 🔒 **Importação Segura do Dispositivo:** Transfira seus favoritos e listas locais para a nuvem com um clique; listas importadas começam privadas por padrão para sua segurança.

### ⭐ Avaliações com Meia Estrela & Feed Social
- 🌗 **Sistema de Meia Estrela (0.0 a 5.0):** Selecione notas com precisão de 0.5 estrelas clicando na metade esquerda/direita ou usando as setas do teclado.
- ✍️ **Resenhas Pessoais:** Textos de até 3.000 caracteres com contador dinâmico e suporte a edição e cancelamento sem perda de dados.
- 💬 **Feed Comunitário por Jogo:** Veja as análises de outros jogadores, com suporte a curtidas únicas (bloqueio de auto-like garantido no banco) e comentários paginados de até 1.000 caracteres.
- 🔗 **Compartilhamento Ágil:** Modal com Clipboard API nativa para cópia de links diretos para jogos e perfis públicos.

---

## 🏷️ 3. Sistema Canônico de Status

A coleção é estruturada sobre seis estados canônicos, exibidos tanto no catálogo quanto na página de detalhes e na sincronização local:

| Status | ID Interno | Ícone | Significado / Critério |
| :--- | :---: | :---: | :--- |
| **Played** | `played` | 🕹️ | Títulos que você já experimentou, mas não necessariamente concluiu a história. |
| **Playing** | `playing` | ▶️ | Jogos ativos na sua rotina atual. |
| **Completed** | `completed` | ✔️ | Campanha principal ou história terminada com sucesso. |
| **Platinum** | `platinum` | 🏆 | Conquista máxima: 100% dos troféus, missões e segredos completados. |
| **Dropped** | `dropped` | ⏸️ | Jogos abandonados ou pausados por tempo indeterminado. |
| **Want to play** | `want-to-play` | 📌 | Sua lista de desejos / próximo da fila para começar. |

---

## 📚 4. Distribuição do Catálogo

O projeto possui **40 títulos emblemáticos** curados e catalogados com capas em alta resolução (padrão 3:4 / 600×800 com desfoque de fundo inteligente) e banners cinematográficos:

```
┌────────────────────────────────────────────────────────┐
│               DISTRIBUIÇÃO POR FRANQUIA                │
├────────────────────────────┬───────────────────────────┤
│ Resident Evil              │ 11 Jogos (1996 a Requiem) │
│ Grand Theft Auto           │ 8 Jogos (GTA 1 ao GTA VI) │
│ God of War                 │ 6 Jogos (Clássicos e Nórd)│
│ Marvel's Spider-Man        │ 3 Jogos (Peter & Miles)   │
│ The Last of Us             │ 2 Jogos (Part I & Part II)│
│ Overwatch                  │ 2 Jogos (1 & 2)           │
│ League of Legends          │ 1 Jogo                    │
│ Standalones & Futuros      │ 7 Jogos (Minecraft, RDR2, │
│                            │ Silent Hill, Phantom Blade│
├────────────────────────────┴───────────────────────────┤
│ TOTAL: 40 Jogos Canônicos Curados                      │
└────────────────────────────────────────────────────────┘
```

---

## 📂 5. Arquitetura e Árvore de Diretórios

A estrutura do projeto separa a camada estática pura da integração com serviços e banco de dados:

```bash
BackLog/
├── index.html                   # Landing page: hero, destaques, favoritos e reviews
├── README.md                    # Documentação oficial do projeto
│
├── css/                         # Folhas de estilo modulares
│   ├── site.css                 # Design tokens globais, reset, header, navegação e footer
│   ├── style.css                # Estilização exclusiva da página inicial
│   ├── social.css               # Estilos para perfis, listas, diálogos modais e feed social
│   └── diary.css                # Estilos do diário cronológico e linha do tempo
│
├── js/                          # Núcleo de lógica, dados e serviços
│   ├── games.js                 # Catálogo canônico dos 40 jogos (BacklogGames)
│   ├── config.js                # Configuração pública (Project URL e Publishable Key)
│   ├── account.js               # Gerenciador de autenticação, sessão e sincronização
│   ├── site.js                  # Controle global de coleção, localStorage e atalhos
│   ├── catalog.js               # Motor de busca, filtros de gênero/status e ordenação
│   ├── reviews.js               # Lógica de avaliações pessoais, notas e meias estrelas
│   ├── diary.js                 # Gerenciamento de registros do diário e persistência temporal
│   ├── community.js             # Integração com o feed da comunidade, curtidas e comentários
│   ├── ui.js                    # Utilitários de interface, toasts e feedback acessível
│   └── vendor/                  # Bibliotecas distribuídas localmente
│       ├── supabase.js          # Supabase JS SDK v2.119.0 oficial
│       └── SUPABASE-LICENSE.txt # Licença MIT da biblioteca
│
├── view/                        # Páginas e views especializadas
│   ├── pagina_jogos.html        # Catálogo geral e coleção organizada em seções
│   ├── game.html                # Página dinâmica do jogo: detalhes, review e comunidade
│   ├── profile.html             # Perfil do jogador: bio, Top 4 favoritos, listas e login
│   ├── diary.html               # Diário de jogos: histórico cronológico com filtros
│   ├── css_game/style.css       # Estilos específicos da página de detalhes do jogo
│   ├── css_paginaJogos/style.css# Estilos da barra de ferramentas e seções do catálogo
│   └── js/                      # Controladores dedicados de cada view
│       ├── game.js              # Renderização dinâmica via URL (?id=), status e modal
│       ├── review.js            # Formulário de review, estrelas fracionadas e rascunhos
│       ├── community.js         # Feed comunitário, curtidas e comentários
│       ├── profile.js           # Gerenciamento do perfil, seleção de favoritos e listas
│       └── diary.js             # Renderização e filtros do diário cronológico
│
├── supabase/                    # Infraestrutura de banco de dados e migrações
│   ├── setup.sql                # Script unificado de criação do banco para novos projetos
│   ├── atualizar-diario.sql     # Script de migração para instâncias existentes
│   └── migrations/              # Migrações versionadas com políticas Row Level Security
│
├── imagens/                     # Ativos gráficos e identidade visual
│   ├── backlog-showcase-banner.png # Banner visual oficial e vitrine da aplicação
│   ├── banner_builder.html      # Template construtor do banner em alta resolução
│   ├── banners/                 # Banners horizontais em alta definição (WebP)
│   ├── capas/catalogo/          # Capas padronizadas 600x800 com proporção 3:4
│   ├── destaques/               # Imagens responsivas para o radar com múltiplos srcsets
│   ├── logo_transparente.png    # Logotipo oficial do BackLog
│   └── gta-vi-banner-4k.webp    # Imagem de destaque 4K do GTA VI
│
└── docs/                        # Documentação técnica detalhada
    ├── supabase.md              # Guia de configuração de autenticação e banco na nuvem
    ├── reviews.md               # Especificação de avaliações e meias estrelas
    ├── diary.md                 # Comportamento e regras de negócio do diário
    └── catalogo/                # Notas de revisão de capas, banners e franquias
```

---

## 🚀 6. Guia de Instalação e Execução

### Opção 1: Execução Local com Python (Recomendado)
Para uma experiência completa (incluindo rotas do navegador, histórico e autenticação de contas locais sem bloqueios do protocolo `file://`):

```bash
# 1. Clone o repositório oficial
git clone https://github.com/gabriellcs7/BackLog.git

# 2. Acesse a pasta do projeto
cd BackLog

# 3. Inicie o servidor HTTP local
python -m http.server 8000 --bind 127.0.0.1
```

Em seguida, abra seu navegador em: **`http://localhost:8000`**

### Opção 2: VS Code Live Server
1. Abra a pasta do projeto no **Visual Studio Code**.
2. Com a extensão **Live Server** instalada, clique com o botão direito em `index.html`.
3. Selecione **"Open with Live Server"**.

### Opção 3: Modo Convidado Rápido (Sem Servidor)
Dê um duplo clique direto em `index.html`. Todas as funcionalidades locais (coleção, diário, top 4 e reviews offline) funcionam instantaneamente.

---

## ☁️ 7. Configuração Opcional do Supabase (Nuvem & Social)

Para habilitar login, perfis públicos, sincronização de listas, curtidas e comentários comunitários:

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito chamado **BackLog**.
2. No painel do Supabase, vá em **SQL Editor** e execute o conteúdo de `supabase/setup.sql`. *(Se já possuir um banco anterior, execute apenas `supabase/atualizar-diario.sql`)*.
3. Em **Authentication** ➔ **URL Configuration**:
   - Defina **Site URL** com o endereço do seu site (ex: `http://localhost:8000` em testes locais).
   - Adicione `http://localhost:8000/view/profile.html` em **Redirect URLs** (e a URL final de produção ao publicar).
4. Em **Project Settings** ➔ **API**, copie a **Project URL** e a **Publishable Key** (`anon`/`public`).
5. Configure em `js/config.js`:
   ```javascript
   window.BacklogConfig = Object.freeze({
       supabaseUrl: 'https://SEU-PROJETO.supabase.co',
       supabasePublishableKey: 'sb_publishable_SUA_CHAVE_PUBLICA'
   });
   ```

> [!SECURITY]
> Todas as tabelas operam sob **Row Level Security (RLS)** estrito. A chave configurada é exclusivamente pública. Nunca insira chaves `service_role` ou secretas no frontend.

---

## ⌨️ 8. Atalhos de Teclado & Usabilidade

| Tecla / Combinação | Onde Funciona | Ação Executada |
| :---: | :--- | :--- |
| <kbd>/</kbd> | Em qualquer página | Foca instantaneamente na barra de busca global. |
| <kbd>Esc</kbd> | Diálogos / Mobile | Fecha modais (diário, listas, login, compartilhar) ou recolhe o menu mobile. |
| <kbd>Enter</kbd> | Barra de busca | Submete o termo e abre o catálogo com os resultados filtrados. |
| <kbd>←</kbd> / <kbd>→</kbd> | Avaliação por estrelas | Aumenta ou diminui a nota pessoal em passos de 0.5 estrelas. |
| <kbd>Tab</kbd> | Navegação geral | Acesso imediato ao *Skip to content* e controles acessíveis. |

---

## 🛠️ 9. Contrato de Dados (Adicionando Novos Jogos)

Para registrar novos títulos no catálogo local, insira um novo objeto no array `window.BacklogGames` em `js/games.js`:

```javascript
{
    "id": "nome-do-jogo",                   // Obrigatório: Slug único em minúsculas com hífens
    "title": "Nome do Jogo",               // Obrigatório: Título oficial completo
    "cover": "catalogo/nome-do-jogo.webp", // Obrigatório: Capa 600x800 dentro de imagens/capas/
    "genre": "Action",                     // Obrigatório: Action, Adventure, Horror, MOBA, RPG, Sandbox, Shooter
    "tags": ["Action", "Adventure"],       // Obrigatório: Tags temáticas para os cards
    "studio": "Nome do Estúdio",           // Obrigatório: Desenvolvedora ou publicadora
    "caption": "Frase de efeito marcante", // Obrigatório: Slogan ou subtítulo
    "description": "Sinopse do jogo...",   // Obrigatório: Texto descritivo para a página do jogo
    "banner": "banners/nome-banner.webp",  // Obrigatório: Arte horizontal dentro de imagens/
    "bannerPosition": "center center",     // Obrigatório: Alinhamento CSS no desktop
    "bannerPositionMobile": "50% center",  // Obrigatório: Alinhamento CSS no smartphone
    
    // Propriedades Opcionais
    "franchise": "Nome da Franquia",       // Opcional: Agrupa franquias e gera recomendações
    "year": 2024,                          // Opcional: Ano de lançamento
    "platforms": ["PC", "PS5", "Xbox"],    // Opcional: Lista de plataformas suportadas
    "aliases": ["Sigla", "Outro Nome"],    // Opcional: Termos extras para a pesquisa
    "releaseState": "upcoming"             // Opcional: 'upcoming' (futuro) ou 'retired' (histórico)
}
```

---

## 🎨 10. Design System & Tokens CSS

O projeto utiliza um conjunto refinado de variáveis CSS declaradas no escopo raiz (`:root`) em `css/site.css`:

```css
:root {
    color-scheme: dark;
    --bg: #131414;        /* Fundo principal escuro profundo */
    --surface: #1a1b1b;   /* Superfície de cards, listas e modais */
    --line: #2c2d2c;      /* Linhas divisórias e bordas sutis */
    --text: #f5f5ef;      /* Texto de alto contraste e legibilidade */
    --muted: #a1a39b;     /* Texto secundário e legendas */
    --yellow: #ffd21f;    /* Cor de destaque principal (âmbar/dourado) */
    --radius: 12px;       /* Arredondamento padrão de cantos */
}
```

---

## 👨‍💻 11. Autor e Direitos

Projeto idealizado e desenvolvido por **Gabriel** ([@gabriellcs7](https://github.com/gabriellcs7)).

- **Repositório:** [https://github.com/gabriellcs7/BackLog](https://github.com/gabriellcs7/BackLog)
- **Propriedade Intelectual:** Todas as capas, capturas de tela, marcas comerciais e logotipos de jogos pertencem a suas respectivas desenvolvedoras e publicadoras (Rockstar Games, Sony Interactive Entertainment, Capcom, Epic Games, Naughty Dog, Mojang Studios, Riot Games, Blizzard Entertainment, etc.).

---

<p align="center">
  <sub>BackLog · Feito com paixão para quem ama grandes jogos e melhores memórias.</sub>
</p>
