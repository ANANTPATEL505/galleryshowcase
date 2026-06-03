# 🔒 Private Gallery

A premium QR-based private photo & video gallery. Guests scan a QR code, enter a PIN, and experience a cinematic slideshow. Built with Next.js 16, TypeScript, Tailwind CSS, Framer Motion — and **100% free backend services**.

## 🆓 Free Tier Services Used

| Service | What for | Free limit |
|---|---|---|
| **Firebase Auth** | Admin login | Free forever |
| **Firebase Firestore** | Gallery config + media metadata | 1 GB, 50k reads/day |
| **Cloudinary** | Photo & video storage | **25 GB storage + 25 GB bandwidth/month** |

> ✅ No credit card required for any of these.

---

## 🚀 Setup (10 minutes)

### Step 1 — Clone & install

```bash
npm install
cp .env.local.example .env.local
```

---

### Step 2 — Firebase (Auth + Firestore only)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Create project** (disable Analytics if asked)
2. **Authentication** → Get started → Sign-in method → **Email/Password** → Enable
3. **Authentication** → Users → **Add user** → enter your admin email + password
4. **Firestore Database** → Create database → choose a region → **Start in test mode**
5. **Project Settings** (gear icon) → General → scroll to **Your apps** → click **</>** Web → register app → copy the config

Fill in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=yourproject
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
```

Then lock down Firestore — go to **Firestore → Rules** and paste:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gallery/config {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /media/{docId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
  }
}
```

---

### Step 3 — Cloudinary (free file storage)

1. Sign up free at [cloudinary.com](https://cloudinary.com) — no credit card needed
2. After login you land on the **Dashboard** — you'll see your credentials right at the top:
   - **Cloud name**
   - **API Key**
   - **API Secret**

Fill in `.env.local`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnop
```

> 🔒 The API secret is **never sent to the browser** — it's only used in the `/api/upload` and `/api/delete-media` server routes.

---

### Step 4 — Run locally

```bash
npm run dev
```

| URL | Description |
|---|---|
| `http://localhost:3000` | Gallery PIN entry |
| `http://localhost:3000/gallery` | Photo/video slideshow |
| `http://localhost:3000/admin` | Admin dashboard |

---

## 📦 Deploy to Vercel (free)

```bash
npx vercel
```

In **Vercel → Project → Settings → Environment Variables**, add all 8 variables from your `.env.local`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## 🏗 Project Structure

```
gallery-app/
├── app/
│   ├── page.tsx                  # PIN entry + QR share
│   ├── gallery/page.tsx          # Slideshow + grid view
│   ├── admin/page.tsx            # Admin auth gate
│   └── api/
│       ├── upload/route.ts       # Cloudinary upload (server-side)
│       ├── delete-media/route.ts # Cloudinary delete (server-side)
│       └── verify-pin/route.ts   # PIN helper endpoint
├── components/
│   ├── AdminDashboard.tsx        # Manage media, settings, QR tab
│   ├── AdminLogin.tsx            # Firebase email/password login
│   ├── MediaCard.tsx             # Grid card with hover actions
│   └── UploadZone.tsx            # Drag-and-drop uploader
├── lib/
│   ├── firebase.ts               # Firebase init (Auth + Firestore)
│   ├── authContext.tsx           # useAuth() hook
│   ├── mediaService.ts           # Firestore CRUD + Cloudinary upload
│   └── utils.ts                  # Helpers
├── hooks/
│   └── useSwipe.ts               # Mobile swipe navigation
└── types/index.ts                # TypeScript types
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `→` / `Space` | Next slide |
| `←` | Previous slide |
| `F` | Toggle fullscreen |
| `P` | Play / Pause |
| `Esc` | Exit fullscreen / grid |

## 📱 Mobile Gestures

| Gesture | Action |
|---|---|
| Swipe left | Next |
| Swipe right | Previous |
| Tap | Show/hide controls |
