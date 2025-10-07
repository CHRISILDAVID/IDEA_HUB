export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Ideahub_workspace</h1>
      <p className="text-sm text-neutral-400 mt-2">Use /workspace/:id to open a file. Create one via POST /api/workspace.</p>
    </div>
  );
}
