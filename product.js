// product.js

const apiURL = "https://fakestoreapi.com/products";

const productsContainer = document.getElementById("products");
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category");
const sortSelect = document.getElementById("sort");
const priceRange = document.getElementById("priceRange");
const priceVal = document.getElementById("priceVal");
const refreshBtn = document.getElementById("refresh");
const errorMsg = document.getElementById("error");

let products = [];
let filteredProducts = [];

// Fetch products from API
async function fetchProducts() {
  try {
    const res = await fetch(apiURL);
    products = await res.json();

    // find max price
    const maxPrice = Math.ceil(Math.max(...products.map(p => p.price)));
    priceRange.max = maxPrice;
    priceRange.value = maxPrice;
    priceVal.textContent = maxPrice;

    // populate categories
    const categories = ["all", ...new Set(products.map(p => p.category))];
    categorySelect.innerHTML = categories.map(cat =>
      `<option value="${cat}">${cat}</option>`).join("");

    filteredProducts = [...products];
    renderProducts();
  } catch (err) {
    errorMsg.style.display = "block";
    errorMsg.textContent = "Failed to load products. Please try again.";
  }
}

// Render product cards
function renderProducts() {
  productsContainer.innerHTML = "";

  let result = [...products];

  // filter: search
  const searchText = searchInput.value.toLowerCase();
  if (searchText) {
    result = result.filter(p => p.title.toLowerCase().includes(searchText));
  }

  // filter: category
  if (categorySelect.value !== "all") {
    result = result.filter(p => p.category === categorySelect.value);
  }

  // filter: price
  result = result.filter(p => p.price <= priceRange.value);

  // sort
  switch (sortSelect.value) {
    case "price-asc": result.sort((a,b) => a.price - b.price); break;
    case "price-desc": result.sort((a,b) => b.price - a.price); break;
    case "rating-desc": result.sort((a,b) => b.rating.rate - a.rating.rate); break;
    case "name-asc": result.sort((a,b) => a.title.localeCompare(b.title)); break;
  }

  if (result.length === 0) {
    productsContainer.innerHTML = `<p class="muted">No products found.</p>`;
    return;
  }

  result.forEach(p => {
    const card = document.createElement("div");
    card.className = "product card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.title}">
      <h3>${p.title}</h3>
      <p>₹${p.price} • ⭐ ${p.rating.rate}</p>
      <small>${p.category}</small>
    `;
    productsContainer.appendChild(card);
  });
}

// Event listeners
searchInput.addEventListener("input", renderProducts);
categorySelect.addEventListener("change", renderProducts);
sortSelect.addEventListener("change", renderProducts);
priceRange.addEventListener("input", () => {
  priceVal.textContent = priceRange.value;
  renderProducts();
});
refreshBtn.addEventListener("click", fetchProducts);

// Load products
fetchProducts();
