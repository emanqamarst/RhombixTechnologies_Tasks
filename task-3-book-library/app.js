const DB = {
  books: JSON.parse(localStorage.getItem('lib_books') || '[]'),
  history: JSON.parse(localStorage.getItem('lib_history') || '[]'),
  save() {
    localStorage.setItem('lib_books', JSON.stringify(this.books));
    localStorage.setItem('lib_history', JSON.stringify(this.history));
  }
};

// Seed sample data on first load
if (DB.books.length === 0) {
  DB.books = [
    { id: uid(), title: 'The Pragmatic Programmer', author: 'David Thomas', category: 'Technology', year: 1999, desc: 'A guide to software craftsmanship and programming best practices.', status: 'available', borrower: null, dueDate: null },
    { id: uid(), title: 'Sapiens', author: 'Yuval Noah Harari', category: 'History', year: 2011, desc: 'A brief history of humankind from the Stone Age to the present.', status: 'available', borrower: null, dueDate: null },
    { id: uid(), title: 'Atomic Habits', author: 'James Clear', category: 'Self-Help', year: 2018, desc: 'A proven framework for building good habits and breaking bad ones.', status: 'available', borrower: null, dueDate: null },
    { id: uid(), title: 'Dune', author: 'Frank Herbert', category: 'Fiction', year: 1965, desc: 'Epic science fiction set in a distant future amidst a feudal galactic empire.', status: 'available', borrower: null, dueDate: null },
  ];
  DB.save();
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Navigation ──
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + target).classList.add('active');
    if (target === 'borrow') renderBorrowList();
    if (target === 'history') renderHistory();
  });
});

// ── Stats ──
function updateStats() {
  document.getElementById('stat-total').textContent = DB.books.length;
  document.getElementById('stat-borrowed').textContent = DB.books.filter(b => b.status === 'borrowed').length;
}

// ── Library Render ──
function renderLibrary() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const cat = document.getElementById('categoryFilter').value;
  const status = document.getElementById('statusFilter').value;
  const grid = document.getElementById('booksGrid');
  const empty = document.getElementById('emptyLibrary');

  let books = DB.books.filter(b => {
    const matchQuery = !query || b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query) || b.category.toLowerCase().includes(query);
    const matchCat = !cat || b.category === cat;
    const matchStatus = !status || b.status === status;
    return matchQuery && matchCat && matchStatus;
  });

  grid.innerHTML = '';

  if (books.length === 0) {
    empty.style.display = 'block';
    grid.appendChild(empty);
    updateStats();
    return;
  }

  empty.style.display = 'none';

  books.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';
    const isBorrowed = book.status === 'borrowed';

    card.innerHTML = `
      <div class="book-card-top">
        <h3 class="book-title">${escHtml(book.title)}</h3>
        <span class="book-badge ${isBorrowed ? 'badge-borrowed' : 'badge-available'}">${isBorrowed ? 'Lent' : 'Available'}</span>
      </div>
      <div class="book-author">by ${escHtml(book.author)}</div>
      <div class="book-meta">
        <span class="book-category">${escHtml(book.category)}</span>
        ${book.year ? `<span class="book-year">${book.year}</span>` : ''}
      </div>
      ${book.desc ? `<p class="book-desc">${escHtml(book.desc)}</p>` : ''}
      <div class="book-actions">
        ${isBorrowed
          ? `<button class="btn-sm return" data-id="${book.id}">Return</button>`
          : `<button class="btn-sm lend" data-id="${book.id}">Lend</button>`}
        <button class="btn-sm" data-edit="${book.id}">Edit</button>
        <button class="btn-sm delete" data-del="${book.id}">Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });

  updateStats();
}

// ── Borrow List ──
function renderBorrowList() {
  const container = document.getElementById('borrowList');
  const borrowed = DB.books.filter(b => b.status === 'borrowed');
  container.innerHTML = '';

  if (borrowed.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📖</div><h3>No books borrowed</h3><p>Lend a book from your library to see it here</p></div>`;
    return;
  }

  borrowed.forEach(book => {
    const due = new Date(book.dueDate);
    const isOverdue = due < new Date();
    const item = document.createElement('div');
    item.className = 'borrow-item';
    item.innerHTML = `
      <div class="borrow-info">
        <h4>${escHtml(book.title)}</h4>
        <div class="borrow-meta">
          <span>👤 ${escHtml(book.borrower)}</span>
          <span class="${isOverdue ? 'overdue' : ''}">📅 Due: ${formatDate(book.dueDate)}${isOverdue ? ' — Overdue' : ''}</span>
          <span>📚 ${escHtml(book.category)}</span>
        </div>
      </div>
      <button class="btn-sm return" data-id="${book.id}" style="flex:none;width:90px">Return</button>
    `;
    container.appendChild(item);
  });
}

// ── History ──
function renderHistory() {
  const container = document.getElementById('historyList');
  container.innerHTML = '';

  if (DB.history.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🗂️</div><h3>No history yet</h3><p>Activity will appear here once books are borrowed and returned</p></div>`;
    return;
  }

  [...DB.history].reverse().forEach(entry => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="history-info">
        <h4>${escHtml(entry.title)}</h4>
        <div class="history-meta">
          <span>👤 ${escHtml(entry.borrower)}</span>
          <span>📅 ${formatDate(entry.date)}</span>
          ${entry.returnDate ? `<span>↩ Returned: ${formatDate(entry.returnDate)}</span>` : ''}
        </div>
      </div>
      <span class="history-badge ${entry.returnDate ? 'returned' : 'borrowed'}">${entry.returnDate ? 'Returned' : 'Lent'}</span>
    `;
    container.appendChild(item);
  });
}

// ── Add / Edit Modal ──
const bookModal = document.getElementById('bookModal');

document.getElementById('openAddModal').addEventListener('click', () => {
  clearForm();
  document.getElementById('modalTitle').textContent = 'Add Book';
  bookModal.classList.add('open');
});

document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);
bookModal.addEventListener('click', e => { if (e.target === bookModal) closeModal(); });

function closeModal() { bookModal.classList.remove('open'); clearForm(); }

function clearForm() {
  ['bookId','bookTitle','bookAuthor','bookYear','bookDesc'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('bookCategory').value = 'Fiction';
}

document.getElementById('saveBook').addEventListener('click', () => {
  const title = document.getElementById('bookTitle').value.trim();
  const author = document.getElementById('bookAuthor').value.trim();
  if (!title || !author) { showToast('Title and Author are required.', 'error'); return; }

  const id = document.getElementById('bookId').value;
  const data = {
    title,
    author,
    category: document.getElementById('bookCategory').value,
    year: document.getElementById('bookYear').value || '',
    desc: document.getElementById('bookDesc').value.trim(),
  };

  if (id) {
    const book = DB.books.find(b => b.id === id);
    Object.assign(book, data);
    showToast('Book updated.', 'success');
  } else {
    DB.books.push({ id: uid(), ...data, status: 'available', borrower: null, dueDate: null });
    showToast('Book added to library.', 'success');
  }

  DB.save();
  renderLibrary();
  closeModal();
});

// ── Lend Modal ──
const lendModal = document.getElementById('lendModal');
let activeLendId = null;

document.getElementById('closeLendModal').addEventListener('click', () => lendModal.classList.remove('open'));
document.getElementById('cancelLend').addEventListener('click', () => lendModal.classList.remove('open'));
lendModal.addEventListener('click', e => { if (e.target === lendModal) lendModal.classList.remove('open'); });

document.getElementById('confirmLend').addEventListener('click', () => {
  const borrower = document.getElementById('borrowerName').value.trim();
  const dueDate = document.getElementById('dueDate').value;
  if (!borrower || !dueDate) { showToast('Please fill in all fields.', 'error'); return; }

  const book = DB.books.find(b => b.id === activeLendId);
  book.status = 'borrowed';
  book.borrower = borrower;
  book.dueDate = dueDate;

  DB.history.push({ id: uid(), bookId: book.id, title: book.title, borrower, date: new Date().toISOString().split('T')[0], dueDate, returnDate: null });

  DB.save();
  renderLibrary();
  lendModal.classList.remove('open');
  showToast(`"${book.title}" lent to ${borrower}.`, 'success');
  document.getElementById('borrowerName').value = '';
  document.getElementById('dueDate').value = '';
});

// ── Delegated Events ──
document.addEventListener('click', e => {
  const lendBtn = e.target.closest('[data-id].lend');
  const returnBtn = e.target.closest('.return[data-id]');
  const editBtn = e.target.closest('[data-edit]');
  const delBtn = e.target.closest('[data-del]');

  if (lendBtn) {
    activeLendId = lendBtn.dataset.id;
    document.getElementById('lendBookId').value = activeLendId;
    lendModal.classList.add('open');
  }

  if (returnBtn) {
    const id = returnBtn.dataset.id;
    const book = DB.books.find(b => b.id === id);
    const entry = [...DB.history].reverse().find(h => h.bookId === id && !h.returnDate);
    if (entry) entry.returnDate = new Date().toISOString().split('T')[0];
    book.status = 'available';
    book.borrower = null;
    book.dueDate = null;
    DB.save();
    renderLibrary();
    renderBorrowList();
    showToast(`"${book.title}" returned.`, 'success');
  }

  if (editBtn) {
    const book = DB.books.find(b => b.id === editBtn.dataset.edit);
    document.getElementById('modalTitle').textContent = 'Edit Book';
    document.getElementById('bookId').value = book.id;
    document.getElementById('bookTitle').value = book.title;
    document.getElementById('bookAuthor').value = book.author;
    document.getElementById('bookCategory').value = book.category;
    document.getElementById('bookYear').value = book.year;
    document.getElementById('bookDesc').value = book.desc;
    bookModal.classList.add('open');
  }

  if (delBtn) {
    const id = delBtn.dataset.del;
    const book = DB.books.find(b => b.id === id);
    if (confirm(`Delete "${book.title}"? This cannot be undone.`)) {
      DB.books = DB.books.filter(b => b.id !== id);
      DB.save();
      renderLibrary();
      showToast('Book removed.', 'success');
    }
  }
});

// ── Filters ──
document.getElementById('searchInput').addEventListener('input', renderLibrary);
document.getElementById('categoryFilter').addEventListener('change', renderLibrary);
document.getElementById('statusFilter').addEventListener('change', renderLibrary);

// ── Clear History ──
document.getElementById('clearHistory').addEventListener('click', () => {
  if (confirm('Clear all borrowing history?')) {
    DB.history = [];
    DB.save();
    renderHistory();
    showToast('History cleared.', 'success');
  }
});

// ── Helpers ──
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

let toastTimer;
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Init ──
renderLibrary();