import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-center">
      <p className="text-6xl font-bold text-slate-700">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-white">Page not found</h1>
      <p className="mt-2 text-sm text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/boards"
        className="mt-6 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
      >
        Go to Boards
      </Link>
    </main>
  );
}
