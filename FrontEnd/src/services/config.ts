// Where the FastAPI backend lives. ONE place to change.
//
// Set it in FrontEnd/.env (copy .env.example), for example:
//   EXPO_PUBLIC_API_URL=http://localhost:8000        <- phone plugged in by USB (adb reverse)
//   EXPO_PUBLIC_API_URL=http://192.168.1.50:8000     <- same Wi-Fi (your computer's address)
//   EXPO_PUBLIC_API_URL=https://mifoo-api.example.com <- hosted backend
// Restart with `npx expo start -c` after changing it: the value is baked in at build time.
// Anything named EXPO_PUBLIC_* ships inside the app, so never put secrets in it.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/+$/, '');

export const REQUEST_TIMEOUT_MS = 10_000;
