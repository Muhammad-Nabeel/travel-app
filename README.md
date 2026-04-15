Safar Umrah is a Next.js travel-platform starter for flights, hotels, and admin-managed Umrah packages.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- DaisyUI
- Prisma ORM
- Supabase Postgres

## Current Scope

- Public landing page for the travel platform
- Flight search foundation with a normalized placeholder API
- Hotel search foundation with a normalized placeholder API
- Admin area for Umrah package management
- Prisma schema for users, bookings, search logs, and packages
- Environment placeholders for Sabre and Amadeus credentials

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
copy .env.example .env
```

3. Update your Supabase connection strings and provider credentials in `.env`.

For Firebase logo storage, also add:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (use escaped newlines like `\\n`)
- `FIREBASE_STORAGE_BUCKET` (example: `your-project-id.appspot.com`)

`DATABASE_URL` should use the Supabase pooled connection string for runtime and Vercel.

`DIRECT_URL` should use the direct Supabase Postgres connection string for Prisma CLI commands.

4. Generate the Prisma client:

```bash
npm run prisma:generate
```

5. Push the schema to Supabase or apply migrations:

```bash
npm run db:push
```

For CI or production promotion, use:

```bash
npm run prisma:deploy
```

6. Start the development server:

```bash
npm run dev
```

7. Open http://localhost:3000 in your browser.

## Logo Management (Firebase)

- Go to `/admin/logos` to upload or remove airline logos.
- Uploaded files are stored in Firebase Storage and persisted in admin settings.
- The homepage airlines slider automatically reads from the managed logo list.

## Prisma Commands

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:deploy
npm run db:push
```

## Supabase And Vercel

- Use the Supabase pooled connection string for `DATABASE_URL` in local `.env` and Vercel environment variables.
- Use the direct Supabase connection string for `DIRECT_URL` when running Prisma CLI commands.
- Run `npm run prisma:deploy` during deployment before the application serves traffic.
- If you are moving existing MySQL data, export it from the old database and import it into Supabase before switching production traffic.

## Suggested Next Steps

1. Add authentication and role-based access control for admin routes.
2. Replace mock package data with Prisma queries.
3. Implement Sabre and Amadeus adapters in `src/lib/providers`.
4. Add booking flows and payment orchestration after provider search is stable.

## Project Structure

- `src/app` for public pages, admin pages, and API routes
- `src/lib/db.ts` for Prisma client setup
- `src/lib/mock-data.ts` for placeholder normalized data used during early UI development
- `src/lib/validations/search.ts` for shared request validation
- `prisma/schema.prisma` for the data model

## Notes

- Search APIs currently return placeholder data so the UI and API contracts can be built before live GDS integration.
- Use the Sabre and Amadeus sandbox environments first.
- Move provider-specific mapping into separate adapter modules to keep the rest of the codebase stable.
