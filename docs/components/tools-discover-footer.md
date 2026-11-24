# Ferramentas, Discover e rodapé

Atualização de 24/11/2026. Implementação em HTML, CSS e JavaScript, sem dependências novas ou migração SQL.

## Componentes aprovados

- [Fold Toolbar](https://21st.dev/@pmalay694/components/fold-toolbar): agrupa as ferramentas originais do editor de reviews. Preserva seleção, formatação, links seguros e limite de caracteres. Escape fecha o grupo; as setas navegam pelas ferramentas.
- [Password Strength](https://21st.dev/@ddoemonn/components/password-strength): orientação visual apenas no cadastro. Mantém a validação original de oito caracteres e não armazena a senha.
- [Hold to Confirm](https://21st.dev/@pmalay694/components/hold-to-confirm): confirmação final de exclusão de lista ou entrada do diário por pressão contínua de 1,2 segundo. Soltar antes, sair do botão ou mudar de conta cancela; falhas permitem tentar novamente.
- [Swipe Deck](https://21st.dev/@ddoemonn/components/swipe-deck): página Discover, acessível pelo catálogo e rodapé. Usa jogos reais ainda sem status ou review. Arrastar à direita adiciona a Want to play; à esquerda apenas pula. Undo desfaz a última escolha sem substituir alterações posteriores feitas em outra área. Possui botões equivalentes, teclado e suporte a toque.

O Breadcrumb Fold foi rejeitado após a prévia aplicada e removido. A navegação anterior permanece.

## Rodapé e páginas do projeto

O rodapé de todas as páginas reúne catálogo, Discover, lista de desejos, notícias, perfil, backlog, diário, estatísticas, configurações e passeio guiado. As novas páginas são:

- `view/about.html`: apresentação do projeto e autor.
- `view/help.html`: perguntas frequentes com busca.
- `view/credits.html`: fontes do catálogo, notícias, referências de interface e licença do Supabase.

Perfis confirmados pelo autor: [Instagram @codergabriel](https://www.instagram.com/codergabriel/) e [GitHub gabriellcs7](https://github.com/gabriellcs7). Links externos abrem em nova aba com proteção de referência. A configuração do remoto Git não foi alterada.

## Verificação

Verificados em Chrome e Brave: ferramentas do editor, roundtrip da review, indicador de senha, confirmação de exclusão, Discover com salvar/desfazer/falha, links e páginas do rodapé, traduções e ausência de erros de página. Também foram verificados toque horizontal e vertical, cancelamento de exclusão, falha de armazenamento, passeio guiado e layout móvel. Os testes usam contextos isolados, sem modificar contas reais.

A auditoria estática conferiu 21 páginas HTML e 101 arquivos JavaScript próprios. As animações respeitam as preferências de movimento existentes.
