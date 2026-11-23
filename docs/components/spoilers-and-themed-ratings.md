# Spoilers e estrelas temáticas

## Referências consultadas em 23/11/2026

- [Letterboxd: Welcome](https://letterboxd.com/welcome/) e o [formulário de registro](https://letterboxd.com/add/) identificam reviews com spoilers e permitem revelá-las. A adaptação do BackLog usa uma caixa Contains spoilers e um aviso com Show review/Hide spoilers. Não revela automaticamente o conteúdo por a pessoa ter marcado o jogo como jogado.
- [Minecraft: Taking Inventory — Nether Star](https://www.minecraft.net/en-us/article/taking-inventory--nether-star) é a referência do item. A textura de inventário foi obtida [deste arquivo do espelho minecraft-assets](https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/items/nether_star.png) e mantida sem alteração, com escala pixelada. A textura é arte do Minecraft, da Mojang/Microsoft; não é um desenho original do BackLog.
- [GTA VI: mídia oficial](https://www.rockstargames.com/VI/media) é a referência visual do jogo. O ícone vermelho usado aqui é um SVG original inspirado no indicador de procurado, adaptado para avaliações. A escala continua sendo de 0,5 a 5, independentemente do HUD do jogo.
- [Cuphead: site oficial](https://cupheadgame.com/) descreve a inspiração nos desenhos dos anos 1930. A revisão final segue a foto de TV sem sinal enviada pelo usuário: sem rostos, com textura de chuvisco preto e branco dentro da silhueta das estrelas. Os SVGs de estrelas e ruído foram escritos para o site.

## Persistência e exibição de spoilers

O aviso utiliza um marcador de metadados na representação textual já existente da review: #!backlog-spoiler-v1 seguido de uma quebra de linha e do texto, que pode conter o formato rico da versão anterior. Não exige mudar a estrutura do Supabase. A opção é preservada ao editar, salvar na conta e no diário. Reviews antigas continuam normais. A review e seus metadados respeitam o limite total de 3.000 caracteres.

Em cards compactos, o aviso substitui o trecho da review. Na página completa e no diário, o corpo só é montado após clicar em Show review. Hide spoilers remove o texto novamente. Cards de links também ficam ocultos enquanto o conteúdo está protegido. A prévia do próprio autor no editor pode exibir o texto com o aviso. Isso é uma preferência de apresentação de conteúdo público, não uma política de acesso a dados privados.

## Temas e acessibilidade

O jogo exato minecraft recebe a Nether Star; minecraft-dungeons e minecraft-dungeons-ii mantêm o padrão. grand-theft-auto-vi recebe a estrela vermelha. cuphead e cuphead-the-delicious-last-course recebem o mesmo estilo de TV sem sinal. Outros jogos continuam com as estrelas padrão.

O editor mantém os dez controles nativos de meia estrela. Os temas também acompanham as notas exibidas nas reviews, perfis, diário, jogos registrados, atividade e feeds. As barras dos gráficos continuam representando as mesmas quantidades.

No Cuphead, quatro padrões de ruído alternam dentro da estrela, com aparência estática quando o modo de animações está reduzido. O modo automático respeita o dispositivo; a escolha explícita de animações completas segue a preferência do site. Os leitores de tela continuam recebendo a nota numérica, e a navegação por teclado e a seleção de meias estrelas permanecem.

## Verificações

Testados no navegador: marcar, salvar, recarregar, editar e remover o aviso; revelação e ocultação; prevenção de trechos e links em spoilers; idioma português; preservação de um único registro no diário; temas por ID; exclusões de Dungeons; limites de meia estrela; teclado; exibição em jogos registrados; modo reduzido e layout móvel. Confirmada a alternância real das texturas de ruído por captura de quadros distintos. Em PostgreSQL local, a representação de spoiler e texto rico foi preservada pelo caminho existente de salvamento em conta/diário, sem migração.

## Correção de visibilidade do chuvisco

O ruído inicial era recortado junto ao preenchimento da nota, ficando invisível quando não havia estrelas preenchidas. Agora existe uma camada escura também nas estrelas vazias, sem alterar a indicação de meia estrela ou a nota. Os quatro novos padrões tv-static-01 a 04 usam geometria SVG explícita, sem filtros de turbulência, tornando o efeito independente desse recurso do navegador.

O CSS e o módulo de temas têm versão explícita nas páginas para renovar arquivos em cache. Verificados Chrome e Brave, com e sem nota, quadros visualmente diferentes, modo completo explícito mesmo com o dispositivo em modo reduzido, modo reduzido do site, reviews salvas e tela móvel.
