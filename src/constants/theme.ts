export type ThemeColors = {
  background: string;
  surface: string;
  primary: string;
  primaryDark: string;
  text: string;
  textMuted: string;
  border: string;
  danger: string;
  success: string;
  receita: string;
  despesa: string;
  /** Fundo neutro das laterais no web (letterbox) e áreas "afundadas". */
  letterbox: string;
};

export const lightColors: ThemeColors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  primary: '#208AEF',
  primaryDark: '#1567B8',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  danger: '#DC2626',
  success: '#16A34A',
  receita: '#16A34A',
  despesa: '#DC2626',
  letterbox: '#E2E5EA',
};

export const darkColors: ThemeColors = {
  background: '#0F1115',
  surface: '#1A1D23',
  primary: '#3B9EFF',
  primaryDark: '#2B7FD8',
  text: '#F3F4F6',
  textMuted: '#9AA3B0',
  border: '#2A2E37',
  danger: '#F87171',
  success: '#4ADE80',
  receita: '#4ADE80',
  despesa: '#F87171',
  letterbox: '#05070A',
};

// Compat: alguns lugares ainda podem importar Colors direto (tema claro).
// Novo código deve usar useTheme()/useThemedStyles.
export const Colors = lightColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Largura máxima do conteúdo no navegador: em telas largas o app fica numa
// coluna central (como um celular), com as laterais em cor neutra.
export const WebMaxWidth = 480;
export const WebLetterbox = lightColors.letterbox;
