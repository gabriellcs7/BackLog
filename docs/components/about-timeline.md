# Linha do tempo do About BackLog

Adaptação do componente Timeline fornecido pelo autor, creditado a [Hyperiux Vault](https://vault.hyperiux.com). Prévia aprovada em 24/11/2026.

## Local e conteúdo

A seção aparece em `view/about.html`, entre os recursos do projeto e a apresentação do autor. Usa as capas já existentes e sete capítulos sobre coleção, diário, personalização, comunidade, descoberta, detalhes da interface e continuidade do projeto. Os capítulos não representam datas de lançamentos históricos; 2026 indica o ano inicial do projeto.

- Estilos exclusivos: `css/about-timeline.css`.
- Controle da animação: `js/about-timeline.js`.
- Tradução: `js/data/i18n-catalog.js`.

A adaptação usa os recursos nativos do navegador, sem React, GSAP ou novas dependências. Não altera contas, coleções ou o banco de dados.

## Movimento e acesso

No modo completo, a seção permanece fixa enquanto a rolagem vertical percorre a linha do tempo horizontal. A linha ganha cor e os capítulos aparecem conforme entram na área visível. A última etapa permanece inteiramente acessível antes da seção seguinte.

As setas esquerda e direita avançam quando a linha do tempo tem foco. Home e End levam ao início e ao fim. O modo reduzido, inclusive o escolhido nas configurações do site, usa rolagem horizontal direta e exibe os capítulos sem animação. A mesma alternativa funciona sem JavaScript. O modo completo escolhido explicitamente continua respeitado mesmo quando o dispositivo prefere movimento reduzido.

## Verificação

Validado em Chrome e Brave: sete capítulos, carregamento das capas, deslocamento horizontal, acesso ao último capítulo, teclado, tradução para português, preferências de animação, largura móvel de 390 px, ausência de transbordamento horizontal da página e alternativa sem JavaScript. Nenhum erro de página ou arquivo local ausente foi encontrado nos testes isolados.

Para conferir manualmente: abra About BackLog pelo rodapé, role até a linha do tempo e continue até o último capítulo; depois repita com o idioma português e as animações reduzidas nas configurações.
