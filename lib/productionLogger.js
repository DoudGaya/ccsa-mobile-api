/**
 * Production Logger
 * Only logs errors and warnings in production, full logging in development
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

class ProductionLogger {
  static info(message, data = null) {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, data ? data : '')
    }
    // In production, only log to external service if configured
    if (isProduction && process.env.LOG_SERVICE_URL) {
      // Could integrate with external logging service
    }
  }

  static debug(message, data = null) {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, data ? data : '')
    }
    // Never log debug in production
  }

  static warn(message, data = null) {
    console.warn(`[WARN] ${message}`, data ? data : '')
    // Log warnings in both dev and production
  }

  static error(message, error = null, data = null) {
    console.error(`[ERROR] ${message}`, error ? error : '', data ? data : '')
    
    // In production, could send to error tracking service
    if (isProduction && process.env.ERROR_TRACKING_URL) {
      // Could integrate with Sentry, LogRocket, etc.
    }
  }

  static api(endpoint, method, status, duration = null) {
    const logMessage = `${method} ${endpoint} - ${status}${duration ? ` (${duration}ms)` : ''}`
    
    if (isDevelopment) {
      console.log(`[API] ${logMessage}`)
    }
    
    // In production, only log errors and slow requests
    if (isProduction && (status >= 400 || (duration && duration > 5000))) {
      console.log(`[API] ${logMessage}`)
    }
  }
}

export default ProductionLogger
