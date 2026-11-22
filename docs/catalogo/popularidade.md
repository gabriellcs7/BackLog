# Popular in the catalog

A seção exibe até seis jogos por número de contas diferentes que deram uma nota válida (0,5 a 5) ou escreveram uma review. Repetir uma review com a mesma conta não aumenta a contagem. Empates usam a média das notas e depois o título. Jogos sem avaliações não recebem posições artificiais.

A consulta usa apenas reviews públicas, percorrendo páginas de mil linhas para respeitar o limite da API. Não requer uma nova migração SQL. Uma falha mostra um aviso e botão para tentar novamente, sem recuperar o ranking fixo antigo. Os feeds de reviews curtidas e de pessoas seguidas continuam independentes.

A prévia de Saga mostra até seis outros jogos da mesma franquia. Mais títulos ficam em view/saga.html, que lista a franquia inteira disponível neste catálogo em ordem de lançamento.
