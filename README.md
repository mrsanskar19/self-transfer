# Ephemeral Vault

Ephemeral Vault is a secure file storage application where your files are automatically deleted after 1 hour or after being downloaded. This ensures your data remains private and temporary.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) and built with Firebase.

## Core Features

- **Secure User Authentication**: Sign up and log in with email and password.
- **Temporary File Storage**: Upload a single file that replaces any previous one.
- **Automatic Deletion**: Files are deleted 1 hour after upload or immediately after download.
- **Private Access**: Only you can access and download your files.

## Getting Started

### 1. Prerequisites

- Node.js (v18 or later)
- npm or yarn

### 2. Firebase Setup

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Create a new project (or use an existing one).
3.  Go to **Project Settings** > **General**.
4.  Under "Your apps", click the web icon (`</>`) to add a new web app.
5.  Register your app and copy the `firebaseConfig` object values.
6.  Enable **Authentication**: Go to **Authentication** > **Sign-in method** and enable the **Email/Password** provider.
7.  Enable **Firestore**: Go to **Firestore Database** and create a database in production mode.
8.  Enable **Storage**: Go to **Storage** and get started.
9.  **Important Security Rules**:
    *   In **Firestore Database** > **Rules**, paste the following and publish:
        ```
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /userFiles/{userId} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
            }
          }
        }
        ```
    *   In **Storage** > **Rules**, paste the following and publish:
        ```
        rules_version = '2';
        service firebase.storage {
          match /b/{bucket}/o {
            match /user-files/{userId}/{allPaths=**} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
            }
          }
        }
        ```

### 3. Project Setup

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env.local` file in the root of the project by copying `.env.local.example`.
4.  Fill in the `.env.local` file with your Firebase config values from step 2.5.

    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
    # ... and so on
    ```

### 4. Running the Development Server

To run the app locally, use the following command:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.
