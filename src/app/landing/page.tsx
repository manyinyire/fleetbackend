import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Azaire Fleet Manager - Complete Fleet Management for Zimbabwe",
  description: "Manage vehicles, drivers, and finances in one place. Built for Zimbabwean businesses who need reliable fleet operations without the complexity.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-dark">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-dark/80 backdrop-blur-md border-b border-stroke dark:border-dark-3 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary">Azaire</span>
              <span className="text-2xl font-light text-dark dark:text-white ml-1">Fleet</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/sign-in"
                className="text-sm font-medium text-dark dark:text-white hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="text-sm font-medium bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-green/5 -z-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-green animate-pulse"></span>
              <span className="text-sm font-medium text-primary">Start managing your fleet today</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-dark dark:text-white mb-6 leading-tight">
              Your fleet,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green">simplified</span>
            </h1>
            <p className="text-xl sm:text-2xl text-dark-5 dark:text-dark-6 mb-10 leading-relaxed">
              Everything you need to manage vehicles, drivers, and finances.
              <br />
              <span className="text-dark dark:text-white font-medium">No spreadsheets. No confusion. Just control.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/sign-up"
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-primary/25 transition-all transform hover:-translate-y-0.5 text-lg"
              >
                Get Started Free
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-4 border-2 border-stroke dark:border-dark-3 text-dark dark:text-white rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-dark-2 transition-all text-lg"
              >
                See How It Works
              </Link>
            </div>
            <p className="mt-8 text-sm text-dark-5 dark:text-dark-6">
              <span className="font-semibold text-dark dark:text-white">100% free</span> • No credit card required • Setup in minutes
            </p>
          </div>

          {/* Hero Visual - Dashboard Preview */}
          <div className="mt-24 relative">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-green/20 to-primary/20 rounded-3xl blur-2xl -z-10"></div>
              
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-dark-2 dark:to-dark-3 rounded-2xl shadow-2xl overflow-hidden border border-stroke/50 dark:border-dark-3/50 backdrop-blur-sm">
                {/* Browser chrome */}
                <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-dark-3 dark:to-dark-2 h-14 flex items-center gap-2 px-6 border-b border-stroke dark:border-dark-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400 shadow-sm"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400 shadow-sm"></div>
                  </div>
                  <div className="flex-1 mx-4 bg-white dark:bg-dark rounded-lg px-4 py-1.5 text-xs text-dark-5 dark:text-dark-6">
                    azaire-fleet.com/dashboard
                  </div>
                </div>
                
                {/* Dashboard content */}
                <div className="p-8 bg-gradient-to-br from-white to-gray-50/50 dark:from-dark-2 dark:to-dark-3/50">
                  {/* Stats cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                      { label: "Active Vehicles", value: "24", color: "from-green-500 to-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
                      { label: "Total Drivers", value: "18", color: "from-blue-500 to-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
                      { label: "Monthly Revenue", value: "$45,230", color: "from-primary to-blue-600", bg: "bg-primary/10 dark:bg-primary/20" },
                    ].map((stat, i) => (
                      <div key={i} className={`${stat.bg} rounded-xl p-6 border border-stroke/50 dark:border-dark-3/50 hover:shadow-lg transition-all`}>
                        <div className="text-sm font-medium text-dark-5 dark:text-dark-6 mb-2">{stat.label}</div>
                        <div className="flex items-baseline gap-2">
                          <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${stat.color}`}></div>
                          <div className="text-3xl font-bold text-dark dark:text-white">{stat.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Chart area */}
                  <div className="bg-white dark:bg-dark-2 rounded-xl p-6 border border-stroke/50 dark:border-dark-3/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-dark dark:text-white">Fleet Overview</h3>
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <div className="w-2 h-2 rounded-full bg-green"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      </div>
                    </div>
                    <div className="h-48 bg-gradient-to-br from-gray-50 to-transparent dark:from-dark-3 dark:to-transparent rounded-lg flex items-end justify-around gap-2 p-4">
                      {[60, 80, 45, 90, 70, 85, 95].map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-primary to-blue-400 rounded-t-lg hover:from-green to-green-400 transition-all"
                          style={{ height: `${height}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-gray-dark dark:via-dark-2 dark:to-gray-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 mb-6">
              <span className="text-red-600 dark:text-red-400 text-sm font-medium">Common challenges</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-dark dark:text-white mb-6">
              Tired of juggling spreadsheets?
            </h2>
            <p className="text-xl text-dark-5 dark:text-dark-6 max-w-2xl mx-auto">
              Fleet management shouldn't require a computer science degree. Here's what most people deal with:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Scattered Information",
                description: "Vehicle records in Excel, driver contracts in filing cabinets, payments tracked in notebooks.",
                icon: "📊",
              },
              {
                title: "Time-Consuming Reports",
                description: "Hours spent compiling data for management. Manual calculations that invite errors.",
                icon: "⏱️",
              },
              {
                title: "No Real-Time Visibility",
                description: "Can't see what's happening right now. Problems discovered too late.",
                icon: "👁️",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group bg-white dark:bg-gray-dark rounded-2xl p-8 border border-stroke dark:border-dark-3 hover:shadow-xl hover:border-primary/20 dark:hover:border-primary/30 transition-all hover:-translate-y-1"
              >
                <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="text-xl font-bold text-dark dark:text-white mb-3">{item.title}</h3>
                <p className="text-dark-5 dark:text-dark-6 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-green/5 -z-10"></div>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 mb-6">
                <span className="w-2 h-2 rounded-full bg-green animate-pulse"></span>
                <span className="text-green-700 dark:text-green-400 text-sm font-medium">The solution</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-dark dark:text-white mb-6">
                Everything in one place
              </h2>
              <p className="text-xl text-dark-5 dark:text-dark-6 mb-10 leading-relaxed">
                Azaire Fleet Manager brings all your fleet operations together. Vehicles, drivers, maintenance, finances—all accessible from anywhere, even offline.
              </p>
              <div className="space-y-5">
                {[
                  "Track every vehicle's status, maintenance, and history",
                  "Manage driver contracts and payments digitally",
                  "Monitor income, expenses, and profitability in real-time",
                  "Work offline and sync when you're back online",
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-green flex items-center justify-center mt-0.5 group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-lg text-dark dark:text-white pt-0.5">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-green/20 rounded-3xl blur-xl -z-10"></div>
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-dark-2 dark:to-dark-3 rounded-2xl shadow-2xl p-8 border border-stroke/50 dark:border-dark-3/50 backdrop-blur-sm">
                  <div className="space-y-5">
                    {[
                      { label: "Active Vehicles", value: "24", color: "from-green-500 to-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
                      { label: "Total Drivers", value: "18", color: "from-blue-500 to-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
                      { label: "Monthly Revenue", value: "$45,230", color: "from-primary to-blue-600", bg: "bg-primary/10 dark:bg-primary/20" },
                      { label: "Pending Maintenance", value: "3", color: "from-yellow-500 to-orange-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
                    ].map((stat, i) => (
                      <div key={i} className={`${stat.bg} flex items-center justify-between p-5 rounded-xl border border-stroke/30 dark:border-dark-3/30 hover:shadow-lg transition-all group`}>
                        <span className="text-dark dark:text-white font-semibold">{stat.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-dark dark:text-white group-hover:scale-110 transition-transform">{stat.value}</span>
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${stat.color} shadow-sm`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-gray-dark dark:via-dark-2 dark:to-gray-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 mb-6">
              <span className="text-primary text-sm font-medium">Powerful features</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-dark dark:text-white mb-6">
              Built for real fleet operations
            </h2>
            <p className="text-xl text-dark-5 dark:text-dark-6 max-w-2xl mx-auto">
              Features that actually matter for running a fleet business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Vehicle Management",
                description: "Complete vehicle profiles with registration, insurance, and maintenance schedules. Know exactly where each vehicle is and its condition.",
                color: "from-blue-500 to-blue-600",
              },
              {
                title: "Driver Management",
                description: "Digital contracts, payment tracking, and assignment history. Keep driver records organized and accessible.",
                color: "from-green-500 to-green-600",
              },
              {
                title: "Financial Tracking",
                description: "Track income from trips, expenses for fuel and maintenance, and see your actual profitability. Generate reports in seconds.",
                color: "from-purple-500 to-purple-600",
              },
              {
                title: "Maintenance Scheduling",
                description: "Never miss a service again. Automated reminders and maintenance history help you avoid costly breakdowns.",
                color: "from-orange-500 to-orange-600",
              },
              {
                title: "Offline Capable",
                description: "Works without internet. Queue actions when offline, sync automatically when you're back online. Perfect for remote areas.",
                color: "from-red-500 to-red-600",
              },
              {
                title: "Real-Time Dashboard",
                description: "See your entire fleet at a glance. Quick insights into vehicle status, driver assignments, and financial performance.",
                color: "from-indigo-500 to-indigo-600",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group bg-white dark:bg-gray-dark rounded-2xl p-8 border border-stroke dark:border-dark-3 hover:shadow-2xl hover:border-primary/30 dark:hover:border-primary/30 transition-all hover:-translate-y-2 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} mb-6 shadow-lg group-hover:scale-110 transition-transform flex items-center justify-center`}>
                  <div className="w-6 h-6 bg-white/20 rounded-lg"></div>
                </div>
                <h3 className="text-xl font-bold text-dark dark:text-white mb-3 relative z-10">{feature.title}</h3>
                <p className="text-dark-5 dark:text-dark-6 leading-relaxed relative z-10">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green/5 via-transparent to-primary/5 -z-10"></div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 mb-6">
              <span className="text-blue-700 dark:text-blue-400 text-sm font-medium">Simple process</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-dark dark:text-white mb-6">
              Get started in minutes
            </h2>
            <p className="text-xl text-dark-5 dark:text-dark-6 max-w-2xl mx-auto">
              No complicated setup. No training required. Just sign up and start managing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Sign Up",
                description: "Create your account. No credit card needed. Start with a 14-day free trial.",
              },
              {
                step: "2",
                title: "Add Your Fleet",
                description: "Import your vehicles and drivers. Our setup wizard guides you through it.",
              },
              {
                step: "3",
                title: "Start Managing",
                description: "Begin tracking trips, payments, and maintenance. Everything syncs automatically.",
              },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="bg-white dark:bg-gray-dark rounded-2xl p-8 border border-stroke dark:border-dark-3 hover:shadow-xl hover:border-primary/30 dark:hover:border-primary/30 transition-all h-full">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-green flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-dark dark:text-white mb-3">{item.title}</h3>
                  <p className="text-dark-5 dark:text-dark-6 leading-relaxed">{item.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-10 h-1 bg-gradient-to-r from-primary to-green rounded-full"></div>
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                      <div className="w-0 h-0 border-l-[10px] border-l-green border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-green -z-10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20 -z-10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to simplify your fleet management?
          </h2>
          <p className="text-xl text-white/95 mb-10 leading-relaxed">
            Join businesses across Zimbabwe who trust Azaire Fleet Manager
          </p>
          <Link
            href="/auth/sign-up"
            className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-primary rounded-xl font-semibold hover:bg-gray-50 hover:shadow-2xl transition-all transform hover:-translate-y-1 text-lg"
          >
            Get Started Free
            <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <p className="mt-8 text-white/90 text-sm font-medium">
            <span className="text-white font-bold">100% free</span> • No credit card required • Setup in minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-stroke dark:border-dark-3">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <span className="text-xl font-bold text-primary">Azaire</span>
                <span className="text-xl font-light text-dark dark:text-white ml-1">Fleet</span>
              </div>
              <p className="text-sm text-dark-5 dark:text-dark-6">
                Complete fleet management for Zimbabwean businesses
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-dark dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-dark-5 dark:text-dark-6">
                <li><Link href="#features" className="hover:text-primary">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-primary">How It Works</Link></li>
                <li><Link href="/auth/sign-up" className="hover:text-primary">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-dark dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-dark-5 dark:text-dark-6">
                <li><Link href="#" className="hover:text-primary">About</Link></li>
                <li><Link href="#" className="hover:text-primary">Contact</Link></li>
                <li><Link href="#" className="hover:text-primary">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-dark dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-dark-5 dark:text-dark-6">
                <li><Link href="#" className="hover:text-primary">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-stroke dark:border-dark-3 text-center text-sm text-dark-5 dark:text-dark-6">
            <p>© {new Date().getFullYear()} Azaire Fleet Manager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

