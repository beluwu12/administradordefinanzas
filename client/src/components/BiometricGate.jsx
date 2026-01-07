/**
 * BiometricGate - Wrapper component for biometric unlock on app start
 * 
 * Shows a lock screen if biometric auth is enabled and requires verification.
 */

import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import biometricService from '../services/BiometricService';

export function BiometricGate({ children }) {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [authError, setAuthError] = useState(null);
    const isNative = Capacitor.isNativePlatform();

    useEffect(() => {
        const checkBiometric = async () => {
            // Skip on web
            if (!isNative) {
                setIsUnlocked(true);
                setIsChecking(false);
                return;
            }

            try {
                const result = await biometricService.unlockIfRequired();

                if (!result.required) {
                    // Biometric not enabled, proceed
                    setIsUnlocked(true);
                } else if (result.success) {
                    // Biometric auth successful
                    setIsUnlocked(true);
                } else {
                    // Auth failed
                    setAuthError(result.error);
                }
            } catch (error) {
                console.error('[BiometricGate] Error:', error);
                setAuthError(error.message);
            } finally {
                setIsChecking(false);
            }
        };

        checkBiometric();
    }, [isNative]);

    const handleRetry = async () => {
        setAuthError(null);
        setIsChecking(true);

        try {
            const result = await biometricService.authenticate('Desbloquea la app');
            if (result.success) {
                setIsUnlocked(true);
            } else {
                setAuthError(result.error);
            }
        } catch (error) {
            setAuthError(error.message);
        } finally {
            setIsChecking(false);
        }
    };

    // Checking state
    if (isChecking) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <span className="material-symbols-outlined text-primary text-5xl animate-pulse">fingerprint</span>
                    <p className="mt-4 text-gray-500">Verificando...</p>
                </div>
            </div>
        );
    }

    // Auth error state - show retry
    if (!isUnlocked && authError !== 'cancelled') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center p-6">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-4xl">lock</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">App Bloqueada</h1>
                    <p className="text-gray-500 mb-6">
                        Usa tu huella o rostro para desbloquear
                    </p>
                    {authError && authError !== 'cancelled' && (
                        <p className="text-red-500 text-sm mb-4">{authError}</p>
                    )}
                    <button
                        onClick={handleRetry}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
                    >
                        <span className="material-symbols-outlined mr-2 align-middle">fingerprint</span>
                        Desbloquear
                    </button>
                </div>
            </div>
        );
    }

    // Unlocked - render children
    return children;
}

export default BiometricGate;
