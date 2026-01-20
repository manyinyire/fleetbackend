import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Could not find requested resource</p>
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-opacity-90"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
