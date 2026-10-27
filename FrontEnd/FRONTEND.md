# MiFoo Frontend

The mobile app for **MiFoo**, a food storage helper. It tracks what food a user has, shows how close each item is to expiring, and (later) recommends meals that use up the soonest-expiring ingredients.

This file explains what each folder holds, the conventions the code follows, how to run the app, and what is still a placeholder. Keep it updated as the project grows.

> **Abbreviations used in this file**
> - **FAB**: floating action button (the round blue **+** button)
> - **OCR**: optical character recognition (reading the expiration date off packaging)
> - **EAS**: Expo Application Services (Expo's cloud build service)
> - **SDK**: software development kit (here, the Expo SDK version, currently 57)
> - **UI**: user interface
> - **API**: application programming interface (here, the backend's web addresses the app calls)
> - **ADB**: Android Debug Bridge (a command-line tool that talks to your phone over the USB cable)
> - **UML**: unified modeling language (the class diagram from the proposal)

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
| `expo-camera` | Live camera: barcode scanning and taking pictures of the date |
| `expo-mlkit-ocr` | Reads text from a picture on the phone (finds the expiration date) |
| `@react-native-community/datetimepicker` | The system date picker |

---

## 2. Folder map

```
FrontEnd/
├── src/
│   ├── app/          Routes (one file = one URL/screen). Kept tiny.
│   ├── screens/      The actual screen UIs. Own the state. (screens/add = add-item flow)
│   ├── components/   Reusable UI pieces used by screens. (components/add = add-item pieces)
│   ├── features/     Logic that belongs to one feature (features/addItem = the draft item).
│   ├── hooks/        Reusable React hooks (useItems loads Home's list).
│   ├── services/     Talks to the outside world: backend API, OCR, API address config.
│   ├── styles/       All styling: one .styles.ts per component + theme.ts (styles/add = add-item).
│   ├── types/        TypeScript types shared across the app.
│   ├── utils/        Pure helper functions (no UI).
│   └── data/         Sample data, used only when the backend cannot be reached.
├── assets/           Images, fonts, icons (created by the Expo template).
├── app.json          Expo app configuration.
├── .env              (you create it from .env.example) where the backend is: EXPO_PUBLIC_API_URL.
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
| `add/_layout.tsx` | (wraps `/add/*`) | Holds the draft item shared by the add-item screens (see section 3). |
| `add/scan-barcode.tsx` | `/add/scan-barcode` | Add-item step 1: scan the barcode. |
| `add/confirm-item.tsx` | `/add/confirm-item` | Step 1b: "Is this the right item?" |
| `add/scan-date.tsx` | `/add/scan-date` | Step 2: scan the expiration date. |
| `add/review.tsx` | `/add/review` | Step 3: review and save. |
| `add/manual.tsx` | `/add/manual` | Manual entry (no scanning). |

Rule: route files contain **no UI**. They re-export a screen from `src/screens`.
The routes that use native code (camera, date picker) load their screen through `lazyScreen` (`src/utils/lazyScreen.tsx`) instead. If the installed development build is missing a native module, only that screen shows a "rebuild the app" message. Without this, expo-router would crash the whole app at launch.

### `src/screens/` — full screens

| File | What it does |
|---|---|
| `HomeScreen.tsx` | The Home screen. **Owns all the state** (item list, which section is in manage mode, selected items, whether the add menu is open) and passes it down to components. |
| `ExploreScreen.tsx` | Placeholder ("Coming soon"). |
| `add/ScanBarcodeScreen.tsx` | Camera + barcode reading. Checks the barcode's check digit, asks the backend what the product is, then goes to Confirm. |
| `add/ConfirmItemScreen.tsx` | Shows the product Open Food Facts found (name, brand, size, photo). |
| `add/ScanDateScreen.tsx` | Takes a picture about once a second, reads the text on the phone, and looks for a date (`parseExpirationDate`). |
| `add/ReviewItemScreen.tsx` | Editable summary (name, date, quantity, Food/Produce), then **Add item** saves it. |
| `add/ManualEntryScreen.tsx` | The same form with nothing pre-filled. |

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

`AddItemFab.tsx` now opens the Figma "Add an item" card with two choices: **Scan barcode** and **Enter manually**.

**`components/add/`** (used only by the add-item screens):

| File | What it does |
|---|---|
| `AddItemHeader.tsx` | Back arrow, "Add an item", close (X). X closes the whole flow. |
| `StepIntro.tsx` | Blue "IDENTIFY ITEM · 1 OF 3" label, 3-segment progress bar, title, description. |
| `ScannerViewport.tsx` | Rounded camera area: corner guide, status chip, flashlight button. |
| `CameraPermissionPrompt.tsx` | "Allow camera" prompt shown inside the camera area. |
| `Buttons.tsx` | `PrimaryButton` (blue pill) and `TextLink`. |
| `InfoCard.tsx` | Small hint box with an icon. |
| `FormControls.tsx` | `FormField`, `TextField`, `DateField`, `QuantityStepper`, `CategoryToggle`. |

### `src/styles/` — all styling

Styles are kept out of the component files so the JSX stays easy to read.

- `theme.ts` is the single source of design tokens: `colors`, `statusColors` (per expiry status), `spacing`, `radii`, `shadows`, `layout`. Change a color here and it changes everywhere.
- Every component or screen has a matching `*.styles.ts` file, such as `itemRow.styles.ts` for `ItemRow.tsx`.
- The add-item flow's styles are in `styles/add/`.
- They are `.ts`, not `.tsx`, because they contain no JSX. Renaming to `.tsx` also works.
- React Native does not use CSS. These files use `StyleSheet.create`, which looks similar but is not CSS (no cascade or selectors).

What stays **inline** in components (not in the style files):

- Values that depend on the device, such as safe-area padding and carousel card width.
- Colors that depend on a status (green / orange / red), taken from `statusColors`.

### `src/types/`

| File | What it holds |
|---|---|
| `item.ts` | `Item` (matches the Item class in the UML diagram; `expirationDate` is `null` for produce without a date), `NewItem` (what the app sends to create one), `ItemCategory` (`'packaged' \| 'produce'`), `ExpiryStatus`, and `Meal`. |
| `product.ts` | `ProductSuggestion`: what the backend returns for a scanned barcode. |

### `src/utils/`

| File | What it holds |
|---|---|
| `expiry.ts` | Date helpers and the status rules: `daysUntil`, `getExpiryStatus`, `getItemDisplay` (status + text for a row, including produce with no date), `formatDate`, `formatLongDate`, `formatDaysLeft`, `parseISODate`, `toISODate`. |
| `parseExpirationDate.ts` | Finds a date in messy OCR text ("BEST BEFORE 28 OCT 2026", "EXP 10/28/26", "28.10.26"...). Skips "packed on" dates. Tested on 37 label formats. |
| `barcode.ts` | Barcode check-digit test (rejects camera misreads before calling the backend). |
| `lazyScreen.tsx` | Loads a screen only when opened (see the routes note above). |

Status thresholds live at the top of `expiry.ts`:

- `URGENT_MAX_DAYS = 2`, so **2 days or fewer** is **Urgent**
- `USE_SOON_MAX_DAYS = 5`, so **3–5 days** is **Use soon**
- **6 days or more** is **Safe**

**Produce without an expiration date** is shown by how long it has been stored (`PRODUCE_USE_SOON_AFTER_DAYS = 5`, `PRODUCE_URGENT_AFTER_DAYS = 7`). Those two numbers are **placeholders**: set them to your own rules.

Why `parseISODate` exists: `new Date('2026-10-21')` is read as UTC midnight, which shows up as **Oct 20** in US time zones. The helper builds the date from its parts in local time. Always use it instead of `new Date('YYYY-MM-DD')`.

### `src/data/`

| File | What it holds |
|---|---|
| `sampleData.ts` | Sample items and meals. Home uses the sample items **only when the backend cannot be reached** (a yellow note says so). The meals are still always sample data. |

---

## 3. How data flows

**Home screen**

```
backend GET /items -> useItems (hooks) -> HomeScreen -> ItemSection -> ItemRow -> StatusBadge
                                              |
                        callbacks (toggle manage, select item, remove) go back up
```

- State goes **down** through props. User actions go **up** through callback props such as `onToggleItem`.
- Home reloads the list every time it comes back into view, so a newly added item appears.
- If the backend is unreachable, Home shows the sample items and a yellow note with the reason.

**Add-item flow** (the draft lives in `features/addItem/AddItemContext.tsx`, created by `app/add/_layout.tsx`)

```
Home "+"  ->  Scan barcode  ->  Confirm item  ->  Scan date  ->  Review  ->  Add item
            \                                                    ^
             \-> Enter manually --------------------------------/ (same save step)
```

1. **Scan barcode:** `expo-camera` reads the barcode. The check digit is verified on the phone, then `GET /products/barcode/{code}` asks the backend, which asks Open Food Facts. 404 means "not found": the screen offers manual entry.
2. **Confirm item:** shows what was found. Nothing is saved yet.
3. **Scan date:** about once a second the screen takes a picture, `expo-mlkit-ocr` reads the text on the phone, and `parseExpirationDate` looks for a date. Open Food Facts has no expiration dates, so this step is needed.
4. **Review:** the user can edit everything. **Add item** sends `POST /items` and returns Home.

**How the screens map to the database** (`backend/sql/schema.sql`)

| Screen field | Database column | Rule enforced in the UI |
|---|---|---|
| Item name | `items.item_name` | Required, up to 200 characters |
| "Add to": Food Items / Produce Items | `items.category` = `packaged` / `produce` | Barcode items start as Food Items |
| Expiration date | `items.expiration_date` | **Required for Food Items, optional for Produce** (the database enforces the same) |
| Quantity | `items.quantity` | 1 to 99 (the database only requires 1 or more) |
| (not on screen) | `items.user_id`, `items.date_added` | Filled in by the backend |

The barcode, brand, package size and photo come from Open Food Facts for display only. The database has no columns for them.

## 4. Running the app

Run everything from the `FrontEnd` folder, in PowerShell.

```powershell
npm install
npx expo install @expo/vector-icons expo-font react-native-safe-area-context
npx expo start -c        # -c clears Metro's cache
```

**One-time setup for the add-item screens** (they use native code, so the app must be **rebuilt** once):

```powershell
npx expo install expo-camera @react-native-community/datetimepicker expo-mlkit-ocr expo-build-properties
```

Then add these to the `plugins` list in `app.json` (keep the plugins already there):

```json
["expo-camera", { "cameraPermission": "MiFoo uses the camera to scan barcodes and expiration dates.", "recordAudioAndroid": false }],
"expo-mlkit-ocr",
["expo-build-properties", { "ios": { "deploymentTarget": "16.0" } }]
```

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` (see "Connecting to the backend" below). Rebuild and start:

```powershell
npx expo run:android --device
npx expo start -c
```

**Development build on an Android phone** (needed later for push notifications and OCR; Expo Go can't do either):

```powershell
npx expo run:android --device    # needs Android Studio installed and the phone on USB debugging
```

`npx expo start` only starts the bundler. The app itself runs on the phone after the development build is installed.

---

### Connecting to the backend

The phone must be able to reach the backend. Set `EXPO_PUBLIC_API_URL` in `.env`, then restart with `npx expo start -c`:

| Situation | Value |
|---|---|
| Phone plugged in by USB (works on any Wi-Fi) | `http://localhost:8000`, after running `adb reverse tcp:8000 tcp:8000` (and `adb reverse tcp:8081 tcp:8081` for the dev server) |
| Phone and computer on the same home Wi-Fi | `http://<your computer's address>:8000`, and start the backend with `uvicorn app.main:app --host 0.0.0.0` |
| Presentation | The hosted backend's `https://` address |

Public and school Wi-Fi often blocks phones from reaching computers on the same network, which is why the USB method or a hosted backend is safer for demos.

---

## 5. Rules and gotchas learned so far

- **Never install the old global `expo-cli`** (`npm i -g expo-cli`). It is deprecated, and it hijacked `npx expo start` earlier. The real CLI is built into the `expo` package.
- **Never run `npm audit fix --force`** in this project. It rewrites dependency versions and breaks the matched set Expo needs.
- **Install Expo-related packages with `npx expo install <package>`**, not plain `npm install`. It picks the version that matches the SDK.
- **To repair version problems:** `npx expo install --check` (lists mismatches), `npx expo install --fix`, and `npx expo-doctor`.
- **If Metro misbehaves,** restart with `npx expo start -c`.
- **Long project paths can break Android builds.** The path contains spaces and parentheses and is long. If a build fails with odd file-not-found errors, move the repo to a short path like `C:\dev\MiFoo`.
- **A real phone can't reach your computer's `localhost`.** When the frontend calls the backend, use the computer's local network address (store it in one config value, not scattered through the code).
- **New native packages need a rebuild.** `expo-camera`, `expo-mlkit-ocr` and the date picker contain native code. A development build made before they were installed will not have them (the add-item screens show "This build is missing a native module"). Run `npx expo run:android --device` again.
- **Red underline under `'/add/scan-barcode'` in VS Code?** The route type list is regenerated when `npx expo start` runs. Restart it.
- **Date scanning needs light and a steady hand.** Fill the narrow guide with just the printed date. Use the flashlight button for dark packaging. If it cannot read a date, use "Enter date manually".
- **Secrets never go in Git.** Keep keys in `.env` files that are listed in `.gitignore`. The Supabase service key belongs in the backend only.

---

## 6. Placeholders and known gaps

| Area | Status |
|---|---|
| Colors | Estimated from a screenshot of the Figma design. Replace with exact values from Figma Dev Mode in `theme.ts`. |
| Font | System font is used. The design looks like Inter. |
| Meal images | Gray placeholders. Add photos to `assets/images` and set `image: require(...)` in `sampleData.ts`. |
| Carousel | Approximates Figma (center card larger, sides shrink). Cards do not overlap like the design. |
| Produce rows | Produce with an expiration date shows it. Produce without one shows "Stored N days" (thresholds are placeholders, see section 2). |
| Bottom nav bar | Visual only. `BottomNavBar` is drawn by `HomeScreen`. Once the Meals / Pantry / Profile screens exist, move the tab bar into `_layout.tsx` using expo-router tabs. |
| Add item | Built (section 3). The OCR date reading has not been tested on real packaging yet; tune `parseExpirationDate.ts` if a label format is missed. |
| Who is the user? | The backend currently saves every item under one test user (`DEV_USER_ID` in `backend/.env`). Login is not built yet. |
| Data | Home loads items from the backend. Meals are still sample data. |
| `explore` route | Placeholder. Rename or remove when its purpose is decided. |

---

## 7. Planned (not created yet)

These folders are part of the architecture but **do not exist yet**. Do not assume they are there.

- `src/features/notifications/`: Expo push notification handling.
- Login screens and the Supabase sign-in (the backend's `get_current_user_id` is the one function to change).
- Meals / Pantry / Profile screens and the real tab bar.

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
| The fields on an item | `src/types/item.ts` (the UML Item class and `backend/sql/schema.sql` should be updated too) |
| Where the backend is | `EXPO_PUBLIC_API_URL` in `.env` (read in `src/services/config.ts`) |
| What the add-item screens say | The matching file in `src/screens/add/` |
| Which dates the scanner understands | `src/utils/parseExpirationDate.ts` |
| Produce "stored N days" cutoffs | `PRODUCE_USE_SOON_AFTER_DAYS` / `PRODUCE_URGENT_AFTER_DAYS` in `src/utils/expiry.ts` |
