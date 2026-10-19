import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// הגדרת האופן שבו התראה מוצגת כשהאפליקציה פתוחה
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

/**
 * בקשת הרשאת התראות יזומה מהמשתמש באייפון (חובה ב-iOS)
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * תזמון התראה מקומית למטלה
 */
export async function scheduleChoreNotification(
  choreTitle: string,
  secondsFromNow: number = 8
): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'תזכורת מטלה עדינה 🧹',
        body: `הגיע הזמן לבצע: ${choreTitle}`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsFromNow,
        repeats: false,
      },
    });
    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}