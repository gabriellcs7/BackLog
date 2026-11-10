# Atividade, coleção e números do perfil

## Ativar

Execute somente `supabase/atualizar-atividade.sql` no SQL Editor do projeto existente. Pode executar novamente sem duplicar dados. Não execute setup.sql. Depois recarregue o localhost, com `python servidor.py` aberto na pasta BackLog.

## Recursos

- A home mostra somente as três reviews escritas com mais likes, exigindo pelo menos um like. O feed de pessoas seguidas continua com uma review por autor.
- Activity, disponível na navegação, mostra quem seguiu você, likes e comentários em suas reviews, avaliações e mudanças de status de quem você segue. Também inclui os comentários dessas pessoas em reviews de terceiros. Os filtros All activity, For you e Following são aplicados no banco, antes da paginação de 20 eventos. Refresh busca novas ações.
- O perfil mostra Played in [ano], Lists (ou Public lists para visitantes) e Games logged. A seção Recent activity vem logo abaixo do top 4, com os oito últimos jogos atualizados e somente uma capa por jogo.
- A seleção de notas começa em meia estrela, até cinco. A opção zero foi retirada e novas notas zero são recusadas no editor. Notas zero antigas continuam legíveis e podem ser substituídas ao editar a avaliação.

## Contagens e privacidade

Games logged conta jogos distintos avaliados ou marcados como Played, Playing, Completed, Platinum ou Dropped. Want to play fica fora dessa contagem. Played in [ano] conta jogos distintos com entrada do diário naquele ano ou uma nova marcação de status de jogo jogado naquele ano; a data do diário escolhida pelo usuário é respeitada. Eventos de status usam o horário de Fortaleza. Um jogo com várias avaliações ou status não duplica a contagem do ano.

O visitante só conta listas públicas; o dono vê também suas listas privadas. O diário continua privado: a consulta pública retorna apenas o total anual, nunca as entradas ou seus textos. Activity exige login e mostra ações relacionadas a você ou às pessoas que você segue. As avaliações e os status de coleção são públicos nos perfis, como solicitado. Desfazer um follow/like ou apagar um comentário remove essa ação do feed; apagar uma review remove seus eventos de avaliação.

## Status e histórico antigo

Com login, os status agora são salvos no Supabase e recuperados em outro navegador. Os status da mesma conta que já estavam neste navegador são importados automaticamente caso não exista um estado no banco. Não inventamos a data em que foram jogados: essa importação não cria atividade nem entra na contagem anual. Avaliações anteriores são recuperadas no histórico público pela data de atualização existente. O histórico anterior a essa data não pode ser reconstruído.

O perfil sem login continua funcionando no navegador, com contagens e atividade recente locais. A nova página Activity pede login. Ao escolher um status, só confirmamos a mudança depois de o banco salvar. Uma falha mantém a seleção anterior. Gravar uma review continua marcando Played automaticamente somente se nenhum status existir, aguardando a coleção carregar para preservar escolhas como Platinum.

## Validação

PostgreSQL: migração repetível, permissões, importação sem datas inventadas, status idempotentes, geração dos eventos, cinco tipos de atividade, comentários em terceiros, filtros, proteção do diário/listas e contagem de títulos distintos. Navegador com SDK oficial e banco de teste: duas contas, filtros, métricas e jogos recentes, recuperação da coleção num navegador novo, mudanças rápidas e preservação de Platinum após review. Perfil offline e larguras 320, 390, 768, 900, 1024 e 1440 verificadas. Nenhuma publicação na internet foi feita.
