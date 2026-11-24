# Jogos em comum

Adicionado em 23/11/2026. Ao visitar outro perfil, a seção Games in common compara os jogos registrados pela conta conectada com os do perfil visitado. A própria página de perfil não mostra a comparação consigo mesma; visitantes sem login recebem um link para entrar.

A seção apresenta até seis capas em ordem alfabética, com as notas de cada pessoa em linhas separadas. O link See all shared games abre view/common-games.html?id=ID_DO_PERFIL, com todos os jogos em comum e pesquisa por título. As capas abrem as páginas dos respectivos jogos.

## Dados e estados

- Usa BacklogCommunity.loggedGames e gameRatings, com os endpoints públicos já existentes e as regras de acesso do Supabase. Nenhuma tabela, chave ou permissão nova foi adicionada.
- Jogos registrados incluem reviews ou status diferente de Want to play. Um jogo apenas na lista de desejos não participa; se também tiver uma review, é um jogo registrado.
- A nota é a avaliação atual de cada pessoa, incluindo meias estrelas e temas próprios dos jogos. Ausência de nota aparece como Not rated; falha ao carregar as notas aparece como Unavailable, sem inventar nota zero.
- Contagens são calculadas pela interseção de IDs conhecidos do catálogo, sem duplicatas. O total mostra também os itens além das seis capas da prévia.
- Respostas antigas são descartadas ao trocar de conta ou recarregar a comparação. Estados vazios e erros têm mensagens específicas e nova tentativa.
- Interface em inglês e português, teclado, movimento reduzido e layout para celular.

## Verificação

Testes locais isolados em Chrome e Brave com duas contas simuladas: interseção de sete jogos, prévia de seis, abertura da página completa, pesquisa, notas independentes de 4,5 e 3 estrelas, ausência de login, próprio perfil, idioma, 390px, falha parcial de notas, erro geral e nova tentativa. Verificações de sintaxe e referências locais nas 16 páginas e 93 scripts próprios; regressão dos fluxos existentes de editor e passeio.

Não é preciso executar SQL para ativar este recurso, desde que as atualizações anteriores do perfil estejam instaladas.

## Estatísticas pessoais

Foi produzida somente uma prévia independente com dados ilustrativos: seleção de ano, conclusões por mês, gêneros, distribuição de notas, coleção e destaques pessoais. O painel não foi integrado ao site e não lê dados da conta. A implementação depende de aprovação posterior.
