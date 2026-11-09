# 🎮 BackLog

BackLog é uma aplicação web para catalogar jogos, registrar datas de jogatina em um diário cronológico e organizar listas pessoais. Funciona direto no navegador sem login (com armazenamento no `localStorage`), com suporte a sincronização na nuvem e recursos de comunidade através do Supabase.

[![GitHub](https://img.shields.io/badge/GitHub-gabriellcs7%2FBackLog-181717?logo=github&logoColor=white)](https://github.com/gabriellcs7/BackLog)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES6%2B-yellow?logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-Custom%20Properties-blue?logo=css3&logoColor=white)
![Armazenamento](https://img.shields.io/badge/Armazenamento-LocalStorage%20%7C%20Supabase-3ECF8E?logo=supabase&logoColor=white)
![Catálogo](https://img.shields.io/badge/Cat%C3%A1logo-40%20Jogos-purple)
![Dependências](https://img.shields.io/badge/Depend%C3%AAncias-Zero-brightgreen)

<p align="center">
  <img src="imagens/backlog-showcase-banner.png" alt="BackLog Interface Showcase" width="100%" style="border-radius: 12px; border: 1px solid #2c2d2c;">
</p>

---

## Como funciona

O projeto foi construído para funcionar em dois modos:

1. **Modo local (offline por padrão):** Você abre a aplicação e usa imediatamente. Seu perfil, Top 4 de favoritos, listas personalizadas, avaliações e o diário de jogatina ficam salvos no `localStorage` do seu navegador. Nenhum dado sai do seu computador e não é necessário criar conta.
2. **Modo conectado (com Supabase):** Ao vincular um projeto Supabase, você pode criar uma conta com e-mail e senha. Seus dados passam a sincronizar na nuvem, seu perfil ganha uma página pública, suas listas podem ser compartilhadas e você pode curtir e comentar nas avaliações de outros jogadores.

---

## Funcionalidades

### Catálogo e Coleção
- **40 jogos canônicos:** Títulos de franquias como Grand Theft Auto, Resident Evil, God of War, The Last of Us e Spider-Man, além de jogos independentes, cadastrados em `js/games.js` com capas 3:4 (600×800) e artes horizontais.
- **Seis status de progresso:** Cada jogo pode ser marcado como *Played*, *Playing*, *Completed*, *Platinum*, *Dropped* ou *Want to play*.
- **Backlog organizado por seções:** Na página de jogos (`view/pagina_jogos.html`), a aba da sua coleção divide os títulos em três áreas com contadores próprios: **Played** (que reúne títulos jogados, zerados, platinados e dropados), **Playing** e **Want to play**.
- **Busca em tempo real:** Atalho global com a tecla <kbd>/</kbd> para focar a pesquisa de qualquer página. O mecanismo normaliza acentos (`normalize('NFD')`) e localiza jogos por título, franquia ou siglas conhecidas.
- **Filtros por gênero e ordenação:** Filtre por Ação, Aventura, Terror, RPG, Sandbox, MOBA ou Shooter, com ordenação por destaques, A–Z ou Z–A.
- **URLs compartilháveis:** Parâmetros de pesquisa, gênero, status e ordenação são refletidos na URL (`?q=...&saved=1&genre=...`) via `history.replaceState`.

### Diário de Jogos (`view/diary.html`)
- **Linha do tempo cronológica:** Toda vez que você avalia ou altera a resenha de um jogo, o sistema registra uma entrada com a data escolhida (hoje por padrão ou datas passadas). Datas futuras são bloqueadas.
- **Métricas no topo:** Contadores de total de entradas (**Entries**), jogos distintos registrados (**Games**) e dias de jogatina anotados (**Days Logged**).
- **Filtros dedicados:** Busca por título, seleção de mês específico e separação entre entradas com resenha escrita ou apenas nota numérica.
- **Edição segura:** Você pode alterar a data de um registro ou removê-lo do diário sem apagar a avaliação principal do jogo nem perder seu status na coleção.
- **Auto-status:** Ao registrar uma entrada no diário para um jogo que ainda não possui status, ele é automaticamente classificado como *Played*. Status prévios (como *Playing* ou *Want to play*) nunca são sobrescritos.

### Perfil e Listas (`view/profile.html`)
- **Identidade do jogador:** Nome de exibição, biografia curta e avatar com inicial.
- **The Favorite Four (Top 4):** Escolha quatro jogos favoritos para ficarem fixados em destaque conjunto no topo do seu perfil, sem ordem ou hierarquia.
- **Listas personalizadas:** Crie coleções temáticas com título e descrição. Cada lista pode ser pública ou privada e conta com busca interna e filtro para exibir apenas jogos que você já marcou como jogados.
- **Importação do dispositivo:** Se você começou usando o site offline e depois criou uma conta, um botão no perfil transfere seus favoritos e listas locais para a nuvem. Listas importadas iniciam privadas por padrão.

### Avaliações e Comunidade
- **Notas de meia estrela (0.0 a 5.0):** Seletor interativo que aceita frações de 0.5. Clique no lado esquerdo da estrela para meia nota, no lado direito para nota inteira, ou use as setas do teclado.
- **Resenhas de até 3.000 caracteres:** Contador de caracteres dinâmico com suporte a edição e cancelamento sem perda acidental do rascunho.
- **Feed comunitário por jogo:** Veja análises publicadas por outros jogadores na página de cada jogo.
- **Curtidas com regra de unicidade:** Cada pessoa pode curtir uma review uma única vez. As regras de banco impedem que o autor curta a própria publicação.
- **Comentários de até 1.000 caracteres:** Discussões paginadas com opção de exclusão pelo próprio autor do comentário.

---

## Estrutura de arquivos

```text
BackLog/
├── index.html                   # Página inicial com destaques, radar e reviews da comunidade
├── README.md                    # Documentação do projeto
│
├── css/
│   ├── site.css                 # Variáveis de design (cores, tipografia, espaçamento), reset e navegação
│   ├── style.css                # Estilos específicos da página inicial
│   ├── social.css               # Estilos para perfis, listas, modais e feed social
│   └── diary.css                # Estilos do diário de jogos e linha do tempo
│
├── js/
│   ├── games.js                 # Catálogo canônico dos 40 jogos
│   ├── config.js                # Chaves públicas de conexão com o Supabase
│   ├── account.js               # Estado da sessão, login, cadastro e importação
│   ├── site.js                  # Controle global de status, atalhos de teclado e contadores
│   ├── catalog.js               # Lógica de filtros, pesquisa e renderização do catálogo
│   ├── reviews.js               # Validação de notas fracionadas e salvamento de reviews
│   ├── diary.js                 # Manipulação das entradas temporais do diário
│   ├── community.js             # Requisições de feed social, likes e comentários
│   ├── ui.js                    # Toasts, notificações acessíveis e diálogos
│   └── vendor/
│       ├── supabase.js          # Biblioteca oficial @supabase/supabase-js v2.119.0
│       └── SUPABASE-LICENSE.txt # Licença MIT do cliente Supabase
│
├── view/
│   ├── pagina_jogos.html        # Catálogo geral e visualização da coleção por seções
│   ├── game.html                # Página do jogo: metadados, avaliação pessoal e feed
│   ├── profile.html             # Perfil do jogador, Top 4, listas e gerenciamento de conta
│   ├── diary.html               # Linha do tempo cronológica do diário
│   ├── css_game/style.css       # Estilos da página de detalhes do jogo
│   ├── css_paginaJogos/style.css# Estilos do grid e da barra de filtros do catálogo
│   └── js/                      # Scripts controladores de cada página
│       ├── game.js              # Carregamento dinâmico do jogo via parâmetro ?id=
│       ├── review.js            # Formulário de avaliação e estrelas fracionadas
│       ├── community.js         # Renderização do feed social e envio de comentários
│       ├── profile.js           # Gerenciamento de perfil, Top 4 e criador de listas
│       └── diary.js             # Filtros e paginação do diário de jogos
│
├── supabase/
│   ├── setup.sql                # Criação completa do banco para novas instalações
│   ├── atualizar-diario.sql     # Script de migração para bancos que já possuíam tabelas anteriores
│   └── migrations/              # Histórico das migrações SQL com políticas RLS
│
├── imagens/
│   ├── backlog-showcase-banner.png # Imagem de capa do README (1600x900)
│   ├── banner_builder.html      # Template HTML usado para renderizar o banner oficial
│   ├── banners/                 # Banners horizontais em alta definição (WebP)
│   ├── capas/catalogo/          # Capas padronizadas 600x800 com proporção 3:4
│   ├── destaques/               # Imagens responsivas do radar com múltiplos tamanhos
│   └── logo_transparente.png    # Logotipo oficial
│
└── docs/
    ├── supabase.md              # Passo a passo de configuração do projeto no Supabase
    ├── reviews.md               # Detalhes de implementação do sistema de avaliações
    ├── diary.md                 # Regras de negócio e comportamento do diário
    └── catalogo/                # Documentação das capas, banners e fontes originais
```

---

## Como executar localmente

### Pré-requisitos
- Um navegador moderno (Chrome, Firefox, Edge ou Safari).
- Python 3 instalado (para subir o servidor HTTP local).

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/gabriellcs7/BackLog.git

# 2. Entre na pasta do projeto
cd BackLog

# 3. Inicie o servidor local
python -m http.server 8000 --bind 127.0.0.1
```

Abra o endereço `http://localhost:8000` no seu navegador.

> O uso de um servidor HTTP local é necessário para que a autenticação e os redirecionamentos de e-mail do Supabase funcionem corretamente. Se quiser apenas testar as funções offline de catálogo, você pode abrir o arquivo `index.html` diretamente no navegador.

---

## Configuração do Supabase (Opcional)

Para ativar cadastro de contas, perfis públicos, sincronização de listas e comentários comunitários:

### 1. Criar o banco de dados
Acesse [supabase.com](https://supabase.com), crie um projeto e abra o **SQL Editor**:
- Se for um projeto novo no Supabase: execute o conteúdo de `supabase/setup.sql`.
- Se você já tinha executado migrações anteriores: execute apenas `supabase/atualizar-diario.sql`.

Todas as tabelas contam com políticas de **Row Level Security (RLS)** ativas. Visitantes anônimos só leem dados marcados como públicos, e operações de escrita exigem autenticação do próprio autor.

### 2. Configurar URLs de autenticação
No painel do Supabase, acesse **Authentication** > **URL Configuration**:
- **Site URL:** defina como `http://localhost:8000` (ou o domínio final quando publicar o site).
- **Redirect URLs:** adicione `http://localhost:8000/view/profile.html` (e a URL equivalente do seu domínio público).

### 3. Conectar o frontend
No Supabase, vá em **Project Settings** > **API**, copie a **Project URL** e a **Publishable Key** (chave `anon` pública) e informe no arquivo `js/config.js`:

```javascript
window.BacklogConfig = Object.freeze({
    supabaseUrl: 'https://SEU-PROJETO.supabase.co',
    supabasePublishableKey: 'sb_publishable_SUA_CHAVE_PUBLICA'
});
```

### Tabela de variáveis

| Configuração | Arquivo | Obrigatório | Descrição |
|---|---|:---:|---|
| `supabaseUrl` | `js/config.js` | Não | URL do seu projeto no Supabase (`https://<id>.supabase.co`). |
| `supabasePublishableKey` | `js/config.js` | Não | Chave pública do tipo `anon` ou `sb_publishable_...`. Nunca utilize chaves secretas ou de `service_role`. |

---

## Atalhos de teclado

| Tecla | Contexto | Ação |
|:---:|---|---|
| <kbd>/</kbd> | Em qualquer tela | Foca diretamente no campo de pesquisa da barra de navegação. |
| <kbd>Esc</kbd> | Diálogos e mobile | Fecha modais abertos (diário, listas, login, compartilhamento) ou recolhe o menu no celular. |
| <kbd>Enter</kbd> | Campo de busca | Submete a consulta e abre a página de jogos com os resultados filtrados. |
| <kbd>←</kbd> / <kbd>→</kbd> | Avaliação do jogo | Altera a nota pessoal em passos de 0.5 estrelas. |
| <kbd>Tab</kbd> | Navegação geral | Percorre os elementos focáveis respeitando o link de salto inicial (*Skip to content*). |

---

## Como cadastrar novos jogos

Para incluir jogos no catálogo local, adicione um novo objeto ao array `window.BacklogGames` no arquivo `js/games.js`:

```javascript
{
    "id": "slug-do-jogo",                   // Obrigatório: identificador único em minúsculas com hífen
    "title": "Nome do Jogo",               // Obrigatório: título oficial completo
    "cover": "catalogo/slug-do-jogo.webp", // Obrigatório: caminho relativo dentro de imagens/capas/
    "genre": "Action",                     // Obrigatório: Action, Adventure, Horror, MOBA, RPG, Sandbox ou Shooter
    "tags": ["Action", "Adventure"],       // Obrigatório: categorias exibidas nos cartões
    "studio": "Estúdio Desenvolvedor",     // Obrigatório: estúdio ou publicadora
    "caption": "Subtítulo de destaque",    // Obrigatório: frase de efeito usada nas visualizações
    "description": "Texto descritivo...",  // Obrigatório: sinopse exibida na página de detalhes
    "banner": "banners/slug-banner.webp",  // Obrigatório: arte horizontal dentro de imagens/
    "bannerPosition": "center center",     // Obrigatório: alinhamento CSS do banner no desktop
    "bannerPositionMobile": "50% center",  // Obrigatório: alinhamento CSS do banner no mobile
    
    // Campos opcionais
    "franchise": "Nome da Franquia",       // Agrupa títulos relacionados e alimenta recomendações
    "year": 2024,                          // Ano de lançamento original
    "platforms": ["PC", "PS5", "Xbox"],    // Lista de plataformas suportadas
    "aliases": ["Sigla", "Outro Nome"],    // Termos extras aceitos pela pesquisa
    "releaseState": "upcoming"             // Use 'upcoming' para lançamentos ou 'retired' para jogos históricos
}
```

Para que contas online possam interagir com títulos novos no feed e nas listas, o mesmo `id` precisa ser inserido na tabela `games` do banco de dados Supabase.

---

## Design System

As variáveis globais de estilo estão centralizadas no arquivo `css/site.css`:

```css
:root {
    color-scheme: dark;
    --bg: #131414;        /* Fundo escuro principal */
    --surface: #1a1b1b;   /* Fundo de cards, painéis e modais */
    --line: #2c2d2c;      /* Linhas divisórias e contornos */
    --text: #f5f5ef;      /* Texto de alto contraste */
    --muted: #a1a39b;     /* Texto secundário e legendas */
    --yellow: #ffd21f;    /* Cor de destaque âmbar/dourada */
    --radius: 12px;       /* Raio padrão de arredondamento */
}
```

---

## Autor

Projeto desenvolvido por **Gabriel** ([@gabriellcs7](https://github.com/gabriellcs7)).

Repositório: [https://github.com/gabriellcs7/BackLog](https://github.com/gabriellcs7/BackLog)

*As imagens de capas, capturas de tela e marcas registradas citadas pertencem aos seus respectivos proprietários legais (Rockstar Games, Sony Interactive Entertainment, Capcom, Epic Games, Naughty Dog, Mojang Studios, Riot Games, Blizzard Entertainment, entre outros).*

## Listas com ranking opcional

No editor de listas, a opção **Rank this list** permite criar top 10 ou outras listas numeradas, reordenando jogos por setas ou posição direta. Listas normais continuam disponíveis, e os quatro favoritos do perfil permanecem sem ranking. Para atualizar o banco atual, veja [docs/ranked-lists.md](docs/ranked-lists.md).
