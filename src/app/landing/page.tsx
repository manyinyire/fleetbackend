import Link from "next/link";
import { Metadata } from "next";
import { RevenueChart } from "@/components/landing/revenue-chart";
import { getPlatformSettingsWithDefaults } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettingsWithDefaults();

  return {
    title: `${settings.platformName} - Fleet Management Made Simple`,
    description: `Professional fleet management software for modern businesses. Track vehicles, manage drivers, and grow your operations.`,
  };
}

export default async function LandingPage() {
  const settings = await getPlatformSettingsWithDefaults();
  
  // Fetch pricing plans from database
  const pricingPlans = await prisma.planConfiguration.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  });
  return (
    <div className="min-h-screen bg-white bg-atmospheric dark:bg-gray-dark">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-dark/80 backdrop-blur-lg border-b border-stroke dark:border-stroke-dark z-50 transition-smooth">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {settings.platformLogo ? (
                <img
                  src={settings.platformLogo}
                  alt={settings.platformName}
                  className="h-8 w-auto"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary dark:bg-primary-light rounded"></div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{settings.platformName}</span>
                </div>
              )}
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Features</a>
              <a href="#pricing" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Pricing</a>
              <a href="#testimonials" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Testimonials</a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/sign-in"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/auth/sign-up"
                className="text-sm px-4 py-2 bg-primary dark:bg-primary-light text-white rounded hover:bg-primary-dark dark:hover:bg-primary"
              >
                Start for free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 dark:bg-primary/10 text-primary-dark dark:text-primary-light text-sm rounded-full mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Trusted by 500+ fleet managers
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-gradient-forest dark:text-white mb-4 sm:mb-6 leading-tight animate-fade-in">
              Fleet management made simple
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Everything you need to run your fleet efficiently. Track vehicles, manage drivers, and monitor finances—all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-6 sm:mb-8 max-w-md mx-auto sm:max-w-none">
              <Link
                href="/auth/sign-up"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-primary dark:bg-primary-light text-white text-base font-semibold rounded-lg hover:bg-primary-dark dark:hover:bg-primary text-center transition-all hover:shadow-lg active:scale-[0.98]"
              >
                Start for free
              </Link>

              <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-base font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.98]">
                Contact Us
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary dark:text-primary-light" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary dark:text-primary-light" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Setup in 5 minutes
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary dark:text-primary-light" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Cancel anytime
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Browser chrome */}
              <div className="bg-gray-100 dark:bg-gray-900 h-10 flex items-center gap-2 px-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 mx-4 bg-white dark:bg-gray-800 rounded px-3 py-1 text-xs text-gray-600 dark:text-gray-400">
                  fleetmanager.co.zw/dashboard
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-6 sm:p-8 bg-gray-50 dark:bg-gray-900">
                {/* Stats cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Active Vehicles", value: "47", icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )},
                    { label: "Total Revenue", value: "$128.5K", icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )},
                    { label: "Active Drivers", value: "36", icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )},
                    { label: "Avg. Profit", value: "35%", icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    )},
                  ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-gray-400 dark:text-gray-500">
                          {stat.icon}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</div>
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Revenue Chart */}
                <RevenueChart />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Built for efficiency
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
              Real results from fleet managers using our platform
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                metric: "20+ hours",
                label: "Saved per week",
                description: "Automate paperwork and data entry",
              },
              {
                metric: "35% increase",
                label: "In profitability",
                description: "Better insights lead to better decisions",
              },
              {
                metric: "$2,400",
                label: "Saved monthly",
                description: "Reduce waste and optimize operations",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="text-2xl sm:text-3xl font-display font-bold text-primary dark:text-primary-light mb-2">
                  {item.metric}
                </div>
                <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">{item.label}</div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Everything you need
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
              Powerful features designed for fleet operations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {[
              {
                title: "Vehicle Management",
                description: "Track maintenance, fuel, insurance, and performance for every vehicle in your fleet.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                title: "Driver Management",
                description: "Organize contracts, payments, and performance metrics for all your drivers.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
              },
              {
                title: "Financial Tracking",
                description: "Monitor income, expenses, and profitability with real-time reporting.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                title: "Maintenance Scheduling",
                description: "Automated reminders keep your fleet running and prevent costly breakdowns.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                ),
              },
              {
                title: "Offline Mode",
                description: "Work without internet. Your data syncs automatically when you're back online.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                title: "Real-Time Dashboard",
                description: "Monitor fleet status, revenues, and performance at a glance.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="text-primary dark:text-primary-light mb-3 sm:mb-4">
                  {feature.icon}
                </div>

                <h3 className="text-base sm:text-lg font-display font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 px-4 sm:px-6 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by fleet managers
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              4.9/5 rating from 500+ reviews
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Tapiwa Moyo",
                role: "Fleet Manager, TransportCo",
                text: "We went from spending 3 hours daily on paperwork to just 20 minutes. Our profitability increased by 40% in the first quarter.",
              },
              {
                name: "Sarah Ndlovu",
                role: "Operations Director, LogisticsPro",
                text: "Real-time tracking saved us from costly maintenance issues. ROI within 2 months. Best investment we made this year.",
              },
              {
                name: "Michael Chikwanha",
                role: "Owner, City Cabs",
                text: "Driver management alone saves us 10 hours weekly. The offline feature is perfect for our connectivity challenges.",
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary dark:bg-primary-light rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Choose the plan that fits your fleet
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => {
              const features = Array.isArray(plan.features) ? plan.features : [];
              const isPopular = plan.displayName === 'Professional';
              const isFree = Number(plan.monthlyPrice) === 0;
              const ctaText = plan.displayName === 'Enterprise' ? 'Contact sales' : 'Start for free';
              
              return (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-gray-800 rounded-lg p-6 border-2 ${
                  isPopular
                    ? "border-primary dark:border-primary-light shadow-md"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary dark:bg-primary-light text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most popular
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{plan.displayName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      ${Number(plan.monthlyPrice).toFixed(0)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      /{isFree ? 'Forever' : 'per month'}
                    </span>
                  </div>
                </div>

                <Link
                  href="/auth/sign-up"
                  className={`block w-full text-center py-3 rounded font-medium mb-6 ${
                    isPopular
                      ? "bg-primary dark:bg-primary-light text-white hover:bg-primary-dark dark:hover:bg-primary"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {ctaText}
                </Link>

                <ul className="space-y-3">
                  {features.map((feature: string, j: number) => (
                    <li key={j} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary dark:text-primary-light flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              All plans include full access for 14 days. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-gray-600 dark:text-gray-400">
              <span>Cancel anytime</span>
              <span className="hidden sm:inline">•</span>
              <span>30-day money-back guarantee</span>
              <span className="hidden sm:inline">•</span>
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 px-4 sm:px-6 bg-forest-amber dark:bg-primary-dark">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>

          <p className="text-xl text-white/90 mb-8">
            Join 500+ fleet managers who trust our platform
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/sign-up"
              className="w-full sm:w-auto px-8 py-4 bg-white text-primary rounded font-semibold hover:bg-gray-100"
            >
              Start for free
            </Link>

            <button className="w-full sm:w-auto px-8 py-4 border-2 border-white text-white rounded font-semibold hover:bg-primary-dark">
              Schedule demo
            </button>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-white/90">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No credit card
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              14-day access
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                {settings.platformLogo ? (
                  <img
                    src={settings.platformLogo}
                    alt={settings.platformName}
                    className="h-8 w-auto"
                  />
                ) : (
                  <>
                    <div className="w-8 h-8 bg-primary dark:bg-primary-light rounded"></div>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">{settings.platformName}</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Professional fleet management for modern businesses.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#features" className="hover:text-gray-900 dark:hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-gray-900 dark:hover:text-white">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-gray-900 dark:hover:text-white">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>© {new Date().getFullYear()} {settings.platformName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
