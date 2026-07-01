# Seguridad

La aplicación nativa utiliza un token de dispositivo porque una app empaquetada no puede utilizar `google.script.run`.

- El token se genera con `setupNativeApi()`.
- El servidor guarda solo un hash SHA-256.
- Nunca añadas el token a `.env`, GitHub, capturas o archivos compartidos.
- Si se pierde el iPhone o se expone el token, ejecuta `rotateNativeApiToken()` y actualiza Ajustes.
- Para una publicación pública o multiusuario, el siguiente paso es Google Sign-In/Firebase Auth y una base de datos con reglas por usuario.
