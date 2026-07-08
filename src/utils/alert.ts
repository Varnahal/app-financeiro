import { Alert, Platform } from 'react-native';

// Alert.alert do React Native é um no-op no react-native-web, então no navegador
// usamos window.alert/window.confirm. No app nativo (Android/iOS), Alert normal.

export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export interface ConfirmOptions {
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export function showConfirm(
  title: string,
  message: string,
  options: ConfirmOptions = {}
): Promise<boolean> {
  const { confirmText = 'OK', cancelText = 'Cancelar', destructive = false } = options;

  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
