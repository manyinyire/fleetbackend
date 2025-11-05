import Link from "next/link";
import { Metadata } from "next";
import { RevenueChart } from "@/components/landing/revenue-chart";
import { getPlatformSettingsWithDefaults } from "@/lib/platform-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettingsWithDefaults();
  
  return {
    title: `${settings.platformName} - Transform Your Fleet Operations | Save 20+ Hours Weekly`,
    description: `The #1 fleet management platform trusted by 500+ businesses. Track vehicles, manage drivers, and boost profitability by 35%. Try free for 14 days.`,
  };
}

export default async function LandingPage() {
  const settings = await getPlatformSettingsWithDefaults();
  return (
    <div className="min-h-screen bg-white dark:bg-gray-dark overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-dark/95 backdrop-blur-xl border-b border-stroke/50 dark:border-dark-3/50 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-12">
            <div className="flex items-center">
                {settings.platformLogo ? (
                  <img
                    src={settings.platformLogo}
                    alt={settings.platformName}
                    className="h-10 w-auto object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-green flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">{settings.platformName.charAt(0)}</span>
                  </div>
                )}
                <span className="text-2xl font-bold text-primary ml-3">{settings.platformName}</span>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors">Features</a>
                <a href="#pricing" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors">Pricing</a>
                <a href="#testimonials" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors">Reviews</a>
              </div>
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
                className="text-sm font-semibold bg-primary text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all transform hover:scale-105 hover:bg-primary/90"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enhanced */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(16,185,129,0.1),transparent_50%)] -z-10"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green/10 rounded-full blur-3xl animate-pulse -z-10" style={{ animationDelay: '1s' }}></div>
        
        <div className="max-w-7xl mx-auto">
          {/* Trust badges */}
          <div className="flex justify-center mb-12 gap-8 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5 text-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">500+ Active Users</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Bank-Level Security</span>
            </div>
          </div>

          <div className="text-center max-w-5xl mx-auto">
            {/* Social proof badge */}
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 mb-8 shadow-sm">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-primary border-2 border-white dark:border-gray-dark"></div>
                ))}
              </div>
              <span className="text-sm font-semibold text-dark dark:text-white">Trusted by 500+ Fleet Managers</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-dark dark:text-white mb-8 leading-tight">
              Manage Your Fleet,<br />
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-green">Multiply Your Profits</span>
                <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 300 8" fill="none">
                  <path d="M2 5.5C60 2.5 120 2.5 240 5.5C270 6.5 290 6.5 298 5.5" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgb(99, 102, 241)" />
                      <stop offset="50%" stopColor="rgb(59, 130, 246)" />
                      <stop offset="100%" stopColor="rgb(16, 185, 129)" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 mb-4 leading-relaxed max-w-3xl mx-auto">
              The all-in-one platform that <span className="font-bold text-gray-900 dark:text-white">saves fleet managers 20+ hours weekly</span> and increases profitability by an average of <span className="font-bold text-green-600 dark:text-green-400">35%</span>.
            </p>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Join hundreds of businesses who ditched spreadsheets for smart fleet management.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-8">
              <Link
                href="/auth/sign-up"
                className="group w-full sm:w-auto px-10 py-5 bg-primary text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-primary/30 transition-all transform hover:scale-105 text-lg hover:bg-primary/90"
              >
                <span className="flex items-center justify-center gap-2">
                  Start Free 14-Day Trial
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              
              <button className="group w-full sm:w-auto px-10 py-5 border-2 border-stroke dark:border-dark-3 text-dark dark:text-white rounded-2xl font-semibold hover:bg-gray-50 dark:hover:bg-dark-2 hover:border-primary/50 dark:hover:border-primary/50 transition-all text-lg flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-green flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Watch Demo</span>
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 text-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 text-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 text-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Enhanced Dashboard Preview with 3D Effect */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-green/30 to-blue-600/30 rounded-[2rem] blur-3xl transform scale-105 -z-10"></div>
            
            <div className="relative bg-gradient-to-br from-white via-gray-50 to-white dark:from-dark-2 dark:via-dark-3 dark:to-dark-2 rounded-[2rem] shadow-2xl overflow-hidden border border-stroke/50 dark:border-dark-3/50 transform perspective-1000 hover:scale-[1.02] transition-transform duration-500">
              {/* Browser chrome with gradient */}
              <div className="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-dark-3 dark:via-dark-2 dark:to-dark-3 h-14 flex items-center gap-3 px-6 border-b border-stroke dark:border-dark-3">
                  <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm ring-2 ring-red-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm ring-2 ring-yellow-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm ring-2 ring-green-500/20"></div>
                  </div>
                  <div className="flex-1 mx-4 bg-white dark:bg-dark rounded-lg px-4 py-2 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>azaire-fleet.com/dashboard</span>
                </div>
                </div>
                
              {/* Enhanced dashboard content */}
              <div className="p-10 bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-dark-2 dark:via-dark-3/50 dark:to-dark-2">
                {/* Animated stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  {[
                    { label: "Active Vehicles", value: "47", trend: "+12%", bg: "bg-blue-50 dark:bg-blue-900/20", icon: "🚗" },
                    { label: "Total Revenue", value: "$128.5K", trend: "+23%", bg: "bg-green-50 dark:bg-green-900/20", icon: "💰" },
                    { label: "Active Drivers", value: "36", trend: "+8%", bg: "bg-purple-50 dark:bg-purple-900/20", icon: "👥" },
                    { label: "Avg. Profit", value: "35%", trend: "+15%", bg: "bg-orange-50 dark:bg-orange-900/20", icon: "📈" },
                    ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} rounded-2xl p-6 border border-stroke/30 dark:border-dark-3/30 hover:shadow-xl transition-all transform hover:-translate-y-1 group`}>
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">{stat.icon}</span>
                        <div className="flex items-center gap-1 text-xs font-bold text-green">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                          {stat.trend}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{stat.label}</div>
                      <div className="text-3xl font-bold text-dark dark:text-white group-hover:scale-110 transition-transform">{stat.value}</div>
                    </div>
                  ))}
                </div>
                
                {/* Revenue Chart with actual data */}
                <RevenueChart />
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-gradient-to-br from-primary to-blue-600 rounded-2xl opacity-20 blur-2xl animate-pulse"></div>
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-gradient-to-br from-green to-blue-600 rounded-2xl opacity-20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section - New */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-dark-2 dark:to-gray-dark">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green"></span>
              </span>
              <span className="text-green-700 dark:text-green-400 text-sm font-semibold">Average Results</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-dark dark:text-white mb-6">
              See How Much You Could Save
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Real numbers from fleet managers using Azaire
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                  metric: "20+ hours",
                  label: "Saved per week",
                  description: "No more spreadsheets or manual data entry",
                  icon: "⏱️",
                  textColor: "text-blue-600",
                  bg: "bg-blue-50 dark:bg-blue-900/20"
                },
                {
                  metric: "35% increase",
                  label: "In profitability",
                  description: "Better tracking means better decisions",
                  icon: "📈",
                  textColor: "text-green-600",
                  bg: "bg-green-50 dark:bg-green-900/20"
                },
                {
                  metric: "$2,400",
                  label: "Saved monthly",
                  description: "Reduce fuel waste and optimize routes",
                  icon: "💰",
                  textColor: "text-purple-600",
                  bg: "bg-purple-50 dark:bg-purple-900/20"
              },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} rounded-3xl p-8 border border-stroke dark:border-dark-3 hover:shadow-2xl transition-all transform hover:-translate-y-2 group`}>
                <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform">{item.icon}</div>
                <div className={`text-4xl font-bold mb-2 ${item.textColor}`}>
                  {item.metric}
                </div>
                <div className="text-lg font-semibold text-dark dark:text-white mb-3">{item.label}</div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-primary/30 transition-all transform hover:scale-105 hover:bg-primary/90"
            >
              Calculate Your Savings
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section - New */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-green/5 -z-10"></div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 mb-6">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                ))}
              </div>
              <span className="text-yellow-700 dark:text-yellow-400 text-sm font-semibold">4.9/5 from 500+ Reviews</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-dark dark:text-white mb-6">
              Loved by Fleet Managers
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Don&apos;t just take our word for it
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Tapiwa Moyo",
                role: "Fleet Manager, TransportCo",
                image: "TM",
                rating: 5,
                text: "Azaire transformed our operations. We went from spending 3 hours daily on paperwork to just 20 minutes. Our profitability increased by 40% in the first quarter.",
              },
              {
                name: "Sarah Ndlovu",
                role: "Operations Director, LogisticsPro",
                image: "SN",
                rating: 5,
                text: "The best investment we made this year. Real-time tracking saved us from costly maintenance issues. ROI within 2 months. Absolutely worth it!",
              },
              {
                name: "Michael Chikwanha",
                role: "Owner, City Cabs",
                image: "MC",
                rating: 5,
                text: "Finally ditched Excel! Driver management alone saves us 10 hours weekly. The offline feature is perfect for Zimbabwe's connectivity. Highly recommend.",
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white dark:bg-gray-dark rounded-3xl p-8 border border-stroke dark:border-dark-3 hover:shadow-2xl hover:border-primary/30 dark:hover:border-primary/30 transition-all transform hover:-translate-y-2 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-green flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {testimonial.image}
                        </div>
                  <div>
                    <div className="font-bold text-dark dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed relative z-10">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-gray-dark dark:via-dark-2 dark:to-gray-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 mb-6">
              <span className="text-primary text-sm font-semibold">Everything You Need</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-dark dark:text-white mb-6">
              Powerful Features, Simple to Use
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Built specifically for fleet operations in Zimbabwe and Africa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Vehicle Management",
                description: "Complete digital records for every vehicle. Track maintenance, fuel, insurance, and performance from one dashboard.",
                icon: "🚗",
                bgColor: "bg-blue-500",
                features: ["Digital records", "Maintenance alerts", "Fuel tracking"]
              },
              {
                title: "Driver Management",
                description: "Manage contracts, payments, and performance. Keep all driver information organized and accessible.",
                icon: "👥",
                bgColor: "bg-green-500",
                features: ["Digital contracts", "Payment tracking", "Performance metrics"]
              },
              {
                title: "Financial Tracking",
                description: "Real-time profitability insights. Track every dollar in and out with automated reporting.",
                icon: "💰",
                bgColor: "bg-purple-500",
                features: ["Income tracking", "Expense management", "Profit analytics"]
              },
              {
                title: "Maintenance Scheduling",
                description: "Never miss a service. Automated reminders keep your fleet running smoothly and prevent costly breakdowns.",
                icon: "🔧",
                bgColor: "bg-orange-500",
                features: ["Auto reminders", "Service history", "Cost tracking"]
              },
              {
                title: "Offline Mode",
                description: "Works perfectly without internet. All your data syncs automatically when you're back online.",
                icon: "📱",
                bgColor: "bg-red-500",
                features: ["Full offline access", "Auto sync", "No data loss"]
              },
              {
                title: "Real-Time Dashboard",
                description: "See everything at a glance. Monitor fleet status, revenues, and performance in real-time.",
                icon: "📊",
                bgColor: "bg-indigo-500",
                features: ["Live updates", "Custom reports", "Performance metrics"]
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group bg-white dark:bg-gray-dark rounded-3xl p-8 border border-stroke dark:border-dark-3 hover:shadow-2xl hover:border-primary/30 dark:hover:border-primary/30 transition-all hover:-translate-y-3"
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.bgColor} mb-6 shadow-lg group-hover:scale-110 transition-transform flex items-center justify-center text-3xl`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-2xl font-bold text-dark dark:text-white mb-4">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">{feature.description}</p>
                
                <ul className="space-y-3">
                  {feature.features.map((item, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green/20 flex items-center justify-center">
                        <svg className="w-3 h-3 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-dark dark:text-white font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - New */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-green/5 -z-10"></div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 mb-6">
              <svg className="w-4 h-4 text-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-700 dark:text-green-400 text-sm font-semibold">Simple, Transparent Pricing</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-dark dark:text-white mb-6">
              Plans That Grow With You
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Start free, upgrade when you&apos;re ready. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$0",
                period: "Forever Free",
                description: "Perfect for testing the waters",
                features: [
                  "Up to 5 vehicles",
                  "Up to 5 drivers",
                  "Basic reporting",
                  "Mobile app access",
                  "Email support",
                ],
                cta: "Start Free",
                popular: false,
              },
              {
                name: "Professional",
                price: "$29",
                period: "per month",
                description: "Most popular for growing fleets",
                features: [
                  "Up to 25 vehicles",
                  "Unlimited drivers",
                  "Advanced analytics",
                  "Priority support",
                  "Offline mode",
                  "Custom reports",
                  "API access",
                ],
                cta: "Start 14-Day Trial",
                popular: true,
              },
              {
                name: "Enterprise",
                price: "$99",
                period: "per month",
                description: "For large operations",
                features: [
                  "Unlimited vehicles",
                  "Unlimited drivers",
                  "White-label option",
                  "Dedicated support",
                  "Custom integrations",
                  "Advanced security",
                  "SLA guarantee",
                ],
                cta: "Contact Sales",
                popular: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative bg-white dark:bg-gray-dark rounded-3xl p-8 border-2 transition-all transform hover:-translate-y-2 hover:shadow-2xl ${
                  plan.popular
                    ? "border-primary shadow-2xl shadow-primary/20 scale-105"
                    : "border-stroke dark:border-dark-3 hover:border-primary/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-primary to-green text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{plan.description}</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-dark dark:text-white">{plan.price}</span>
                    <span className="text-gray-600 dark:text-gray-400">/{plan.period}</span>
                  </div>
                </div>

                <Link
                  href="/auth/sign-up"
                  className={`block w-full text-center py-4 rounded-xl font-semibold transition-all mb-8 ${
                    plan.popular
                      ? "bg-primary text-white hover:shadow-lg hover:shadow-primary/20 hover:bg-primary/90"
                      : "bg-gray-100 dark:bg-dark-2 text-dark dark:text-white hover:bg-gray-200 dark:hover:bg-dark-3"
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-4">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green/20 flex items-center justify-center mt-0.5">
                        <svg className="w-3.5 h-3.5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-dark dark:text-white">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
              <p className="text-gray-900 dark:text-gray-200 text-lg mb-4 font-semibold">
                All plans include 14-day free trial. No credit card required.
              </p>
            <div className="flex items-center justify-center gap-8 flex-wrap text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-900 dark:text-gray-200 font-semibold">Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-900 dark:text-gray-200 font-semibold">30-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-900 dark:text-gray-200 font-semibold">24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Enhanced */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-green -z-10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30 -z-10"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-primary"></div>
              ))}
            </div>
            <span className="text-white font-semibold">Join 500+ happy fleet managers</span>
          </div>
          
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-8 leading-tight">
            Ready to Transform<br />Your Fleet?
          </h2>
          
          <p className="text-2xl text-white/95 mb-4 leading-relaxed max-w-3xl mx-auto">
            Start your <span className="font-bold">14-day free trial</span> today. No credit card required.
          </p>
          
          <p className="text-lg text-white/80 mb-12">
            Setup takes less than 5 minutes. Cancel anytime.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link
            href="/auth/sign-up"
              className="group w-full sm:w-auto px-12 py-6 bg-white text-primary rounded-2xl font-bold hover:bg-gray-100 hover:shadow-xl transition-all transform hover:scale-105 text-xl flex items-center justify-center gap-3"
            >
              Start Free Trial
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
          </Link>
            
            <button className="w-full sm:w-auto px-12 py-6 border-2 border-white/50 text-white rounded-2xl font-semibold hover:bg-white/10 hover:border-white transition-all text-xl backdrop-blur-sm">
              Schedule Demo
            </button>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-12 flex-wrap text-white/90">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-stroke dark:border-dark-3 bg-gray-50 dark:bg-dark-2">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center mb-6">
                {settings.platformLogo ? (
                  <img
                    src={settings.platformLogo}
                    alt={settings.platformName}
                    className="h-10 w-auto object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-green flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">{settings.platformName.charAt(0)}</span>
                  </div>
                )}
                <span className="text-xl font-bold text-primary ml-3">{settings.platformName}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Transform your fleet operations with Africa&apos;s #1 fleet management platform.
              </p>
              <div className="flex gap-4">
                {["twitter", "facebook", "linkedin"].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-10 h-10 rounded-lg bg-stroke dark:bg-dark-3 flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                  >
                    <span className="sr-only">{social}</span>
                    <div className="w-5 h-5 bg-current"></div>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-dark dark:text-white mb-6">Product</h4>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-primary transition-colors">Reviews</a></li>
                <li><Link href="/auth/sign-up" className="hover:text-primary transition-colors">Free Trial</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-dark dark:text-white mb-6">Company</h4>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-dark dark:text-white mb-6">Support</h4>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-stroke dark:border-dark-3 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <p>© {new Date().getFullYear()} {settings.platformName}. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                99.9% Uptime
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                SSL Secured
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
