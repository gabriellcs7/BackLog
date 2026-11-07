# Diário de jogos

Cada salvamento de uma avaliação ou review gera um novo registro, com uma data de calendário escolhida pelo usuário (hoje por padrão; datas futuras não são aceitas). Registros anteriores permanecem como histórico. Editar a data no diário altera somente o registro selecionado; se for o registro atual, a data da review atual também é corrigida. Remover um registro do diário preserva a review e o status. Excluir a review do jogo apaga seus registros relacionados, como informado na confirmação.

As avaliações antigas geram um registro inicial. No navegador, usa-se a data local do timestamp existente. No banco, a importação considera o horário de Fortaleza. Não é possível reconstruir versões anteriores que nunca foram armazenadas; as datas importadas podem ser editadas. Notas zero e meias estrelas são preservadas.

Ao salvar, o jogo recebe Played somente se ainda não tiver status. Qualquer status já escolhido, inclusive Playing e Want to play, permanece inalterado. A pessoa pode mudar esse status depois.

## Atualizar o projeto Supabase existente

No SQL Editor do projeto BackLog, execute **somente `supabase/atualizar-diario.sql`**, uma vez. Ele adiciona o diário e importa as reviews existentes sem removê-las. Não execute novamente setup.sql no banco existente. setup.sql reúne todas as migrações somente para projetos novos.

O diário é pessoal: no modo conectado, somente o autor pode consultar, mudar datas ou excluir seus registros. A review pública mais recente continua na comunidade e mantém seus likes/comentários ao ser atualizada. O salvamento da review e a criação do registro no banco ocorrem na mesma transação. Os status continuam no armazenamento local de cada conta, como antes.

## Interface e organização

A página `view/diary.html` aparece como Diary na navegação. Agrupa registros por mês e dia, com busca por jogo, filtro de mês, filtro de avaliações sem texto ou reviews escritas e carregamento progressivo de 40 registros. Os quatro favoritos são apresentados sem ranking. A coleção My backlog tem áreas independentes para Played (inclui Completed, Platinum e Dropped), Playing e Want to play; busca, gênero e status continuam disponíveis.

## Verificação

Foram exercitados o modo local e a biblioteca oficial Supabase contra PostgreSQL com as políticas RLS reais, incluindo importação de avaliações antigas, salvamento atômico, datas anteriores e inválidas, notas 0 e meias estrelas, histórico de múltiplos salvamentos, preservação de likes, mudança de data, exclusão de um registro sem apagar a review, privacidade entre duas contas e exclusão da review com seu histórico. A interface foi conferida em 320, 390, 768, 1024 e 1440 pixels. Os dados pessoais do projeto real não foram usados nesses testes.

## Ativação do projeto atual

Em 7 de novembro de 2026, o usuário aplicou atualizar-diario.sql. Foi verificado que os campos reviewed_on/diary_entry_id estão disponíveis no banco real e que consultas anônimas ao diário são bloqueadas (42501). Não é necessário repetir essa atualização no projeto atual. Nenhuma avaliação real foi criada ou alterada durante essa verificação.
