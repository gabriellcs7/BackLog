# Listas, radar e animação da ajuda

Atualização de 24/11/2026. Adaptações em HTML, CSS e JavaScript, sem novas dependências ou migração SQL.

## Renomear listas

Referência: [Inline Edit](https://21st.dev/@ebnsina/components/inline-edit).

Na página de uma lista própria, clique no título ou no lápis para editar o nome. Salvar nome usa `BacklogAccount.saveList` com os dados atuais da lista. Jogos, posições, descrição, etiquetas, ranking e privacidade são preservados. Cancelar ou pressionar Escape fecha a edição sem gravar.

O controle não aparece em listas alheias. Falhas mantêm o nome digitado para uma nova tentativa. Trocas de conta impedem que uma resposta antiga seja apresentada como sucesso na conta nova.

Arquivos: `js/inline-list-name.js`, `css/inline-list-name.css` e `view/js/list-page.js`.

## Radar dos gêneros

Referência: [Radar Chart](https://21st.dev/@intentui/components/radar-chart).

O radar aparece em Statistics, junto das barras de gêneros existentes. Usa a mesma contagem de jogos registrados do ano selecionado, sem novas consultas. Mostra os seis gêneros mais registrados; quando há menos de seis, os eixos restantes indicam gêneros com contagem zero. A lista de barras continua mostrando todos os gêneros registrados.

Os pontos informam suas contagens por mouse, toque ou foco do teclado. Um ano sem registros oculta o radar e mantém a mensagem de ausência de dados. Idioma, filtro de ano e movimento reduzido seguem as preferências do site.

Arquivos: `js/genre-radar.js`, `css/genre-radar.css` e `view/js/gaming-statistics-page.js`.

## Ajuda

Referência de movimento: [FAQ Liquid Accordion](https://21st.dev/@vovalopuh13/components/faq-liquid-accordion).

A abertura e o fechamento das respostas animam a altura, a opacidade e o desfoque. O sinal de mais, o texto e as bordas originais permanecem iguais. Não há um novo traço lateral. Busca, teclado e elementos nativos `details` continuam funcionando; o modo reduzido usa a abertura imediata.

Arquivos: `js/help-answer-motion.js` e `css/help-answer-motion.css`.

## Listas em etapas

Referência: [Stepper](https://21st.dev/@sudharshanpanidev/components/stepper/vertical-stepper).

A prévia foi mostrada e depois autorizada na mesma conversa. O fluxo está integrado ao diálogo de criação e edição de listas no perfil:

1. Detalhes: nome, descrição, etiquetas, ranking e privacidade.
2. Jogos: busca, gênero, filtro por jogos jogados e seleção.
3. Conferir lista: resumo, posições e controles de ordenação, quando houver ranking.

Os campos e o manipulador de salvamento originais são reaproveitados. Só a etapa final permite gravar. Voltar mantém o rascunho; cancelar e reabrir restaura os dados salvos. Falhas não fecham o diálogo. O fluxo permite listas vazias, como a API existente, e mantém os limites originais.

Arquivos: `js/list-stepper.js`, `css/list-stepper.css`, `view/profile.html` e um ponto de reinicialização em `view/js/profile.js`. A versão isolada em `docs/previews/list-stepper` permanece como referência de design e não grava dados.

## Verificação

Em contextos isolados, foram conferidos:

- Renomear e recarregar listas locais, cancelar, rejeitar nome em branco e tentar novamente após falha de armazenamento.
- Contrato de salvamento com conta simulada: preservação dos dados, restrição de propriedade e troca de conta durante uma operação pendente.
- Radar com dados de anos diferentes, ano vazio, um único gênero, exclusão de Want to play sem avaliação, leitura por teclado e português.
- Ajuda com abertura e fechamento, teclado, cliques rápidos, busca durante a animação e movimento reduzido. O HTML do sinal de mais e a borda esquerda foram comparados antes e depois.
- Fluxo de listas com etiquetas, filtros, reordenação, falha e nova tentativa, edição, cancelamento, listas vazias, português, Escape e largura móvel.

As interações foram testadas no Chrome; o formulário em etapas e a ajuda também foram testados no Brave. Nenhuma conta real foi alterada. A auditoria estática verificou 21 páginas HTML e 106 arquivos JavaScript próprios, sem problemas encontrados.
