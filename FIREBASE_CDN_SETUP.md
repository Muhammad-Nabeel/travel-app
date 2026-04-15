# Firebase Storage CDN Setup for Logo Management

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_STORAGE_BUCKET=your-storage-bucket.appspot.com

# Firebase Client SDK (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Firebase Storage Rules

Add these rules to your Firebase Console Storage Rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /logos/{allPaths=**} {
      // Allow read from anywhere with signed URLs
      allow read: if request.auth != null || true;
      // Allow write only to authenticated admins
      allow write: if request.auth != null && request.auth.token.admin == true;
      // Allow delete only to authenticated admins
      allow delete: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## API Endpoints

### Upload Logo

**POST** `/api/admin/logos`

```typescript
const formData = new FormData();
formData.append("file", file); // File object
formData.append("fileName", "my-logo.png");

const response = await fetch("/api/admin/logos", {
  method: "POST",
  body: formData,
});

// Response: { success: true, url: string, fileName: string }
```

### Get Logo CDN URL

**GET** `/api/admin/logos?fileName=my-logo.png`

```typescript
const response = await fetch("/api/admin/logos?fileName=my-logo.png");
const data = await response.json();
// Use data.url for the logo download/display
```

### Delete Logo

**DELETE** `/api/admin/logos?fileName=my-logo.png`

```typescript
const response = await fetch("/api/admin/logos?fileName=my-logo.png", {
  method: "DELETE",
});
```

## Usage in Components

### Upload Logo

```typescript
'use client';

import { useState } from 'react';

export function LogoUploader() {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', `logo-${Date.now()}`);

      const response = await fetch('/api/admin/logos', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      console.log('Logo URL:', data.url);
      // Use the URL for display or save to database
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <input
      type="file"
      accept="image/*"
      onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
      disabled={uploading}
    />
  );
}
```

### Display Logo from CDN

```typescript
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export function LogoDisplay({ fileName }: { fileName: string }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/logos?fileName=${fileName}`)
      .then((res) => res.json())
      .then((data) => setLogoUrl(data.url))
      .catch(console.error);
  }, [fileName]);

  if (!logoUrl)
    return <div className="bg-gray-200 animate-pulse w-32 h-32" />;

  return (
    <Image
      src={logoUrl}
      alt="Logo"
      width={128}
      height={128}
      className="rounded-lg"
    />
  );
}
```

## Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Storage**
4. Create a storage bucket (or use the default)
5. Update storage rules (see above)
6. Get your credentials from **Project Settings → Service Accounts**

## Features

- ✅ Secure server-side uploads using Firebase Admin SDK
- ✅ CDN delivery via signed URLs (1-year expiration)
- ✅ Support for logo deletion
- ✅ CORS-friendly API endpoints
- ✅ Automatic file type detection
- ✅ Error handling and validation
