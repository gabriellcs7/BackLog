# Novas referências visuais nos jogos

Adaptações autorizadas pelo usuário em 23/11/2026, usando SVGs originais e animações locais:

- SUPERHOT e MIND CONTROL DELETE: estrelas vermelhas facetadas, com cinco recortes que se reorganizam quando a nota muda.
- Os cinco Uncharted: metal dourado envelhecido com um reflexo curto sobre a parte preenchida.
- Cyberpunk 2077 e Phantom Liberty: estrelas neon com deslocamento breve dos canais de cor na seleção.
- Todos os Resident Evil do catálogo: máquina de escrever decorativa no botão Save review. As teclas só animam enquanto uma submissão está pendente. O indicador para tanto no sucesso como na falha; o salvamento, os textos e a mensagem de confirmação continuam no fluxo existente. Não há áudio.
- Os três Marvel’s Spider-Man: estrelas desenhadas com fios de teia, que se formam brevemente ao selecionar uma nota.

A escala permanece em dez opções, de 0,5 a 5, usando os mesmos rádios nativos e teclas de seta. Os símbolos também aparecem nas avaliações já exibidas pelo site; o movimento de seleção fica no editor. Os efeitos respeitam o modo de animações e não acontecem ao digitar texto ou mudar a data. Não há alteração de dados nem atualização do Supabase.

As rotinas de decoração de estrelas e de animação são compartilhadas. Os desenhos e o CSS ficam em imagens/ui/ratings e css/rating-references.css. Os arquivos de estilos e os módulos foram versionados para atualizar o cache. A primeira textura do Cuphead também usa a mesma família de SVGs sem filtros das outras três fases do chuvisco.

Verificado no navegador: cada tema, meia estrela, teclado, movimento na seleção, modo reduzido, avaliação salva, telas móveis e ausência de erros de script. O teste da máquina de escrever mantém a promessa de salvamento pendente para conferir que não há confirmação antecipada e simula uma falha para verificar a restauração correta. Os temas anteriores continuam ativos; Hollow Knight, Dark Souls e God of War não receberam referências novas nesta atualização.
