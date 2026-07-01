# Migración desde la V7 de Apps Script

## Lo que se conserva

- El Google Sheets maestro.
- Las hojas de sesiones, ejercicios, series, calendario, calentamientos y medidas.
- La API de escritura existente.
- La aplicación web V7, si deseas mantenerla como respaldo.

## Lo que cambia

- La interfaz deja de depender de un `Index.html` de más de 5.000 líneas.
- El código se divide en pantallas, servicios y lógica comprobable.
- El temporizador usa notificaciones locales del iPhone.
- Los cambios se guardan primero en el dispositivo y se sincronizan después.
- GitHub mantiene el histórico de versiones y ejecuta tests.

## Orden recomendado

1. Sube este proyecto a un repositorio privado de GitHub.
2. Prueba `npm run dev` en modo demostración.
3. Actualiza Apps Script y genera el token nativo.
4. Configura la API en Ajustes.
5. Comprueba lectura y escritura en el maestro.
6. En un Mac, genera el proyecto iOS y ejecútalo en tu iPhone.
7. Mantén la V7 web durante unas semanas como respaldo.

## No elimines todavía

- La implementación web V7.
- Las hojas del maestro.
- Las copias de seguridad creadas antes de la migración.
