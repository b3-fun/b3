---
lang: es
originalPath: README.md
---
# Kit de inicio de Mintlify

Utiliza el kit de inicio para desplegar tus documentos y personalizarlos.

Haz clic en el botón verde **Usar esta plantilla** en la parte superior de este repositorio para copiar el kit de inicio de Mintlify. El kit de inicio contiene ejemplos con

- Páginas de guías
- Navegación
- Personalizaciones
- Páginas de referencia de API
- Uso de componentes populares

**[Sigue la guía rápida completa](https://starter.mintlify.com/quickstart)**

## Desarrollo

Instala el [Mintlify CLI](https://www.npmjs.com/package/mint) para previsualizar los cambios de tu documentación localmente. Para instalarlo, usa el siguiente comando:

```
npm i -g mint
```

Ejecuta el siguiente comando en la raíz de tu documentación, donde se encuentra tu `docs.json`:

```
mint dev
```

Visualiza tu previsualización local en `http://localhost:3000`.

## Publicando cambios

Instala nuestra aplicación de GitHub desde tu [dashboard](https://dashboard.mintlify.com/settings/organization/github-app) para propagar los cambios de tu repositorio a tu despliegue. Los cambios se despliegan automáticamente en producción después de empujarlos a la rama por defecto.

## ¿Necesitas ayuda?

### Solución de problemas

- Si tu entorno de desarrollo no se está ejecutando: Ejecuta `mint update` para asegurarte de tener la versión más reciente del CLI.
- Si una página se carga como un 404: Asegúrate de estar ejecutándolo en una carpeta con un `docs.json` válido.

### Recursos

- [Documentación de Mintlify](https://mintlify.com/docs)
- [Comunidad de Mintlify](https://mintlify.com/community)
