"use server";

import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const storage = getStorage(firebaseApp);
const db = getFirestore(firebaseApp);

export async function deleteFile(userId: string, fileName: string) {
  if (!userId || !fileName) {
    return { success: false, error: "User ID and file name are required." };
  }

  try {
    const filePath = `user-files/${userId}/${fileName}`;
    const fileRef = ref(storage, filePath);
    
    // Delete from Firebase Storage
    await deleteObject(fileRef);

    // Delete from Firestore
    const fileDocRef = doc(db, "userFiles", userId);
    await deleteDoc(fileDocRef);

    return { success: true };
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
        // If file is not in storage, still try to delete firestore doc
        try {
            const fileDocRef = doc(db, "userFiles", userId);
            await deleteDoc(fileDocRef);
            return { success: true, message: "File already deleted from storage, removed record." };
        } catch (dbError: any) {
            return { success: false, error: dbError.message };
        }
    }
    return { success: false, error: error.message };
  }
}
