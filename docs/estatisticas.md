# Estatísticas pessoais

Acesso: Profile → Your gaming journal → View statistics. O botão preserva o ID do perfil visitado e abre view/statistics.html. Sem ID, a página mostra a conta conectada ou o perfil local. O visual foi adaptado da prévia aprovada, incluindo os gráficos, os quatro totais e os destaques pessoais.

## Como os números são calculados

- **Ano:** anos encontrados nas datas salvas, mais o ano atual e o anterior. A seleção muda os totais, os gêneros, as notas, os destaques e o gráfico mensal sem nova consulta ao servidor.
- **Concluídos:** jogos com status atual Completed ou Platinum, agrupados pelo ano/mês em que esse status foi salvo. A comparação usa a mesma regra no ano anterior.
- **Registrados no ano:** jogos únicos que têm uma review datada naquele ano ou um status atual diferente de Want to play registrado naquele ano.
- **Notas:** uma avaliação atual por jogo, de 0,5 a 5, com a data salva da review no ano selecionado. Sem avaliações, a média aparece como um traço; não é inventada uma nota zero.
- **Gêneros:** gênero principal dos jogos únicos registrados no ano. Os gêneros não são multiplicados pelas etiquetas do catálogo.
- **Coleção:** todos os jogos com review ou status diferente de Want to play, sem duplicação. Uma review sem status jogado aparece na categoria Reviewed. A lista de desejos é contada separadamente.
- **Destaques:** até quatro jogos com maior nota no ano, com desempate alfabético. As capas abrem as páginas dos jogos e as estrelas preservam os temas especiais.

O site não guarda todas as mudanças históricas de status. Por isso, um jogo que antes estava Completed e depois mudou para Playing deixa de participar das conclusões derivadas do status atual. Essa regra aparece no painel e não tenta reconstruir um histórico ausente. As datas de status online são interpretadas no fuso America/Fortaleza; a data de avaliação escolhida pela pessoa é preservada.

## Interações

As colunas mensais mostram os jogos concluídos naquele mês. As barras de notas abrem Games logged filtrado pela mesma nota e pelo mesmo ano da avaliação. O total da coleção e a contagem de Want to play abrem as respectivas páginas do perfil. O parâmetro year nos jogos registrados usa a data salva da review, não o ano de lançamento do jogo.

## Dados e acesso

O perfil local usa os status e as reviews do dispositivo. Perfis online usam somente os campos públicos necessários de game_statuses e reviews, com paginação e as regras de acesso existentes. O conteúdo escrito das reviews e as entradas privadas do diário não são buscados para calcular estatísticas. Ao trocar de conta, resultados pendentes são descartados. O acesso explícito ao perfil local enquanto há uma conta conectada pede para sair, evitando misturar dados.

Não foi adicionada migração e não é necessário executar SQL.

## Verificação

Testes de cálculos com contagens únicas, Wishlist, avaliações sem nota, meias estrelas, comparação anual e soma dos meses. Fluxos locais e públicos simulados em Chrome e Brave: navegação pelo perfil, ano anterior, abertura dos jogos por nota e ano, meses, idioma PT-BR e decimais, 390px, dados vazios, falhas, nova tentativa e perfil inexistente. Regressão de jogos em comum e nove páginas existentes sem erros; 17 páginas e 95 scripts próprios sem referências locais ausentes ou erros de sintaxe. Nenhuma conta real foi alterada nos testes.
