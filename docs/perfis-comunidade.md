# Fotos, seguidores e feeds

## Ativação no projeto existente

Execute somente `supabase/atualizar-perfis-comunidade.sql` no SQL Editor do Supabase. O arquivo reúne as duas migrações de 10/11/2026: IDs de Hollow Knight e Silksong, fotos, seguidores e feeds. Pode ser executado novamente sem duplicar dados. Não execute o setup antigo: `setup.sql` é exclusivo para novos projetos.

Depois, mantenha `python servidor.py` aberto na pasta BackLog e recarregue o site. Nada precisa ser publicado na internet.

## Como usar

- Profile → Edit profile → Profile photo: JPG, PNG ou WebP de até 5 MB, recortado no centro para 384×384 e convertido em WebP. Save profile confirma a alteração. Remove photo remove a foto ao salvar. Sem login, a imagem fica neste navegador.
- Abra o perfil pelo nome do autor de uma review e clique em Follow. Following ✓ desfaz a ação. As contagens abrem as listas de seguidores e contas seguidas, paginadas de 20 em 20. Não é possível seguir a própria conta.
- A home mostra reviews escritas ordenadas por número total de likes, com desempate por publicação mais recente. O feed seguinte mostra apenas reviews das contas seguidas, pela data de publicação. As duas seções carregam seis por vez. Uma avaliação sem texto continua no perfil e no diário, mas não entra nesses feeds.
- Read review abre a review específica na página do jogo, inclusive quando ela está fora da primeira página. Os estados vazios não exibem reviews fictícias.
- As estrelas formam uma faixa contínua: metade esquerda seleciona meia estrela, direita uma estrela inteira. O mouse mostra uma prévia; sair da faixa restaura a escolha. Setas do teclado também funcionam. A opção 0 e Clear rating continuam disponíveis.

## Dados e acesso

O bucket público `avatars` serve fotos de perfis públicos. Só o dono pode gravar ou remover arquivos dentro da pasta de seu UUID. O banco restringe avatar_path à pasta do próprio perfil; nomes de arquivo únicos evitam fotos antigas no cache. Ao trocar a foto, o arquivo anterior é removido. Somente WebP de até 512 KB é aceito no bucket.

Seguidores, perfis e reviews são públicos, como os demais recursos sociais do projeto. Cada pessoa só pode alterar os próprios relacionamentos; a contagem e a ordenação são feitas no banco. A view review_cards usa security_invoker e preserva as políticas existentes. E-mails não são expostos nos feeds. Listas privadas e diário permanecem privados.

## Referências

- Jogos e dados oficiais: https://www.teamcherry.com.au/games
- Sistema de notas em meias estrelas do Letterboxd: https://letterboxd.com/faq/ e https://api-docs.letterboxd.com/
- A faixa de estrelas é uma adaptação ao visual do BackLog, com zero preservado como opção própria do projeto.

## Verificação

Migrações testadas em PostgreSQL local (PGlite), inclusive repetição, propriedade de fotos, regras do Storage, bloqueio de auto-seguir e escrita anônima, idempotência, contagens, paginação, ordem por likes e filtro por contas seguidas. Navegador com SDK oficial contra banco de teste: login de duas contas, envio/remoção e persistência da foto, seguir/deixar de seguir, listas de seguidores, feeds e links para reviews. Regressões de listas ranqueadas, favoritos, diário, likes e comentários. Testes locais de teclado/hover/meias estrelas e foto offline, com larguras 320, 390, 768 e 1440 px.
