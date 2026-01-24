import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface NotificationSettings {
  // Master toggles
  pushEnabled: boolean;
  emailEnabled: boolean;
  
  // Sound settings
  soundEnabled: boolean;
  soundVolume: number; // 0-100
  
  // Alert types
  budgetAlerts: boolean;
  budgetThreshold: number; // Percentage at which to alert (e.g., 80)
  billReminders: boolean;
  billReminderDays: number; // Days before due date to remind
  goalUpdates: boolean;
  weeklyReport: boolean;
  
  // Push notification permission status
  pushPermission: NotificationPermission;
}

interface NotificationSettingsContextType {
  settings: NotificationSettings;
  updateSettings: (updates: Partial<NotificationSettings>) => void;
  requestPushPermission: () => Promise<NotificationPermission>;
  sendPushNotification: (title: string, options?: NotificationOptions) => void;
  playNotificationSound: (type?: 'info' | 'warning' | 'success') => void;
}

const defaultSettings: NotificationSettings = {
  pushEnabled: false,
  emailEnabled: true,
  soundEnabled: true,
  soundVolume: 70,
  budgetAlerts: true,
  budgetThreshold: 80,
  billReminders: true,
  billReminderDays: 3,
  goalUpdates: true,
  weeklyReport: false,
  pushPermission: 'default',
};

const NotificationSettingsContext = createContext<NotificationSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'fincontrol-notification-settings';

export const NotificationSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return { ...defaultSettings, ...JSON.parse(saved) };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  // Check initial push permission
  useEffect(() => {
    if ('Notification' in window) {
      setSettings(prev => ({
        ...prev,
        pushPermission: Notification.permission,
        pushEnabled: Notification.permission === 'granted' && prev.pushEnabled,
      }));
    }
  }, []);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const requestPushPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    updateSettings({ 
      pushPermission: permission,
      pushEnabled: permission === 'granted',
    });
    return permission;
  }, [updateSettings]);

  const sendPushNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!settings.pushEnabled || Notification.permission !== 'granted') {
      return;
    }

    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }, [settings.pushEnabled]);

  const playNotificationSound = useCallback((type: 'info' | 'warning' | 'success' = 'info') => {
    if (!settings.soundEnabled) return;

    // Create audio context for generating sounds
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set volume based on settings (0-100 -> 0-0.3 for comfortable levels)
    const volume = (settings.soundVolume / 100) * 0.3;
    
    // Different sounds for different notification types
    switch (type) {
      case 'warning':
        // Two-tone alert sound
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(330, audioContext.currentTime + 0.15);
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'success':
        // Pleasant ascending chime
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
        break;
      default:
        // Simple notification ping
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
  }, [settings.soundEnabled, settings.soundVolume]);

  return (
    <NotificationSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        requestPushPermission,
        sendPushNotification,
        playNotificationSound,
      }}
    >
      {children}
    </NotificationSettingsContext.Provider>
  );
};

export const useNotificationSettings = () => {
  const context = useContext(NotificationSettingsContext);
  if (!context) {
    throw new Error('useNotificationSettings must be used within a NotificationSettingsProvider');
  }
  return context;
};
