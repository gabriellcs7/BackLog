# Conectar contas e recursos sociais

1. Crie um projeto no Supabase. No SQL Editor, execute `supabase/migrations/202611070001_social.sql` uma única vez.
2. Em Authentication, habilite Email. Configure Site URL com a URL HTTPS do site e inclua `https://SEU-DOMINIO/view/profile.html` na lista de Redirect URLs. Para testar, use um servidor HTTP local; contas online não devem ser testadas por file://.
3. Em `js/config.js`, informe `supabaseUrl` (Project URL) e `supabasePublishableKey` (chave publicável ou anon). Nunca use uma chave secret/service_role no site.
4. Publique os arquivos estáticos. Crie duas contas de teste, confirme os e-mails e verifique likes, comentários e perfis entre elas.

Sem configuração, perfil, top 4, listas e reviews pessoais funcionam no navegador. Likes e comentários entre pessoas ficam indisponíveis até a conexão; não são simulados com pessoas fictícias. As listas locais não são publicadas automaticamente. O botão de importar dados do dispositivo copia apenas perfil, favoritos e listas, todas privadas. Reviews antigas só são publicadas mediante ação explícita do usuário.

Contas conectadas salvam perfil, favoritos, listas, reviews, likes e comentários no Supabase. As listas começam privadas e só ficam visíveis no perfil público se seu autor escolher torná-las públicas. Reviews publicadas, likes, comentários, nomes, bio e top 4 são públicos. E-mails não aparecem nos perfis públicos. Status da coleção antiga continuam salvos no navegador e são separados por conta; não são sincronizados neste incremento.

A migração usa RLS em todas as tabelas: visitantes só leem conteúdo público; alterações são limitadas ao autor; likes têm chave única por pessoa/review; não é permitido curtir a própria review. Favoritos e edições de listas são transações para impedir atualizações parciais. Exclusão de reviews remove likes e comentários associados. Não há chaves secretas no repositório.

Biblioteca oficial: `@supabase/supabase-js` 2.119.0, distribuída localmente em `js/vendor/supabase.js`, com licença MIT ao lado. Referências: https://supabase.com/docs/reference/javascript/initializing e https://supabase.com/docs/guides/database/postgres/row-level-security.
