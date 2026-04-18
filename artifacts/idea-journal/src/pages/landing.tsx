import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f0f0ee] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#2d7d6f] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 2.74 1.54 5.12 3.82 6.37L8 18h8l-.82-2.63C17.46 14.12 19 11.74 19 9c0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5z" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-semibold text-gray-900 leading-tight">Planora</div>
            <div className="text-[11px] text-gray-500 leading-tight">Ideas into motion</div>
          </div>
        </div>

        <nav className="flex items-center gap-4">
          <Link
            href="/share"
            className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            Public portfolio
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-white bg-[#2d7d6f] hover:bg-[#236158] transition-colors px-4 py-2 rounded-md"
          >
            Sign up
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center">
        <div className="w-full max-w-6xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left column */}
          <div className="space-y-6">
            <span className="inline-block text-sm text-gray-600 border border-gray-300 bg-white/60 px-3 py-1 rounded-full">
              Personal research and idea journal
            </span>

            <h1 className="text-5xl lg:text-[56px] font-serif font-bold text-gray-900 leading-[1.08] tracking-tight">
              Capture rough ideas, track progress, and share the ones that grow.
            </h1>

            <p className="text-base text-gray-600 leading-relaxed max-w-md">
              Planora keeps your private idea workspace separate for each account, then lets you publish selected ideas to a clean public portfolio.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <Link
                href="/dashboard"
                className="inline-block text-sm font-medium text-white bg-[#2d7d6f] hover:bg-[#236158] transition-colors px-5 py-2.5 rounded-md"
              >
                Create your account
              </Link>
              <Link
                href="/dashboard"
                className="inline-block text-sm text-gray-700 hover:text-gray-900 transition-colors px-4 py-2.5"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Right column — step cards */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-2 space-y-1">
            {[
              {
                title: "Seed",
                description: "Save sparks before they disappear.",
              },
              {
                title: "Plan",
                description: "Choose priorities and next steps.",
              },
              {
                title: "Build",
                description: "Add progress notes as your research develops.",
              },
              {
                title: "Share",
                description: "Publish finished thinking to a public portfolio.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="px-5 py-4 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
