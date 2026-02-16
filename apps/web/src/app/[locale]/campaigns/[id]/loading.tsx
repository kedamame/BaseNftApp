export default function CampaignDetailLoading() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 h-7 w-48 animate-pulse rounded bg-gray-200" />
      <div className="space-y-6">
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
        <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
        <div className="space-y-2">
          <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      </div>
    </main>
  );
}
