Safar Umrah is a Next.js travel-platform starter for flights, hotels, and admin-managed Umrah packages.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- DaisyUI
- Prisma ORM
- MySQL

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

3. Update `DATABASE_URL` and provider credentials in `.env`.

4. Generate the Prisma client:

```bash
npm run prisma:generate
```

5. Start the development server:

```bash
npm run dev
```

6. Open http://localhost:3000 in your browser.

## Prisma Commands

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run db:push
```

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
