# Notícias automáticas da página inicial

A seleção fixa no HTML foi substituída por notícias carregadas em tempo de execução. A seção mantém quatro cards, com manchete, fonte, data, link original e imagem da matéria. Fica na mesma posição da página inicial.

## Como ativar

Na pasta do BackLog, use:

```powershell
python servidor.py
```

Se o servidor já estava aberto, encerre-o com Ctrl+C e execute o comando novamente. Abra http://localhost:8000/ e atualize a página. O servidor simples `python -m http.server` e a abertura por `file://` não oferecem a rota necessária às notícias; nesses casos o site explica que é preciso usar o servidor do BackLog. Não é necessário executar SQL, criar conta em API ou instalar bibliotecas.

## Fontes

- PlayStation.Blog: https://blog.playstation.com/feed/
- Xbox Wire: https://news.xbox.com/en-us/feed/
- Steam News: https://store.steampowered.com/feeds/news.xml

Os feeds foram consultados e validados em 23/11/2026. Os títulos permanecem no idioma da fonte; controles, mensagens e datas seguem o idioma escolhido no BackLog. Cada card abre a publicação oficial em outra aba. O site não reproduz o texto integral nem os resumos das matérias; a descrição convida à leitura na fonte.

## Atualização e falhas

- Ao abrir a página, o navegador consulta `/api/gaming-news` no mesmo servidor do site. Isso evita o bloqueio de leitura de RSS de outra origem pelo navegador.
- Com a página visível, a consulta se repete a cada dez minutos. Ao retornar à aba ou recuperar a conexão, uma nova consulta pode ocorrer antes.
- O botão Refresh news permite buscar novidades manualmente. O servidor limita consultas manuais às fontes a uma por minuto e compartilha um cache de dez minutos entre abas.
- A lista usa as notícias mais recentes recebidas, sem URLs ou títulos duplicados, preservando variedade de fontes. Não há rotação artificial de notícias antigas quando os publicadores não têm novidades.
- A indicação Updated mostra quando a seleção foi obtida; a data de publicação aparece separadamente em cada matéria. Se as fontes falharem, não é inventada uma data nova para a seleção anterior.
- A última seleção válida fica no navegador por até sete dias. Em falhas, continua visível com aviso explícito de notícias salvas. Falhas parciais de fontes também são informadas.
- Se não houver notícias válidas nem cache, aparece uma mensagem com nova tentativa, sem manchetes fictícias. Sem JavaScript, há links diretos para os canais oficiais.

## Implementação

`news_feed.py` lê apenas os endereços oficiais fixos e usa a biblioteca padrão do Python. O módulo limita o tamanho das respostas, define tempo limite, rejeita entidades XML e valida links. Não funciona como proxy para endereços enviados pelo visitante. Quando falta imagem no RSS, procura apenas metadados públicos `og:image` ou `twitter:image` da matéria oficial. Sem imagem válida, usa `imagens/noticias/news-placeholder.svg`.

`servidor.py` oferece a rota JSON, com cache HTTP desativado, e mantém as proteções existentes dos arquivos locais. `js/gaming-news.js` usa elementos e textContent, sem executar HTML dos feeds. O cache das notícias não altera os dados da conta, não grava arquivos novos no projeto e não exige commits a cada publicação dos veículos. As imagens editoriais locais antigas foram mantidas no repositório.

O site continua privado/local: nenhuma hospedagem ou publicação foi feita.

## Verificação

```powershell
python -m unittest discover -s tests -v
```

Sete testes locais cobrem RSS, Steam/RDF, metadados de imagem, URLs inválidas, XML, datas futuras, cache, atualização, deduplicação e GET/HEAD da rota. Testes de navegador em Chrome e Brave verificaram os quatro cards, brilho, atualização manual e pelo temporizador, imagens alternativas, cache após recarga, falhas, idioma, celular e rejeição de links inseguros. Houve também consulta real das três fontes e abertura do fluxo completo pelo servidor Python, sem alterar contas reais.
