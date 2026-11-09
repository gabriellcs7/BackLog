# Conectar contas e recursos sociais

1. Entre em https://supabase.com/dashboard e crie um projeto chamado BackLog. Guarde a senha do banco.
2. Abra SQL Editor → New query. Copie o conteúdo de `supabase/setup.sql` e clique em Run. Execute uma vez, em um projeto novo. Se preferir usar migrações, execute os arquivos de `supabase/migrations/` na ordem numérica, em vez do setup.sql.
3. Em Authentication, habilite Email. Configure Site URL com a URL HTTPS do site e inclua `https://SEU-DOMINIO/view/profile.html` na lista de Redirect URLs. Para testar, use um servidor HTTP local; contas online não devem ser testadas por file://.
4. No projeto, abra Connect para copiar Project URL e Publishable key (começa com `sb_publishable_`). Em `js/config.js`, informe `supabaseUrl` (Project URL) e `supabasePublishableKey` (chave publicável ou anon). Nunca use uma chave secret/service_role no site.
5. Publique os arquivos estáticos. Crie duas contas de teste, confirme os e-mails e verifique likes, comentários e perfis entre elas.

Sem configuração, perfil, top 4, listas e reviews pessoais funcionam no navegador. Likes e comentários entre pessoas ficam indisponíveis até a conexão; não são simulados com pessoas fictícias. As listas locais não são publicadas automaticamente. O botão de importar dados do dispositivo copia apenas perfil, favoritos e listas, todas privadas. Reviews antigas só são publicadas mediante ação explícita do usuário.

Contas conectadas salvam perfil, favoritos, listas, reviews, likes e comentários no Supabase. As listas começam privadas e só ficam visíveis no perfil público se seu autor escolher torná-las públicas. Reviews publicadas, likes, comentários, nomes, bio e top 4 são públicos. E-mails não aparecem nos perfis públicos. Status da coleção antiga continuam salvos no navegador e são separados por conta; não são sincronizados neste incremento.

A migração usa RLS em todas as tabelas: visitantes só leem conteúdo público; alterações são limitadas ao autor; likes têm chave única por pessoa/review; não é permitido curtir a própria review. Favoritos e edições de listas são transações para impedir atualizações parciais. Exclusão de reviews remove likes e comentários associados. Não há chaves secretas no repositório.

Biblioteca oficial: `@supabase/supabase-js` 2.119.0, distribuída localmente em `js/vendor/supabase.js`, com licença MIT ao lado. Referências: https://supabase.com/docs/reference/javascript/initializing e https://supabase.com/docs/guides/database/postgres/row-level-security.

## Verificação realizada

As migrações foram executadas em PostgreSQL (PGlite), com os papéis anon/authenticated e auth.uid. Foram testados: RLS entre duas contas, listas privadas, favoritos duplicados e rollback, likes duplicados e próprios, bloqueio de impersonação em comentários e exclusão em cascata. A interface foi exercitada com a biblioteca oficial Supabase contra um servidor de teste apoiado nesse PostgreSQL: autenticação, perfil, listas públicas/privadas, publicação explícita de draft local, notas de meia estrela, likes/unlikes persistentes, comentários tratados como texto e recuperação após falha. Foram conferidas as larguras de 320, 390, 768 e 1440 pixels. O projeto Supabase foi conectado e verificado em 7 de novembro de 2026: as tabelas estão acessíveis, os 40 jogos estão no banco, o feed responde e operações anônimas de favoritos são bloqueadas. A biblioteca oficial inicializa e as telas de login/cadastro e o feed real carregam. Nenhuma conta ou review foi criada durante essa verificação.

O catálogo do banco contém os 40 IDs atuais. Novos jogos precisam ser inseridos também na tabela games para que contas online possam referenciá-los.

## Confirmação de e-mail

Este projeto exige confirmar o e-mail antes de entrar. Em Authentication → URL Configuration, use o endereço real do BackLog como Site URL e adicione a URL completa de `view/profile.html` em Redirect URLs. O cadastro solicita retorno à página de perfil do mesmo endereço em que o site foi aberto. Para desenvolvimento, autorize também o endereço HTTP local usado. Depois de confirmar o e-mail, volte ao perfil e entre com a conta. Nunca desative a confirmação de e-mail para contornar um endereço de retorno incorreto.

## Uso local neste computador

Abra `http://localhost:8000` para criar contas e retornar da confirmação de e-mail. Para iniciar novamente, abra um terminal na pasta BackLog e execute `python servidor.py`. Mantenha o terminal aberto enquanto usa o site. No Supabase, use Site URL `http://localhost:8000` e Redirect URL `http://localhost:8000/view/profile.html`. Ao publicar, acrescente também o endereço publicado. Os dados locais do antigo endereço file:// permanecem nesse endereço; navegadores separam o armazenamento de file:// e localhost.
