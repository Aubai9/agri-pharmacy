/**
 * UI Management Module
 * Handles all UI interactions and modal management
 */
const APP_VERSION = "1.0.18";

class UIManager {
  constructor() {
    this.currentPage = "dashboard";
    this.currentProductId = null;
    this.currentCustomerId = null;
    this.initializeEventListeners();
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
    this.checkLoginStatus();
  }

  /**
   * Initialize all event listeners
   */

  /**
   * تهيئة جميع أحداث الأزرار والواجهة (النسخة الكاملة والمطورة)
   */
  initializeEventListeners() {
    document
      .getElementById("check-update-btn")
      .addEventListener("click", () => this.checkForUpdates());
    const posCustSearch = document.getElementById("pos-customer-search-input");
    if (posCustSearch) {
      posCustSearch.addEventListener("input", () => this.loadCustomerSelect());
    }
    // 12. نظام تسجيل الدخول والخروج
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const passwordInput = document.getElementById("login-password");

    if (loginBtn) {
      loginBtn.addEventListener("click", () => this.handleLogin());
      // دعم الدخول بالضغط على زر Enter بالكيبورد
      passwordInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.handleLogin();
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.handleLogout());
    }
    // 1. القائمة الجانبية (Sidebar) والموبايل (نسخة محمية من الأخطاء)
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("sidebar-overlay");

    // تشغيل الزر فقط إذا كان موجود بالشاشة
    if (menuToggle && sidebar) {
      menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("active");
        if (overlay) overlay.classList.remove("active");
      });
    }

    // إغلاق المنيو عند الضغط في الخارج
    document.addEventListener("click", (event) => {
      // نتأكد أولاً أن السايدبار موجود وأنه حالياً "مفتوح"
      if (sidebar && sidebar.classList.contains("active")) {
        // هل الضغطة كانت خارج السايدبار؟
        const clickedOutsideSidebar = !sidebar.contains(event.target);
        // هل الضغطة كانت خارج زر القائمة؟ (نتأكد أن الزر موجود أصلاً)
        const clickedOutsideToggle = menuToggle
          ? !menuToggle.contains(event.target)
          : true;

        // إذا كانت الضغطة براتهم التنين، سكر القائمة
        if (clickedOutsideSidebar && clickedOutsideToggle) {
          sidebar.classList.remove("active");
          if (overlay) overlay.classList.remove("active");
        }
      }
    });

    // 2. تنقل الصفحات
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () =>
        this.navigateToPage(btn.getAttribute("data-page"))
      );
    });

    // 3. أزرار الفلترة في لوحة التحكم (Dashboard Tabs)
    document.querySelectorAll(".filter-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document
          .querySelectorAll(".filter-tab")
          .forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        this.renderDashboardData(tab.getAttribute("data-filter"));
      });
    });

    // 4. إدارة المنتجات (المخزون)
    document
      .getElementById("add-product-btn")
      .addEventListener("click", () => this.openProductModal());
    document
      .getElementById("product-modal-save")
      .addEventListener("click", () => this.saveProduct());
    this.setupModalClose("product-modal");

    // 5. إدارة العملاء
    document
      .getElementById("add-customer-btn")
      .addEventListener("click", () => this.openCustomerModal());
    document
      .getElementById("customer-modal-save")
      .addEventListener("click", () => this.saveCustomer());
    this.setupModalClose("customer-modal");

    // 6. الآلة الحاسبة
    document
      .getElementById("calculator-btn")
      .addEventListener("click", () => this.openCalculatorModal());
    this.setupModalClose("calculator-modal");

    // 7. فلاتر البحث والجرد
    document
      .getElementById("category-filter")
      .addEventListener("change", () => this.filterInventory());
    document
      .getElementById("product-search")
      .addEventListener("input", () => this.filterInventory());

    // 8. فلاتر نقطة البيع (POS)
    document
      .getElementById("pos-category-filter")
      .addEventListener("change", () => this.filterProducts());
    document
      .getElementById("pos-search")
      .addEventListener("input", () => this.filterProducts());

    // 9. عمليات الفاتورة (POS)
    document
      .getElementById("discount-input")
      .addEventListener("input", () => this.updateInvoiceTotal());
    document
      .getElementById("clear-invoice-btn")
      .addEventListener("click", () => this.clearInvoice());
    document
      .getElementById("complete-invoice-btn")
      .addEventListener("click", () => this.completeInvoice());

    // 10. بحث العملاء والعمليات المالية (Cash Book)
    document
      .getElementById("customer-search")
      .addEventListener("input", () => this.filterCustomers());
    document
      .getElementById("add-transaction-btn")
      .addEventListener("click", () => this.addTransaction());

    // 11. إعدادات النظام (استيراد وتصدير)
    document
      .getElementById("export-data-btn")
      .addEventListener("click", () => this.exportData());

    const exportInvoicesExcelBtn = document.getElementById(
      "export-invoices-excel-btn"
    );
    if (exportInvoicesExcelBtn) {
      exportInvoicesExcelBtn.addEventListener("click", () =>
        this.exportInvoicesToExcel()
      );
    }

    document
      .getElementById("import-data-btn")
      .addEventListener("click", () =>
        document.getElementById("import-file").click()
      );
    document
      .getElementById("import-file")
      .addEventListener("change", (e) => this.importData(e));
    document
      .getElementById("clear-data-btn")
      .addEventListener("click", () => this.clearAllData());
  }

  // دالة تسجيل الدخول
  handleLogin() {
    const user = document.getElementById("login-username").value.trim();
    const pass = document.getElementById("login-password").value.trim();

    if (db.verifyLogin(user, pass)) {
      localStorage.setItem("isLoggedIn", "true");
      // إخفاء شاشة الدخول وإظهار التطبيق
      document.getElementById("login-screen").style.display = "none";
      document.getElementById("app").style.display = "flex";

      // تفريغ الحقول لحماية البيانات لو سجل خروج لاحقاً
      document.getElementById("login-username").value = "";
      document.getElementById("login-password").value = "";

      // تحديث لوحة التحكم
      this.updateDashboard();
      this.checkAutoBackup();
    } else {
      alert("اسم المستخدم أو كلمة المرور غير صحيحة!");
    }
  }

  // دالة تسجيل الخروج
  handleLogout() {
    if (confirm("هل تريد فعلاً تسجيل الخروج من النظام؟")) {
      localStorage.removeItem("isLoggedIn");
      // إخفاء التطبيق وإظهار شاشة الدخول
      document.getElementById("app").style.display = "none";
      document.getElementById("login-screen").style.display = "flex";
    }
  }

  /**
   * Setup modal close functionality
   */
  setupModalClose(modalId) {
    const modal = document.getElementById(modalId);
    const closeBtn = modal.querySelector(".close-btn");
    const cancelBtn = modal.querySelector('[id$="-cancel"]');

    closeBtn.addEventListener("click", () => this.closeModal(modalId));
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.closeModal(modalId));
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.closeModal(modalId);
      }
    });
  }

  /**
   * Navigate to a page
   */
  navigateToPage(pageName) {
    // Hide all pages
    document.querySelectorAll(".page").forEach((page) => {
      page.classList.remove("active");
    });

    // Show selected page
    document.getElementById(pageName).classList.add("active");

    // Update navigation
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add("active");

    // Update page title
    const titles = {
      dashboard: "لوحة التحكم",
      inventory: "إدارة المخزون",
      pos: "نقطة البيع",
      customers: "العملاء والديون",
      reports: "التقارير",
      settings: "الإعدادات",
      "low-stock": "النواقص والطلبيات", // <--- السطر الجديد
    };

    document.getElementById("page-title").textContent = titles[pageName];

    this.currentPage = pageName;

    // Close sidebar on mobile
    document.querySelector(".sidebar").classList.remove("active");

    // Refresh page content
    this.refreshPageContent(pageName);
  }

  /**
   * Refresh page content
   */
  refreshPageContent(pageName) {
    switch (pageName) {
      case "dashboard":
        this.updateDashboard();
        break;
      case "inventory":
        this.loadInventory();
        break;
      case "pos":
        this.loadPOS();
        break;
      case "customers":
        this.loadCustomers();
        break;
      case "reports":
        // تعيين تاريخ اليوم كافتراضي بمجرد فتح الصفحة
        const fromInput = document.getElementById("report-from-date");
        const toInput = document.getElementById("report-to-date");

        // إذا كانت الخانات فارغة، املأها بتاريخ الشهر الحالي
        if (!fromInput.value || !toInput.value) {
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split("T")[0];
          const today = now.toISOString().split("T")[0];

          fromInput.value = firstDay;
          toInput.value = today;
        }

        // جلب البيانات فوراً بناءً على التواريخ المعبأة
        this.loadProfitReport();
        break;

      case "sales-log":
        this.loadSalesLog();
        break;
      case "low-stock":
        this.loadLowStock();
        break;
      case "settings":
        // السطر الجديد اللي رح يعرض رقم الإصدار في الشاشة
        if (document.getElementById("app-version-number")) {
          document.getElementById("app-version-number").textContent =
            APP_VERSION;
        }

        // ... باقي الكود الموجود عندك بالإعدادات ...
        const stats = db.getStatistics();
        document.getElementById("last-update").textContent = stats.lastUpdate
          ? new Date(stats.lastUpdate).toLocaleString("ar-SA")
          : "لا يوجد بيانات بعد";
        break;
    }
  }

  /**
   * Update dashboard statistics
   */
  updateDashboard() {
    // نجلب الزر (الفلتر) المفتوح حالياً في لوحة التحكم
    const activeTab = document.querySelector(".filter-tab.active");

    // إذا في زر شغال بناخد اسمه، وإذا لأ بنفترض إنه "المبيعات الشهرية" (all)
    const currentFilter = activeTab
      ? activeTab.getAttribute("data-filter")
      : "all";

    // إعادة رسم الجدول والأرقام فوراً بناءً على البيانات الجديدة
    this.renderDashboardData(currentFilter);
  }

  /**
   * Load inventory page
   */
  loadInventory() {
    this.filterInventory();
  }

  /**
   * Filter inventory by category and search
   */
  filterInventory() {
    const category = document.getElementById("category-filter").value;
    const search = document
      .getElementById("product-search")
      .value.toLowerCase();
    let products = db.getProducts();

    if (category) {
      products = products.filter((p) => p.category === category);
    }

    if (search) {
      products = products.filter((p) => p.name.toLowerCase().includes(search));
    }

    this.renderInventoryTable(products);
  }

  /**
   * Render inventory table
   */
  renderInventoryTable(products) {
    const tbody = document.getElementById("inventory-table-body");
    tbody.innerHTML = "";

    if (products.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center; padding: 20px;">لا توجد منتجات</td></tr>';
      return;
    }

    products.forEach((product) => {
      const total = product.purchase_price * product.stock_quantity;
      const row = document.createElement("tr");

      // استخدمنا || '-' لضمان عدم ظهور مكان فارغ إذا لم يتم إدخال القيمة
      row.innerHTML = `
        <td style="font-weight:bold">${product.name}</td>
        <td>${product.company || "-"}</td>
        <td>${product.country || "-"}</td>
        <td>${product.texture || "-"}</td>
        <td>${product.packageSize || "-"}</td>
        <td><span class="badge">${product.category}</span></td>
        <td>${this.formatCurrency(product.purchase_price)}</td>
        <td>${this.formatCurrency(product.selling_price)}</td>
        <td style="font-weight:bold; color:${
          product.stock_quantity < 5 ? "red" : "inherit"
        }">
            ${product.stock_quantity}
        </td>
        <td style="font-weight:bold">${this.formatCurrency(total)}</td>
        <td>
            <div style="display:flex; gap:5px">
                <button class="action-btn" onclick="ui.editProduct(${
                  product.id
                })" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="ui.deleteProduct(${
                  product.id
                })" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
      tbody.appendChild(row);
    });
  }

  /**
   * Open product modal
   */
  openProductModal(productId = null) {
    this.currentProductId = productId;
    const modal = document.getElementById("product-modal");
    const title = document.getElementById("product-modal-title");

    if (productId) {
      const product = db.getProductById(productId);
      document.getElementById("product-company").value = product.company || "";
      document.getElementById("product-country").value = product.country || "";
      document.getElementById("product-texture").value =
        product.texture || "سائل";
      document.getElementById("product-package").value =
        product.packageSize || "";
      title.textContent = "تعديل منتج";
      document.getElementById("product-name").value = product.name;
      document.getElementById("product-company").value = product.company || "";
      document.getElementById("product-country").value = product.country || "";
      document.getElementById("product-texture").value =
        product.texture || "سائل";
      document.getElementById("product-package").value =
        product.packageSize || "";
      document.getElementById("product-category").value = product.category;
      document.getElementById("product-purchase-price").value =
        product.purchase_price;
      document.getElementById("product-selling-price").value =
        product.selling_price;
      document.getElementById("product-quantity").value =
        product.stock_quantity;
    } else {
      title.textContent = "إضافة منتج جديد";

      document.getElementById("product-name").value = "";
      document.getElementById("product-company").value = "";
      document.getElementById("product-country").value = "";
      document.getElementById("product-texture").value = "سائل"; // القيمة الافتراضية
      document.getElementById("product-package").value = "";
      document.getElementById("product-category").value = "أسمدة أرضية"; // الصنف الافتراضي
      document.getElementById("product-purchase-price").value = "";
      document.getElementById("product-selling-price").value = "";
      document.getElementById("product-quantity").value = "";
    }

    this.openModal("product-modal");
  }

  /**
   * Save product
   */
  saveProduct() {
    // جلب جميع القيم من النافذة
    const name = document.getElementById("product-name").value.trim();
    const company = document.getElementById("product-company").value.trim();
    const country = document.getElementById("product-country").value.trim();
    const texture = document.getElementById("product-texture").value;
    const category = document.getElementById("product-category").value;
    const packageSize = document.getElementById("product-package").value.trim();
    const purchasePrice = parseFloat(
      document.getElementById("product-purchase-price").value
    );
    const sellingPrice = parseFloat(
      document.getElementById("product-selling-price").value
    );
    const quantity = parseInt(
      document.getElementById("product-quantity").value
    );

    // التحقق من الحقول الأساسية
    if (
      !name ||
      isNaN(purchasePrice) ||
      isNaN(sellingPrice) ||
      isNaN(quantity)
    ) {
      alert("يرجى ملء جميع الحقول الأساسية والأرقام بشكل صحيح");
      return;
    }

    const allProducts = db.getProducts();

    // --- قانون التطابق الدقيق (يجب أن تتطابق الـ 6 حقول تماماً) ---
    const existingProduct = allProducts.find(
      (p) =>
        p.name.toLowerCase() === name.toLowerCase() &&
        (p.company || "").toLowerCase() === company.toLowerCase() &&
        (p.country || "").toLowerCase() === country.toLowerCase() &&
        (p.texture || "") === texture &&
        (p.category || "") === category &&
        (p.packageSize || "").toLowerCase() === packageSize.toLowerCase()
    );

    if (this.currentProductId) {
      // حالة (1): تعديل بيانات منتج موجود (من زر القلم)
      db.updateProduct(this.currentProductId, {
        name,
        company,
        country,
        texture,
        category,
        packageSize: packageSize,
        purchase_price: purchasePrice,
        selling_price: sellingPrice,
        stock_quantity: quantity,
      });
      alert("تم تعديل بيانات المنتج");
    } else if (existingProduct) {
      // حالة (2): توريد بضاعة لمنتج (متطابق 100% بالاسم والشركة والبلد والقوام والصنف والحجم)
      if (
        confirm(
          `هذا المنتج مطابق تماماً لمنتج موجود مسبقاً. هل تريد إضافة الكمية الجديدة (${quantity}) إلى المخزون الحالي؟`
        )
      ) {
        const updatedStock = existingProduct.stock_quantity + quantity;

        db.updateProduct(existingProduct.id, {
          purchase_price: purchasePrice,
          selling_price: sellingPrice,
          stock_quantity: updatedStock,
        });

        db.logStockAddition(name, quantity, purchasePrice);
        alert("تم تحديث كمية المنتج وتسجيلها في الجرد");
      }
    } else {
      // حالة (3): إضافة منتج جديد (إذا اختلف ولو شرط واحد من الشروط الستة!)
      db.addProduct({
        name,
        company,
        country,
        texture,
        category,
        packageSize: packageSize,
        purchase_price: purchasePrice,
        selling_price: sellingPrice,
        stock_quantity: quantity,
      });

      db.logStockAddition(name, quantity, purchasePrice);
      alert("تم إضافة المنتج كصنف جديد ومستقل بنجاح");
    }

    this.closeModal("product-modal");
    this.loadInventory();
    this.loadPOS();

    if (this.currentPage === "dashboard") {
      const activeTab = document.querySelector(".filter-tab.active");
      const currentFilter = activeTab
        ? activeTab.getAttribute("data-filter")
        : "all";
      this.renderDashboardData(currentFilter);
    }
  }
  /**
   * Edit product
   */
  editProduct(productId) {
    this.openProductModal(productId);
  }

  /**
   * Delete product
   */
  deleteProduct(productId) {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      db.deleteProduct(productId);
      this.loadInventory();
      this.loadPOS();
    }
  }

  /**
   * Load POS page
   */
  loadPOS() {
    this.filterProducts();
    this.loadCustomerSelect();
    this.updateInvoiceTotal();
  }

  /**
   * Filter products for POS
   */
  filterProducts() {
    const category = document.getElementById("pos-category-filter").value;
    const search = document.getElementById("pos-search").value.toLowerCase();
    let products = db.getProducts();

    if (category) {
      products = products.filter((p) => p.category === category);
    }

    if (search) {
      products = products.filter((p) => p.name.toLowerCase().includes(search));
    }

    this.renderProductsGrid(products);
  }

  /**
   * Render products grid for POS
   */
  renderProductsGrid(products) {
    const grid = document.getElementById("products-grid");
    grid.innerHTML = "";

    if (products.length === 0) {
      grid.innerHTML =
        '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">لا توجد منتجات</div>';
      return;
    }

    products.forEach((product) => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
                <div class="product-card-name">${product.name}</div>
                <div class="product-card-price">${this.formatCurrency(
                  product.selling_price
                )}</div>
                <div class="product-card-stock">المخزون: ${
                  product.stock_quantity
                }</div>
            `;
      card.addEventListener("click", () => this.addToInvoice(product));
      grid.appendChild(card);
    });
  }

  /**
   * Add product to invoice
   */
  addToInvoice(product) {
    if (product.stock_quantity <= 0) {
      alert("المنتج غير متوفر في المخزون");
      return;
    }

    const invoiceItems = document.getElementById("invoice-items");
    let existingItem = null;

    invoiceItems.querySelectorAll(".invoice-item").forEach((item) => {
      if (item.getAttribute("data-product-id") == product.id) {
        existingItem = item;
      }
    });

    if (existingItem) {
      const qtyInput = existingItem.querySelector(".invoice-item-qty input");
      const currentQty = parseInt(qtyInput.value);
      if (currentQty < product.stock_quantity) {
        qtyInput.value = currentQty + 1;
      }
    } else {
      const item = document.createElement("div");
      item.className = "invoice-item";
      item.setAttribute("data-product-id", product.id);
      item.innerHTML = `
                <button class="invoice-item-remove" onclick="ui.removeFromInvoice(${
                  product.id
                })">&times;</button>
                <div class="invoice-item-name">${product.name}</div>
                <div class="invoice-item-qty">
                    <input type="number" value="1" min="1" max="${
                      product.stock_quantity
                    }" onchange="ui.updateInvoiceTotal()">
                </div>
                <div class="invoice-item-total">${this.formatCurrency(
                  product.selling_price
                )}</div>
            `;
      invoiceItems.appendChild(item);
    }

    this.updateInvoiceTotal();
  }

  /**
   * Remove item from invoice
   */
  removeFromInvoice(productId) {
    const item = document.querySelector(`[data-product-id="${productId}"]`);
    if (item) {
      item.remove();
      this.updateInvoiceTotal();
    }
  }

  /**
   * Update invoice total
   */
  updateInvoiceTotal() {
    const invoiceItems = document.getElementById("invoice-items");
    let total = 0;

    invoiceItems.querySelectorAll(".invoice-item").forEach((item) => {
      const productId = item.getAttribute("data-product-id");
      const product = db.getProductById(parseInt(productId));
      const qty = parseInt(item.querySelector(".invoice-item-qty input").value);
      total += product.selling_price * qty;
    });

    const discount =
      parseFloat(document.getElementById("discount-input").value) || 0;
    const finalTotal = total - discount;

    document.getElementById("invoice-total").textContent =
      this.formatCurrency(total);
    document.getElementById("final-total").textContent =
      this.formatCurrency(finalTotal);
  }

  /**
   * Clear invoice
   */
  clearInvoice() {
    document.getElementById("invoice-items").innerHTML = "";
    document.getElementById("discount-input").value = "0";
    this.updateInvoiceTotal();
  }

  /**
   * Complete invoice
   */
  completeInvoice() {
    const invoiceItems = document.getElementById("invoice-items");
    if (invoiceItems.children.length === 0) {
      alert("الفاتورة فارغة");
      return;
    }

    const customerId =
      document.getElementById("customer-select").value === "cash"
        ? null
        : parseInt(document.getElementById("customer-select").value);
    const paymentStatus = document.getElementById("payment-status").value;
    const total = parseFloat(
      document
        .getElementById("invoice-total")
        .textContent.replace(/[^\d.-]/g, "")
    );
    const discount =
      parseFloat(document.getElementById("discount-input").value) || 0;
    const finalTotal = total - discount;

    // Create invoice
    const invoice = db.createInvoice({
      customer_id: customerId,
      total_amount: total,
      paid_amount: paymentStatus === "paid" ? finalTotal : 0,
      discount: discount,
      status: paymentStatus,
    });

    // Add invoice items and update stock
    invoiceItems.querySelectorAll(".invoice-item").forEach((item) => {
      const productId = parseInt(item.getAttribute("data-product-id"));
      const qty = parseInt(item.querySelector(".invoice-item-qty input").value);
      const product = db.getProductById(productId);

      if (!product) return;

      // تحديث المخزون مرة واحدة فقط لتفادي الخصم المكرر
      const newQuantity = product.stock_quantity - qty;
      db.updateProduct(productId, {
        stock_quantity: newQuantity,
      });

      db.addInvoiceItem({
        invoice_id: invoice.id,
        product_id: productId,
        quantity: qty,
        price: product.selling_price,
      });
    });

    // Update customer balance if unpaid
    if (customerId && paymentStatus === "unpaid") {
      db.updateCustomerBalance(customerId, finalTotal);
    }

    alert("تم إكمال البيع بنجاح");
    this.clearInvoice();
    this.loadPOS();
    this.updateDashboard();
  }

  /**
   * Load customers page
   */
  loadCustomers() {
    this.filterCustomers();
    this.loadTransactionCustomerSelect();
  }

  /**
   * Filter customers
   */
  filterCustomers() {
    const search = document
      .getElementById("customer-search")
      .value.toLowerCase();
    let customers = db.getCustomers();

    if (search) {
      customers = customers.filter(
        (c) => c.name.toLowerCase().includes(search) || c.phone.includes(search)
      );
    }

    this.renderCustomersTable(customers);
  }

  /**
   * Render customers table
   */
  renderCustomersTable(customers) {
    const tbody = document.getElementById("customers-table-body");
    tbody.innerHTML = "";

    customers.forEach((customer) => {
      // 1. جلب فواتير العميل
      const customerInvoices = db
        .getInvoices()
        .filter((inv) => inv.customer_id === customer.id);

      // 2. حساب إجمالي المسحوبات (الصافي بعد الخصم)
      const totalOwed = customerInvoices.reduce(
        (sum, inv) => sum + (inv.total_amount - (inv.discount || 0)),
        0
      );

      // 3. التعديل الجوهري: حساب إجمالي المدفوع من الفواتير فقط
      // لأننا برمجنا نظام التسديد (FIFO) ليقوم بتحديث الـ paid_amount داخل الفاتورة تلقائياً
      const totalPaid = customerInvoices.reduce(
        (sum, inv) => sum + inv.paid_amount,
        0
      );

      // 4. الباقي (الرصيد الحقيقي)
      const balance = totalOwed - totalPaid;

      const row = document.createElement("tr");
      row.innerHTML = `
            <td style="cursor:pointer; color:var(--secondary-color); font-weight:bold" onclick="ui.loadCustomerQuickHistory(${
              customer.id
            })">
                ${customer.name}
            </td>
            <td>${customer.phone}</td>
            <td>${this.formatCurrency(totalOwed)}</td>
            <td style="color:green">${this.formatCurrency(totalPaid)}</td>
            <td style="color:${
              balance > 0 ? "red" : "black"
            }">${this.formatCurrency(balance)}</td>
            <td>
                <button class="action-btn" onclick="ui.editCustomer(${
                  customer.id
                })"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="ui.deleteCustomer(${
                  customer.id
                })"><i class="fas fa-trash"></i></button>
            </td>
        `;
      tbody.appendChild(row);
    });
  }

  /**
   * Open customer modal
   */
  openCustomerModal(customerId = null) {
    this.currentCustomerId = customerId;
    const modal = document.getElementById("customer-modal");
    const title = document.getElementById("customer-modal-title");

    if (customerId) {
      title.textContent = "تعديل عميل";
      const customer = db.getCustomerById(customerId);
      document.getElementById("customer-name").value = customer.name;
      document.getElementById("customer-phone").value = customer.phone;
    } else {
      title.textContent = "إضافة عميل";
      document.getElementById("customer-name").value = "";
      document.getElementById("customer-phone").value = "";
    }

    this.openModal("customer-modal");
  }

  /**
   * Save customer
   */
  saveCustomer() {
    const name = document.getElementById("customer-name").value.trim();
    const phone = document.getElementById("customer-phone").value.trim();

    if (!name || !phone) {
      alert("يرجى ملء جميع الحقول");
      return;
    }

    if (this.currentCustomerId) {
      db.updateCustomer(this.currentCustomerId, { name, phone });
    } else {
      db.addCustomer({ name, phone });
    }

    this.closeModal("customer-modal");
    this.loadCustomers();
    this.loadCustomerSelect();
  }

  /**
   * Edit customer
   */
  editCustomer(customerId) {
    this.openCustomerModal(customerId);
  }

  /**
   * Delete customer
   */
  deleteCustomer(customerId) {
    if (confirm("هل أنت متأكد من حذف هذا العميل؟")) {
      db.deleteCustomer(customerId);
      this.loadCustomers();
      this.loadCustomerSelect();
    }
  }

  /**
   * Load customer select dropdown
   */
  /**
   * Load customer select dropdown (مع ميزة البحث الذكي)
   */
  loadCustomerSelect() {
    const select = document.getElementById("customer-select");
    const searchInput = document.getElementById("pos-customer-search-input");

    if (!select) return;

    // جلب الكلمة المكتوبة في مربع البحث (إن وجدت)
    const term = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const currentValue = select.value; // حفظ الاختيار الحالي

    // تصفير القائمة وإضافة العميل النقدي أولاً
    select.innerHTML = '<option value="cash">عميل  (نقدي)</option>';

    db.getCustomers().forEach((customer) => {
      // التحقق: هل مربع البحث فارغ؟ أو هل الاسم/الرقم يطابق البحث؟
      if (
        !term ||
        customer.name.toLowerCase().includes(term) ||
        (customer.phone && customer.phone.includes(term))
      ) {
        const option = document.createElement("option");
        option.value = customer.id;
        // تنسيق الاسم مع رقم الهاتف ليظهر بشكل أرتب
        option.textContent = `${customer.name} ${
          customer.phone ? " - " + customer.phone : ""
        }`;
        select.appendChild(option);
      }
    });

    // إبقاء التحديد على العميل المختار إذا كان لا يزال ضمن نتائج البحث
    if (Array.from(select.options).some((o) => o.value === currentValue)) {
      select.value = currentValue;
    } else {
      select.value = "cash";
    }
  }

  /**
   * Load transaction customer select
   */
  loadTransactionCustomerSelect() {
    const select = document.getElementById("transaction-customer");
    select.innerHTML = "";

    db.getCustomers().forEach((customer) => {
      const option = document.createElement("option");
      option.value = customer.id;
      option.textContent = customer.name;
      select.appendChild(option);
    });
  }

  /**
   * Add transaction
   */
  addTransaction() {
    const customerId = parseInt(
      document.getElementById("transaction-customer").value
    );
    const type = document.getElementById("transaction-type").value;
    const amount = parseFloat(
      document.getElementById("transaction-amount").value
    );
    const notes = document.getElementById("transaction-notes").value;

    if (!customerId || isNaN(amount) || amount <= 0) {
      alert("يرجى إدخال مبلغ صحيح واختيار العميل");
      return;
    }

    // 1. تسجيل العملية في دفتر الصندوق
    db.addTransaction({
      customer_id: customerId,
      amount,
      type,
      notes,
    });

    // 2. تحديث رصيد العميل العام
    const balanceChange = type === "in" ? -amount : amount;
    db.updateCustomerBalance(customerId, balanceChange);

    // ==========================================
    // 3. الجزء الجديد الذكي: تسديد الفواتير القديمة
    // ==========================================
    if (type === "in") {
      // إذا كانت العملية "دفع من العميل"
      let remainingPayment = amount; // المبلغ اللي دفعه الزبون ولسه ما توزع

      // جلب كل فواتير العميل اللي لسا عليها دين (المدفوع أقل من الإجمالي)
      let unpaidInvoices = db
        .getInvoices()
        .filter(
          (inv) =>
            inv.customer_id === customerId && inv.paid_amount < inv.total_amount
        );

      // ترتيب الفواتير من الأقدم للأحدث (عشان نسدد القديم أولاً)
      unpaidInvoices.sort((a, b) => new Date(a.date) - new Date(b.date));

      // توزيع المبلغ على الفواتير
      for (let inv of unpaidInvoices) {
        if (remainingPayment <= 0) break; // إذا خلصت الدفعة، بنوقف

        // قديش باقي على هاي الفاتورة؟
        let amountOwedOnInvoice = inv.total_amount - inv.paid_amount;

        if (remainingPayment >= amountOwedOnInvoice) {
          // الدفعة بتغطي الفاتورة كاملة (وزيادة)
          db.updateInvoice(inv.id, {
            paid_amount: inv.total_amount, // تسديد كامل
            status: "paid", // تحويل الحالة لمدفوع
          });
          remainingPayment -= amountOwedOnInvoice; // نخصم اللي سددناه من الدفعة
        } else {
          // الدفعة ما بتغطي الفاتورة كاملة (تسديد جزئي)
          db.updateInvoice(inv.id, {
            paid_amount: inv.paid_amount + remainingPayment, // نضيف الدفعة للرصيد المدفوع سابقاً
            // status تبقى 'unpaid' لأنها لسا ما تسددت بالكامل
          });
          remainingPayment = 0; // الدفعة خلصت
        }
      }
    }
    // ==========================================

    // 4. تفريغ الحقول وتحديث الشاشات
    document.getElementById("transaction-amount").value = "";
    document.getElementById("transaction-notes").value = "";

    alert("تم تسجيل الدفعة وتسديد الفواتير المعلقة بنجاح");

    this.loadCustomers(); // تحديث جدول العملاء (الرصيد)

    // تحديث سجل المبيعات والفواتير (إذا كان مفتوح)
    if (document.getElementById("sales-log-table-body")) {
      this.loadSalesLog();
    }

    this.updateDashboard(); // تحديث الداشبورد (الأرباح، المبيعات، الديون)
    const currentCustId = parseInt(
      document.getElementById("transaction-customer").value
    );
    if (currentCustId) {
      this.loadCustomerQuickHistory(currentCustId);
    }
    document.getElementById("transaction-amount").value = "";
    document.getElementById("transaction-notes").value = "";
  }

  /**
   * Load reports page
   */
  loadReports() {
    this.loadTopProducts();
    this.loadLeastProducts();
  }

  /**
   * Load top selling products
   */
  loadTopProducts() {
    const products = db.getTopSellingProducts(10);
    const tbody = document.getElementById("top-products-table");
    tbody.innerHTML = "";

    if (products.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="3" style="text-align: center; padding: 20px;">لا توجد بيانات</td></tr>';
      return;
    }

    products.forEach((item) => {
      const product = db.getProductById(item.product_id);
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${product ? product.name : "منتج محذوف"}</td>
                <td>${item.quantity}</td>
                <td>${this.formatCurrency(item.revenue)}</td>
            `;
      tbody.appendChild(row);
    });
  }

  /**
   * Load least selling products
   */
  loadLeastProducts() {
    const products = db.getLeastSellingProducts(10);
    const tbody = document.getElementById("least-products-table");
    tbody.innerHTML = "";

    if (products.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="3" style="text-align: center; padding: 20px;">لا توجد بيانات</td></tr>';
      return;
    }

    products.forEach((item) => {
      const product = db.getProductById(item.product_id);
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${product ? product.name : "منتج محذوف"}</td>
                <td>${item.quantity}</td>
                <td>${this.formatCurrency(item.revenue)}</td>
            `;
      tbody.appendChild(row);
    });
  }

  /**
   * Open calculator modal
   */
  openCalculatorModal() {
    this.openModal("calculator-modal");
  }

  /**
   * Open modal
   */
  openModal(modalId) {
    document.getElementById(modalId).classList.add("active");
  }

  /**
   * Close modal
   */
  closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
  }

  /**
   * Export data
   */
  exportData() {
    const data = db.exportData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pharmacy-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import data
   */
  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        db.importData(data);
        alert("تم استيراد البيانات بنجاح");
        this.refreshPageContent(this.currentPage);
      } catch (error) {
        alert("خطأ في استيراد البيانات");
      }
    };
    reader.readAsText(file);
  }

  /**
   * Clear all data
   */
  clearAllData() {
    if (
      confirm(
        "هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه."
      )
    ) {
      db.clearAllData();
      alert("تم حذف جميع البيانات");
      this.navigateToPage("dashboard");
    }
  }

  /**
   * Format currency
   */
  formatCurrency(value) {
    // en-US تعني تنسيق أمريكي (رمز $ على اليسار)
    // إذا بدك الرمز يضل عاليمين وبس نغير العملة، خبرني.
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2, // الدولار غالباً بنحتاج فيه فاصلة وقرشين (.00)
    }).format(value);
  }

  /**
   * Update date and time
   */
  updateDateTime() {
    const now = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      numberingSystem: "latn", // هاد السطر بيجبر الأرقام تصير 123
    };
    document.getElementById("current-date").textContent =
      now.toLocaleDateString("ar-SA", options);
  }

  renderDashboardData(filterType) {
    const thead = document.getElementById("dashboard-table-head");
    const tbody = document.getElementById("dashboard-table-body");
    const totalDisplayArea = document.querySelector(".quick-stats-bar span"); // لجلب مكان النص

    if (!tbody || !thead) return;

    tbody.innerHTML = "";
    let total = 0;
    let totalLabel = "الإجمالي: "; // النص الافتراضي

    // متغيرات مساعدة للتواريخ
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayString = now.toDateString();

    switch (filterType) {
      // ----------------------------------------------------
      // 1 & 2: المبيعات (الشهرية واليومية) - دمجناهم لأنهم بيشبهوا بعض
      // ----------------------------------------------------
      case "all": // مبيعات شهرية
      case "daily": // مبيعات اليوم
        totalLabel =
          filterType === "daily"
            ? "إجمالي مبيعات اليوم: "
            : "إجمالي مبيعات الشهر: ";
        thead.innerHTML = `<tr>
            <th>التاريخ</th>
            <th>رقم الفاتورة</th>
            <th>العميل</th>
            <th>إجمالي الفاتورة</th>
            <th>المدفوع كاش</th>
            <th>الحالة</th>
        </tr>`;

        // فلترة الفواتير حسب اليوم أو الشهر
        const invoices = db.getInvoices().filter((inv) => {
          const invDate = new Date(inv.date);
          if (filterType === "daily") {
            return invDate.toDateString() === todayString;
          } else {
            return (
              invDate.getMonth() === currentMonth &&
              invDate.getFullYear() === currentYear
            );
          }
        });

        if (invoices.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">لا توجد مبيعات في هذه الفترة</td></tr>`;
        } else {
          invoices.reverse().forEach((inv) => {
            total += inv.total_amount; // نجمع قيمة المبيعات
            const customer = inv.customer_id
              ? db.getCustomerById(inv.customer_id)
              : { name: "عميل (نقدي)" };
            const statusHtml =
              inv.status === "paid"
                ? '<span class="badge success" style="color:green">مدفوع</span>'
                : '<span class="badge warning" style="color:red">دين</span>';

            tbody.innerHTML += `<tr>
                    <td>${new Date(inv.date).toLocaleString("ar-SA")}</td>
                    <td>#${inv.id}</td>
                    <td style="font-weight:bold">${customer.name}</td>
                    <td>${this.formatCurrency(inv.total_amount)}</td>
                    <td style="color:green">${this.formatCurrency(
                      inv.paid_amount
                    )}</td>
                    <td>${statusHtml}</td>
                </tr>`;
          });
        }
        break;

      // ----------------------------------------------------
      // 3: كشف الديون (من عليه مصاري للسوق)
      // ----------------------------------------------------
      case "debts":
        totalLabel = "إجمالي الديون في السوق (لك): ";
        thead.innerHTML = `<tr>
            <th>اسم العميل</th>
            <th>رقم الهاتف</th>
            <th>الدين المتبقي (الرصيد)</th>
        </tr>`;

        const debtors = db.getCustomers().filter((c) => c.balance > 0);

        if (debtors.length === 0) {
          tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">لا يوجد ديون مستحقة، السوق نظيف!</td></tr>`;
        } else {
          // ترتيب الديون من الأكبر للأصغر
          debtors
            .sort((a, b) => b.balance - a.balance)
            .forEach((c) => {
              total += c.balance;
              tbody.innerHTML += `<tr>
                    <td style="font-weight:bold; color:var(--secondary-color); cursor:pointer;" onclick="ui.navigateToPage('customers')" title="الذهاب لصفحة العميل">${
                      c.name
                    }</td>
                    <td>${c.phone || "-"}</td>
                    <td style="color:red; font-weight:bold; font-size:16px;">${this.formatCurrency(
                      c.balance
                    )}</td>
                </tr>`;
            });
        }
        break;

      // ----------------------------------------------------
      // 4: الأرباح (تحسب أرباح الشهر الحالي كخلاصة سريعة)
      // ----------------------------------------------------
      case "profit":
        totalLabel = "إجمالي الأرباح الصافية (لهذا الشهر): ";
        thead.innerHTML = `<tr>
            <th>المادة (المنتج)</th>
            <th>الكمية المباعة</th>
            <th>إجمالي المبيعات</th>
            <th>صافي الربح</th>
        </tr>`;

        const allInvoiceItems = db.getAllData().invoiceItems || [];
        let productProfits = {};

        // نحسب أرباح هذا الشهر فقط عشان الداشبورد ما يكون بطيء
        const currentMonthInvoicesIds = db
          .getInvoices()
          .filter(
            (inv) =>
              new Date(inv.date).getMonth() === currentMonth &&
              new Date(inv.date).getFullYear() === currentYear
          )
          .map((inv) => inv.id);

        allInvoiceItems.forEach((item) => {
          if (currentMonthInvoicesIds.includes(item.invoice_id)) {
            const product = db.getProductById(item.product_id);
            if (product) {
              const revenue = item.price * item.quantity;
              const cost = product.purchase_price * item.quantity;
              const profit = revenue - cost;

              if (!productProfits[item.product_id]) {
                productProfits[item.product_id] = {
                  name: product.name,
                  qty: 0,
                  totalRev: 0,
                  totalProfit: 0,
                };
              }
              productProfits[item.product_id].qty += item.quantity;
              productProfits[item.product_id].totalRev += revenue;
              productProfits[item.product_id].totalProfit += profit;
            }
          }
        });

        const sortedProfits = Object.values(productProfits).sort(
          (a, b) => b.totalProfit - a.totalProfit
        );

        if (sortedProfits.length === 0) {
          tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">لا توجد مبيعات هذا الشهر لحساب الأرباح</td></tr>`;
        } else {
          sortedProfits.forEach((p) => {
            total += p.totalProfit;
            tbody.innerHTML += `<tr>
                    <td style="font-weight:bold">${p.name}</td>
                    <td>${p.qty} قطعة</td>
                    <td>${this.formatCurrency(p.totalRev)}</td>
                    <td style="color:var(--primary-color); font-weight:bold">${this.formatCurrency(
                      p.totalProfit
                    )}</td>
                </tr>`;
          });
        }
        break;

      // ----------------------------------------------------
      // 5: جرد المستودع (الكود اللي عملناه سابقاً)
      // ----------------------------------------------------
      case "inventory":
        totalLabel = "إجمالي تكلفة البضاعة المضافة: ";
        thead.innerHTML = `<tr>
            <th>التاريخ</th>
            <th>المادة (المنتج)</th>
            <th>الكمية المضافة</th>
            <th>إجمالي سعر الشراء</th>
        </tr>`;

        const stockLog = db.getInventoryAdditions();
        if (stockLog.length === 0) {
          tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">لا يوجد سجلات توريد بضاعة حتى الآن</td></tr>`;
        } else {
          [...stockLog].reverse().forEach((entry) => {
            total += entry.totalCost;
            tbody.innerHTML += `<tr>
                <td>${new Date(entry.date).toLocaleDateString("ar-SA")}</td>
                <td style="font-weight:bold">${entry.productName}</td>
                <td>${entry.quantity} قطعة</td>
                <td>${this.formatCurrency(entry.totalCost)}</td>
              </tr>`;
          });
        }
        break;
    }

    // تحديث شريط الإجمالي بالرقم والنص الصحيح
    if (totalDisplayArea) {
      totalDisplayArea.innerHTML = `${totalLabel} <strong id="filter-total-value" style="font-size:18px;">${this.formatCurrency(
        total
      )}</strong>`;
    }
  }

  loadCustomerQuickHistory(customerId) {
    const customer = db.getCustomerById(customerId);
    if (!customer) return;

    document.getElementById("transaction-customer").value = customerId;

    const historyContainer = document.getElementById(
      "customer-history-container"
    );
    const historyList = document.getElementById("customer-history-list");
    const notesField = document.getElementById("transaction-notes");

    historyList.innerHTML = "";
    notesField.value = "";

    // 1. جلب المشتريات (الفواتير)
    const invoices = db
      .getInvoices()
      .filter((inv) => inv.customer_id === customerId);

    // 2. جلب الدفعات النقدية (التي سجلتها في الصندوق)
    const transactions = db
      .getTransactions()
      .filter((t) => t.customer_id === customerId);

    // 3. دمج المشتريات والدفعات في مصفوفة واحدة وترتيبها زمنياً (من الأحدث للأقدم)
    let fullHistory = [];

    // إضافة المشتريات للمصفوفة
    invoices.forEach((inv) => {
      const items = db.getInvoiceItems(inv.id);
      items.forEach((item) => {
        const product = db.getProductById(item.product_id);
        fullHistory.push({
          date: new Date(inv.date),
          type: "purchase",
          name: product ? product.name : "منتج محذوف",
          amount: item.price,
          qty: item.quantity,
          note: inv.status === "paid" ? "مدفوع نقداً" : "بالدين",
        });
      });
    });

    // إضافة الدفعات المالية (مثل الـ 50 دولار تبعت باسم)
    transactions.forEach((t) => {
      fullHistory.push({
        date: new Date(t.date),
        type: "payment",
        name: t.type === "in" ? "قبض دفعة مالية" : "استرجاع مبلغ",
        amount: t.amount,
        qty: null,
        note: t.notes || "بدون ملاحظات", // هنا ستظهر ملاحظتك "عم يسدد الدين"
      });
    });

    // ترتيب الكل حسب التاريخ
    fullHistory.sort((a, b) => b.date - a.date);

    if (fullHistory.length === 0) {
      historyList.innerHTML =
        '<p style="text-align:center; color:#7f8c8d;">لا يوجد أي حركات مسجلة.</p>';
    } else {
      fullHistory.forEach((entry) => {
        const row = document.createElement("div");
        row.style.cssText =
          "display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 13px;";

        // تمييز اللون: أخضر للدفعات، وأزرق للمشتريات
        const iconColor =
          entry.type === "payment"
            ? "var(--primary-color)"
            : "var(--secondary-color)";
        const icon =
          entry.type === "payment" ? "fa-money-bill-wave" : "fa-shopping-bag";

        row.innerHTML = `
                <div style="flex: 2;">
                    <i class="fas ${icon}" style="color: ${iconColor}; margin-left: 8px;"></i>
                    <strong>${entry.name}</strong>
                    <br><small style="color: #7f8c8d; margin-right: 25px;">${
                      entry.note
                    }</small>
                </div>
                <div style="flex: 1; text-align: center;">
                    ${
                      entry.qty
                        ? `<span style="background: #eee; padding: 2px 6px; border-radius: 10px;">${entry.qty} قطعة</span>`
                        : ""
                    }
                </div>
                <div style="flex: 1; text-align: left; font-weight: bold;">
                    ${this.formatCurrency(entry.amount)}
                </div>
                <div style="flex: 1; text-align: left; color: #999; font-size: 11px;">
                    ${entry.date.toLocaleDateString("ar-SA")}
                </div>
            `;
        historyList.appendChild(row);
      });
    }

    historyContainer.style.display = "block";
    historyContainer.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  // 1. تحميل سجل المبيعات
  loadSalesLog() {
    const tbody = document.getElementById("sales-log-table-body");
    const search = document.getElementById("sales-search").value.toLowerCase();
    const invoices = db.getInvoices();

    tbody.innerHTML = "";

    invoices.reverse().forEach((inv) => {
      const customer = inv.customer_id
        ? db.getCustomerById(inv.customer_id)
        : { name: "عميل نقدي" };

      // فحص البحث
      if (
        search &&
        !inv.id.toString().includes(search) &&
        !customer.name.toLowerCase().includes(search)
      ) {
        return;
      }

      const row = document.createElement("tr");
      row.innerHTML = `
            <td>#${inv.id}</td>
            <td>${new Date(inv.date).toLocaleString("ar-SY")}</td>
            <td>${customer.name}</td>
            <td>${this.formatCurrency(inv.total_amount)}</td>
            <td>${this.formatCurrency(inv.paid_amount)}</td>
            <td><span class="badge ${
              inv.status === "paid" ? "success" : "warning"
            }">${inv.status === "paid" ? "مدفوع" : "دين"}</span></td>
            <td>
                <button class="action-btn" onclick="ui.viewInvoiceDetails(${
                  inv.id
                })" title="عرض التفاصيل"><i class="fas fa-eye"></i></button>
                <button class="action-btn delete" onclick="ui.deleteInvoice(${
                  inv.id
                })" title="إلغاء الفاتورة"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
      tbody.appendChild(row);
    });
  }

  // 2. عرض تفاصيل فاتورة محددة
  viewInvoiceDetails(invoiceId) {
    const inv = db.getInvoiceById(invoiceId);
    const items = db.getInvoiceItems(invoiceId);
    const customer = inv.customer_id
      ? db.getCustomerById(inv.customer_id)
      : { name: "عميل نقدي" };

    document.getElementById("detail-invoice-id").textContent = invoiceId;
    const content = document.getElementById("invoice-details-content");

    let itemsHtml = `
        <p><strong>العميل:</strong> ${customer.name}</p>
        <p><strong>التاريخ:</strong> ${new Date(inv.date).toLocaleString(
          "ar-SY"
        )}</p>
        <hr>
        <table class="data-table">
            <thead>
                <tr><th>المادة</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>
            </thead>
            <tbody>
    `;

    items.forEach((item) => {
      const product = db.getProductById(item.product_id);
      itemsHtml += `
            <tr>
                <td>${product ? product.name : "منتج محذوف"}</td>
                <td>${item.quantity}</td>
                <td>${this.formatCurrency(item.price)}</td>
                <td>${this.formatCurrency(item.quantity * item.price)}</td>
            </tr>
        `;
    });

    itemsHtml += `
            </tbody>
        </table>
        <div style="margin-top:15px; text-align:left;">
            <p>الإجمالي الكلي: <strong>${this.formatCurrency(
              inv.total_amount
            )}</strong></p>
            <p>المدفوع: <strong style="color:green">${this.formatCurrency(
              inv.paid_amount
            )}</strong></p>
            <p>الباقي (دين): <strong style="color:red">${this.formatCurrency(
              inv.total_amount - inv.paid_amount
            )}</strong></p>
        </div>
    `;

    content.innerHTML = itemsHtml;
    this.openModal("invoice-details-modal");
  }

  // 3. حذف فاتورة وإعادة البضاعة للمخزون (مهم جداً!)
  deleteInvoice(invoiceId) {
    if (
      confirm(
        "هل أنت متأكد من إلغاء هذه الفاتورة؟ سيتم إعادة الكميات المباعة إلى المخزون."
      )
    ) {
      const items = db.getInvoiceItems(invoiceId);
      const inv = db.getInvoiceById(invoiceId);

      // إعادة البضاعة للمخزون
      items.forEach((item) => {
        const product = db.getProductById(item.product_id);
        if (product) {
          db.updateProduct(product.id, {
            stock_quantity: product.stock_quantity + item.quantity,
          });
        }
      });

      // تعديل رصيد العميل إذا كانت الفاتورة ديناً
      if (inv.customer_id && inv.status === "unpaid") {
        const unpaidAmount = inv.total_amount - inv.paid_amount;
        db.updateCustomerBalance(inv.customer_id, -unpaidAmount);
      }

      // حذف الفاتورة نهائياً
      db.deleteInvoice(invoiceId);
      alert("تم إلغاء الفاتورة بنجاح وإعادة البضاعة للمخزون.");
      this.loadSalesLog();
      this.updateDashboard();
    }
  }
  // 1. تحديث صفحة التقارير عند فتحها
  // (تأكد من إضافة السطر التالي داخل دالة refreshPageContent):
  // case 'reports': this.loadProfitReport(); break;

  loadProfitReport() {
    console.log("جاري تحديث التقرير..."); // سطر للتأكد إن الزر استجاب

    const fromInput = document.getElementById("report-from-date");
    const toInput = document.getElementById("report-to-date");

    if (!fromInput || !toInput) {
      console.error("خطأ: لم يتم العثور على خانات التاريخ في الصفحة!");
      return;
    }

    const fromDate = fromInput.value;
    const toDate = toInput.value;

    console.log("الفلترة من:", fromDate, "إلى:", toDate);

    // جلب البيانات من الداتا بيز
    const data = db.getProfitReportData(fromDate, toDate);

    // 1. تحديث الأرقام في البطاقات (تأكد أن الـ IDs موجودة بالـ HTML)
    const revEl = document.getElementById("report-total-revenue");
    const costEl = document.getElementById("report-total-cost");
    const profitEl = document.getElementById("report-total-profit");

    if (revEl) revEl.textContent = this.formatCurrency(data.totalRevenue);
    if (costEl) costEl.textContent = this.formatCurrency(data.totalCost);
    if (profitEl) {
      profitEl.textContent = this.formatCurrency(data.totalProfit);
      profitEl.style.color =
        data.totalProfit >= 0 ? "var(--primary-color)" : "var(--danger-color)";
    }

    // 2. تحديث جدول المنتجات الأكثر ربحية
    const tbody = document.getElementById("profitable-products-table");
    if (!tbody) return;

    tbody.innerHTML = "";

    const sortedProfits = Object.values(data.productProfits)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

    if (sortedProfits.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="3" style="text-align:center;">لا توجد مبيعات في هذه الفترة</td></tr>';
    } else {
      sortedProfits.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.qty} قطعة</td>
                <td style="font-weight:bold; color:var(--primary-color)">${this.formatCurrency(
                  item.profit
                )}</td>
            `;
        tbody.appendChild(row);
      });
    }
  }
  // 1. دالة عرض النواقص في الجدول
  loadLowStock() {
    const tbody = document.getElementById("low-stock-table-body");
    // جلب المنتجات اللي كميتها 5 أو أقل
    const lowProducts = db.getLowStockProducts(5);

    tbody.innerHTML = "";

    if (lowProducts.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align: center; font-size: 16px; padding: 30px;">المستودع ممتلئ، لا يوجد نواقص حالياً! </td></tr>';
      return;
    }

    // ترتيب المنتجات من الأقل (اللي خلصان) للأكثر
    lowProducts
      .sort((a, b) => a.stock_quantity - b.stock_quantity)
      .forEach((product) => {
        // تحديد حالة الخطر (خلصان تماماً أو قارب على النفاذ)
        const status =
          product.stock_quantity === 0
            ? '<span class="badge" style="background:var(--danger-color);color:white;padding:5px 10px;border-radius:15px">نفذ تماماً</span>'
            : '<span class="badge" style="background:var(--warning-color);color:white;padding:5px 10px;border-radius:15px">قارب على النفاذ</span>';

        const row = document.createElement("tr");
        row.innerHTML = `
                <td style="font-weight:bold">${product.name}</td>
                <td>${product.company || "غير محدد"}</td>
                <td>${product.category}</td>
                <td style="color:red; font-weight:bold; font-size:18px;">${
                  product.stock_quantity
                }</td>
                <td>${status}</td>
            `;
        tbody.appendChild(row);
      });
  }

  // 2. دالة تجهيز رسالة الواتساب ونسخها
  copyLowStockForWhatsApp() {
    const lowProducts = db.getLowStockProducts(5);

    if (lowProducts.length === 0) {
      alert("لا يوجد نواقص لطلبها!");
      return;
    }

    // بناء نص الرسالة بشكل مرتب
    let text = "مرحباً، أرجو تجهيز الطلبية التالية:\n\n";

    lowProducts.forEach((p, index) => {
      text += `${index + 1}. ${p.name} (شركة: ${
        p.company || "أي شركة"
      }) - الكمية المطلوبة: .......\n`;
    });

    text += "\nشكراً لكم.";

    // أمر نسخ النص إلى الحافظة (Clipboard)
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert(
          '✅ تم نسخ قائمة النواقص!\n\nيمكنك الآن فتح محادثة المورد في الواتساب وعمل "لصق" (Paste) لإرسال الطلبية.'
        );
      })
      .catch((err) => {
        alert("حدث خطأ أثناء النسخ، يرجى المحاولة مرة أخرى.");
      });
  }
  // دالة للتحقق مما إذا كان المستخدم قد سجل دخوله مسبقاً
  checkLoginStatus() {
    // إذا كان مسجل دخول من قبل
    if (localStorage.getItem("isLoggedIn") === "true") {
      document.getElementById("login-screen").style.display = "none";
      document.getElementById("app").style.display = "flex";
      this.updateDashboard();
      this.checkAutoBackup();
    } else {
      // إذا لم يسجل دخول، نعرض شاشة القفل
      document.getElementById("login-screen").style.display = "flex";
      document.getElementById("app").style.display = "none";
    }
  }
  // 1. دالة فحص النسخ الاحتياطي التلقائي
  checkAutoBackup() {
    const today = new Date().toISOString().split("T")[0]; // تاريخ اليوم (مثال: 2026-03-31)
    const lastBackupDate = localStorage.getItem("last_auto_backup_date");

    // إذا كان تاريخ آخر نسخة لا يساوي تاريخ اليوم، يعني لسا ما عملنا نسخة اليوم!
    if (lastBackupDate !== today) {
      // نعمل تأخير 3 ثواني عشان ما يزعج المستخدم أول ما يفتح البرنامج
      setTimeout(() => {
        this.triggerAutoBackupDownload(`AutoBackup-${today}.json`);
        // حفظ تاريخ اليوم عشان ما يرجع يحمله مرة تانية بنفس اليوم
        localStorage.setItem("last_auto_backup_date", today);

        // إشعار لطيف للمستخدم
        this.showNotification("تم إنشاء نسخة احتياطية تلقائية لبيانات اليوم!");
      }, 3000);
    }
  }

  // 2. دالة التحميل الصامتة الخاصة بالنسخ التلقائي
  triggerAutoBackupDownload(filename) {
    const data = db.exportData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link); // ضروري لبعض المتصفحات
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // 3. دالة إشعار لطيفة (بدل الـ alert المزعج)
  showNotification(message) {
    const notif = document.createElement("div");
    notif.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: #27ae60; color: white; padding: 15px 30px;
            border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 999999; font-weight: bold; transition: opacity 0.5s;
        `;
    notif.textContent = message;
    document.body.appendChild(notif);

    // إخفاء الإشعار بعد 4 ثواني
    setTimeout(() => {
      notif.style.opacity = "0";
      setTimeout(() => notif.remove(), 500);
    }, 4000);
  }
  // دالة تصدير تقرير الأرباح إلى ملف إكسيل (CSV)
  // دالة خاصة بتصدير تقرير "الأرباح" فقط
  exportReportToExcel() {
    const fromDate = document.getElementById("report-from-date").value;
    const toDate = document.getElementById("report-to-date").value;

    // جلب الداتا المفلترة حسب التاريخ
    const data = db.getProfitReportData(fromDate, toDate);

    let csvContent = "\uFEFF"; // لدعم العربي
    csvContent +=
      "اسم المنتج;الكمية المباعة;إجمالي الإيرادات;إجمالي التكلفة;صافي الربح\n";

    const sortedProfits = Object.values(data.productProfits);

    sortedProfits.forEach((item) => {
      const revenue = item.totalRev || 0;
      const profit = item.totalProfit || 0;
      const cost = revenue - profit;
      csvContent += `${item.name};${item.qty};${revenue};${cost};${profit}\n`;
    });

    // إنشاء الملف وتحميله
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `تقرير_أرباح_${fromDate}_إلى_${toDate}.csv`;
    link.href = url;
    link.click();
  }
  // دالة تصدير سجل الفواتير إلى ملف Excel (CSV) يفهمه العميل
  async exportInvoicesToExcel() {
    const invoices = db.getInvoices();
    if (!invoices.length) {
      alert("لا يوجد فواتير لتصديرها.");
      return;
    }

    // Excel في الإعدادات العربية يستخدم الفاصلة المنقوطة ; كفاصل أعمدة
    const sep = ";";

    // ترويسة الملف (العناوين)
    let csv = "\uFEFF"; // BOM لدعم العربية في Excel
    csv += [
      "رقم الفاتورة",
      "التاريخ",
      "العميل",
      "إجمالي الفاتورة",
      "المدفوع",
      "الباقي",
      "الحالة",
    ].join(sep);
    csv += "\r\n";

    invoices.forEach((inv) => {
      const customer = inv.customer_id
        ? db.getCustomerById(inv.customer_id)
        : { name: "عميل نقدي" };

      const dateStr = new Date(inv.date).toLocaleString("ar-SY");
      const total = inv.total_amount || 0;
      const paid = inv.paid_amount || 0;
      const remaining = total - paid;
      const status = inv.status === "paid" ? "مدفوع" : "دين";

      const row = [
        `"${inv.id}"`,
        `"${dateStr}"`,
        `"${customer.name}"`,
        total,
        paid,
        remaining,
        `"${status}"`,
      ].join(sep);

      csv += row + "\r\n";
    });

    const today = new Date().toISOString().split("T")[0];
    const fileName = `سجل_الفواتير_${today}.csv`;

    // محاولة حفظ الملف مباشرة ضمن data/ (مدعوم في متصفحات Chromium الحديثة)
    if ("showDirectoryPicker" in window) {
      try {
        const rootDirHandle = await window.showDirectoryPicker({
          mode: "readwrite",
          id: "agri-pharmacy-export-root",
        });

        const dataDirHandle = await rootDirHandle.getDirectoryHandle("data", {
          create: true,
        });
        const fileHandle = await dataDirHandle.getFileHandle(fileName, {
          create: true,
        });
        const writable = await fileHandle.createWritable();
        await writable.write(csv);
        await writable.close();

        this.showNotification(`تم حفظ الملف داخل data باسم ${fileName}`);
        return;
      } catch (error) {
        // إذا ألغى المستخدم الاختيار ننتقل للحفظ التقليدي بصمت
        if (error?.name !== "AbortError") {
          console.error("File System Access API error:", error);
        }
      }
    }

    // fallback: تنزيل عادي إذا API غير مدعومة أو فشلت
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = fileName;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  // دالة فلترة العملاء في صفحة البيع
  filterPOSCustomers() {
    const searchInput = document.getElementById("pos-customer-search-input");
    if (!searchInput) return;

    const term = searchInput.value.toLowerCase();
    const select = document.getElementById("customer-select");
    const currentValue = select.value; // حفظ الاختيار الحالي

    select.innerHTML = '<option value="cash">عميل نقدي</option>';

    db.getCustomers().forEach((c) => {
      // البحث بالاسم أو الرقم
      if (
        c.name.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term))
      ) {
        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = `${c.name} (${c.phone || "بدون رقم"})`;
        select.appendChild(option);
      }
    });

    // إبقاء العميل مختاراً إذا كان لا يزال ضمن نتائج البحث
    if (Array.from(select.options).some((o) => o.value === currentValue)) {
      select.value = currentValue;
    }
  }
  // دالة فحص وتفعيل التحديثات الجديدة للنظام
  // دالة فحص وتفعيل التحديثات الجديدة (النسخة النووية لكسر الكاش)
  async checkForUpdates() {
    const updateBtn = document.getElementById("check-update-btn");
    const originalText = updateBtn.innerHTML;

    if (!navigator.onLine) {
      alert("❌ لا يوجد اتصال بالإنترنت.");
      return;
    }

    updateBtn.disabled = true;
    updateBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> جاري جلب التحديث...';

    try {
      // 1. إجبار الـ Service Worker على التحديث
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let reg of registrations) {
        await reg.update();
      }

      // 2. مسح الكاش برمجياً (تفريغ الذاكرة القديمة تماماً)
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        for (let name of cacheNames) {
          await caches.delete(name);
        }
      }

      // 3. رسالة للمستخدم وإعادة تحميل قسرية
      alert(
        "✨ تم تنظيف الذاكرة وجلب أحدث نسخة! سيتم إعادة تشغيل النظام الآن."
      );

      // إضافة رقم عشوائي للرابط تمنع المتصفح من استخدام الكاش نهائياً
      window.location.href =
        window.location.origin +
        window.location.pathname +
        "?v=" +
        new Date().getTime();
    } catch (err) {
      alert("حدث خطأ أثناء التحديث، يرجى المحاولة لاحقاً.");
      this.resetUpdateBtn(updateBtn, originalText);
    }
  }
  // دالة مساعدة لإعادة شكل الزر
  resetUpdateBtn(btn, text) {
    btn.disabled = false;
    btn.innerHTML = text;
  }
}

// Create global UI manager instance
let ui;
document.addEventListener("DOMContentLoaded", async () => {
  await db.ready();
  ui = new UIManager();
  ui.updateDashboard();
});
