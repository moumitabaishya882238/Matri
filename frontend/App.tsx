import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import notifee, { TriggerType, RepeatFrequency, AuthorizationStatus, TimestampTrigger } from '@notifee/react-native';

// Import i18n engine to load localized dictionaries on boot
import './src/i18n';

const App = () => {

  useEffect(() => {
    async function setupNotifications() {
      const settings = await notifee.requestPermission();

      if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
        const channelId = await notifee.createChannel({
          id: 'daily-checkin',
          name: 'Daily Check-in Reminder',
          sound: 'default',
        });

        // Set trigger for 10:00 AM every day yes
        const date = new Date(Date.now());
        date.setHours(10, 0, 0, 0);

        if (date.getTime() < Date.now()) {
          date.setDate(date.getDate() + 1);
        }

        const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: date.getTime(),
          repeatFrequency: RepeatFrequency.DAILY,
        };

        const existingTriggers = await notifee.getTriggerNotificationIds();
        if (!existingTriggers.includes('daily-checkin-notification')) {
          await notifee.createTriggerNotification(
            {
              id: 'daily-checkin-notification',
              title: 'Good Morning, Mama ☀️',
              body: 'MATRI is ready for your daily check-in whenever you are!',
              android: {
                channelId,
                pressAction: {
                  id: 'default',
                },
              },
            },
            trigger,
          );
        }
      }
    }

    setupNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
