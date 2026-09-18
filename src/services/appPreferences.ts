import { isRecord, readStoredJson, readStoredString, writeStoredJson, writeStoredString } from '../lib/storage';

const ONBOARDING_KEY = '@notre-table/onboarding-seen-v1';
const LANGUAGE_CHOSEN_KEY = '@notre-table/language-chosen-v1';
const NOTIFICATIONS_KEY = '@notre-table/notification-preferences-v2';
const LOCALE_KEY = '@notre-table/locale-preferences-v1';
const THEME_KEY = '@notre-table/theme-preference-v1';
const LIA_SECOND_INTRO_KEY = '@notre-table/lia-second-intro-seen-v1';

export type NotificationPreferences = {
  planningChanges: boolean;
  shoppingChecks: boolean;
  liaNoonReminder: boolean;
  dinnerReminder: boolean;
  dinnerReminderTime: string;
  weekendReminder: boolean;
  weekendReminderWeekday: number;
  weekendReminderTime: string;
};

export const defaultNotificationPreferences: NotificationPreferences = {
  planningChanges: false,
  shoppingChecks: false,
  liaNoonReminder: true,
  dinnerReminder: true,
  dinnerReminderTime: '17:00',
  weekendReminder: true,
  weekendReminderWeekday: 6,
  weekendReminderTime: '18:00',
};

export async function hasSeenOnboarding(): Promise<boolean> {
  return (await readStoredString(ONBOARDING_KEY, '0', ['0', '1'] as const)) === '1';
}

export async function markOnboardingSeen(): Promise<void> {
  await writeStoredString(ONBOARDING_KEY, '1');
}


export async function hasSeenLiaSecondIntro(): Promise<boolean> {
  return (await readStoredString(LIA_SECOND_INTRO_KEY, '0', ['0', '1'] as const)) === '1';
}

export async function markLiaSecondIntroSeen(): Promise<void> {
  await writeStoredString(LIA_SECOND_INTRO_KEY, '1');
}

export async function hasChosenLanguage(): Promise<boolean> {
  return (await readStoredString(LANGUAGE_CHOSEN_KEY, '0', ['0', '1'] as const)) === '1';
}

export async function markLanguageChosen(): Promise<void> {
  await writeStoredString(LANGUAGE_CHOSEN_KEY, '1');
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const stored = await readStoredJson<Record<string, unknown>>(NOTIFICATIONS_KEY, {}, isRecord);
  return {
    // Collaborative push is intentionally unavailable in the first beta. Keep the
    // persisted fields false so old preview settings cannot imply a working server push.
    planningChanges: false,
    shoppingChecks: false,
    liaNoonReminder: typeof stored.liaNoonReminder === 'boolean' ? stored.liaNoonReminder : defaultNotificationPreferences.liaNoonReminder,
    dinnerReminder: typeof stored.dinnerReminder === 'boolean' ? stored.dinnerReminder : defaultNotificationPreferences.dinnerReminder,
    dinnerReminderTime: typeof stored.dinnerReminderTime === 'string' ? stored.dinnerReminderTime : defaultNotificationPreferences.dinnerReminderTime,
    weekendReminder: typeof stored.weekendReminder === 'boolean' ? stored.weekendReminder : defaultNotificationPreferences.weekendReminder,
    weekendReminderWeekday: typeof stored.weekendReminderWeekday === 'number' ? stored.weekendReminderWeekday : defaultNotificationPreferences.weekendReminderWeekday,
    weekendReminderTime: typeof stored.weekendReminderTime === 'string' ? stored.weekendReminderTime : defaultNotificationPreferences.weekendReminderTime,
  };
}

export async function saveNotificationPreferences(value: NotificationPreferences): Promise<void> {
  await writeStoredJson(NOTIFICATIONS_KEY, {...value,planningChanges:false,shoppingChecks:false});
}

export type LocalePreferences = { language: 'system' | 'fr' | 'en' | 'es' | 'he'; measurement: 'system' | 'metric' | 'imperial' };

export const defaultLocalePreferences: LocalePreferences = { language: 'system', measurement: 'system' };

const LANGUAGES = ['system', 'fr', 'en', 'es', 'he'] as const;
const MEASUREMENTS = ['system', 'metric', 'imperial'] as const;

export async function getLocalePreferences(): Promise<LocalePreferences> {
  const stored = await readStoredJson<Record<string, unknown>>(LOCALE_KEY, {}, isRecord);
  const language = typeof stored.language === 'string' && (LANGUAGES as readonly string[]).includes(stored.language)
    ? stored.language as LocalePreferences['language']
    : defaultLocalePreferences.language;
  const measurement = typeof stored.measurement === 'string' && (MEASUREMENTS as readonly string[]).includes(stored.measurement)
    ? stored.measurement as LocalePreferences['measurement']
    : defaultLocalePreferences.measurement;
  return { language, measurement };
}

export async function saveLocalePreferences(value: LocalePreferences): Promise<void> {
  await writeStoredJson(LOCALE_KEY, value);
}

export type ThemePreference = 'system' | 'light' | 'dark';
const THEMES = ['system', 'light', 'dark'] as const;

export async function getThemePreference(): Promise<ThemePreference> {
  return readStoredString(THEME_KEY, 'system', THEMES);
}

export async function saveThemePreference(value: ThemePreference): Promise<void> {
  await writeStoredString(THEME_KEY, value);
}
