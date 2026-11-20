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
