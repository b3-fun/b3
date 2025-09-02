---
lang: pt-BR
originalPath: README.md
---
# Kit Inicial Mintlify

Use o kit inicial para ter sua documentação implantada e pronta para personalização.

Clique no botão verde **Use this template** no topo deste repositório para copiar o kit inicial Mintlify. O kit inicial contém exemplos com

- Páginas de guia
- Navegação
- Personalizações
- Páginas de referência da API
- Uso de componentes populares

**[Siga o guia rápido completo](https://starter.mintlify.com/quickstart)**

## Desenvolvimento

Instale o [Mintlify CLI](https://www.npmjs.com/package/mint) para visualizar localmente as alterações na sua documentação. Para instalar, use o seguinte comando:

```
npm i -g mint
```

Execute o seguinte comando na raiz da sua documentação, onde seu `docs.json` está localizado:

```
mint dev
```

Visualize sua prévia local em `http://localhost:3000`.

## Publicando alterações

Instale nosso aplicativo GitHub a partir do seu [painel](https://dashboard.mintlify.com/settings/organization/github-app) para propagar alterações do seu repositório para sua implantação. As alterações são implantadas automaticamente após o envio para a branch padrão.

## Precisa de ajuda?

### Solução de problemas

- Se seu ambiente de desenvolvimento não estiver funcionando: Execute `mint update` para garantir que você tenha a versão mais recente do CLI.
- Se uma página carregar como um 404: Certifique-se de que você está executando em uma pasta com um `docs.json` válido.

### Recursos

- [Documentação Mintlify](https://mintlify.com/docs)
- [Comunidade Mintlify](https://mintlify.com/community)
