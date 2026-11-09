# Listas com ranking opcional

O campo is_ranked diferencia listas numeradas de listas sem ordem de preferência. Listas antigas recebem false, mantendo seus jogos e a sequência de exibição. A ordem dos jogos continua em list_games.position. Os quatro favoritos do perfil permanecem sem ranking.

Para atualizar o projeto Supabase existente, execute somente `supabase/atualizar-ranking-listas.sql` no SQL Editor. Não repita setup.sql. A atualização pode ser executada novamente sem apagar dados. setup.sql é destinado somente a bancos novos.

A função save_game_list_v2 salva tipo, visibilidade e sequência na mesma transação, mantém RLS do proprietário e rejeita jogos repetidos. A função anterior continua disponível para compatibilidade. Antes de aplicar a atualização, listas normais continuam salvando pelo caminho anterior; uma lista com ranking não é silenciosamente convertida em lista normal.

## Como usar

Em Profile, crie ou edite uma lista e marque Rank this list. Selecione os jogos e use as setas ou o campo de posição para reordenar. O primeiro jogo recebe o número 1. Desmarcar a opção remove a indicação de ranking sem retirar jogos; ativá-la novamente aproveita a sequência atual. Não há limite de dez: top 5, top 10 e outras quantidades usam o mesmo editor, dentro do limite de 100 jogos de uma lista.

Os jogos selecionados continuam visíveis no editor mesmo quando a busca ou os filtros mudam. Os controles são acessíveis por teclado e toque, e listas públicas mostram as posições também aos visitantes. Só o autor pode alterar a ordem.

## Verificação

Testes locais e PostgreSQL com RLS cobriram migração repetível, listas antigas, top 10, salvamento e recarga, setas e posição direta, ativar/desativar, cancelamento, posições inválidas, privacidade e bloqueio de alterações entre contas. A biblioteca oficial Supabase foi exercitada contra um servidor de teste apoiado em PostgreSQL, incluindo salvamento e leitura do ranking por outra conta e compatibilidade com o caminho anterior de listas normais. Conferidas as larguras 320, 390, 768, 1024 e 1440 pixels.
