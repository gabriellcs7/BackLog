# Diário de jogos

Cada salvamento de uma avaliação ou review gera um novo registro, com uma data de calendário escolhida pelo usuário (hoje por padrão; datas futuras não são aceitas). Registros anteriores permanecem como histórico. Editar a data no diário altera somente o registro selecionado; se for o registro atual, a data da review atual também é corrigida. Remover um registro do diário preserva a review e o status. Excluir a review do jogo apaga seus registros relacionados, como informado na confirmação.

As avaliações antigas geram um registro inicial. No navegador, usa-se a data local do timestamp existente. No banco, a importação considera o horário de Fortaleza. Não é possível reconstruir versões anteriores que nunca foram armazenadas; as datas importadas podem ser editadas. Notas zero e meias estrelas são preservadas.

Ao salvar, o jogo recebe Played somente se ainda não tiver status. Qualquer status já escolhido, inclusive Playing e Want to play, permanece inalterado. A pessoa pode mudar esse status depois.

## Atualizar o projeto Supabase existente

No SQL Editor do projeto BackLog, execute **somente `supabase/atualizar-diario.sql`**, uma vez. Ele adiciona o diário e importa as reviews existentes sem removê-las. Não execute novamente setup.sql no banco existente. setup.sql reúne todas as migrações somente para projetos novos.

O diário é pessoal: no modo conectado, somente o autor pode consultar, mudar datas ou excluir seus registros. A review pública mais recente continua na comunidade e mantém seus likes/comentários ao ser atualizada. O salvamento da review e a criação do registro no banco ocorrem na mesma transação. Os status continuam no armazenamento local de cada conta, como antes.
