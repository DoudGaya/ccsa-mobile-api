/**
 * Modern, Fast Page Loader Component
 * Provides consistent loading UI across all dashboard pages
 * Uses skeleton screens for better perceived performance
 */

export function PageLoader({ title = "Loading", message = "Please wait..." }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Animated Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 animate-pulse shadow-lg"></div>
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 animate-ping opacity-30"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-800 animate-pulse">{title}</h2>
          <p className="text-gray-600">{message}</p>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 rounded-full animate-loading-bar"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export function CardLoader({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3">
            <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
            <div className="w-1/2 h-6 bg-gray-300 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableLoader({ rows = 5, cols = 6 }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 bg-gray-200 rounded animate-pulse"
                  style={{
                    animationDelay: `${(rowIndex * cols + colIndex) * 50}ms`,
                  }}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartLoader({ count = 2 }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            <div className="w-1/3 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-full h-64 bg-gray-100 rounded-lg animate-pulse flex items-end justify-around p-4 space-x-2">
              {Array.from({ length: 6 }).map((_, j) => (
                <div
                  key={j}
                  className="bg-gray-300 rounded-t"
                  style={{
                    width: '100%',
                    height: `${Math.random() * 60 + 40}%`,
                    animationDelay: `${j * 100}ms`,
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardLoader() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats Cards */}
      <CardLoader count={4} />
      
      {/* Charts */}
      <ChartLoader count={2} />
      
      {/* Table */}
      <TableLoader rows={5} cols={5} />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }
      `}</style>
    </div>
  )
}

export function ListLoader({ rows = 8 }) {
  return (
    <div className="bg-white rounded-lg shadow-md divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center space-x-4 animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
            <div className="w-1/2 h-3 bg-gray-100 rounded"></div>
          </div>
          <div className="w-20 h-8 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  )
}

export function MapLoader() {
  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-100 rounded-lg overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading map data...</p>
        </div>
      </div>
      
      {/* Map-like background */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #ccc 0px, #ccc 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #ccc 0px, #ccc 1px, transparent 1px, transparent 40px)',
        }}></div>
      </div>
    </div>
  )
}

// Inline spinner for buttons and small components
export function Spinner({ size = 'md', color = 'blue' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }
  
  const colors = {
    blue: 'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-600 border-t-transparent',
  }
  
  return (
    <div className={`${sizes[size]} ${colors[color]} rounded-full animate-spin`}></div>
  )
}

export default PageLoader
