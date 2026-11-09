# Listas com ranking opcional

O campo is_ranked diferencia listas numeradas de listas sem ordem de preferência. Listas antigas recebem false, mantendo seus jogos e a sequência de exibição. A ordem dos jogos continua em list_games.position. Os quatro favoritos do perfil permanecem sem ranking.

Para atualizar o projeto Supabase existente, execute somente `supabase/atualizar-ranking-listas.sql` no SQL Editor. Não repita setup.sql. A atualização pode ser executada novamente sem apagar dados. setup.sql é destinado somente a bancos novos.

A função save_game_list_v2 salva tipo, visibilidade e sequência na mesma transação, mantém RLS do proprietário e rejeita jogos repetidos. A função anterior continua disponível para compatibilidade. Antes de aplicar a atualização, listas normais continuam salvando pelo caminho anterior; uma lista com ranking não é silenciosamente convertida em lista normal.
