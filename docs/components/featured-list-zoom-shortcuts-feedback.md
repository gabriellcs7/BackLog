# Lista em destaque, zoom, atalhos e feedback

Adaptações aprovadas em 25/11/2026 para HTML/CSS/JavaScript. O contador de lançamentos da prévia não foi integrado.

## Onde usar

- **Listas do próprio perfil:** Feature on profile fixa uma única lista no espaço Game lists. Clique novamente para desafixar. A lista mantém jogos, ordem, etiquetas e privacidade. Sem uma lista fixada disponível, o perfil mostra a primeira lista disponível. Uma lista privada não aparece para visitantes; nesse caso, eles veem a primeira lista pública. Excluir a fixada limpa a seleção. Perfis locais salvam a escolha no navegador; contas usam Supabase.
- **Galeria do jogo:** Zoom in aproxima a screenshot sem alterar seu arquivo original. Clique na imagem ou no botão para reduzir. No zoom, arraste com mouse ou role com toque; a área também recebe foco para rolagem por teclado. Previous/Next reiniciam o zoom; as setas trocam imagens apenas sem zoom. Escape fecha e devolve o foco à capa que abriu a galeria.
- **Configurações:** Browse keyboard shortcuts abre um diálogo com busca por função, seção ou tecla. Mostra os atalhos existentes; no macOS, Ctrl+K aparece como Command+K. As setas da galeria são contextuais. Escape fecha mesmo quando há texto no campo de pesquisa.
- **Ajuda / rodapé:** Send feedback permite escolher categoria e escrever de 10 a 500 caracteres. Com conta, envia para a caixa privada do projeto. Sem conta, oferece baixar um arquivo de texto: não simula envio. Falhas mantêm a mensagem e permitem nova tentativa. Ao trocar de conta, limpa o rascunho e fecha a janela para não misturar identidades.

## Atualizar um projeto Supabase existente

Execute uma vez **supabase/atualizar-componentes-comunidade.sql** no SQL Editor. Não é necessário repetir setup.sql. O arquivo contém tanto a lista em destaque quanto o feedback. setup.sql também recebeu as definições para instalações novas.

A função set_featured_game_list só aceita lista pertencente à pessoa autenticada. Não concede atualização direta da coluna pelo navegador. A chave estrangeira limpa a escolha quando a lista é excluída.

A tabela site_feedback usa RLS, sem leitura/escrita direta para anon ou authenticated. A função submit_site_feedback aceita apenas usuários autenticados, valida categoria/tamanho e limita cada usuário a cinco mensagens por hora, com bloqueio transacional para evitar envios concorrentes acima do limite. O responsável pelo projeto pode consultar as mensagens no Table Editor/SQL Editor do Supabase; não há exposição dessa caixa no site. Excluir a conta elimina os feedbacks vinculados.

## Referências visuais

- Pin List: https://21st.dev/@skyleen77/components/pin-list
- Zoomable Image: https://21st.dev/@fuma-nama/components/zoomable-image
- Keyboard Shortcuts: https://21st.dev/@aadixc0de/components/keyboard-shortcuts
- Feedback Dialog: https://dev.21st.dev/@syeddhasnainn/components/feedback-dialog

São adaptações próprias para a estrutura existente, sem instalar React ou dependências novas. Os diálogos usam a gestão nativa de foco, brilho conforme preferências, abertura/fechamento animados, movimento reduzido e textos em inglês/português.

## Verificação

Galeria: aproximação, área rolável, reinício ao trocar imagem, setas, Escape, português e celular. Lista: persistência local após recarregar, exibição no perfil, desafixar, excluir e largura mobile. Diálogos: filtros/resultados vazios, idioma, foco após fechar, download e conteúdo do arquivo, além de falha/nova tentativa do envio com API simulada. Diálogos verificados em Chrome e Brave. APIs simuladas verificam propriedade da lista, erro de migração, tamanho/categoria, dados enviados e mudança de sessão. Auditoria estática das páginas e scripts também passou.

O SQL foi revisado, mas não executado remotamente nesta alteração. A integração real da conta depende da execução do arquivo acima no projeto do usuário.
