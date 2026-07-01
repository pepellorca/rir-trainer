import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'es.pepellorca.rirtrainer',
  appName: 'RIR Trainer',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: { enabled: true },
    LocalNotifications: {
      smallIcon: 'ic_stat_rir',
      iconColor: '#f5a623',
    },
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0d0d0d',
      showSpinner: false,
    },
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    preferredContentMode: 'mobile',
  },
};

export default config;
