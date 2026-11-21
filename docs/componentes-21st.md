# Componentes autorizados do 21st.dev

Integrações visuais adaptadas à estrutura HTML/CSS/JavaScript existente do BackLog. Os componentes foram recriados para usar o catálogo, perfis, avaliações e APIs do projeto, sem migrar o site para React.

| Referência | Adaptação no BackLog |
| --- | --- |
| [Spotlight Card](https://21st.dev/@preetsuthar17/components/spotlight-card) | Luz suave em cards de reviews, listas, resultados de usuários e notícias. |
| [Animated Tabs](https://21st.dev/@educalvolpz/components/animated-tabs) | Indicador deslizante nos filtros do catálogo, Activity, conexões, busca e seções dos jogos. |
| [Command Menu](https://21st.dev/@pmalay694/components/command-menu) | Busca global por jogos e usuários, com categorias e atalhos. |
| [Timeline](https://21st.dev/@kuratlielia/components/timeline) | Activity agrupada por dia, com eventos expansíveis e paginação preservada. |
| [Animated Tooltip](https://21st.dev/@lucasbassetti/components/animated-tooltip) | Contexto de jogos e usuários ao passar o mouse ou focar as capas. |
| [Hero Video Dialog](https://21st.dev/@dillionverma/components/hero-video-dialog) | Trailer em janela, mantendo o link direto para o YouTube. |

## Arquivos

- `css/interface-effects.css`: aparência dos seis componentes.
- `js/card-effects.js`: spotlight, incluindo cards criados dinamicamente.
- `js/animated-tabs.js`: posição do indicador a partir dos controles existentes.
- `js/quick-search.js`: diálogo global; jogos são pesquisados localmente, perfis usam `BacklogCommunity.searchPlayers`.
- `js/rich-tooltips.js`: dicas seguras, sem HTML recebido de usuários. Notas e status pessoais são identificados como “Your rating” e “Your status”.
- `view/js/activity.js`: grupos de dia e detalhes dos eventos existentes.
- `view/js/trailer-dialog.js`: cria o iframe somente após abrir o trailer e o remove ao fechar.

## Interação

- Busca: clique no campo da navegação, pressione `/` fora dos campos ou use Ctrl+K / Cmd+K. Setas percorrem resultados, Enter abre e Esc fecha.
- Activity: filtros e Load more continuam consultando a mesma API. Datas usam o fuso do navegador; eventos do mesmo dia são agrupados inclusive entre páginas.
- Trailer: o clique normal abre o diálogo; o link direto e o botão Open on YouTube permitem assistir no YouTube. A requisição do player só começa ao abrir a janela.
- Dicas: hover/foco e Esc para fechar. Em capas, o status e a nota indicam a conta conectada, sem confundir com a conta de um perfil visitado.
- Efeitos respeitam `prefers-reduced-motion`. Navegadores sem popover mantêm os seletores nativos; sem JavaScript, os links e a busca tradicional permanecem no HTML.

Não há migração SQL adicional nem mudança de políticas de acesso.

## Background Paths em todas as páginas

- Referência aprovada: https://21st.dev/@kokonutd/components/background-paths
- Adaptação própria em `css/background-paths.css` e `js/background-paths.js`: duas famílias de curvas finas em cinza, com poucos detalhes amarelos e fluxo lento.
- Substitui a aurora anterior nas 13 páginas. Popular in the catalog usa apenas este mesmo fundo global.
- Fundo SVG fixo e decorativo, sem capturar cliques ou mudar as capas e banners.
- Respeita Presentation animations e movimento reduzido; pausa quando a aba está oculta. Sem dependências ou requisições externas.

## Conta, carregamento, estados vazios e estatísticas

- Profile Dropdown: https://21st.dev/@kokonutd/components/profile-dropdown — `js/profile-menu.js`. Clique na foto da navegação para os atalhos da própria conta; o link Profile continua abrindo o perfil. Setas navegam, Escape fecha. Sair da conta é uma ação explícita do botão Sign out.
- Skeleton: https://21st.dev/@shadcn/components/skeleton — `BacklogUI.loadingCards`, usado nos feeds e nas reviews/listas do perfil. Os placeholders saem ao concluir ou falhar a consulta; erros permanecem visíveis.
- Empty: https://21st.dev/@shadcn/components/empty — `js/empty-states.js`. Decora mensagens de coleções e feeds vazios preservando seus textos e links; não transforma avisos de carregamento ou erro em estados vazios.
- Number Ticker: https://21st.dev/@dillionverma/components/number-ticker — `js/number-ticker.js`. Anima somente as estatísticas visíveis do perfil por 700 ms; mantém o valor final acessível e respeita movimento reduzido. Números maiores que as legendas, com tipografia herdada corretamente.
- Estilos em `css/community-polish.css`. São adaptações locais para o HTML/CSS/JavaScript existente, sem adicionar React ou dependências.
- Bento Grid foi solicitado apenas como prévia e não foi aplicado à Home.
- Verificação em navegador isolado com dados simulados: menu e teclado, skeletons de reviews/listas, estados vazios, números finais e tamanho, movimento reduzido e layout mobile. Sem alterações em contas reais e sem SQL adicional.

## Foto, curtidas, paginação, ranking e compartilhamento

- Image Crop: https://21st.dev/@originui/components/image-crop — `js/photo-crop.js`. Enquadramento com arrasto por mouse/toque, zoom, centralização e setas do teclado. Exporta WebP 384 × 384; cancelar preserva a foto anterior e Use photo apenas prepara o rascunho. Só Save profile aplica a mudança. Fechar a edição cancela o rascunho e tarefas pendentes.
- Like Burst: https://21st.dev/@ddoemonn/components/like-burst — `js/like-burst.js`. Efeito amarelo após a API confirmar a curtida; falhas mantêm o estado anterior e exibem a mensagem existente. Respeita movimento reduzido.
- Floating Pill Pagination: https://21st.dev/@shadcnspace/components/pagination-01 — `js/pill-pagination.js` com `js/catalog.js`. Mantém 42 jogos por página, links reais para abrir em outra aba, indicador deslizante e navegação pelo histórico do navegador.
- Sortable List: https://21st.dev/@ebnsina/components/sortable — `js/sortable-list.js`. Puxador em listas ranqueadas com mouse, toque e teclado (setas, Home/End), marcação do destino, rolagem no diálogo e Escape para cancelar o arrasto. Reordena o rascunho; Save list usa a persistência existente. Setas e posição numérica continuam disponíveis.
- Share Button: https://21st.dev/@reuno-ui/components/share-button — `js/share-controls.js`. Painel expansível em jogos, reviews públicas e páginas de listas. Copiar link tem seleção manual como alternativa; compartilhamento nativo só abre após clique. Links de redes sociais aparecem apenas para endereços externos, e localhost continua com copiar/compartilhamento do dispositivo. O painel acompanha o botão durante a rolagem.
- São adaptações locais para o site existente, com estilos em `css/interaction-upgrades.css`, sem novas dependências ou SQL.
- Verificação em navegador isolado: cancelar/ajustar foto sem gravar conta, falha/sucesso de curtidas com API simulada, páginas 42/42/16 e voltar/avançar, ranking por teclado/mouse/toque e salvamento em armazenamento local isolado, compartilhamento com cópia/serviço nativo simulados e layouts mobile. As 13 páginas também foram abertas sem erros de JavaScript.

## Listas como pastas de vidro

- Referência aprovada: https://21st.dev/@kedhareswer/components/glass-folder-cards
- Adaptação em `view/js/list-card.js` e `css/glass-folder-lists.css`, nas listas do perfil e na página de todas as listas.
- A frente abre para revelar até seis capas; os jogos são links para suas páginas. Escape fecha a pasta e devolve o foco ao botão. O teclado só alcança as capas quando a pasta está aberta.
- A seta é um link normal para `view/list.html?profile=...&id=...`, sem pop-up, preservando o proprietário e o identificador da lista. A página completa mantém todos os jogos, mesmo quando há mais de seis.
- `js/card-effects.js` usa a área da pasta para posicionar a luz dourada sobre o vidro sem bloquear os links. Inclinação e transições respeitam movimento reduzido.
- O perfil mostra somente uma lista; Game lists continua abrindo a página com todas. Rankings, privacidade, descrição e ações de editar/excluir usam os dados e fluxos existentes. Sem SQL adicional.
- Verificação em navegador isolado: lista com oito jogos e seis capas, ranking, lista vazia, navegação real da seta sem diálogo, brilho e cliques, limite de uma lista no perfil, edição, teclado, movimento reduzido e layout mobile. Não houve alterações em contas reais.

## Filtros múltiplos e progresso pessoal nas listas

- Multi Select: https://21st.dev/@kuratlielia/components/multi-select — `js/multi-select.js` e `css/catalog-multi-select.css`. Genres e Statuses aceitam várias opções, com busca interna, etiquetas removíveis, Clear all, Done e teclado. O select nativo continua guardando os valores e é a alternativa quando JavaScript não está disponível.
- `js/catalog.js` combina opções do mesmo filtro com OU e filtros distintos com E; preserva pesquisa/ordenação, parâmetros repetidos de URL, links antigos com valor único e navegação de páginas/histórico. Sem seleção significa todas as opções.
- Circular Progress: https://21st.dev/@diceui/components/circular-progress — `js/list-progress.js` e `css/list-progress.css`. As pastas mostram um círculo compacto com o progresso de quem visita a lista, usando os status da própria conta/dispositivo, sem consultar nem inferir os status do autor.
- Na página completa da lista, o progresso é pequeno: ícone de controle de videogame ao lado da porcentagem, acima das capas. Clique alterna entre 50% e 5 of 10, e outro clique volta à porcentagem. O visual circular do perfil foi mantido.
- Contam Played, Playing, Completed, Platinum e Dropped; Want to play fica fora. Uma avaliação sem status também conta como jogada. O cálculo considera todos os jogos válidos da lista, incluindo os que não aparecem nas seis capas da pasta. Listas vazias usam 0% / 0 of 0.
- Aguarda a sincronização da conta; erros mostram progresso indisponível em vez de uma contagem falsa. Não grava avaliações, status ou dados da lista. Sem SQL adicional.
- Testado em navegador isolado com filtros combinados, remoção/reset/busca, URL e histórico/paginação, alternância e atualização por status/avaliação, progresso do visitante em lista alheia, listas vazias e layout mobile. Nenhuma conta real foi alterada.
- Notificações (opção 1) e galeria (opção 3) foram inicialmente apresentadas como prévias e depois integradas com autorização. Detalhes em `notificacoes-galeria.md`.
