# Passeio, atalhos por deslize e painel de ações

Implementados em 23/11/2026 como adaptações nativas para o site HTML/CSS/JavaScript, sem React ou dependências externas.

## Passeio opcional (Product Tour)

Acesso em Settings → How to use BackLog → Take a tour, ou pelo link no rodapé. Nove etapas apresentam pesquisa, filtros, backlog, status, reviews, favoritos, listas, diário e aparência. Não salva jogos, avaliações ou alterações no perfil. Progresso temporário em sessionStorage, apenas nesta aba, expira em 20 minutos e é removido ao concluir ou encerrar. Esc encerra; setas e botões navegam. A área destacada permanece nítida; o entorno apenas escurece. PT-BR/EN e movimento reduzido respeitados.

Referência: https://21st.dev/@laziekiki/components/product-tour

## Backlog no celular (Swipe Row)

Até 600px, apenas os jogos salvos ficam em linhas com capa. Deslizar revela Playing ou Completed; tocar no botão confirma a alteração pela API de coleção já existente. O gesto sozinho não salva nada. O botão ⇄ permite o mesmo acesso sem arrastar. A rolagem vertical e o toque prolongado das capas continuam disponíveis. Erros preservam o status anterior. O catálogo normal mantém sua grade e paginação de 42 jogos.

Referência: https://dev.21st.dev/@molecule-lab-rushil/components/swipe-row-1

## Ações das capas (Bottom Sheet)

Até 600px, as mesmas ações do menu das capas abrem em um dialog nativo na base da tela. Cabeçalho com capa e nome, toque fora, botão de fechar, Esc e arraste da alça para baixo. Foco permanece dentro do painel e retorna ao botão de origem ao fechar pelo teclado. Selecionar uma lista abre o diálogo já existente. No computador, permanece o menu flutuante. As duas apresentações usam as mesmas funções de conta, listas e status.

Referência: https://21st.dev/@f0rextasy/components/bottom-sheet

## Validação

Testes locais e isolados com conta e armazenamento de teste: navegação pelas nove etapas, versões desktop/mobile, português, ausência de desfoque, teclado e fechamento, revelação por arraste sem salvar, confirmação e falha de salvamento, foco e fechamento do painel, compatibilidade entre toque prolongado e deslize. Conferência de nove páginas sem erros de JavaScript ou arquivos locais ausentes. Nenhuma mudança de banco de dados é necessária.

## Filtros ativos e Desfazer

Filter Badge e Toast with Undo foram aprovados e implementados. O catálogo mostra pesquisa, gêneros, status e ordenação ativos acima das capas, com remoção individual e limpeza conjunta. Limpar preserva a aba My backlog. Os selects nativos continuam como fonte de verdade; valores explícitos evitam espaços extras introduzidos na tradução dos gêneros. Referência: https://21st.dev/@serafimcloud/components/filter-badge

As mudanças explícitas de status e remoções da coleção, nos detalhes do jogo, menu das capas e atalhos por deslize, oferecem Undo. O aviso fica disponível por 12 segundos, pausando enquanto há hover ou foco. A ação restaura o status anterior; não apaga reviews nem eventos históricos. A restauração usa a API existente e confere conta e status atual antes de salvar. Alterações mais recentes invalidam o aviso. As operações são enfileiradas para preservar a sequência de mudanças rápidas. Status automático ao salvar uma review não cria esse aviso. Referência: https://21st.dev/@russellbloxwich/components/toast

Validação adicional em Chrome e Brave: filtros combinados, URL, limpeza mantendo o backlog, paginação de 42 jogos, restauração após alteração/remoção, invalidação após nova alteração ou troca de conta, operações rápidas, falhas de salvamento, dimensões no celular e ausência de erros nas nove páginas verificadas. Não é necessário executar SQL.
