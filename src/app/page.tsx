export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#F9F9F9] font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A] shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#4296F7]">
          DayOne
        </h1>
        <a
          href="/login"
          className="px-5 py-2 rounded-full bg-[#4296F7] text-white font-semibold shadow-md hover:bg-[#409EFF] transition"
        >
          Log In
        </a>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32">
        <h2 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
          Start your journey.
        </h2>
        <p className="text-lg sm:text-xl max-w-xl mb-10 text-[#89C6FF]">
          DayOne helps you stay consistent, build better habits, and transform your routines—one day at a time.
        </p>
        <a
          href="/login"
          className="px-8 py-4 rounded-full bg-[#4296F7] text-white font-semibold text-lg shadow-lg hover:bg-[#409EFF] transition"
        >
          Get Started
        </a>
      </main>

      {/* Footer */}
      <footer className="text-sm text-center text-[#717C89] py-6 border-t border-[#1A1A1A]">
        &copy; {new Date().getFullYear()} DayOne. All rights reserved. Created by Justin Won.
      </footer>
    </div>
  )
}
