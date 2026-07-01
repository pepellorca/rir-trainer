# Inicio rápido

## A. Subir a GitHub

1. Crea un repositorio privado llamado `rir-trainer`.
2. Descomprime este paquete.
3. Sube todo el contenido de la carpeta al repositorio.
4. No subas ningún token.

## B. Probar en un ordenador

```bash
npm install
npm run dev
```

Abre la dirección que muestre Vite. La aplicación empieza en modo demostración.

## C. Preparar Apps Script

1. Copia `apps-script/Code.gs` sobre tu Code.gs actual, después de guardar una copia.
2. Ejecuta `setupNativeApi()`.
3. Guarda la URL y el token que devuelve.
4. Crea una segunda implementación web, ejecutada como propietario y accesible mediante enlace.

## D. Crear la app iPhone

En un Mac:

```bash
npm install
npm run cap:add:ios
npm run cap:sync
npm run ios:icons
npm run cap:open:ios
```

En Xcode selecciona tu equipo, tu iPhone y pulsa Run.

## E. Conectar el maestro

En RIR Trainer → Ajustes:

1. Desactiva Modo demostración.
2. Pega la URL `/exec` de la API nativa.
3. Pega el token.
4. Guarda y pulsa Probar conexión.
5. Activa las notificaciones.
