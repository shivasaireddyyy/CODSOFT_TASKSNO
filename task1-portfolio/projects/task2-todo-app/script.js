const STORE_KEY = 'codsoft.todo.tasks';
const THEME_KEY = 'codsoft.todo.theme';

const $ = id => document.getElementById(id);
const els = {
  form: $('task-form'), title: $('title'), category: $('category'), priority: $('priority'), due: $('due'),
  error: $('form-error'), submit: $('submit-btn'), cancel: $('cancel-edit'),
  search: $('search'), fStatus: $('filter-status'), fCategory: $('filter-category'), clearDone: $('clear-done'),
  list: $('list'), empty: $('empty'), theme: $('theme-toggle'),
  pending: $('count-pending'), done: $('count-done'), total: $('count-total')
};

let tasks = load();
let editingId = null;

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY));
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(tasks)); } catch { /* storage unavailable */ }
}

function resetForm() {
  editingId = null;
  els.form.reset();
  els.priority.value = 'medium';
  els.submit.textContent = 'Add task';
  els.cancel.hidden = true;
  els.error.textContent = '';
}

els.form.addEventListener('submit', e => {
  e.preventDefault();
  const title = els.title.value.trim();
  if (!title) { els.error.textContent = 'Enter a task before adding it.'; els.title.focus(); return; }
  const duplicate = tasks.some(t => t.id !== editingId && t.title.toLowerCase() === title.toLowerCase() && !t.done);
  if (duplicate) { els.error.textContent = 'That task is already on your list.'; els.title.focus(); return; }

  const fields = { title, category: els.category.value, priority: els.priority.value, due: els.due.value };
  if (editingId) {
    tasks = tasks.map(t => t.id === editingId ? { ...t, ...fields } : t);
  } else {
    tasks.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), done: false, created: Date.now(), ...fields });
  }
  save();
  resetForm();
  render();
  els.title.focus();
});

els.cancel.addEventListener('click', resetForm);

[els.search, els.fStatus, els.fCategory].forEach(el => el.addEventListener('input', render));

els.clearDone.addEventListener('click', () => {
  const n = tasks.filter(t => t.done).length;
  if (!n) return;
  if (confirm(`Delete ${n} completed task${n === 1 ? '' : 's'}?`)) {
    tasks = tasks.filter(t => !t.done);
    save(); render();
  }
});

els.list.addEventListener('click', e => {
  const li = e.target.closest('li[data-id]');
  if (!li) return;
  const id = li.dataset.id;
  if (e.target.matches('.edit')) startEdit(id);
  if (e.target.matches('.del')) {
    tasks = tasks.filter(t => t.id !== id);
    if (editingId === id) resetForm();
    save(); render();
  }
});
els.list.addEventListener('change', e => {
  if (!e.target.matches('input[type="checkbox"]')) return;
  const id = e.target.closest('li').dataset.id;
  tasks = tasks.map(t => t.id === id ? { ...t, done: e.target.checked } : t);
  save(); render();
});

function startEdit(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  editingId = id;
  els.title.value = t.title;
  els.category.value = t.category;
  els.priority.value = t.priority;
  els.due.value = t.due || '';
  els.submit.textContent = 'Save changes';
  els.cancel.hidden = false;
  els.error.textContent = '';
  els.title.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatDue(due) {
  const d = new Date(due + 'T00:00:00');
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function render() {
  const done = tasks.filter(t => t.done).length;
  els.done.textContent = done;
  els.pending.textContent = tasks.length - done;
  els.total.textContent = tasks.length;

  const q = els.search.value.trim().toLowerCase();
  const visible = tasks.filter(t =>
    (els.fStatus.value === 'all' || (els.fStatus.value === 'done') === t.done) &&
    (els.fCategory.value === 'all' || t.category === els.fCategory.value) &&
    (!q || t.title.toLowerCase().includes(q)));

  els.list.textContent = '';
  const today = new Date().toISOString().slice(0, 10);

  visible.forEach(t => {
    const li = document.createElement('li');
    li.dataset.id = t.id;
    li.className = `item ${t.priority}${t.done ? ' done' : ''}`;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = t.done;
    cb.setAttribute('aria-label', `Mark "${t.title}" as ${t.done ? 'pending' : 'completed'}`);

    const body = document.createElement('div');
    body.className = 'body';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = t.title;
    const meta = document.createElement('div');
    meta.className = 'meta';
    const parts = [t.category, `${t.priority[0].toUpperCase()}${t.priority.slice(1)} priority`];
    parts.forEach(text => { const s = document.createElement('span'); s.textContent = text; meta.append(s); });
    if (t.due) {
      const s = document.createElement('span');
      const overdue = !t.done && t.due < today;
      s.textContent = `${overdue ? 'Overdue: ' : 'Due '}${formatDue(t.due)}`;
      if (overdue) s.className = 'overdue';
      meta.append(s);
    }
    body.append(title, meta);

    const actions = document.createElement('div');
    actions.className = 'actions';
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'ghost edit'; edit.textContent = 'Edit';
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'ghost del'; del.textContent = 'Delete';
    actions.append(edit, del);

    li.append(cb, body, actions);
    els.list.append(li);
  });

  if (visible.length) {
    els.empty.hidden = true;
  } else {
    els.empty.hidden = false;
    els.empty.textContent = tasks.length ? 'No tasks match your search or filters.' : 'No tasks yet. Add your first task above.';
  }
}

// Dark mode
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  els.theme.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  els.theme.setAttribute('aria-pressed', String(theme === 'dark'));
}
let savedTheme = null;
try { savedTheme = localStorage.getItem(THEME_KEY); } catch { /* ignore */ }
applyTheme(savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
els.theme.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
});

render();
