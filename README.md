# BackLog

Aplicação web para catalogar jogos, registrar sessões em um diário cronológico, organizar listas personalizadas e compartilhar avaliações. Funciona direto no navegador sem login, salvando dados no `localStorage`, e oferece sincronização na nuvem e recursos de comunidade opcionais via Supabase.

[![GitHub](https://img.shields.io/badge/GitHub-gabriellcs7%2FBackLog-181717?logo=github&logoColor=white)](https://github.com/gabriellcs7/BackLog)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES6%2B-yellow?logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-Custom%20Properties-blue?logo=css3&logoColor=white)
![Armazenamento](https://img.shields.io/badge/Armazenamento-LocalStorage%20%7C%20Supabase-3ECF8E?logo=supabase&logoColor=white)
![Catálogo](https://img.shields.io/badge/Cat%C3%A1logo-100%20Jogos-purple)
![Dependências](https://img.shields.io/badge/Depend%C3%AAncias-Zero-brightgreen)

<p align="center">
  <img src="imagens/backlog-showcase-banner.png" alt="BackLog Interface Showcase" width="100%" style="border-radius: 12px; border: 1px solid #2c2d2c;">
</p>

---

## Como funciona

O projeto opera em dois modos:

1. **Modo local (offline):** Abra a aplicação no navegador e use imediatamente. Perfil, quatro jogos favoritos, listas (livres ou ranqueadas), avaliações e diário ficam salvos no `localStorage`. Os dados do perfil ficam na sua máquina e nenhuma conta é exigida. As notícias automáticas precisam de conexão e do servidor local do BackLog.
2. **Modo conectado (Supabase):** Ao preencher as chaves do Supabase no arquivo `js/config.js`, a aplicação ativa autenticação por e-mail, sincronização na nuvem, upload de fotos e banners de perfil, distribuição comunitária de notas, feed social de seguidos, central de atividades e busca de jogadores.

---

## Recursos principais

- Catálogo com 100 jogos detalhados com capas, banners panorâmicos, logos transparentes e metadados de franquia, estúdio, plataformas e ambientação.
- Navegação em perspectiva tridimensional pelos jogos em destaque (`js/game-tunnel.js`), acionada pela rolagem suave, cursor ou teclado.
- Linha do tempo interativa na página inicial demonstrando a interface mobile (`js/cinematic-backlog.js`).
- Mais de 440 biografias de personagens em 90 jogos com retratos dedicados (`imagens/personagens/`) e sinopses sem spoilers (`js/game-characters.js`).
- Notícias oficiais atualizadas automaticamente a cada dez minutos, com cache e imagens das matérias (`docs/noticias.md`), usando o servidor Python local sem bibliotecas adicionais.
- Controle de movimento e acessibilidade (`js/presentation-motion.js`) com modos `auto`, `full` e `reduced`.
- Histograma de avaliações comunitárias de 0.5 a 5.0 estrelas na página de cada jogo e no perfil (`view/js/game-ratings.js`).
- Listas ranqueadas e temáticas (`docs/ranked-lists.md`) com suporte a reordenação por teclado ou arrastar e soltar.
- Perfil com banner personalizável vinculado a qualquer jogo do catálogo, seleção de plataforma principal (PC, PlayStation, Xbox, Nintendo), localização e link externo.
- Vitrine de quatro jogos favoritos no perfil com suporte a arrastar e soltar ou reordenação por teclado.
- Barra de busca global com atalho `/` que localiza títulos, franquias e perfis de usuários.
- Discover com capas arrastáveis para descobrir jogos e adicioná-los à lista de desejos, com opção de desfazer.
- Rodapé com páginas Sobre, Ajuda e Créditos e links do autor ([detalhes](docs/components/tools-discover-footer.md)).

---

## Estrutura da aplicação

### Catálogo e coleções (`view/pagina_jogos.html`)
Filtros combinados por status da coleção, ordenação (Destaques, A-Z, Z-A) e 10 gêneros (`Action`, `Adventure`, `Fighting`, `Horror`, `MOBA`, `RPG`, `Sandbox`, `Shooter`, `Sports`, `Survival`). Acompanha seis status: `Played` (Jogado), `Playing` (Jogando), `Completed` (Zerado), `Platinum` (Platinado), `Dropped` (Dropado) e `Want to play` (Quero jogar).

### Página do jogo (`view/game.html`)
Cabeçalho panorâmico com logo oficial, distribuição de notas da comunidade, carrossel de personagens com retratos, sinopse, plataformas e resenhas públicas de outros jogadores. Permite alterar o status na coleção e abrir o editor de resenhas.

### Diário de jogos (`view/diary.html`)
Registro das sessões por data em ordem cronológica decrescente. Inclui filtro por mês e ano, busca textual e opção de alterar a data de cada registro sem modificar o texto da resenha.

### Perfil e recursos sociais (`view/profile.html`)
Métricas automáticas (*Games logged*, *Played in [ano]*, número de listas públicas e privadas), vitrine de quatro favoritos, listas do usuário, atividade recente e lista de desejos. Na versão conectada ao Supabase, exibe contadores de conexões, feed de seguidos e suporte a upload de foto de perfil.

### Central de atividades (`view/activity.html`)
Feed social com filtros por todas as atividades, personalizadas ou de quem você segue. Exibe novos seguidores, curtidas e comentários em resenhas.

### Página inicial (`index.html`)
Apresentação do catálogo em perspectiva, atalhos para a coleção pessoal, resenhas recentes da comunidade, notícias de fontes oficiais e demonstração visual dos recursos.

---

## Catálogo de Jogos (100 Títulos em 30 Coleções)

O acervo reúne 100 jogos detalhados em `js/games.js`, todos com capas em `imagens/capas/catalogo/`, banners em `imagens/banners/` e logos em `imagens/logos/`:

| Franquia / Coleção | Qtd | Títulos Incluídos |
| :--- | :---: | :--- |
| **Alan Wake** | 2 | Alan Wake, Alan Wake 2 |
| **Counter-Strike** | 5 | Counter-Strike, Condition Zero, Source, Global Offensive, Counter-Strike 2 |
| **Cuphead** | 2 | Cuphead, The Delicious Last Course |
| **Cyberpunk** | 2 | Cyberpunk 2077, Phantom Liberty |
| **Dark Souls** | 3 | Dark Souls, Dark Souls II, Dark Souls III |
| **EA Sports FC** | 2 | EA Sports FC 26, EA Sports FC 27 |
| **God of War** | 6 | God of War (2005), God of War II, God of War III, Ascension, God of War (2018), Ragnarök |
| **Grand Theft Auto** | 8 | GTA, GTA 2, GTA III, Vice City, San Andreas, GTA IV, GTA V, GTA VI |
| **Hollow Knight** | 2 | Hollow Knight, Hollow Knight: Silksong |
| **Injustice** | 2 | Injustice: Gods Among Us, Injustice 2 |
| **League of Legends** | 1 | League of Legends |
| **Marvel Rivals** | 1 | Marvel Rivals |
| **Marvel's Spider-Man** | 3 | Marvel's Spider-Man, Miles Morales, Marvel's Spider-Man 2 |
| **Marvel's Wolverine** | 1 | Marvel's Wolverine |
| **Minecraft** | 1 | Minecraft Dungeons |
| **Outlast** | 3 | Outlast, Outlast 2, The Outlast Trials |
| **Overwatch** | 2 | Overwatch (2016), Overwatch 2 |
| **Phasmophobia** | 1 | Phasmophobia |
| **Poppy Playtime** | 7 | Chapter 1 – A Tight Squeeze, Chapter 2, Chapter 3, Chapter 4, Chapter 5, Project: Playtime, Escape from Playtime |
| **Resident Evil** | 11 | Resident Evil (1996), RE 2 (1998), RE 3 Nemesis, Code: Veronica, RE Zero, RE 4 (2005), RE 5, RE 6, RE 7 Biohazard, Village, Requiem |
| **Roblox** | 1 | Roblox |
| **SUPERHOT** | 2 | SUPERHOT, SUPERHOT: Mind Control Delete |
| **Silent Hill** | 9 | Silent Hill, Silent Hill 2, Silent Hill 3, The Room, Origins, Homecoming, Shattered Memories, Downpour, Silent Hill f |
| **Skate** | 1 | skate. |
| **The Forest** | 2 | The Forest, Sons of the Forest |
| **The Last of Us** | 2 | The Last of Us, The Last of Us Part II |
| **The Witcher** | 3 | The Witcher, The Witcher 2: Assassins of Kings, The Witcher 3: Wild Hunt |
| **Uncharted** | 5 | Drake's Fortune, Among Thieves, Drake's Deception, A Thief's End, The Lost Legacy |
| **Watch Dogs** | 3 | Watch Dogs, Watch Dogs 2, Watch Dogs: Legion |
| **Títulos Individuais** | 7 | Red Dead Redemption, Red Dead Redemption 2, Minecraft, Fortnite, Phantom Blade Zero, Silent Hill: Townfall, Minecraft Dungeons II |

---

## Estrutura de Arquivos

```text
BackLog/
├── css/
│   ├── cinematic-backlog.css  # Estilos da vitrine cinematográfica mobile
│   ├── diary.css              # Estilos da página de diário
│   ├── game-tunnel.css        # Efeito de túnel 3D com rolagem
│   ├── gaming-news.css        # Seção editorial de notícias
│   ├── site.css               # Variáveis globais, tema e navegação
│   ├── social.css             # Feeds comunitários, comentários e perfis
│   └── style.css              # Estilos base da home e vitrines
├── docs/
│   ├── atividade.md           # Guia da central de atividades
│   ├── catalogo/              # Documentações de cada franquia (24 arquivos)
│   ├── diary.md               # Guia do diário de jogatina
│   ├── local-preview.md       # Procedimentos de teste local
│   ├── noticias.md            # Fontes e diretrizes editoriais de notícias
│   ├── perfis-comunidade.md   # Fotos de perfil, seguidores e feeds
│   ├── pesquisa-feeds.md      # Busca unificada e regras de feeds
│   ├── ranked-lists.md        # Documentação técnica de listas ranqueadas
│   ├── reviews.md             # Sistema de avaliações e comentários
│   └── supabase.md            # Guia completo de configuração do banco
├── imagens/
│   ├── backlog-showcase-banner.png
│   ├── banners/               # 100 banners panorâmicos dos jogos
│   ├── capas/catalogo/        # 100 capas verticais em alta definição
│   ├── logos/                 # 100 logos transparentes oficiais
│   ├── noticias/              # Artes das matérias editoriais
│   └── personagens/           # 371 retratos curados dos personagens
├── js/
│   ├── account.js             # Sessão, login e sincronização de dados
│   ├── catalog.js             # Busca, filtros e paginação do catálogo
│   ├── cinematic-backlog.js   # Animação interativa do smartphone e iluminação
│   ├── community.js           # Funções de social, seguir, likes e comentários
│   ├── config.js              # Credenciais do Supabase (URL e anon key)
│   ├── diary.js               # Lógica de registro cronológico do diário
│   ├── game-characters.js     # Base de mais de 440 biografias de personagens
│   ├── game-tunnel.js         # Mecânica matemática e render do túnel 3D
│   ├── games.js               # Catálogo completo com os 100 jogos cadastrados
│   ├── home.js                # Lógica da vitrine e feeds da página inicial
│   ├── player-search.js       # Busca instantânea de usuários
│   ├── presentation-motion.js # Gerenciador de acessibilidade de movimento
│   ├── reviews.js             # Criação e listagem de reviews com meio ponto
│   ├── select-controls.js     # Menus dropdown com tema escuro e teclado
│   ├── site.js                # Cabeçalho, avatar da conta e atalho de busca
│   ├── ui.js                  # Modais, toasts e renderização de notas
│   └── vendor/
│       └── supabase.js        # Biblioteca cliente oficial do Supabase
├── servidor.py                # Servidor local Python, notícias e cabeçalhos anti-cache
├── news_feed.py               # Feeds oficiais, imagens e cache das notícias
├── supabase/
│   ├── setup.sql              # Schema inicial para novos bancos
│   └── migrations/            # 18 migrações SQL incrementais
├── view/
│   ├── activity.html          # Linha do tempo de atividades sociais
│   ├── diary.html             # Diário cronológico de jogos
│   ├── game.html              # Página do jogo com personagens e notas
│   ├── list.html              # Visualização de lista pública ou privada
│   ├── logged-games.html      # Jogos registrados pelo jogador
│   ├── pagina_jogos.html      # Catálogo com filtros de status e gênero
│   ├── profile-lists.html     # Listas do usuário
│   ├── profile-reviews.html   # Todas as reviews do perfil
│   ├── profile.html           # Perfil com Top 4, banner, plataforma e métricas
│   ├── review.html            # Resenha individual com discussão e likes
│   ├── want-to-play.html      # Lista de desejos (Wishlist)
│   ├── write-review.html      # Formulário dedicado para escrever resenhas
│   └── js/                    # 23 módulos específicos das páginas view
├── index.html                 # Página inicial da plataforma
└── README.md
```

---

## Como Executar Localmente

Como a aplicação é construída com JavaScript e CSS puros, não requer `node_modules`, `npm install` ou processos de compilação.

### Pré-requisitos
- Python 3.8 ou superior instalado.
- Navegador moderno (Chrome, Edge, Firefox, Brave, Safari).

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/gabriellcs7/BackLog.git
   ```

2. **Acesse a pasta do projeto:**
   ```bash
   cd BackLog
   ```

3. **Inicie o servidor local anti-cache:**
   ```bash
   python servidor.py
   ```
   > **Por que usar o `servidor.py`?** Ele oferece as notícias automáticas e envia cabeçalhos `Cache-Control: no-store, no-cache` para garantir que alterações em arquivos `.js`, `.css` e `.html` apareçam imediatamente na tela após salvar, sem travar no cache do navegador.

4. **Acesse pelo navegador:**
   - Página inicial: [http://localhost:8000](http://localhost:8000)
   - Catálogo de jogos: [http://localhost:8000/view/pagina_jogos.html](http://localhost:8000/view/pagina_jogos.html)
   - Perfil: [http://localhost:8000/view/profile.html](http://localhost:8000/view/profile.html)

---

## Configuração do Supabase (Opcional)

Para habilitar login, sincronização em múltiplos aparelhos, upload de foto, reviews públicas e central de atividades:

### 1. Criar o Projeto no Supabase
1. Crie uma conta gratuita em [supabase.com](https://supabase.com).
2. Crie um novo projeto.
3. No menu **SQL Editor**, se for um banco virgem, execute o conteúdo de `supabase/setup.sql`.
4. Em seguida, aplique as migrações da pasta `supabase/migrations/` em ordem para garantir todas as funções mais recentes (`profile_recent_games_v3`, `save_game_list_v2`, `save_review_log`, suporte a banners de perfil e plataformas).

### 2. Configurar Autenticação e URLs
No painel do Supabase, vá em **Authentication** → **URL Configuration**:
- **Site URL:** `http://localhost:8000/`
- **Redirect URLs:** Adicione:
  - `http://localhost:8000/index.html`
  - `http://localhost:8000/view/profile.html`
  - `http://localhost:8000/view/pagina_jogos.html`

### 3. Conectar o Frontend
Abra o arquivo `js/config.js` e preencha suas chaves:

```javascript
window.BACKLOG_CONFIG = {
    SUPABASE_URL: 'https://seu-projeto.supabase.co',
    SUPABASE_ANON_KEY: 'sua-chave-anon-publica-aqui'
};
```

---

## Atalhos de Teclado e Acessibilidade

| Atalho / Tecla | Contexto | Ação |
| :--- | :--- | :--- |
| `/` | Qualquer página | Foca instantaneamente na barra de pesquisa superior |
| `Esc` | Qualquer página | Fecha modais, limpa a busca ou encerra menus abertos |
| `Enter` | Na busca | Executa a busca filtrada no catálogo |
| `Home` / `End` | No Túnel 3D | Avança ou retorna aos extremos da sequência de jogos |
| `Espaço` / `Enter` | Menus Dropdown | Abre o menu e confirma o item selecionado |
| `Setas Cima / Baixo` | Menus Dropdown | Navega entre as opções sem perder o foco na rolagem |
| `Arrastar / Soltar` | Top 4 Favoritos | Reordena a posição das capas no perfil |
| `Setas` / `Arrastar` | Editor de Listas | Reordena posições em listas ranqueadas |

---

## Como Cadastrar Novos Jogos

Para incluir novos títulos no acervo, insira o objeto no array em `js/games.js`:

```javascript
{
    id: "titulo-do-jogo",
    title: "Nome do Jogo",
    cover: "imagens/capas/catalogo/titulo-do-jogo.webp",
    genre: "Action", // Action, Adventure, Fighting, Horror, MOBA, RPG, Sandbox, Shooter, Sports, Survival
    tags: ["Ação", "Mundo aberto", "História rica"],
    studio: "Nome do Estúdio",
    caption: "Frase curta marcante sobre o jogo.",
    description: "Descrição completa do jogo e ambientação.",
    gameplay: "Destaques das mecânicas principais de jogabilidade.",
    platforms: ["PC", "PlayStation 5", "Xbox Series X/S"],
    setting: "Mundo / Época / Cenário onde a trama se passa",
    banner: "imagens/banners/titulo-do-jogo.webp",
    bannerPosition: "center 30%",
    bannerPositionMobile: "center center",
    franchise: "Nome da Franquia", // ou null para jogos individuais
    year: 2026,
    releaseState: "released" // ou "upcoming"
}
```

Opcionalmente, adicione os personagens correspondentes em `js/game-characters.js`:
```javascript
"titulo-do-jogo": [
    ["Nome do Personagem", "identificador-do-retrato", "Descrição neutra sem spoilers da trama."]
]
```

---

## Design System

A interface adota tema escuro nativo focado em legibilidade e contraste, usando CSS Custom Properties:

- **Fundo Principal:** `#0d0e0d` (Dark Onyx)
- **Superfícies de Cartão:** `#131413` com bordas sutis `#202220`
- **Destaque Primário:** `#f3b72c` (Amarelo Dourado para foco, ratings e seleções ativas)
- **Tipografia:** Família do sistema operacional (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
- **Estilização de Elementos Nativos:** Menus `<select>` customizados com aparência consistente e foco estável durante a rolagem.

---

## Autor

Desenvolvido por **Gabriel** ([@gabriellcs7](https://github.com/gabriellcs7)).