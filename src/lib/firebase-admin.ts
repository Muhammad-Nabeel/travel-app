import "server-only";

import type { Bucket } from "@google-cloud/storage";
import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

let firebaseAdminApp: App | null = null;

function getRequiredEnv(name: string) {
    const value = process.env[name]?.trim();
    return value && value.length > 0 ? value : null;
}

function isFirebaseConfigured() {
    return Boolean(
        getRequiredEnv("FIREBASE_PROJECT_ID") &&
        getRequiredEnv("FIREBASE_CLIENT_EMAIL") &&
        getRequiredEnv("FIREBASE_PRIVATE_KEY") &&
        getRequiredEnv("FIREBASE_STORAGE_BUCKET"),
    );
}

function getFirebaseAdminApp() {
    if (!isFirebaseConfigured()) {
        throw new Error("Firebase storage is not configured.");
    }

    if (firebaseAdminApp) {
        return firebaseAdminApp;
    }

    const existing = getApps()[0];
    if (existing) {
        firebaseAdminApp = existing;
        return existing;
    }

    firebaseAdminApp = initializeApp({
        credential: cert({
            projectId: getRequiredEnv("FIREBASE_PROJECT_ID")!,
            clientEmail: getRequiredEnv("FIREBASE_CLIENT_EMAIL")!,
            privateKey: getRequiredEnv("FIREBASE_PRIVATE_KEY")!.replace(/\\n/g, "\n"),
        }),
        storageBucket: getRequiredEnv("FIREBASE_STORAGE_BUCKET")!,
    });

    return firebaseAdminApp;
}

export function getFirebaseStorageBucket(): Bucket {
    const app = getFirebaseAdminApp();
    return getStorage(app).bucket();
}

export function getFirebasePublicUrl(storagePath: string) {
    const bucket = getFirebaseStorageBucket();
    return `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(storagePath).replace(/%2F/g, "/")}`;
}

export function canUseFirebaseStorage() {
    return isFirebaseConfigured();
}
