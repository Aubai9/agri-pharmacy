/**
 * Main Application Entry Point
 * Initializes the application and sets up global configurations
 */

// Application configuration
const APP_CONFIG = {
  name: "نظام الصيدلية الزراعية المتكامل",
  version: "1.1.0",
  author: "Agricultural Pharmacy Systems",
  description: "نظام متكامل لإدارة نقطة البيع والمخزون ودفتر الصندوق",
};

/**
 * Application initialization
 */
class Application {
  constructor() {
    this.config = APP_CONFIG;
    this.initialize();
  }

  /**
   * Initialize the application
   */
  initialize() {
    console.log(`${this.config.name} v${this.config.version}`);
    console.log("Application initialized successfully");

    // Set up error handling
    this.setupErrorHandling();

    // Initialize service worker for offline support (optional)
    this.initializeServiceWorker();
  }

  /**
   * Setup global error handling
   */
  setupErrorHandling() {
    window.addEventListener("error", (event) => {
      console.error("Global error:", event.error);
    });

    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
    });
  }

  /**
   * Initialize service worker for offline support
   */
  initializeServiceWorker() {
    if ("serviceWorker" in navigator) {
      // Service worker registration can be added here if needed
      // navigator.serviceWorker.register('sw.js');
    }
  }

  /**
   * Get application info
   */
  getInfo() {
    return this.config;
  }
}

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const app = new Application();
  window.APP = app;
});

// Prevent accidental data loss
window.addEventListener("beforeunload", (event) => {
  // Only show warning if there are unsaved changes
  // This can be enhanced based on your needs
});
