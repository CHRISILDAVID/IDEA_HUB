export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to IDEA HUB
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Migrated to Next.js with Prisma ORM
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Migration Complete!</h2>
            <p className="text-gray-700 mb-4">
              This project has been successfully migrated from:
            </p>
            <ul className="text-left space-y-2 mb-6">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Supabase → Prisma ORM</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>React (Vite) → Next.js</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Database schema converted to Prisma models</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Service layer updated for Prisma</span>
              </li>
            </ul>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-sm text-blue-700">
                <strong>Next Steps:</strong> Configure your DATABASE_URL in .env and run migrations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
