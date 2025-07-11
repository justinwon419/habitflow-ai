export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 shadow-sm border-b">
        <h1 className="text-3xl font-extrabold text-[#367BDB] tracking-tight">
          HabitFlow
        </h1>
        <a
          href="/login"
          className="px-5 py-2 rounded-full bg-[#367BDB] text-white font-semibold shadow-md hover:bg-[#2d6bbd] transition"
        >
          Log In
        </a>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32">
        <h2 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
          Build better habits.
        </h2>
        <p className="text-lg sm:text-xl max-w-xl mb-10 text-gray-600">
          HabitFlow helps you stay consistent, track your goals, and build lasting routines.
        </p>
        <a
          href="/login"
          className="px-8 py-4 rounded-full bg-[#367BDB] text-white font-semibold text-lg shadow-lg hover:bg-[#2d6bbd] transition"
        >
          Get Started
        </a>
      </main>

      {/* Footer */}
      <footer className="text-sm text-center text-gray-500 py-6 border-t">
        &copy; {new Date().getFullYear()} HabitFlow. All rights reserved.
      </footer>
    </div>
  )
}
