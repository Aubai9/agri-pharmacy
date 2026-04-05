/**
 * Database Management System
 * Uses Dexie (IndexedDB) with a legacy localStorage migration.
 */

const DEFAULT_CATEGORIES = [
  { id: 1, name: "أسمدة أرضية" },
  { id: 2, name: "أسمدة ورقية" },
  { id: 3, name: "مبيدات فطرية" },
  { id: 4, name: "مبيدات أعشاب" },
  { id: 5, name: "معدات" },
  { id: 6, name: "شبكات ري" },
  { id: 7, name: "قشاشات" },
  { id: 8, name: "مبيدات حشرية" },
  { id: 9, name: "مخصبات" },
  { id: 10, name: "بذور" },
  { id: 11, name: "شتل" },
];

const createDefaultData = () => ({
  categories: [...DEFAULT_CATEGORIES],
  products: [],
  customers: [],
  invoices: [],
  invoiceItems: [],
  transactions: [],
  stockLog: [],
  users: [{ username: "admin", password: "1234" }],
  lastUpdate: new Date().toISOString(),
});

class Database {
  constructor() {
    this.dbKey = "agri_pharmacy_db";
    this.snapshotKey = "main";
    this.state = createDefaultData();
    this.hasDexie = typeof Dexie !== "undefined";
    this.dexie = null;
    if (this.hasDexie) {
      this.dexie = new Dexie("agri_pharmacy_pos_db");
      this.dexie.version(1).stores({
        snapshots: "id,updatedAt",
      });
    } else {
      console.warn("Dexie is unavailable. Falling back to localStorage mode.");
    }
    this.readyPromise = this.initializeDatabase();
  }

  /**
   * Initialize the database with default structure
   */
  async initializeDatabase() {
    let snapshot = null;
    if (this.hasDexie) {
      try {
        snapshot = await this.dexie.table("snapshots").get(this.snapshotKey);
      } catch (error) {
        console.error(
          "Dexie initialization failed, fallback to localStorage:",
          error
        );
      }
    }

    if (snapshot?.data) {
      this.state = this.normalizeData(snapshot.data);
      this.saveToLocalStorage();
      return;
    }

    const legacyRaw = localStorage.getItem(this.dbKey);
    if (legacyRaw) {
      try {
        const legacyData = JSON.parse(legacyRaw);
        this.state = this.normalizeData(legacyData);
      } catch (error) {
        console.error("Failed to parse legacy localStorage data:", error);
        this.state = createDefaultData();
      }
    } else {
      this.state = createDefaultData();
    }

    this.persist();
  }

  ready() {
    return this.readyPromise;
  }

  normalizeData(raw = {}) {
    return {
      ...createDefaultData(),
      ...raw,
      categories:
        Array.isArray(raw.categories) && raw.categories.length
          ? raw.categories
          : [...DEFAULT_CATEGORIES],
      products: Array.isArray(raw.products) ? raw.products : [],
      customers: Array.isArray(raw.customers) ? raw.customers : [],
      invoices: Array.isArray(raw.invoices) ? raw.invoices : [],
      invoiceItems: Array.isArray(raw.invoiceItems) ? raw.invoiceItems : [],
      transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
      stockLog: Array.isArray(raw.stockLog) ? raw.stockLog : [],
      users:
        Array.isArray(raw.users) && raw.users.length
          ? raw.users
          : [{ username: "admin", password: "1234" }],
      lastUpdate: raw.lastUpdate || new Date().toISOString(),
    };
  }

  saveToLocalStorage() {
    localStorage.setItem(this.dbKey, JSON.stringify(this.state));
  }

  persist() {
    this.state.lastUpdate = new Date().toISOString();
    this.saveToLocalStorage();
    if (!this.hasDexie) return;
    this.dexie
      .table("snapshots")
      .put({
        id: this.snapshotKey,
        updatedAt: Date.now(),
        data: this.state,
      })
      .catch((error) =>
        console.error("Failed to persist Dexie snapshot:", error)
      );
  }

  /**
   * Get all data from database
   */
  getAllData() {
    return structuredClone(this.state);
  }

  /**
   * Save all data to database
   */
  saveAllData(data) {
    this.state = this.normalizeData(data);
    this.persist();
  }

  /**
   * Get next ID for a table
   */
  getNextId(table) {
    const items = this.state[table] || [];
    return items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;
  }

  // ============ PRODUCTS ============

  /**
   * Add a new product
   */
  addProduct(product) {
    product.id = this.getNextId("products");
    this.state.products.push(product);
    this.persist();
    return product;
  }

  /**
   * Get all products
   */
  getProducts() {
    return this.state.products || [];
  }

  /**
   * Get product by ID
   */
  getProductById(id) {
    return this.getProducts().find((p) => p.id === id);
  }

  /**
   * Update product
   */
  updateProduct(id, updates) {
    const product = this.state.products.find((p) => p.id === id);
    if (product) {
      Object.assign(product, updates);
      this.persist();
    }
    return product;
  }

  /**
   * Delete product
   */
  deleteProduct(id) {
    this.state.products = this.state.products.filter((p) => p.id !== id);
    this.persist();
  }

  /**
   * Get products by category
   */
  getProductsByCategory(category) {
    return this.getProducts().filter((p) => p.category === category);
  }

  // ============ CUSTOMERS ============

  /**
   * Add a new customer
   */
  addCustomer(customer) {
    customer.id = this.getNextId("customers");
    customer.balance = 0;
    this.state.customers.push(customer);
    this.persist();
    return customer;
  }

  /**
   * Get all customers
   */
  getCustomers() {
    return this.state.customers || [];
  }

  /**
   * Get customer by ID
   */
  getCustomerById(id) {
    return this.getCustomers().find((c) => c.id === id);
  }

  /**
   * Update customer
   */
  updateCustomer(id, updates) {
    const customer = this.state.customers.find((c) => c.id === id);
    if (customer) {
      Object.assign(customer, updates);
      this.persist();
    }
    return customer;
  }

  /**
   * Delete customer
   */
  deleteCustomer(id) {
    this.state.customers = this.state.customers.filter((c) => c.id !== id);
    this.persist();
  }

  /**
   * Update customer balance
   */
  updateCustomerBalance(customerId, amount) {
    const customer = this.getCustomerById(customerId);
    if (customer) {
      customer.balance += amount;
      this.updateCustomer(customerId, { balance: customer.balance });
    }
    return customer;
  }

  // ============ INVOICES ============

  /**
   * Create a new invoice
   */
  createInvoice(invoice) {
    invoice.id = this.getNextId("invoices");
    invoice.date = invoice.date || new Date().toISOString();
    this.state.invoices.push(invoice);
    this.persist();
    return invoice;
  }

  /**
   * Get all invoices
   */
  getInvoices() {
    return this.state.invoices || [];
  }

  /**
   * Get invoice by ID
   */
  getInvoiceById(id) {
    return this.getInvoices().find((i) => i.id === id);
  }

  /**
   * Get invoices by customer
   */
  getInvoicesByCustomer(customerId) {
    return this.getInvoices().filter((i) => i.customer_id === customerId);
  }

  /**
   * Add invoice item
   */
  addInvoiceItem(item) {
    item.id = this.getNextId("invoiceItems");
    this.state.invoiceItems.push(item);
    this.persist();
    return item;
  }

  /**
   * Get invoice items
   */
  getInvoiceItems(invoiceId) {
    return (this.state.invoiceItems || []).filter(
      (item) => item.invoice_id === invoiceId
    );
  }

  /**
   * Delete invoice and its items
   */
  deleteInvoice(invoiceId) {
    this.state.invoices = this.state.invoices.filter((i) => i.id !== invoiceId);
    this.state.invoiceItems = this.state.invoiceItems.filter(
      (item) => item.invoice_id !== invoiceId
    );
    this.persist();
  }

  // ============ TRANSACTIONS ============

  /**
   * Add a transaction (cash in/out)
   */
  addTransaction(transaction) {
    transaction.id = this.getNextId("transactions");
    transaction.date = transaction.date || new Date().toISOString();
    this.state.transactions.push(transaction);
    this.persist();
    return transaction;
  }

  /**
   * Get all transactions
   */
  getTransactions() {
    return this.state.transactions || [];
  }

  /**
   * Get transactions by customer
   */
  getTransactionsByCustomer(customerId) {
    return this.getTransactions().filter((t) => t.customer_id === customerId);
  }

  // ============ REPORTS ============

  /**
   * Get top selling products
   */
  getTopSellingProducts(limit = 10) {
    const invoiceItems = this.getAllData().invoiceItems || [];
    const productSales = {};

    invoiceItems.forEach((item) => {
      if (!productSales[item.product_id]) {
        productSales[item.product_id] = {
          product_id: item.product_id,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[item.product_id].quantity += item.quantity;
      productSales[item.product_id].revenue += item.price * item.quantity;
    });

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  }

  /**
   * Get least selling products
   */
  getLeastSellingProducts(limit = 10) {
    const invoiceItems = this.getAllData().invoiceItems || [];
    const productSales = {};

    // Initialize all products with zero sales
    this.getProducts().forEach((product) => {
      productSales[product.id] = {
        product_id: product.id,
        quantity: 0,
        revenue: 0,
      };
    });

    // Add actual sales
    invoiceItems.forEach((item) => {
      if (productSales[item.product_id]) {
        productSales[item.product_id].quantity += item.quantity;
        productSales[item.product_id].revenue += item.price * item.quantity;
      }
    });

    return Object.values(productSales)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, limit);
  }

  /**
   * Get sales for today
   */
  getTodaysSales() {
    const today = new Date().toDateString();
    const invoices = this.getInvoices();

    return invoices
      .filter(
        (invoice) =>
          new Date(invoice.date).toDateString() === today &&
          invoice.paid_amount > 0
      )
      .reduce((sum, invoice) => sum + invoice.paid_amount, 0);
  }

  /**
   * Get sales for current month
   */
  getMonthlySales() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const invoices = this.getInvoices();

    return invoices
      .filter((invoice) => {
        const invoiceDate = new Date(invoice.date);
        return (
          invoiceDate.getMonth() === currentMonth &&
          invoiceDate.getFullYear() === currentYear &&
          invoice.paid_amount > 0
        );
      })
      .reduce((sum, invoice) => sum + invoice.paid_amount, 0);
  }

  /**
   * Get total inventory value
   */
  getTotalInventoryValue() {
    return this.getProducts().reduce((sum, product) => {
      return sum + product.purchase_price * product.stock_quantity;
    }, 0);
  }

  /**
   * Get total customer debts
   */
  getTotalDebts() {
    return this.getCustomers().reduce((sum, customer) => {
      return sum + Math.max(0, customer.balance);
    }, 0);
  }

  /**
   * Get total payables (from unpaid invoices)
   */
  getTotalPayables() {
    return this.getInvoices()
      .filter((invoice) => invoice.paid_amount < invoice.total_amount)
      .reduce(
        (sum, invoice) => sum + (invoice.total_amount - invoice.paid_amount),
        0
      );
  }

  /**
   * Calculate estimated net profit
   */
  getEstimatedProfit() {
    const invoiceItems = this.getAllData().invoiceItems || [];
    let profit = 0;

    invoiceItems.forEach((item) => {
      const product = this.getProductById(item.product_id);
      if (product) {
        const costPrice = product.purchase_price;
        const sellingPrice = item.price;
        profit += (sellingPrice - costPrice) * item.quantity;
      }
    });

    return profit;
  }

  // ============ DATA MANAGEMENT ============

  /**
   * Export all data as JSON
   */
  exportData() {
    return this.getAllData();
  }

  /**
   * Import data from JSON
   */
  importData(data) {
    this.saveAllData(this.normalizeData(data));
  }

  /**
   * Clear all data
   */
  clearAllData() {
    this.state = createDefaultData();
    this.persist();
  }

  /**
   * Get database statistics
   */
  getStatistics() {
    return {
      totalProducts: this.getProducts().length,
      totalCustomers: this.getCustomers().length,
      totalInvoices: this.getInvoices().length,
      totalTransactions: this.getTransactions().length,
      lastUpdate: this.getAllData().lastUpdate,
    };
  }
  // دالة لجلب سجل إضافات المخزون فقط
  getInventoryAdditions() {
    if (!this.state.stockLog) this.state.stockLog = [];
    return this.state.stockLog;
  }

  // دالة لإضافة عملية توريد للسجل
  logStockAddition(productName, quantity, purchasePrice) {
    if (!this.state.stockLog) this.state.stockLog = [];

    this.state.stockLog.push({
      date: new Date().toISOString(),
      productName: productName,
      quantity: quantity,
      purchasePrice: purchasePrice,
      totalCost: quantity * purchasePrice,
    });
    this.persist();
  }
  getProfitReportData(fromDate, toDate) {
    const invoices = this.getInvoices();
    const invoiceItems = this.getAllData().invoiceItems || [];

    let report = {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      productProfits: {},
    };

    // تحويل التواريخ لمقارنتها بشكل صحيح (Timestamp)
    const start = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : 0;
    const end = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : Infinity;

    let foundInvoicesCount = 0; // عداد للاختبار

    invoices.forEach((inv) => {
      const invDate = new Date(inv.date).getTime();

      // هل تاريخ الفاتورة يقع بين البداية والنهاية؟
      if (invDate >= start && invDate <= end) {
        foundInvoicesCount++; // لقينا فاتورة!

        const items = invoiceItems.filter((item) => item.invoice_id === inv.id);
        items.forEach((item) => {
          const product = this.getProductById(item.product_id);
          if (product) {
            const itemRevenue = item.price * item.quantity;
            const itemCost = product.purchase_price * item.quantity;
            const itemProfit = itemRevenue - itemCost;

            report.totalRevenue += itemRevenue;
            report.totalCost += itemCost;
            report.totalProfit += itemProfit;

            if (!report.productProfits[item.product_id]) {
              report.productProfits[item.product_id] = {
                name: product.name,
                qty: 0,
                profit: 0,
                totalRev: 0,
              };
            }
            report.productProfits[item.product_id].qty += item.quantity;
            report.productProfits[item.product_id].profit += itemProfit;
            report.productProfits[item.product_id].totalRev += itemRevenue;
          }
        });
      }
    });

    // سطر التأكيد السحري:
    console.log(
      `✅ نتيجة الفحص: تم العثور على (${foundInvoicesCount}) فواتير في هذه الفترة.`
    );

    return report;
  }
  // دالة التحقق من تسجيل الدخول
  verifyLogin(username, password) {
    if (!this.state.users) {
      this.state.users = [{ username: "admin", password: "1234" }];
      this.persist();
    }
    return this.state.users.some(
      (u) => u.username === username && u.password === password
    );
  }
  /**
   * تحديث بيانات فاتورة (مثل تسديد مبلغ منها)
   */
  updateInvoice(id, updates) {
    const invoice = this.state.invoices.find((i) => i.id === id);
    if (invoice) {
      Object.assign(invoice, updates);
      this.persist();
    }
    return invoice;
  }
  /**
   * جلب المنتجات التي قارب مخزونها على النفاذ (5 قطع أو أقل)
   */
  getLowStockProducts(threshold = 5) {
    const products = this.getProducts();
    return products.filter((p) => p.stock_quantity <= threshold);
  }
}

// Create global database instance
const db = new Database();
