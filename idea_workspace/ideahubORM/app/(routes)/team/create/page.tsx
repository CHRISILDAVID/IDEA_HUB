import Link from "next/link";

const TeamCreatePage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Team workspaces are coming soon
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          We&apos;re focusing on the personal workspace experience right now.
          Please head back to the dashboard to continue editing your files.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600"
      >
        Go to dashboard
      </Link>
    </div>
  );
};

export default TeamCreatePage;
