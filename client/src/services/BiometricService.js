/**
 * BiometricService - Biometric authentication (fingerprint/face)
 * 
 * Provides optional biometric lock for the app.
 * User can enable/disable in settings.
 * 
 * Uses @capgo/capacitor-native-biometric plugin
 */

import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const CREDENTIALS_SERVER = 'com.finanzas.app';

class BiometricService {
    isAvailable = false;
    biometryType = BiometryType.NONE;

    /**
     * Check if biometric authentication is available on this device
     */
    async checkAvailability() {
        if (!Capacitor.isNativePlatform()) {
            return { available: false, type: 'Ninguno' };
        }

        try {
            const result = await NativeBiometric.isAvailable();

            this.isAvailable = result.isAvailable;
            this.biometryType = result.biometryType;

            const typeNames = {
                [BiometryType.NONE]: 'Ninguno',
                [BiometryType.TOUCH_ID]: 'Touch ID',
                [BiometryType.FACE_ID]: 'Face ID',
                [BiometryType.FINGERPRINT]: 'Huella Digital',
                [BiometryType.FACE_AUTHENTICATION]: 'Reconocimiento Facial',
                [BiometryType.IRIS_AUTHENTICATION]: 'Iris',
                [BiometryType.MULTIPLE]: 'Múltiple'
            };

            return {
                available: result.isAvailable,
                type: typeNames[result.biometryType] || 'Biometría',
                errorCode: result.errorCode || null
            };
        } catch (error) {
            console.error('[BiometricService] Availability check error:', error);
            return { available: false, type: 'Ninguno', error: error.message };
        }
    }

    /**
     * Authenticate using biometrics
     * @param {string} reason - Reason shown to user
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async authenticate(reason = 'Verifica tu identidad para continuar') {
        if (!Capacitor.isNativePlatform()) {
            return { success: true }; // Skip on web
        }

        if (!this.isAvailable) {
            const check = await this.checkAvailability();
            if (!check.available) {
                return { success: false, error: 'Biometría no disponible' };
            }
        }

        try {
            await NativeBiometric.verifyIdentity({
                reason,
                title: 'Autenticación Biométrica',
                subtitle: 'Usa tu huella o reconocimiento facial',
                description: reason,
                useFallback: true, // Allow PIN/pattern as fallback
                fallbackTitle: 'Usar código',
                maxAttempts: 3
            });

            return { success: true };
        } catch (error) {
            console.error('[BiometricService] Auth failed:', error);

            // User cancelled
            if (error.code === 'userCancel' || error.message?.includes('cancel')) {
                return { success: false, error: 'cancelled' };
            }

            return { success: false, error: error.message || 'Error de autenticación' };
        }
    }

    /**
     * Check if biometric lock is enabled by user
     */
    async isEnabled() {
        try {
            const { value } = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY });
            return value === 'true';
        } catch (e) {
            return false;
        }
    }

    /**
     * Enable/disable biometric lock
     * @param {boolean} enabled 
     */
    async setEnabled(enabled) {
        // If enabling, verify biometrics work first
        if (enabled) {
            const check = await this.checkAvailability();
            if (!check.available) {
                throw new Error(`Biometría no disponible: ${check.errorCode || 'dispositivo no compatible'}`);
            }

            // Test authentication
            const authResult = await this.authenticate('Verifica tu identidad para activar el bloqueo biométrico');
            if (!authResult.success) {
                if (authResult.error === 'cancelled') {
                    throw new Error('Autenticación cancelada');
                }
                throw new Error(`No se pudo verificar: ${authResult.error}`);
            }
        }

        await Preferences.set({
            key: BIOMETRIC_ENABLED_KEY,
            value: enabled.toString()
        });

        console.log(`[BiometricService] Biometric lock ${enabled ? 'enabled' : 'disabled'}`);
        return true;
    }

    /**
     * Perform app unlock if biometric is enabled
     * @returns {Promise<{required: boolean, success: boolean, error?: string}>}
     */
    async unlockIfRequired() {
        const enabled = await this.isEnabled();

        if (!enabled) {
            return { required: false, success: true };
        }

        const result = await this.authenticate('Desbloquea la app');
        return { required: true, ...result };
    }

    /**
     * Get biometry type name for UI display
     */
    async getBiometryTypeName() {
        const check = await this.checkAvailability();
        return check.type;
    }

    /**
     * Store credentials securely with biometric protection
     * (For future use - storing refresh token, etc.)
     */
    async setCredentials(username, password) {
        try {
            await NativeBiometric.setCredentials({
                username,
                password,
                server: CREDENTIALS_SERVER
            });
            return true;
        } catch (error) {
            console.error('[BiometricService] Set credentials error:', error);
            return false;
        }
    }

    /**
     * Get stored credentials (requires biometric auth)
     */
    async getCredentials() {
        try {
            const credentials = await NativeBiometric.getCredentials({
                server: CREDENTIALS_SERVER
            });
            return credentials;
        } catch (error) {
            console.error('[BiometricService] Get credentials error:', error);
            return null;
        }
    }

    /**
     * Delete stored credentials
     */
    async deleteCredentials() {
        try {
            await NativeBiometric.deleteCredentials({
                server: CREDENTIALS_SERVER
            });
            return true;
        } catch (error) {
            console.error('[BiometricService] Delete credentials error:', error);
            return false;
        }
    }
}

// Singleton instance
const biometricService = new BiometricService();
export default biometricService;
