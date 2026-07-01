# RIR Trainer — GitHub + Capacitor

Migración modular de RIR Trainer a una aplicación iPhone real. Mantiene Google Sheets como maestro a través de Apps Script, pero el frontend vive en GitHub y se empaqueta con Capacitor.

## Qué incluye esta versión

- Vista semanal con D1, D2 y D3 para mesociclos de duración dinámica.
- Una única sesión de fuerza por día y cardio adicional.
- Calentamientos del entrenador por D1/D2/D3.
- Aproximaciones calculadas desde la carga prevista de S1.
- Escalera de cargas por serie:
  - S1 conserva la carga más alta.
  - la carga alta se extiende a S2 y S3;
  - al consolidarla en todas las series, sube solo S1;
  - si no alcanzas el mínimo, baja la siguiente serie, no la referencia de S1;
  - un RIR bajo no obliga a bajar si las repeticiones están dentro del rango.
- Autoguardado idempotente por entrenamiento + ejercicio + número de serie.
- Cola offline y reintentos automáticos.
- Estado visible de sincronización.
- Temporizador integrado con notificación local y vibración, sin abrir Atajos.
- Recuperación del entrenamiento y temporizador al reabrir la app.
- Resumen final parcial o completo.
- Histórico básico y mejores cargas.
- Tests automáticos de la progresión y compilación en GitHub Actions.
- Demo web en GitHub Pages.

## Requisitos

- Node.js 24.
- Para iPhone: macOS, Xcode 26 o posterior y un iPhone con iOS 15 o posterior.
- Un proyecto de Google Apps Script conectado a tu maestro.

Capacitor 8 requiere un proyecto web compilado y genera el proyecto iOS mediante `npx cap add ios`.

## Probar la interfaz sin conectar el maestro

```bash
npm install
npm run dev
```

La app arranca en **modo demostración**. Permite comprobar la interfaz y la escalera de cargas sin modificar Google Sheets.

## Conectar el maestro

### 1. Actualizar Apps Script

1. Haz una copia de seguridad de tu proyecto actual.
2. Sustituye `Code.gs` por `apps-script/Code.gs`.
3. Mantén `Index.html` de la aplicación web antigua si quieres conservarla en paralelo.
4. Ejecuta `setupRIRTrainer()` si todavía no tienes todas las hojas y columnas.
5. Ejecuta manualmente:

```text
setupNativeApi
```

La ejecución devuelve:

- `apiUrl`
- `token`

Copia el token en ese momento. Apps Script almacena únicamente su hash.

### 2. Crear una segunda implementación para la app nativa

La web actual puede seguir como **Solo yo / usuario que accede**. Para la app nativa crea otra implementación:

- Tipo: aplicación web.
- Ejecutar como: **yo, propietario**.
- Acceso: **cualquier usuario con el enlace**.

La URL no concede acceso por sí sola: cada petición necesita el token aleatorio. No publiques el token en GitHub.

### 3. Configurar RIR Trainer

En **Ajustes**:

1. Desactiva Modo demostración.
2. Pega la URL `/exec` de la implementación nativa.
3. Pega el token generado.
4. Pulsa **Guardar** y **Probar conexión**.

## Crear la app iPhone

```bash
npm install
npm run cap:add:ios
npm run cap:sync
npm run ios:icons
npm run cap:open:ios
```

Después, en Xcode:

1. Selecciona tu equipo de firma.
2. Elige tu iPhone como destino.
3. Comprueba que `rest-complete.wav` y `PrivacyInfo.xcprivacy` pertenecen al target **App**.
4. Comprueba en Assets que el AppIcon dorado aparece correctamente.
5. Pulsa Run.
5. La primera vez, acepta el permiso de notificaciones.

No se incluye un `.ipa` firmado porque requiere tu cuenta de Apple y Xcode.

## Flujo de actualización

Después de cambiar el código:

```bash
npm test
npm run cap:sync
```

Abre Xcode y vuelve a ejecutar la app. Para subir cambios a GitHub:

```bash
git add .
git commit -m "Mejora RIR Trainer"
git push
```

## Seguridad

- El token no está en el repositorio.
- Apps Script guarda un hash SHA-256 del token.
- Puedes revocarlo ejecutando `rotateNativeApiToken()`.
- La implementación web protegida por Google puede mantenerse separada.
- El token se guarda actualmente en Capacitor Preferences para una app personal. Para distribución a terceros conviene migrarlo al Keychain.

## Estado de la migración

Esta entrega implementa el flujo nativo principal: semana → sesión → calentamiento → ejercicio → series → descanso → finalización. Todavía no porta toda la administración avanzada de la versión monolítica, por ejemplo la edición completa de mesociclos, el análisis muscular detallado y todas las gráficas de medidas.
