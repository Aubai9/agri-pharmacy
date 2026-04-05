/**
 * Calculator Module
 * Provides floating calculator functionality
 */

class Calculator {
  constructor() {
    this.display = document.getElementById("calc-display");
    this.currentValue = "0";
    this.previousValue = "";
    this.operation = null;
    this.shouldResetDisplay = false;
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Number and decimal buttons
    document.querySelectorAll(".calc-btn[data-value]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const value = btn.getAttribute("data-value");
        if (value === "=") {
          this.calculate();
        } else if (btn.classList.contains("operator")) {
          this.setOperation(value);
        } else {
          this.inputValue(value);
        }
      });
    });

    // Clear button
    document.getElementById("calc-clear").addEventListener("click", () => {
      this.clear();
    });
  }

  inputValue(value) {
    if (this.shouldResetDisplay) {
      this.currentValue = value;
      this.shouldResetDisplay = false;
    } else {
      if (value === "." && this.currentValue.includes(".")) return;
      this.currentValue =
        this.currentValue === "0" ? value : this.currentValue + value;
    }
    this.updateDisplay();
  }

  setOperation(op) {
    if (this.operation !== null) {
      this.calculate();
    }
    this.previousValue = this.currentValue;
    this.operation = op;
    this.shouldResetDisplay = true;

    // 👇 هذا هو السطر اللي كان ناقص عشان تظهر العملية على الشاشة فوراً 👇
    this.updateDisplay();
  }

  calculate() {
    if (this.operation === null || this.shouldResetDisplay) return;

    let result;
    const prev = parseFloat(this.previousValue);
    const current = parseFloat(this.currentValue);

    switch (this.operation) {
      case "+":
        result = prev + current;
        break;
      case "-":
        result = prev - current;
        break;
      case "*":
        result = prev * current;
        break;
      case "/":
        result = current !== 0 ? prev / current : 0;
        break;
      default:
        return;
    }

    this.currentValue = result.toString();
    this.operation = null;
    this.shouldResetDisplay = true;
    this.updateDisplay();
  }

  clear() {
    this.currentValue = "0";
    this.previousValue = "";
    this.operation = null;
    this.shouldResetDisplay = false;
    this.updateDisplay();
  }

  updateDisplay() {
    if (this.operation && !this.shouldResetDisplay) {
      this.display.value = `${this.previousValue} ${this.operation} ${this.currentValue}`;
    } else if (this.operation && this.shouldResetDisplay) {
      this.display.value = `${this.previousValue} ${this.operation}`;
    } else {
      this.display.value = this.currentValue;
    }
  }
}

// Initialize calculator when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new Calculator();
});
