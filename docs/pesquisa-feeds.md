# Pesquisa, feeds e perfis compactos

Execute `supabase/atualizar-pesquisa-feeds.sql` no SQL Editor para ativar as novas consultas. Este arquivo não apaga dados e pode ser executado novamente. Não repita setup.sql.

- Every game tells a story: apenas as quatro reviews escritas com mais likes (mínimo de um like). Empates seguem a publicação mais recente. Sem likes, aparece um estado vazio. Não há botão para carregar mais nesta seção.
- From your people: somente a última review escrita de cada conta seguida, por data de publicação, com desempate pelo ID. A seleção de uma por autor acontece no banco antes da paginação, portanto o botão de carregar mais traz outras pessoas.
- A barra de pesquisa aceita nomes de jogos e de jogadores. Pressione Enter de qualquer página para abrir os resultados; no catálogo a busca atualiza enquanto você digita. Os jogadores aparecem em uma seção própria, com foto e link para o perfil. A busca por nome requer dois caracteres e traz 12 por página. Não pesquisa nem expõe e-mails. Caracteres como % e _ são pesquisados literalmente.
- O top 4 continua sem ordem de preferência, mas tem largura máxima de 960 px e cards menores. No celular mantém duas colunas com largura máxima de 320 px.
- Fotos redondas no perfil, editor, reviews, comentários e pesquisa.

Verificação: PostgreSQL com 24 reviews de oito contas seguidas para testar uma por autor antes da paginação, ordem e limite das populares, pesquisa paginada e literal, acesso anônimo sem exposição de e-mails; navegador com duas contas, busca pela barra da home e do catálogo, links, estados vazios, preservação da busca de jogos e quatro larguras de tela.
