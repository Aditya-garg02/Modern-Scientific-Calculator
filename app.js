/**
 * Modern Scientific Calculator
 * Web Edition - Client-side Engine
 * Mirrors Python AST Calculator logic & Tkinter GUI behavior
 */

(function () {
  'use strict';

  // =========================================================
  // STATE MANAGEMENT
  // =========================================================
  const state = {
    displayValue: '',
    subDisplayValue: '',
    memory: 0,
    history: [],
    theme: 'dark',
    justCalculated: false
  };

  const STORAGE_KEYS = {
    HISTORY: 'msc_history_records',
    THEME: 'msc_theme_pref',
    MEMORY: 'msc_memory_val'
  };

  // DOM Elements
  const display = document.getElementById('display');
  const subDisplay = document.getElementById('sub-display');
  const memoryBadge = document.getElementById('memory-badge');
  const themeBtn = document.getElementById('theme-btn');
  const themeBtnText = document.getElementById('theme-btn-text');
  const themeBtnIcon = document.getElementById('theme-btn-icon');
  const historyModal = document.getElementById('history-modal');
  const historyList = document.getElementById('history-list');
  const btnHistoryToggle = document.getElementById('btn-history-toggle');
  const btnCloseHistory = document.getElementById('btn-close-history');
  const btnClearHistory = document.getElementById('btn-clear-history');
  const toast = document.getElementById('toast');

  // =========================================================
  // MATHEMATICAL EVALUATOR (Safe AST / Recursive Descent)
  // =========================================================

  class CalculatorEngine {
    constructor() {
      this.constants = {
        pi: Math.PI,
        e: Math.E
      };

      this.functions = {
        sin: (x) => {
          const rad = (x * Math.PI) / 180;
          let val = Math.sin(rad);
          if (Math.abs(val) < 1e-15) val = 0;
          return val;
        },
        cos: (x) => {
          const rad = (x * Math.PI) / 180;
          let val = Math.cos(rad);
          if (Math.abs(val) < 1e-15) val = 0;
          return val;
        },
        tan: (x) => {
          const degMod = Math.abs(x % 180);
          if (Math.abs(degMod - 90) < 1e-9) {
            throw new Error('Cannot divide by zero.');
          }
          const rad = (x * Math.PI) / 180;
          let val = Math.tan(rad);
          if (Math.abs(val) < 1e-15) val = 0;
          return val;
        },
        sqrt: (x) => {
          if (x < 0) throw new Error('Invalid calculation.');
          return Math.sqrt(x);
        },
        log: (x) => {
          if (x <= 0) throw new Error('Invalid calculation.');
          return Math.log10(x);
        },
        ln: (x) => {
          if (x <= 0) throw new Error('Invalid calculation.');
          return Math.log(x);
        },
        abs: (x) => Math.abs(x)
      };
    }

    tokenize(raw) {
      // Normalize math symbols
      let expr = raw
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/π/g, 'pi');

      const tokens = [];
      let i = 0;

      while (i < expr.length) {
        const char = expr[i];

        if (/\s/.test(char)) {
          i++;
          continue;
        }

        // Numbers (integers & floats)
        if (/[0-9]/.test(char) || (char === '.' && i + 1 < expr.length && /[0-9]/.test(expr[i + 1]))) {
          let numStr = '';
          while (i < expr.length && (/[0-9]/.test(expr[i]) || expr[i] === '.')) {
            numStr += expr[i];
            i++;
          }
          tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
          continue;
        }

        // Identifiers (functions or constants: sin, cos, tan, sqrt, log, ln, abs, pi, e)
        if (/[a-zA-Z]/.test(char)) {
          let idStr = '';
          while (i < expr.length && /[a-zA-Z]/.test(expr[i])) {
            idStr += expr[i];
            i++;
          }
          idStr = idStr.toLowerCase();

          if (idStr in this.constants) {
            tokens.push({ type: 'CONST', value: idStr });
          } else if (idStr in this.functions) {
            tokens.push({ type: 'FUNC', value: idStr });
          } else {
            throw new Error(`Unknown value: ${idStr}`);
          }
          continue;
        }

        // Exponent: ** or ^
        if (char === '^') {
          tokens.push({ type: 'OP', value: '^' });
          i++;
          continue;
        }
        if (char === '*' && expr[i + 1] === '*') {
          tokens.push({ type: 'OP', value: '^' });
          i += 2;
          continue;
        }

        // Standard Operators & Parentheses
        if ('+-*/%()'.includes(char)) {
          tokens.push({ type: 'OP', value: char });
          i++;
          continue;
        }

        throw new Error('Invalid expression.');
      }

      // Handle implicit multiplication (e.g., 2pi, 2(3), (1)(2), 5sin(30))
      const expanded = [];
      for (let j = 0; j < tokens.length; j++) {
        expanded.push(tokens[j]);
        if (j + 1 < tokens.length) {
          const curr = tokens[j];
          const next = tokens[j + 1];

          const currCanEnd =
            curr.type === 'NUMBER' ||
            curr.type === 'CONST' ||
            (curr.type === 'OP' && curr.value === ')');

          const nextCanStart =
            next.type === 'NUMBER' ||
            next.type === 'CONST' ||
            next.type === 'FUNC' ||
            (next.type === 'OP' && next.value === '(');

          if (currCanEnd && nextCanStart) {
            expanded.push({ type: 'OP', value: '*' });
          }
        }
      }

      return expanded;
    }

    evaluate(expression) {
      if (!expression || !expression.trim()) {
        throw new Error('Please enter an expression.');
      }

      const tokens = this.tokenize(expression);
      if (tokens.length === 0) {
        throw new Error('Please enter an expression.');
      }

      let pos = 0;

      const peek = () => (pos < tokens.length ? tokens[pos] : null);
      const consume = () => tokens[pos++];

      // Grammar:
      // Expression -> Term (( '+' | '-' ) Term)*
      // Term       -> Factor (( '*' | '/' | '%' ) Factor)*
      // Factor     -> Power
      // Power      -> Unary ('^' Power)?   (right-associative)
      // Unary      -> ('+' | '-') Unary | Primary
      // Primary    -> NUMBER | CONST | FUNC '(' Expression ')' | '(' Expression ')'

      const parseExpression = () => {
        let left = parseTerm();
        while (pos < tokens.length) {
          const tok = peek();
          if (tok && tok.type === 'OP' && (tok.value === '+' || tok.value === '-')) {
            consume();
            const right = parseTerm();
            left = tok.value === '+' ? left + right : left - right;
          } else {
            break;
          }
        }
        return left;
      };

      const parseTerm = () => {
        let left = parsePower();
        while (pos < tokens.length) {
          const tok = peek();
          if (tok && tok.type === 'OP' && (tok.value === '*' || tok.value === '/' || tok.value === '%')) {
            consume();
            const right = parsePower();
            if (tok.value === '*') {
              left *= right;
            } else if (tok.value === '/') {
              if (right === 0) throw new Error('Cannot divide by zero.');
              left /= right;
            } else if (tok.value === '%') {
              if (right === 0) throw new Error('Cannot divide by zero.');
              left %= right;
            }
          } else {
            break;
          }
        }
        return left;
      };

      const parsePower = () => {
        const left = parseUnary();
        const tok = peek();
        if (tok && tok.type === 'OP' && tok.value === '^') {
          consume();
          const right = parsePower(); // right-associative recursion
          if (Math.abs(right) > 1000) {
            throw new Error('Exponent is too large.');
          }
          if (left < 0 && !Number.isInteger(right)) {
            throw new Error('Invalid calculation.');
          }
          const res = Math.pow(left, right);
          if (!isFinite(res) || isNaN(res)) {
            throw new Error('Invalid calculation.');
          }
          return res;
        }
        return left;
      };

      const parseUnary = () => {
        const tok = peek();
        if (tok && tok.type === 'OP') {
          if (tok.value === '+') {
            consume();
            return parseUnary();
          }
          if (tok.value === '-') {
            consume();
            return -parseUnary();
          }
        }
        return parsePrimary();
      };

      const parsePrimary = () => {
        const tok = peek();
        if (!tok) throw new Error('Invalid expression.');

        if (tok.type === 'NUMBER') {
          consume();
          return tok.value;
        }

        if (tok.type === 'CONST') {
          consume();
          return this.constants[tok.value];
        }

        if (tok.type === 'FUNC') {
          const fn = this.functions[tok.value];
          consume();
          const openParen = peek();
          if (!openParen || openParen.type !== 'OP' || openParen.value !== '(') {
            throw new Error('Invalid expression.');
          }
          consume(); // consume '('
          const arg = parseExpression();
          const closeParen = peek();
          if (!closeParen || closeParen.type !== 'OP' || closeParen.value !== ')') {
            throw new Error('Invalid expression.');
          }
          consume(); // consume ')'
          return fn(arg);
        }

        if (tok.type === 'OP' && tok.value === '(') {
          consume(); // consume '('
          const val = parseExpression();
          const closeParen = peek();
          if (!closeParen || closeParen.type !== 'OP' || closeParen.value !== ')') {
            throw new Error('Invalid expression.');
          }
          consume(); // consume ')'
          return val;
        }

        throw new Error('Invalid expression.');
      };

      const result = parseExpression();
      if (pos < tokens.length) {
        throw new Error('Invalid expression.');
      }

      if (typeof result !== 'number' || !isFinite(result) || isNaN(result)) {
        throw new Error('Invalid calculation.');
      }

      return result;
    }

    formatResult(result) {
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Invalid calculation.');
      }
      // Round to 10 decimal places to eliminate floating point imprecision
      const rounded = Math.round(result * 1e10) / 1e10;
      if (Number.isInteger(rounded)) {
        return rounded.toString();
      }
      let str = rounded.toFixed(10);
      str = str.replace(/\.?0+$/, '');
      return str;
    }
  }

  const engine = new CalculatorEngine();

  // =========================================================
  // UI & ACTION HANDLERS
  // =========================================================

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3200);
  }

  function updateDisplay(value) {
    state.displayValue = value;
    display.value = value;
    display.scrollLeft = display.scrollWidth;
  }

  function updateSubDisplay(value) {
    state.subDisplayValue = value;
    subDisplay.textContent = value;
  }

  function appendToDisplay(chars) {
    updateDisplay(state.displayValue + chars);
    display.focus();
  }

  function clearAll() {
    updateDisplay('');
    updateSubDisplay('');
    display.focus();
  }

  function clearEntry() {
    updateDisplay('');
    display.focus();
  }

  function backspace() {
    const curr = state.displayValue;
    if (!curr) return;

    // Check if ends with multi-character function like "sin(", "sqrt(", "log(", "cos(", "tan(", "ln("
    const fnPatterns = [
      /sin\($/,
      /cos\($/,
      /tan\($/,
      /sqrt\($/,
      /log\($/,
      /ln\($/,
      /abs\($/
    ];

    for (const pat of fnPatterns) {
      if (pat.test(curr)) {
        updateDisplay(curr.replace(pat, ''));
        display.focus();
        return;
      }
    }

    updateDisplay(curr.slice(0, -1));
    display.focus();
  }

  function calculate() {
    const expr = state.displayValue.trim();
    if (!expr) return;

    try {
      const numResult = engine.evaluate(expr);
      const formatted = engine.formatResult(numResult);

      // Save to history
      addHistoryRecord(expr, formatted);

      // Show previous calculation in sub-display
      updateSubDisplay(`${expr} =`);
      updateDisplay(formatted);
      state.justCalculated = true;
    } catch (err) {
      showToast(err.message || 'Calculation Error');
    }
  }

  function calculatePercentage() {
    const val = state.displayValue.trim();
    if (!val) return;

    try {
      const numResult = engine.evaluate(val);
      const percentVal = numResult / 100;
      const formatted = engine.formatResult(percentVal);

      addHistoryRecord(`${val}%`, formatted);
      updateSubDisplay(`${val}% =`);
      updateDisplay(formatted);
    } catch (err) {
      showToast('Please enter a valid number.');
    }
  }

  function toggleSign() {
    const val = state.displayValue.trim();
    if (!val) {
      showToast('Enter a number before using ±.');
      return;
    }

    try {
      const num = engine.evaluate(val);
      const toggled = -num;
      const formatted = engine.formatResult(toggled);
      updateDisplay(formatted);
    } catch (err) {
      showToast('Enter a valid expression before using ±.');
    }
  }

  // =========================================================
  // MEMORY FUNCTIONS
  // =========================================================

  function updateMemoryBadge() {
    if (state.memory !== 0) {
      memoryBadge.classList.remove('hidden');
    } else {
      memoryBadge.classList.add('hidden');
    }
    localStorage.setItem(STORAGE_KEYS.MEMORY, state.memory.toString());
  }

  function memoryClear() {
    state.memory = 0;
    updateMemoryBadge();
    showToast('Memory Cleared (MC)');
  }

  function memoryRecall() {
    updateDisplay(engine.formatResult(state.memory));
    display.focus();
  }

  function memoryAdd() {
    const val = state.displayValue.trim();
    if (!val) {
      showToast('Enter a valid number.');
      return;
    }
    try {
      const num = engine.evaluate(val);
      state.memory += num;
      updateMemoryBadge();
      showToast(`Added to Memory (M = ${engine.formatResult(state.memory)})`);
    } catch (err) {
      showToast('Enter a valid number.');
    }
  }

  function memorySubtract() {
    const val = state.displayValue.trim();
    if (!val) {
      showToast('Enter a valid number.');
      return;
    }
    try {
      const num = engine.evaluate(val);
      state.memory -= num;
      updateMemoryBadge();
      showToast(`Subtracted from Memory (M = ${engine.formatResult(state.memory)})`);
    } catch (err) {
      showToast('Enter a valid number.');
    }
  }

  // =========================================================
  // HISTORY FUNCTIONS
  // =========================================================

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      state.history = raw ? JSON.parse(raw) : [];
    } catch (e) {
      state.history = [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  }

  function addHistoryRecord(expression, result) {
    state.history.unshift({ expression, result, timestamp: Date.now() });
    if (state.history.length > 100) state.history.pop();
    saveHistory();
  }

  function clearHistory() {
    state.history = [];
    saveHistory();
    renderHistoryModal();
  }

  function renderHistoryModal() {
    if (!historyList) return;
    historyList.innerHTML = '';

    if (state.history.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'history-empty';
      emptyLi.textContent = 'No calculations yet.';
      historyList.appendChild(emptyLi);
      return;
    }

    state.history.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'history-item';
      li.tabIndex = 0;
      li.setAttribute('role', 'button');
      li.setAttribute('aria-label', `Use result ${item.result} from calculation ${item.expression}`);

      const exprSpan = document.createElement('span');
      exprSpan.className = 'history-expr';
      exprSpan.textContent = item.expression;

      const resSpan = document.createElement('span');
      resSpan.className = 'history-res';
      resSpan.textContent = `= ${item.result}`;

      li.appendChild(exprSpan);
      li.appendChild(resSpan);

      li.addEventListener('click', () => {
        updateDisplay(item.result);
        updateSubDisplay(`${item.expression} =`);
        closeHistoryModal();
      });

      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          updateDisplay(item.result);
          updateSubDisplay(`${item.expression} =`);
          closeHistoryModal();
        }
      });

      historyList.appendChild(li);
    });
  }

  function openHistoryModal() {
    renderHistoryModal();
    historyModal.classList.remove('hidden');
  }

  function closeHistoryModal() {
    historyModal.classList.add('hidden');
    display.focus();
  }

  // =========================================================
  // THEME MANAGEMENT
  // =========================================================

  function setTheme(theme) {
    state.theme = theme;
    if (theme === 'light') {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      themeBtnIcon.textContent = '🌙';
      themeBtnText.textContent = 'Dark Mode';
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      themeBtnIcon.textContent = '☀️';
      themeBtnText.textContent = 'Light Mode';
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  function toggleTheme() {
    setTheme(state.theme === 'dark' ? 'light' : 'dark');
  }

  // =========================================================
  // BUTTON CLICK DISPATCHER
  // =========================================================

  function handleButtonClick(action) {
    if (state.justCalculated) {
      state.justCalculated = false;
      const isOperator = ['+', '-', '*', '/', '^', '%', 'x²', '÷', '×', '−'].includes(action);
      const isMemoryOrControl = ['MC', 'MR', 'M+', 'M-', 'AC', 'CE', '±', '⌫', '='].includes(action);
      if (!isOperator && !isMemoryOrControl) {
        updateDisplay('');
      }
    }

    switch (action) {
      case 'AC':
        clearAll();
        break;
      case 'CE':
        clearEntry();
        break;
      case '⌫':
        backspace();
        break;
      case '=':
        calculate();
        break;
      case '%':
        calculatePercentage();
        break;
      case '±':
        toggleSign();
        break;
      case 'MC':
        memoryClear();
        break;
      case 'MR':
        memoryRecall();
        break;
      case 'M+':
        memoryAdd();
        break;
      case 'M-':
        memorySubtract();
        break;
      case 'sin':
        appendToDisplay('sin(');
        break;
      case 'cos':
        appendToDisplay('cos(');
        break;
      case 'tan':
        appendToDisplay('tan(');
        break;
      case 'sqrt':
        appendToDisplay('sqrt(');
        break;
      case 'log':
        appendToDisplay('log(');
        break;
      case 'ln':
        appendToDisplay('ln(');
        break;
      case 'pi':
        appendToDisplay('pi');
        break;
      case 'e':
        appendToDisplay('e');
        break;
      case '^':
        appendToDisplay('^');
        break;
      case 'x²':
        appendToDisplay('^2');
        break;
      case '÷':
        appendToDisplay('/');
        break;
      case '×':
        appendToDisplay('*');
        break;
      case '−':
        appendToDisplay('-');
        break;
      default:
        appendToDisplay(action);
        break;
    }
  }

  // Visual flash for keyboard actions
  function flashButton(actionSelector) {
    const btn = document.querySelector(`[data-action="${actionSelector}"]`);
    if (btn) {
      btn.classList.add('keyboard-active');
      setTimeout(() => btn.classList.remove('keyboard-active'), 120);
    }
  }

  // =========================================================
  // KEYBOARD SUPPORT
  // =========================================================

  function handleKeyboard(event) {
    // If modal is open, let Escape close it
    if (!historyModal.classList.contains('hidden')) {
      if (event.key === 'Escape') {
        closeHistoryModal();
      }
      return;
    }

    const key = event.key;

    // Digits
    if (/[0-9]/.test(key)) {
      handleButtonClick(key);
      flashButton(key);
      event.preventDefault();
      return;
    }

    // Basic Operators & decimal
    if (key === '.') {
      handleButtonClick('.');
      flashButton('.');
      event.preventDefault();
      return;
    }
    if (key === '+') {
      handleButtonClick('+');
      flashButton('+');
      event.preventDefault();
      return;
    }
    if (key === '-') {
      handleButtonClick('−');
      flashButton('−');
      event.preventDefault();
      return;
    }
    if (key === '*') {
      handleButtonClick('×');
      flashButton('×');
      event.preventDefault();
      return;
    }
    if (key === '/') {
      handleButtonClick('÷');
      flashButton('÷');
      event.preventDefault();
      return;
    }
    if (key === '%') {
      handleButtonClick('%');
      flashButton('%');
      event.preventDefault();
      return;
    }
    if (key === '^') {
      handleButtonClick('^');
      flashButton('^');
      event.preventDefault();
      return;
    }
    if (key === '(' || key === ')') {
      handleButtonClick(key);
      flashButton(key);
      event.preventDefault();
      return;
    }

    // Enter or Equals
    if (key === 'Enter' || key === '=') {
      handleButtonClick('=');
      flashButton('=');
      event.preventDefault();
      return;
    }

    // Backspace
    if (key === 'Backspace') {
      handleButtonClick('⌫');
      flashButton('⌫');
      event.preventDefault();
      return;
    }

    // Escape -> AC
    if (key === 'Escape') {
      handleButtonClick('AC');
      const acBtn = document.getElementById('btn-ac');
      if (acBtn) {
        acBtn.classList.add('keyboard-active');
        setTimeout(() => acBtn.classList.remove('keyboard-active'), 120);
      }
      event.preventDefault();
      return;
    }

    // Scientific shortcuts when not inside text selection
    if (key === 's') {
      handleButtonClick('sin');
      flashButton('sin');
      event.preventDefault();
    } else if (key === 'c') {
      handleButtonClick('cos');
      flashButton('cos');
      event.preventDefault();
    } else if (key === 't') {
      handleButtonClick('tan');
      flashButton('tan');
      event.preventDefault();
    } else if (key === 'q') {
      handleButtonClick('sqrt');
      flashButton('sqrt');
      event.preventDefault();
    } else if (key === 'l') {
      handleButtonClick('log');
      flashButton('log');
      event.preventDefault();
    } else if (key === 'p') {
      handleButtonClick('pi');
      flashButton('pi');
      event.preventDefault();
    }
  }

  // =========================================================
  // INITIALIZATION
  // =========================================================

  function init() {
    // 1. Load History
    loadHistory();

    // 2. Load Memory
    const savedMemory = localStorage.getItem(STORAGE_KEYS.MEMORY);
    if (savedMemory) {
      state.memory = parseFloat(savedMemory) || 0;
      updateMemoryBadge();
    }

    // 3. Load Theme
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    setTheme(savedTheme);

    // 4. Attach Click Listeners to Keypad & Actions
    document.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        handleButtonClick(action);
      });
    });

    // 5. Display Input sync
    display.addEventListener('input', (e) => {
      state.displayValue = e.target.value;
    });

    // 6. Theme Button
    themeBtn.addEventListener('click', toggleTheme);

    // 7. History Modal Listeners
    btnHistoryToggle.addEventListener('click', openHistoryModal);
    btnCloseHistory.addEventListener('click', closeHistoryModal);
    btnClearHistory.addEventListener('click', clearHistory);
    historyModal.addEventListener('click', (e) => {
      if (e.target === historyModal) closeHistoryModal();
    });

    // 8. Keyboard events
    window.addEventListener('keydown', handleKeyboard);

    // 9. Initial display focus
    display.focus();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
