import type { AppStore } from '../store/app-store';
import type { AppSettings } from '../types';

export function renderSettings(store: AppStore): string {
  const s = store.settings;
  return `
    <header class="topbar"><div class="brand">Ajustes</div><span></span></header>
    <main class="page">
      <section class="card card-body">
        <div class="section-head" style="margin-top:0"><div><h2>Conexión</h2><p>La app nativa usa una API personal de Apps Script.</p></div></div>
        <div class="toggle-row"><div><strong>Modo demostración</strong><div class="exercise-meta">Permite probar la app sin conectar el maestro.</div></div><button class="toggle ${s.demoMode ? 'on' : ''}" data-toggle="demo"></button></div>
        <div class="form-group" style="margin-top:16px"><label>URL de la API</label><input class="text-input" id="api-url" value="${s.apiUrl}" placeholder="https://script.google.com/macros/s/.../exec"></div>
        <div class="form-group"><label>Token personal</label><input class="text-input" id="api-token" type="password" value="${s.apiToken}" placeholder="Pega el token generado en Apps Script"></div>
        <div class="button-row"><button class="secondary" data-action="test-api">Probar conexión</button><button class="primary" data-action="save-settings">Guardar</button></div>
      </section>
      <section class="card card-body" style="margin-top:14px">
        <div class="section-head" style="margin-top:0"><div><h2>Entrenamiento</h2><p>Preferencias del dispositivo.</p></div></div>
        <div class="form-group"><label>Avisos finales del descanso</label><select class="select-input" id="countdown"><option value="3" ${s.restCountdownSeconds===3?'selected':''}>Últimos 3 segundos</option><option value="5" ${s.restCountdownSeconds===5?'selected':''}>Últimos 5 segundos</option></select></div>
        <div class="form-group"><label>Entorno habitual</label><select class="select-input" id="environment"><option ${s.defaultEnvironment==='Casa'?'selected':''}>Casa</option><option ${s.defaultEnvironment==='Gimnasio'?'selected':''}>Gimnasio</option><option ${s.defaultEnvironment==='Viaje'?'selected':''}>Viaje</option></select></div>
        <button class="secondary full" data-action="request-notifications">Activar notificaciones de descanso</button>
      </section>
      <section class="card card-body" style="margin-top:14px"><div class="eyebrow">Versión</div><h2 style="margin:8px 0">RIR Trainer 8.0 · GitHub/Capacitor</h2><p style="color:var(--muted);line-height:1.5">Frontend modular, modo offline, autoguardado idempotente y temporizador nativo sin Atajos.</p></section>
    </main>`;
}

export function bindSettings(
  store: AppStore,
  onTest: () => Promise<void>,
  onNotifications: () => Promise<void>,
  toast: (message: string, type?: 'error') => void,
): void {
  document.querySelector('[data-toggle="demo"]')?.addEventListener('click', () => {
    store.settings.demoMode = !store.settings.demoMode;
    store.notify();
  });
  document.querySelector('[data-action="save-settings"]')?.addEventListener('click', async () => {
    const next: AppSettings = {
      ...store.settings,
      apiUrl: (document.getElementById('api-url') as HTMLInputElement).value.trim(),
      apiToken: (document.getElementById('api-token') as HTMLInputElement).value.trim(),
      restCountdownSeconds: Number((document.getElementById('countdown') as HTMLSelectElement).value) as 3|5,
      defaultEnvironment: (document.getElementById('environment') as HTMLSelectElement).value as AppSettings['defaultEnvironment'],
    };
    await store.saveSettings(next);
    toast('Ajustes guardados');
  });
  document.querySelector('[data-action="test-api"]')?.addEventListener('click', () => void onTest());
  document.querySelector('[data-action="request-notifications"]')?.addEventListener('click', () => void onNotifications());
}
