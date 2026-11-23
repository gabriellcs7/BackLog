# Reviews, listas e ações nas capas

Referências visuais autorizadas no 21st.dev em 23/11/2026, adaptadas ao HTML/CSS/JavaScript existente do BackLog:

- [Rich Text Editor, Toribryan](https://21st.dev/@iamtoribryan/components/rich-text-editor) — toolbar visual, limites e formatação.
- [New Items Pill, Özer](https://21st.dev/@ddoemonn/components/new-items-pill) — aviso de novidades no feed.
- [Expandable Text, Théo Balick](https://21st.dev/@balick/components/expandable-text) — expandir somente textos que ultrapassam o limite de linhas.
- [Tag Input, Özer](https://21st.dev/@ddoemonn/components/tag-input) — chips, teclado e duplicatas.
- [Context Menu, Özer](https://21st.dev/@ddoemonn/components/context-menu) — menu das capas.
- [Link Preview, aadixc0de](https://21st.dev/@aadixc0de/components/link-preview) — cards de links.

As páginas de referência indicam MIT. A implementação é nativa, escrita para este projeto, sem incluir React, Tiptap, Tailwind ou copiar os pacotes dessas bibliotecas.

## Reviews

O editor oferece negrito, itálico, títulos, listas, citações e links http/https. O armazenamento continua no campo text, limitado a 3.000 caracteres. Reviews novas com formatação usam um marcador de versão e uma representação textual; reviews antigas continuam sendo exibidas literalmente, inclusive asteriscos e sinais de HTML. O leitor constrói elementos DOM permitidos e não interpreta HTML da review. Colar texto não importa imagens, estilos ou scripts. As prévias compactas mostram texto legível, sem o marcador.

## Textos e novidades

Os textos longos podem ser expandidos com Read more/Read less. Links de navegação e botões de carregar mais mantêm seus destinos e funções, recebendo a mesma animação. O aviso de novas atividades verifica a primeira página do filtro atual a cada 45 segundos quando a página está visível e há uma conta conectada. Não altera o conteúdo ou a rolagem antes do clique; usa 20+ quando o resultado pode ultrapassar o tamanho da página. Trocar filtro ou conta limpa o aviso. Não requer Realtime ou uma migração de atividades.

## Etiquetas

Cada lista aceita até oito etiquetas diferentes de 1–24 caracteres. O backend valida os mesmos limites. Tags ficam em coluna própria, preservando descrições, privacidade e rankings. A função save_game_list_v3 usa as políticas existentes e salva lista, posições e etiquetas na mesma transação. A atualização é supabase/atualizar-etiquetas-listas.sql; a migração equivalente também está no histórico e no setup de instalações novas. Não repetir o setup numa instalação existente. Antes da migração, listas sem etiquetas continuam usando o caminho anterior; tentar salvar etiquetas informa que a atualização é necessária sem perder o rascunho.

## Menu das capas

Botão direito, Shift+F10 ou toque prolongado abrem os atalhos. Os cards normais também oferecem um botão de três pontos acessível por teclado e toque. É possível marcar como jogado, mudar status, escrever uma review, adicionar a uma lista própria, criar uma lista com o jogo, abrir o trailer e copiar o endereço. Não há leitura ou edição de listas privadas de outras pessoas. O menu fecha ao rolar, redimensionar ou trocar de conta e respeita os limites da janela.

## Prévia de links

A página de uma review e seu editor exibem até três links diferentes. Trailers conhecidos, links de jogos do BackLog e ofertas reconhecidas nas lojas usam títulos e imagens já presentes no catálogo. Outros vídeos do YouTube usam sua miniatura pública e uma identificação genérica quando não há título confirmado. Outros endereços recebem um card compacto com domínio e texto do link. Não há busca arbitrária de metadados em servidores privados, proxy, chave secreta ou serviço de scraping. Os links abrem em nova aba com noopener/noreferrer.

## Verificação

Validados: persistência e edição de reviews formatadas; preservação de texto antigo; limites e links seguros; colagem; expansão e idioma; avisos sem salto de rolagem, filtros e troca de conta; tags e rankings; políticas de privacidade e propriedade em PostgreSQL local; idempotência da migração; ações das capas; prévias persistidas; dispositivos móveis e carregamento das páginas principais. A disponibilidade da coluna tags foi confirmada na API pública do projeto após a execução da atualização pelo proprietário.
