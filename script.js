
    
    // Inside script.js
const todoContainer = document.getElementById("todo");
if (todoContainer) {
  // run To-Do app code here


    /* ---------- Tabs ---------- */
    const tabs = document.querySelectorAll('.tab');
    const sections = {
      portfolio: document.getElementById('portfolio'),
      todo: document.getElementById('todo'),
      store: document.getElementById('store'),
    };
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.forEach(b => b.classList.toggle('active', b === btn));
        Object.values(sections).forEach(s => s.hidden = true);
        sections[btn.dataset.tab].hidden = false;
        // Lazy-load products when first opening store
        if (btn.dataset.tab === 'store' && !store.state.loaded) { store.init(); }
      });
    });

    /* ---------- To-Do App (localStorage) ---------- */
    const todoKey = 'apex_task4_todos_v1';
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const listEl = document.getElementById('todo-list');
    const emptyEl = document.getElementById('todo-empty');
    const filterEl = document.getElementById('filter');
    const clearCompletedBtn = document.getElementById('clear-completed');

    const todo = {
      state: { items: JSON.parse(localStorage.getItem(todoKey) || '[]'), filter: 'all' },
      save() { localStorage.setItem(todoKey, JSON.stringify(this.state.items)); },
      add(text) {
        const t = text.trim(); if (!t) return;
        this.state.items.push({ id: crypto.randomUUID(), text: t, done: false, ts: Date.now() });
        this.save(); this.render(); todoInput.value = '';
      },
      toggle(id) { const it = this.state.items.find(x => x.id === id); if (it) { it.done = !it.done; this.save(); this.render(); } },
      remove(id) { this.state.items = this.state.items.filter(x => x.id !== id); this.save(); this.render(); },
      edit(id, newText) { const it = this.state.items.find(x => x.id === id); if (it) { it.text = newText.trim() || it.text; this.save(); this.render(); } },
      clearCompleted() { this.state.items = this.state.items.filter(x => !x.done); this.save(); this.render(); },
      render() {
        const f = filterEl.value;
        const items = this.state.items.filter(x => f === 'all' ? true : f === 'active' ? !x.done : x.done);
        listEl.innerHTML = '';
        if (items.length === 0) { emptyEl.hidden = false; return } else emptyEl.hidden = true;
        for (const it of items) {
          const row = document.createElement('div'); row.className = 'todo-item' + (it.done ? ' completed' : '');
          // checkbox
          const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = it.done;
          cb.addEventListener('change', () => this.toggle(it.id));
          // text (editable)
          const txt = document.createElement('input'); txt.value = it.text; txt.style.background = 'transparent'; txt.style.border = 'none';
          txt.addEventListener('change', () => this.edit(it.id, txt.value));
          // actions
          const del = document.createElement('button'); del.className = 'btn danger'; del.textContent = 'Delete';
          del.addEventListener('click', () => this.remove(it.id));
          row.append(cb, txt, del); listEl.append(row);
        }
      }
    };
    addBtn.addEventListener('click', () => todo.add(todoInput.value));
    todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') todo.add(todoInput.value) });
    filterEl.addEventListener('change', () => todo.render());
    clearCompletedBtn.addEventListener('click', () => todo.clearCompleted());
    todo.render();

    /* ---------- Product Store (Fetch API + Filter + Sort) ---------- */
    const productsEl = document.getElementById('products');
    const errorEl = document.getElementById('error');
    const categoryEl = document.getElementById('category');
    const sortEl = document.getElementById('sort');
    const searchEl = document.getElementById('search');
    const priceRange = document.getElementById('priceRange');
    const priceVal = document.getElementById('priceVal');
    const refreshBtn = document.getElementById('refresh');

    const store = {
      state: { all: [], view: [], categories: [], maxPrice: 0, loaded: false },
      async init() {
        // skeletons
        productsEl.innerHTML = Array.from({ length: 8 }).map(() => `<div class="skeleton"></div>`).join('');
        errorEl.style.display = 'none';
        try {
          const [prodsRes, catsRes] = await Promise.all([
            fetch('https://fakestoreapi.com/products'),
            fetch('https://fakestoreapi.com/products/categories')
          ]);
          const all = await prodsRes.json();
          const categories = await catsRes.json();
          this.state.all = all.map(p => ({ ...p, rupees: Math.round(p.price * 85) })); // rough INR
          this.state.categories = categories;
          this.state.maxPrice = Math.max(...this.state.all.map(p => p.rupees));
          this.state.loaded = true;

          // UI init
          categoryEl.innerHTML = `<option value="all">All categories</option>` +
            this.state.categories.map(c => `<option value="${c}">${c}</option>`).join('');
          priceRange.min = 0; priceRange.max = this.state.maxPrice; priceRange.value = this.state.maxPrice;
          priceVal.textContent = this.state.maxPrice.toLocaleString('en-IN');

          this.apply();
        } catch (err) {
          productsEl.innerHTML = '';
          errorEl.textContent = 'Failed to load products. Check your internet or try Refresh.';
          errorEl.style.display = 'block';
        }
      },
      apply() {
        const q = searchEl.value.trim().toLowerCase();
        const cat = categoryEl.value;
        const maxP = +priceRange.value || this.state.maxPrice;
        let list = [...this.state.all];

        if (cat !== 'all') list = list.filter(p => p.category === cat);
        if (q) list = list.filter(p => p.title.toLowerCase().includes(q));
        list = list.filter(p => p.rupees <= maxP);

        switch (sortEl.value) {
          case 'price-asc': list.sort((a, b) => a.rupees - b.rupees); break;
          case 'price-desc': list.sort((a, b) => b.rupees - a.rupees); break;
          case 'rating-desc': list.sort((a, b) => b.rating.rate - a.rating.rate); break;
          case 'name-asc': list.sort((a, b) => a.title.localeCompare(b.title)); break;
          default: break;
        }

        this.state.view = list;
        this.render();
      },
      render() {
        if (this.state.view.length === 0) {
          productsEl.innerHTML = `<div class="todo-empty">No products match your filters.</div>`;
          return;
        }
        productsEl.innerHTML = this.state.view.map(p => `
      <article class="product">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:start">
          <div class="chip">${p.category}</div>
          <div class="price">₹${p.rupees.toLocaleString('en-IN')}</div>
        </div>
        <div class="rating">⭐ ${p.rating.rate} • ${p.rating.count} reviews</div>
        <h4 style="margin:0">${p.title}</h4>
        <a class="btn" style="text-align:center;text-decoration:none" href="https://fakestoreapi.com/products/${p.id}" target="_blank" rel="noopener">View</a>
      </article>
    `).join('');
      }
    };

    // Controls
    const debounced = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) } }
    searchEl.addEventListener('input', debounced(() => store.apply(), 250));
    categoryEl.addEventListener('change', () => store.apply());
    sortEl.addEventListener('change', () => store.apply());
    priceRange.addEventListener('input', () => {
      priceVal.textContent = (+priceRange.value).toLocaleString('en-IN');
    });
    priceRange.addEventListener('change', () => store.apply());
    refreshBtn.addEventListener('click', () => store.init());
}