/// <reference types="vite/client" />

interface ImportMetaEnv {
    // SECURITY FIX: Removed Twitch API credential definitions
    // API credentials should never be exposed in frontend code
    readonly VITE_TWITTER_ENABLED: string
    readonly VITE_ALLOWED_MESSAGE_ORIGINS: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}