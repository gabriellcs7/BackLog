# Abrir a versão atual do BackLog

No terminal, dentro da pasta BackLog, execute:

```powershell
python servidor.py
```

Mantenha o terminal aberto e acesse http://localhost:8000/view/profile.html. Se um servidor antigo estiver ocupando a porta, encerre-o primeiro com Ctrl+C. Depois atualize a página; na primeira troca de servidor, Ctrl+F5 força a atualização da aba já aberta.

Em Profile → Create a list ou Edit, a opção Rank this list fica logo abaixo da descrição e antes da visibilidade pública. Nenhuma nova alteração no Supabase é necessária para corrigir o carregamento da página.

O servidor usa a própria pasta do projeto mesmo se chamado de outro diretório. HTML, CSS, JavaScript e JSON não são guardados em cache; pedidos condicionais desses arquivos também recebem a versão atual. Capas e banners continuam podendo ser reutilizados pelo navegador. O servidor só escuta no próprio computador (127.0.0.1), não publica o site na internet e bloqueia listagem de diretórios e arquivos ocultos. O comando antigo de http.server ainda serve arquivos, mas não tem esses ajustes.
