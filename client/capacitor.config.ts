import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.finanzas.app',
  appName: 'Administrador de Finanzas',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    // Network plugin config
    Network: {
      // No additional config needed
    },
    // Preferences plugin config
    Preferences: {
      // No additional config needed  
    }
  }
};

export default config;