import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";

export default async function AdminServiceRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const request = await prisma.serviceRequest.findUnique({
    where: { id },
  });

  if (!request) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
          Service Request
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-blue-950 sm:text-3xl">
          {request.reference}
        </h1>
        <p className="mt-2 text-sm leading-6 text-blue-800/80 sm:text-base">
          {request.type} request submitted from the website.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="font-medium text-slate-500">Type</dt>
              <dd className="text-right text-slate-900">{request.type}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="font-medium text-slate-500">Status</dt>
              <dd className="text-right text-slate-900">{request.status}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="font-medium text-slate-500">Customer</dt>
              <dd className="text-right text-slate-900">
                {request.customerName ?? "Guest enquiry"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="font-medium text-slate-500">Email</dt>
              <dd className="text-right text-slate-900">
                {request.customerEmail ?? "No email provided"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="font-medium text-slate-500">Phone</dt>
              <dd className="text-right text-slate-900">
                {request.customerPhone ?? "No phone provided"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="font-medium text-slate-500">Amount</dt>
              <dd className="text-right text-slate-900">
                {request.amount
                  ? `${request.currency ?? "PKR"} ${request.amount.toString()}`
                  : "Not provided"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="font-medium text-slate-500">Created</dt>
              <dd className="text-right text-slate-900">
                {request.createdAt.toLocaleString()}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Payload</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
            {JSON.stringify(request.payload, null, 2)}
          </pre>
        </article>
      </section>
    </main>
  );
}
