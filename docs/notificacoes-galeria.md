# Notificações e galeria dos jogos

## Notificações

O sino aparece nas 13 páginas do site. Mostra curtidas, comentários nas próprias reviews e novos seguidores, usando o feed recebido da conta já existente no Supabase. As interações de pessoas seguidas continuam na página Activity.

- All/Unread têm o mesmo indicador deslizante dos outros filtros do site.
- O sino e as linhas recebem a luz dos outros cards. O sino se movimenta discretamente ao receber novas notificações; abertura e resultados têm transições curtas.
- Há contador, atualização, marcar individualmente e marcar tudo como lido. Links abrem a review ou o perfil correspondente.
- O estado de leitura é salvo **por conta neste navegador**, sem sincronizar leitura entre dispositivos. Somente os identificadores dos eventos são armazenados, não o conteúdo. Se o armazenamento estiver indisponível, a interface informa que a leitura é temporária.
- Usa até as 100 interações recebidas mais recentes. Atualiza a cada minuto somente com a página visível e a conta conectada. Não envia mensagens nem altera reviews.
- Sair ou trocar de conta limpa imediatamente o painel e invalida respostas pendentes.
- Falhas de conexão oferecem nova tentativa. Sem login, o sino oferece acesso à conta.

## Galeria

`view/game.html` tem uma seção entre Game details e Main characters com até seis screenshots. Clique abre a imagem completa em uma janela ampliada com anterior/próxima, setas do teclado, Escape e retorno do foco à miniatura. Imagens usam `object-fit: contain`, sem recortes.

São **414 imagens para 69 jogos, com seis imagens por galeria**. Os arquivos WebP e suas miniaturas ficam em `imagens/galeria/`, dentro do repositório. As miniaturas carregam sob demanda; a imagem maior só é solicitada ao abrir. Não dependem de bibliotecas ou imagens hospedadas em terceiros durante o uso.

O manifesto de exibição é `js/game-galleries.js`. As fontes, URLs originais e nomes das edições estão em `docs/catalogo/galerias.json`. As galerias usam páginas oficiais de distribuição e dos desenvolvedores; os complementos de Rockstar, Valve e Konami incluem arquivos de imprensa preservados em iRedDead, Hooked Gamers e Silent Hill Memories. Cada imagem ampliada mostra sua fonte; a imagem adicional de Poppy Playtime é da versão para iPad, identificada no crédito. Algumas páginas distribuem edições Remastered/Enhanced, identificadas no manifesto.

Os 31 jogos sem uma fonte incluída nesta revisão não exibem uma galeria vazia. Não foram usadas imagens de remakes para substituir os originais de Resident Evil/Silent Hill nem screenshots de Counter-Strike 2 para Global Offensive.

Layouts: três miniaturas por linha no computador, duas no celular. As animações respeitam movimento reduzido do dispositivo e a preferência do site.

## Verificação

Teste em navegador isolado, sem alterar contas reais: arquivos locais de todas as galerias, abertura/navegação/fechamento por teclado e foco, ausência de seção vazia, layout mobile, filtros e indicador das notificações, persistência de leitura, falha/nova tentativa, troca de conta, acesso de visitante e navegação real para review/perfil. Nenhum SQL adicional é necessário.
