import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'local.hydration.waterreminder',
  appName: '记得',
  webDir: 'dist',
  backgroundColor: '#F6F7F3',
  ios: { contentInset: 'never', preferredContentMode: 'mobile' },
};

export default config;
