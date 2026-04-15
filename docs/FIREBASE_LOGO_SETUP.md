# Firebase Storage Configuration for Logo Management

## Project Structure

```
src/
├── lib/
│   ├── firebase-admin.ts      # Server-side Firebase Admin SDK
│   ├── firebase-client.ts     # Client-side Firebase SDK (new)
│   └── hooks/
│       └── use-logo-manager.ts # React hook for logo operations (new)
├── app/
│   └── api/
│       └── admin/
│           └── logos/
│               └── route.ts   # Logo API endpoints (new)
└── components/
    └── admin/
        └── logo-upload-form.tsx # Logo upload form component (new)
```

## Setup Steps

### 1. Install Firebase Client SDK

```bash
npm install firebase
```

### 2. Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Project Settings" (⚙️ icon)
4. Click "Service Accounts" tab
5. For Admin SDK: Click "Generate New Private Key"
6. For Web SDK: Copy the config from the "General" tab

### 3. Set Environment Variables

Create or update `.env.local`:

```env
# Firebase Admin SDK (Server-side only)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Firebase Client SDK (Publicly accessible - NEXT_PUBLIC prefix)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 4. Configure Firebase Storage Rules

Go to Firebase Console → Storage → Rules and update:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /logos/{allPaths=**} {
      // Public read access (via signed URLs)
      allow read: if true;

      // Write/Delete only for authenticated admin users
      allow write, delete: if request.auth != null &&
                              get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

## API Endpoints

### Upload Logo

```bash
POST /api/admin/logos
Content-Type: multipart/form-data

Parameters:
- file: File (image file, max 5MB)
- fileName: string (filename with extension, e.g., "company-logo.png")

Response:
{
  "success": true,
  "url": "https://firebasestorage.googleapis.com/v0/b/...",
  "fileName": "company-logo.png"
}
```

### Get Logo CDN URL

```bash
GET /api/admin/logos?fileName=company-logo.png

Response:
{
  "success": true,
  "url": "https://firebasestorage.googleapis.com/v0/b/...",
  "fileName": "company-logo.png"
}
```

### Delete Logo

```bash
DELETE /api/admin/logos?fileName=company-logo.png

Response:
{
  "success": true,
  "message": "Logo deleted successfully"
}
```

## Usage Examples

### In Admin Panel Component

```typescript
'use client';

import { LogoUploadForm } from '@/components/admin/logo-upload-form';

export function AdminLogoPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">Logo Management</h1>
      <LogoUploadForm />
    </div>
  );
}
```

### Using the Hook Directly

```typescript
'use client';

import { useLogoManager } from '@/lib/hooks/use-logo-manager';

export function MyComponent() {
  const { uploadLogo, getLogo, deleteLogo, isLoading, error } = useLogoManager();

  async function handleUpload() {
    const file = /* ... get file ... */;
    const result = await uploadLogo(file, 'my-logo-name');
    if (result) {
      console.log('Logo uploaded:', result.url);
    }
  }

  return (
    // Your component JSX
  );
}
```

## CDN Features

- ✅ **Signed URLs**: Secure 1-year expiring URLs
- ✅ **Auto Optimization**: Firebase delivers optimized images
- ✅ **Global CDN**: Distributed across edge locations
- ✅ **Automatic Scaling**: Handles any traffic volume
- ✅ **File Type Validation**: Only images allowed
- ✅ **Size Limits**: 5MB maximum per file

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to git
2. **CORS**: API endpoints are server-to-server (no CORS issues)
3. **Authentication**: Delete/Update endpoints should verify admin role
4. **Rate Limiting**: Consider adding rate limiting for production
5. **File Validation**: Always validate file type and size

## Troubleshooting

### "Firebase storage is not configured"

- Check all FIREBASE\_\* env variables are set
- Verify the service account JSON key is correct
- Restart the dev server after env changes

### Signed URL expired

- URLs have 1-year expiration
- Call GET endpoint again to get a fresh URL

### CORS errors

- These are typically client-side issues
- Use the API routes (they're server-to-server)

### Image not displaying

- Verify the file exists in Firebase Storage
- Check the download URL format
- Ensure Image component has proper dimensions

## Next Steps

1. Add logo management UI in admin panel
2. Link uploaded logos to settings/branding
3. Implement caching for CDN URLs
4. Add batch upload support
5. Implement image compression before upload
