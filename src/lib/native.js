import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Network } from '@capacitor/network';
import { PushNotifications } from '@capacitor/push-notifications';

export const isNativeApp = Capacitor.isNativePlatform();

export async function openExternal(url) {
  if (isNativeApp) return Browser.open({ url });
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Copies text, falling back to execCommand where the Clipboard API is blocked (Android WebView). */
export async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    return copied;
  }
}

/** Link props for wa.me / sms: / tel: — the native app hands these to Android as intents. */
export function externalLinkProps(href) {
  return isNativeApp || !href.startsWith('http')
    ? { href }
    : { href, target: '_blank', rel: 'noopener noreferrer' };
}

export async function enableAppointmentNotifications() {
  if (!isNativeApp) return false;
  const current = await LocalNotifications.checkPermissions();
  const permission = current.display === 'granted'
    ? current
    : await LocalNotifications.requestPermissions();
  if (permission.display !== 'granted') return false;
  await LocalNotifications.createChannel({
    id: 'appointments',
    name: 'Appointments',
    description: 'New appointment requests and clinic updates',
    importance: 5,
  });
  return true;
}

export async function notifyNewAppointments(count) {
  if (!isNativeApp || count < 1) return;
  await LocalNotifications.schedule({
    notifications: [{
      id: Date.now() % 2_147_483_647,
      title: 'New appointment request',
      body: count === 1 ? 'A patient requested an appointment.' : `${count} patients requested appointments.`,
      channelId: 'appointments',
      schedule: { at: new Date(Date.now() + 250) },
    }],
  });
}

export async function registerPushNotifications(onToken, onOpen) {
  if (!isNativeApp) return () => {};
  const current = await PushNotifications.checkPermissions();
  const permission = current.receive === 'granted'
    ? current
    : await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') return () => {};
  const handles = [
    await PushNotifications.addListener('registration', ({ value }) => onToken(value)),
    await PushNotifications.addListener('pushNotificationActionPerformed', () => onOpen()),
  ];
  await PushNotifications.register();
  return () => handles.forEach((handle) => handle.remove());
}

export async function monitorNativeApp({ onResume, onNetworkChange }) {
  const status = await Network.getStatus();
  onNetworkChange(status.connected);
  const handles = [
    await Network.addListener('networkStatusChange', (next) => onNetworkChange(next.connected)),
  ];
  if (isNativeApp) {
    handles.push(await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) onResume();
    }));
  }
  return () => handles.forEach((handle) => handle.remove());
}
