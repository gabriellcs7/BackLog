# Mural de reviews populares

A seção da home usa `js/review-wall.js` e `css/review-wall.css`. Os dados continuam vindo de `BacklogCommunity.home('popular')`, pela integração já existente com Supabase.

`js/home.js` remove IDs repetidos, ignora reviews sem likes e jogos desconhecidos, ordena por curtidas e limita o mural a três reviews únicas. Não há textos, usuários ou curtidas de demonstração no site.

As colunas usam cópias visuais para preencher a sequência contínua. Apenas o primeiro grupo da primeira coluna participa da navegação por teclado e da leitura assistiva. Os links e likes das cópias continuam funcionando com mouse; as curtidas recarregam o feed como antes.

- Computador: três colunas, com velocidades diferentes.
- Telas intermediárias: duas colunas.
- Celular: uma coluna com as três reviews.
- Passar o mouse: reduz a velocidade da coluna pela metade.
- Pause animation: mostra os três cards sem repetição ou movimento; Resume animation retoma o mural.
- Foco pelo teclado: pausa e mostra os cards estáticos para permitir a leitura e o uso dos links.
- Movimento reduzido: respeita a preferência do dispositivo ou a escolha em Presentation animations e mostra os cards estáticos.

O movimento pausa fora da tela ou quando a aba fica oculta. O feed de pessoas seguidas, a seleção no banco e as regras de likes não foram alterados. Não há migração SQL adicional.
