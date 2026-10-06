import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * AsyncStorage, made safe for static rendering.
 *
 * With web.output "static", every route is rendered in Node.js at export time.
 * AsyncStorage's web implementation reaches for window.localStorage on every
 * call, which throws there. During that build-time render nothing should be
 * persisted anyway, so this wrapper turns reads into "nothing stored" and
 * writes into no-ops. In the browser and on native it is plain AsyncStorage.
 */
const isStaticRender = Platform.OS === 'web' && typeof window === 'undefined';

export const storage = {
  getItem: (key: string): Promise<string | null> =>
    isStaticRender ? Promise.resolve(null) : AsyncStorage.getItem(key),
  setItem: (key: string, value: string): Promise<void> =>
    isStaticRender ? Promise.resolve() : AsyncStorage.setItem(key, value),
  removeItem: (key: string): Promise<void> =>
    isStaticRender ? Promise.resolve() : AsyncStorage.removeItem(key),
};
