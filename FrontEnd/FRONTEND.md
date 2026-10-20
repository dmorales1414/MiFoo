# MiFoo Frontend

The mobile app for **MiFoo**, a food storage helper. It tracks what food a user has, shows how close each item is to expiring, and (later) recommends meals that use up the soonest-expiring ingredients.

This file explains what each folder holds, the conventions the code follows, how to run the app, and what is still a placeholder. Keep it updated as the project grows.

> **Abbreviations used in this file**
> - **FAB**: floating action button (the round blue **+** button)
> - **OCR**: optical character recognition (reading the expiration date off packaging)
> - **EAS**: Expo Application Services (Expo's cloud build service)
> - **SDK**: software development kit (here, the Expo SDK version, currently 57)
> - **UI**: user interface

---

## 1. Tech stack (frontend)

| Piece | Purpose |
|---|---|
| React Native + Expo (SDK 57) | The mobile framework and its tooling |
| TypeScript (strict mode) | Type safety across all files |
| expo-router | File-based navigation: files in `src/app` become screens |
| `@expo/vector-icons` (Ionicons) | Icons |
| `react-native-safe-area-context` | Keeps content clear of the notch and gesture bar |
| `expo-status-bar` | Controls the status bar icons |
| `expo-dev-client` | Development build (used instead of Expo Go) |

---

## 2. Folder map

```
FrontEnd/
├── src/
│   ├── app/          Routes (one file = one URL/screen). Kept tiny.
│   ├── screens/      The actual screen UIs. Own the state.
│   ├── components/   Reusable UI pieces used by screens.
│   ├── styles/       All styling: one .styles.ts per component + theme.ts.
│   ├── types/        TypeScript types shared across the app.
│   ├── utils/        Pure helper functions (no UI).
│   └── data/         Temporary sample data (replaced by the backend later).
├── assets/           Images, fonts, icons (created by the Expo template).
├── app.json          Expo app configuration.
├── package.json      Dependencies and scripts.
└── FRONTEND.md       This file.
```

### `src/app/` — routes

expo-router turns each file here into a screen. The file name is the URL.

| File | Route | What it does |
|---|---|---|
| `_layout.tsx` | (wraps everything) | Root layout. A `Stack` navigator with headers hidden, a dark status bar, and `initialRouteName: 'index'` so Home is always the base screen. **This is the file to change when you add a tab bar.** |
| `index.tsx` | `/` | The first screen the app opens. Only re-exports `HomeScreen`. |
| `explore.tsx` | `/explore` | Placeholder route. Only re-exports `ExploreScreen`. |

Rule: route files contain **no UI**. They re-export a screen from `src/screens`.

### `src/screens/` — full screens

| File | What it does |
|---|---|
| `HomeScreen.tsx` | The Home screen. **Owns all the state** (item list, which section is in manage mode, selected items, whether the add menu is open) and passes it down to components. |
| `ExploreScreen.tsx` | Placeholder ("Coming soon"). |

`HomeScreen` covers three Figma frames as three states of one screen:

1. **Default:** nothing open, nothing selected.
2. **Add menu:** `isMenuOpen` is true, so the "Add an item" popover shows above the FAB.
3. **Manage mode:** `managingCategory` is set and items can be checked. The red "Remove N selected items" bar replaces the FAB.

### `src/components/` — reusable UI pieces

Components receive data and callbacks through props. They hold no app-level state.

| File | What it does |
|---|---|
| `RecommendedMealCarousel.tsx` | Horizontal snapping carousel of meal cards. The centered card is full size; neighbors shrink and fade. Shows gray placeholders when a meal has no image. |
| `ItemSection.tsx` | A gray card with a title ("Food Items" / "Produce Items"), a **Manage / Done** chip, and a list of `ItemRow`s. |
| `ItemRow.tsx` | One food item: icon (or checkbox in manage mode), name, date line, status badge. Border color follows the item's expiry status. |
| `StatusBadge.tsx` | The "● Safe / ● Use soon / ● Urgent" pill. |
| `AddItemFab.tsx` | The blue **+** button and the "Add an item" popover. |
| `RemoveSelectedButton.tsx` | The red "Remove N selected items" bar (disabled when nothing is selected). |
| `BottomNavBar.tsx` | The Home / Meals / Pantry / Profile bar. **Visual only for now** (see section 6). |

### `src/styles/` — all styling

Styles are kept out of the component files so the JSX stays easy to read.

- `theme.ts` is the single source of design tokens: `colors`, `statusColors` (per expiry status), `spacing`, `radii`, `shadows`, `layout`. Change a color here and it changes everywhere.
- Every component or screen has a matching `*.styles.ts` file, such as `itemRow.styles.ts` for `ItemRow.tsx`.
- They are `.ts`, not `.tsx`, because they contain no JSX. Renaming to `.tsx` also works.
- React Native does not use CSS. These files use `StyleSheet.create`, which looks similar but is not CSS (no cascade or selectors).

What stays **inline** in components (not in the style files):

- Values that depend on the device, such as safe-area padding and carousel card width.
- Colors that depend on a status (green / orange / red), taken from `statusColors`.

### `src/types/`

| File | What it holds |
|---|---|
| `item.ts` | `Item` (matches the Item class in the UML diagram), `ItemCategory` (`'packaged' \| 'produce'`), `ExpiryStatus` (`'safe' \| 'useSoon' \| 'urgent'`), and `Meal`. |

### `src/utils/`

| File | What it holds |
|---|---|
| `expiry.ts` | Date helpers and the status rules: `daysUntil`, `getExpiryStatus`, `formatDate`, `formatDaysLeft`, `parseISODate`, `toISODate`. |

Status thresholds live at the top of `expiry.ts`:

- `URGENT_MAX_DAYS = 2`, so **2 days or fewer** is **Urgent**
- `USE_SOON_MAX_DAYS = 5`, so **3–5 days** is **Use soon**
- **6 days or more** is **Safe**

Why `parseISODate` exists: `new Date('2026-10-21')` is read as UTC midnight, which shows up as **Oct 20** in US time zones. The helper builds the date from its parts in local time. Always use it instead of `new Date('YYYY-MM-DD')`.

### `src/data/`

| File | What it holds |
|---|---|
| `sampleData.ts` | Temporary items and meals so the screen renders before the backend exists. Dates are relative to today, so the badges always look the same. Delete this once Home loads real data. |

---

## 3. How data flows on the Home screen

```
sampleData.ts  ->  HomeScreen (state)  ->  ItemSection  ->  ItemRow  ->  StatusBadge
                        |                      ^
                        |                      |
                        +-- callbacks (toggle manage, select item, remove) --+
```

- State goes **down** through props. User actions go **up** through callback props such as `onToggleItem`.
- When the backend exists, the only change in `HomeScreen` is where `items` comes from. The components stay the same.

---

## 4. Running the app

Run everything from the `FrontEnd` folder, in PowerShell.

```powershell
npm install
npx expo install @expo/vector-icons expo-font react-native-safe-area-context
npx expo start -c        # -c clears Metro's cache
```

**Development build on an Android phone** (needed later for push notifications and OCR; Expo Go can't do either):

```powershell
npx expo run:android --device    # needs Android Studio installed and the phone on USB debugging
```

`npx expo start` only starts the bundler. The app itself runs on the phone after the development build is installed.

---

## 5. Rules and gotchas learned so far

- **Never install the old global `expo-cli`** (`npm i -g expo-cli`). It is deprecated, and it hijacked `npx expo start` earlier. The real CLI is built into the `expo` package.
- **Never run `npm audit fix --force`** in this project. It rewrites dependency versions and breaks the matched set Expo needs.
- **Install Expo-related packages with `npx expo install <package>`**, not plain `npm install`. It picks the version that matches the SDK.
- **To repair version problems:** `npx expo install --check` (lists mismatches), `npx expo install --fix`, and `npx expo-doctor`.
- **If Metro misbehaves,** restart with `npx expo start -c`.
- **Long project paths can break Android builds.** The path contains spaces and parentheses and is long. If a build fails with odd file-not-found errors, move the repo to a short path like `C:\dev\MiFoo`.
- **A real phone can't reach your computer's `localhost`.** When the frontend calls the backend, use the computer's local network address (store it in one config value, not scattered through the code).
- **Secrets never go in Git.** Keep keys in `.env` files that are listed in `.gitignore`. The Supabase service key belongs in the backend only.

---

## 6. Placeholders and known gaps

| Area | Status |
|---|---|
| Colors | Estimated from a screenshot of the Figma design. Replace with exact values from Figma Dev Mode in `theme.ts`. |
| Font | System font is used. The design looks like Inter. |
| Meal images | Gray placeholders. Add photos to `assets/images` and set `image: require(...)` in `sampleData.ts`. |
| Carousel | Approximates Figma (center card larger, sides shrink). Cards do not overlap like the design. |
| Produce rows | Show an expiration date as in the Figma mockup, but the proposal says produce is tracked by **time stored**. When decided, change only the `subtitle` line in `ItemRow.tsx`. |
| Bottom nav bar | Visual only. `BottomNavBar` is drawn by `HomeScreen`. Once the Meals / Pantry / Profile screens exist, move the tab bar into `_layout.tsx` using expo-router tabs. |
| Add item | `handleAddItem` in `HomeScreen.tsx` is a TODO. It will open the scanner / manual-entry screen. |
| Data | Sample data only. No backend calls yet. |
| `explore` route | Placeholder. Rename or remove when its purpose is decided. |

---

## 7. Planned (not created yet)

These folders are part of the architecture but **do not exist yet**. Do not assume they are there.

- `src/features/scanner/`: barcode scanner (`expo-camera`) and OCR expiration-date scanner (`expo-mlkit-ocr`), each with a manual-entry fallback.
- `src/features/notifications/`: Expo push notification handling.
- `src/services/`: API calls to the FastAPI backend and to Open Food Facts.
- A `backend/` folder next to `FrontEnd/` (Python + FastAPI + Supabase), in the same Git repository.

---

## 8. Where do I change...?

| I want to change... | Go to |
|---|---|
| A color, spacing value, or corner radius | `src/styles/theme.ts` |
| How one component looks | That component's file in `src/styles/` |
| The Safe / Use soon / Urgent cutoffs | `URGENT_MAX_DAYS` and `USE_SOON_MAX_DAYS` in `src/utils/expiry.ts` |
| The text shown under an item name | The `subtitle` line in `src/components/ItemRow.tsx` |
| What the first screen is | `src/app/index.tsx` |
| Navigation structure or tab bar | `src/app/_layout.tsx` |
| What data the Home screen shows | `items` state in `src/screens/HomeScreen.tsx` |
| The fields on an item | `src/types/item.ts` (the UML Item class should be updated too) |
