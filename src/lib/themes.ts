export type Theme = 'light' | 'dark'

export const themes = {
    light: {
        name: '浅色',
        colors: {
            background: '#F7F8FA',
            foreground: '#0f172a',
            muted: '#64748b',
            'muted-foreground': '#6c7281',
            primary: '#2563eb',
            'primary-foreground': '#ffffff',
            secondary: '#4f46e5',
            'secondary-foreground': '#ffffff',
            accent: '#f59e0b',
            'accent-foreground': '#ffffff',
            border: '#e2e8f0',
            ring: '#94a3b8',
            card: '#ffffff',
            'card-foreground': '#0f172a',
        }
    },
    dark: {
        name: '深色',
        colors: {
            background: '#0f172a',
            foreground: '#ffffff',
            muted: '#94a3b8',
            'muted-foreground': '#a1a1aa',
            primary: '#3b82f6',
            'primary-foreground': '#ffffff',
            secondary: '#6366f1',
            'secondary-foreground': '#ffffff',
            accent: '#f59e0b',
            'accent-foreground': '#ffffff',
            border: '#1e293b',
            ring: '#1f2937',
            card: '#1e293b',
            'card-foreground': '#ffffff',
        }
    },

}

