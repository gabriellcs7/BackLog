# Configurações e idiomas

`view/settings.html` reúne preferências funcionais, com acesso pelo menu da foto da conta e pelo rodapé das 14 páginas. Mantém as cores, brilho, indicador deslizante, animações de interação e layouts para computador e celular existentes no site.

## Opções

- **Idioma da interface:** inglês (padrão) ou português do Brasil. A escolha atualiza menus, botões, campos, estados vazios, filtros, datas e textos de interface, incluindo conteúdo criado dinamicamente. Os nomes dos jogos, perfis, listas e textos publicados pelos usuários são preservados. Textos editoriais de jogos e descrições de personagens não passam por tradução automática.
- **Animações:** seguir o dispositivo, ativar todas ou usar movimento reduzido. A configuração usa o `BacklogMotion` existente e também funciona quando o dispositivo solicita movimento reduzido.
- **Aparência:** ativar/desativar o fundo de linhas e o brilho que acompanha o cursor nos cards. O fundo oculto também deixa de animar.
- **Notificações:** escolher se o sino mostra curtidas, comentários nas próprias reviews e novos seguidores. O contador considera somente as categorias ativadas; o feed de Activity continua disponível. Preferências de leitura continuam separadas por conta.
- **Privacidade:** escolher se novas listas serão públicas. O padrão continua privado. Listas existentes mantêm sua visibilidade ao serem editadas; listas do dispositivo continuam privadas.
- **Conta:** identidade da conta, acesso ao login, sair, editar perfil/foto, escolher banner, favoritos e acessar as listas. Os atalhos abrem os editores existentes no próprio perfil e não permitem editar o perfil de outro usuário.
- **Dados:** baixar JSON com perfil, listas, favoritos, registros do diário, avaliações, status dos jogos e preferências. Para uma conta online, aguarda a sincronização e a leitura do diário; falhas e trocas de conta cancelam a exportação. A exportação contém somente os campos selecionados pelo código, sem cookies, senhas, tokens de autenticação, configurações de API nem dados de outros projetos.
- **Restaurar padrão:** redefine apenas idioma, aparência, notificações e modo de animação. Não apaga jogos, reviews, listas, diário ou sessões.

## Persistência e tradução

`js/preferences.js` valida os valores e salva as preferências em `backlog:preferences:v1`. O modo de animação mantém a chave existente `backlog:presentation-motion`. As escolhas valem para este navegador e se atualizam nas outras abas abertas. Quando o armazenamento não está disponível, a página informa que as escolhas são temporárias. Não há nova migração SQL.

`js/i18n-catalog.js` guarda as traduções; `js/i18n.js` aplica traduções reversíveis à interface e observa novos elementos, mantendo uma referência ao texto original. Campos digitados não são alterados; opções nativas preservam seus valores originais, mantendo os identificadores usados pelo banco e pelos filtros. A tradução não é salva nos dados dos jogadores.

Novos textos de interface podem ser incluídos no catálogo inglês/português. Conteúdo escrito pelos jogadores deve usar as classes protegidas existentes ou `data-no-translate`.

## Verificações

Testado em navegador isolado, sem alterar contas reais: 14 páginas em português, alternância de volta ao inglês, persistência e sincronização entre abas, valores dos campos, texto de review/lista/perfil preservado, preferências de movimento/fundo/brilho, filtros do sino e contador, abertura depois da rolagem, atalhos do perfil, visibilidade inicial de listas em conta simulada, exportação local e de conta simulada sem tokens, restauração sem perda de coleção e armazenamento indisponível. Layouts de computador e celular foram inspecionados; sem erros de JavaScript nem recursos locais ausentes nesses testes.
