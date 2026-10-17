const STORE_KEY = 'codsoft.expense.transactions';
const CATEGORIES = {
  expense: ['Food', 'Transport', 'Rent', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Other'],
  income: ['Salary', 'Freelance', 'Gift', 'Other']
};

const $ = id => document.getElementById(id);
const els = {
  form: $('tx-form'), formTitle: $('form-title'), desc: $('desc'), amount: $('amount'), category: $('category'), date: $('date'),
  error: $('form-error'), submit: $('submit-btn'), cancel: $('cancel-edit'),
  fType: $('filter-type'), fCategory: $('filter-category'), note: $('filtered-note'),
  rows: $('rows'), empty: $('empty'),
  income: $('sum-income'), expense: $('sum-expense'), balance: $('sum-balance')
};

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const today = () => new Date().toISOString().slice(0, 10);
const currentType = () => els.form.elements.type.value;

let transactions = load();
let editingId = null;

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY));
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(transactions)); } catch { /* storage unavailable */ }
}

function fillSelect(select, items, firstLabel) {
  select.textContent = '';
  if (firstLabel) select.append(new Option(firstLabel, 'all'));
  items.forEach(c => select.append(new Option(c, c)));
}
function refreshFormCategories(selected) {
  fillSelect(els.category, CATEGORIES[currentType()]);
  if (selected) els.category.value = selected;
}
function refreshFilterCategories() {
  const all = [...new Set([...CATEGORIES.expense, ...CATEGORIES.income])];
  const previous = els.fCategory.value;
  fillSelect(els.fCategory, all, 'All categories');
  els.fCategory.value = all.includes(previous) ? previous : 'all';
}

function resetForm() {
  editingId = null;
  els.form.reset();
  els.date.value = today();
  refreshFormCategories();
  els.formTitle.textContent = 'Add a transaction';
  els.submit.textContent = 'Add transaction';
  els.cancel.hidden = true;
  els.error.textContent = '';
}

els.form.addEventListener('change', e => { if (e.target.name === 'type') refreshFormCategories(); });

els.form.addEventListener('submit', e => {
  e.preventDefault();
  const description = els.desc.value.trim();
  const amount = Math.round(parseFloat(els.amount.value) * 100) / 100;
  if (!description) return fail('Enter a description.', els.desc);
  if (!Number.isFinite(amount) || amount <= 0) return fail('Enter an amount greater than 0.', els.amount);
  if (!els.date.value) return fail('Pick a date.', els.date);

  const fields = { type: currentType(), description, amount, category: els.category.value, date: els.date.value };
  if (editingId) {
    transactions = transactions.map(t => t.id === editingId ? { ...t, ...fields } : t);
  } else {
    transactions.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...fields });
  }
  save();
  resetForm();
  render();
});

function fail(message, field) {
  els.error.textContent = message;
  field.focus();
}

els.cancel.addEventListener('click', resetForm);
[els.fType, els.fCategory].forEach(el => el.addEventListener('input', render));

els.rows.addEventListener('click', e => {
  const tr = e.target.closest('tr[data-id]');
  if (!tr) return;
  const id = tr.dataset.id;
  if (e.target.matches('.edit')) startEdit(id);
  if (e.target.matches('.del')) {
    const t = transactions.find(x => x.id === id);
    if (t && confirm(`Delete "${t.description}"?`)) {
      transactions = transactions.filter(x => x.id !== id);
      if (editingId === id) resetForm();
      save(); render();
    }
  }
});

function startEdit(id) {
  const t = transactions.find(x => x.id === id);
  if (!t) return;
  editingId = id;
  els.form.elements.type.value = t.type;
  refreshFormCategories(t.category);
  els.desc.value = t.description;
  els.amount.value = t.amount;
  els.date.value = t.date;
  els.formTitle.textContent = 'Edit transaction';
  els.submit.textContent = 'Save changes';
  els.cancel.hidden = false;
  els.error.textContent = '';
  els.desc.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
  // Totals always cover every transaction, regardless of the filters
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  els.income.textContent = money.format(income);
  els.expense.textContent = money.format(expense);
  els.balance.textContent = money.format(balance);
  els.balance.closest('.stat').classList.toggle('negative', balance < 0);

  const visible = transactions
    .filter(t => (els.fType.value === 'all' || t.type === els.fType.value) &&
                 (els.fCategory.value === 'all' || t.category === els.fCategory.value))
    .sort((a, b) => b.date.localeCompare(a.date));

  els.rows.textContent = '';
  visible.forEach(t => {
    const tr = document.createElement('tr');
    tr.dataset.id = t.id;

    const date = document.createElement('td');
    date.textContent = new Date(t.date + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    const desc = document.createElement('td');
    desc.textContent = t.description;
    const cat = document.createElement('td');
    cat.textContent = t.category;
    const amt = document.createElement('td');
    amt.className = `num ${t.type}`;
    amt.textContent = `${t.type === 'income' ? '+' : '-'}${money.format(t.amount)}`;

    const actions = document.createElement('td');
    actions.className = 'actions';
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'ghost edit'; edit.textContent = 'Edit';
    edit.setAttribute('aria-label', `Edit ${t.description}`);
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'ghost del'; del.textContent = 'Delete';
    del.setAttribute('aria-label', `Delete ${t.description}`);
    actions.append(edit, del);

    tr.append(date, desc, cat, amt, actions);
    els.rows.append(tr);
  });

  const filtering = els.fType.value !== 'all' || els.fCategory.value !== 'all';
  if (filtering && visible.length) {
    const shown = visible.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
    els.note.hidden = false;
    els.note.textContent = `Showing ${visible.length} of ${transactions.length} transactions. Net of shown: ${money.format(shown)}.`;
  } else {
    els.note.hidden = true;
  }

  els.empty.hidden = visible.length > 0;
  if (!visible.length) {
    els.empty.textContent = transactions.length ? 'No transactions match these filters.' : 'No transactions yet. Add your first one above.';
  }
}

refreshFilterCategories();
resetForm();
render();
