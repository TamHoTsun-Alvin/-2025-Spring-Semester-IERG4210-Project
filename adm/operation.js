document.addEventListener('DOMContentLoaded', () => {
    initAdminPage();
});

let categories = []; // Store categories for dropdown

async function initAdminPage() {
    await loadCategories();
    loadProducts();
    setupAddForm();
}

// Load categories for dropdown
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        categories = data.categories;
        populateCategoryDropdown();
    } catch (err) {
        alert('Error loading categories');
        console.error(err);
    }
}

function populateCategoryDropdown() {
    const dropdowns = document.querySelectorAll('.catid-select');
    dropdowns.forEach(select => {
        select.innerHTML = categories.map(cat => 
            `<option value="${cat.catid}">${cat.name} (${cat.catid})</option>`
        ).join('');
    });
}

// Load and display products
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        renderProducts(data.products);
    } catch (err) {
        alert('Error loading products');
        console.error(err);
    }
}

function renderProducts(products) {
    const container = document.getElementById('container');
    container.innerHTML = '';

    // Add Product Form
    container.innerHTML += `
        <div class="form-section">
            <h2>Add New Product</h2>
            <form id="addForm">
                <input type="text" id="pid" placeholder="Product ID" required>
                <select class="catid-select" id="catid" required></select>
                <input type="text" id="name" placeholder="Product Name" required>
                <input type="number" id="price" placeholder="Price" step="0.01" required>
                <textarea id="des" placeholder="Description" required></textarea>
                <button type="submit">Add Product</button>
            </form>
        </div>
        <div class="product-list">
            <h2>Existing Products</h2>
            <div id="productList"></div>
        </div>
    `;

    // Populate category dropdown in add form
    populateCategoryDropdown();

    // Render product list
    const productList = document.getElementById('productList');
    productList.innerHTML = products.map(product => `
        <div class="product-item" data-pid="${product.pid}">
            <div class="product-info">
                <h3>${product.name} (ID: ${product.pid})</h3>
                <p>Category: ${product.catid} | Price: $${product.price}</p>
                <p>${product.des}</p>
            </div>
            <div class="product-actions">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        </div>
    `).join('');

    // Add event listeners for edit/delete
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDelete);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', handleEditClick);
    });

    // Add form submission
    document.getElementById('addForm').addEventListener('submit', handleAddSubmit);
}

// Add new product
async function handleAddSubmit(e) {
    e.preventDefault();
    
    const productData = {
        pid: document.getElementById('pid').value,
        catid: document.getElementById('catid').value,
        name: document.getElementById('name').value,
        price: document.getElementById('price').value,
        des: document.getElementById('des').value
    };

    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        
        if (!response.ok) throw new Error('Add failed');
        loadProducts(); // Refresh list
        e.target.reset(); // Clear form
    } catch (err) {
        alert('Error adding product');
        console.error(err);
    }
}

// Delete product
async function handleDelete(e) {
    const pid = e.target.closest('.product-item').dataset.pid;
    if (!confirm(`Delete product ${pid}?`)) return;

    try {
        const response = await fetch(`/api/products/${pid}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete failed');
        loadProducts(); // Refresh list
    } catch (err) {
        alert('Error deleting product');
        console.error(err);
    }
}

// Edit product
function handleEditClick(e) {
    const productItem = e.target.closest('.product-item');
    const pid = productItem.dataset.pid;
    
    // Get current values
    const infoDiv = productItem.querySelector('.product-info');
    const currentValues = {
        name: infoDiv.querySelector('h3').textContent.split('(')[0].trim(),
        catid: infoDiv.querySelector('p').textContent.match(/Category: (\d+)/)[1],
        price: infoDiv.querySelector('p').textContent.match(/\$([\d.]+)/)[1],
        des: infoDiv.querySelector('p:last-child').textContent
    };

    // Create edit form
    const editForm = `
        <form class="edit-form" data-pid="${pid}">
            <input type="text" value="${currentValues.name}" required>
            <select class="catid-select">${categories.map(cat => 
                `<option value="${cat.catid}" ${cat.catid == currentValues.catid ? 'selected' : ''}>${cat.name}</option>`
            ).join('')}</select>
            <input type="number" value="${currentValues.price}" step="0.01" required>
            <textarea required>${currentValues.des}</textarea>
            <button type="submit">Save</button>
            <button type="button" class="cancel-btn">Cancel</button>
        </form>
    `;

    productItem.innerHTML = editForm;
    productItem.querySelector('.cancel-btn').addEventListener('click', () => loadProducts());
    productItem.querySelector('.edit-form').addEventListener('submit', handleEditSubmit);
}

// Handle edit submission
async function handleEditSubmit(e) {
    e.preventDefault();
    const pid = e.target.dataset.pid;
    const formData = new FormData(e.target);
    
    const updateData = {
        pid: pid,
        catid: formData.getAll('select')[0],
        name: formData.getAll('input')[0].value,
        price: formData.getAll('input')[1].value,
        des: formData.getAll('textarea')[0].value
    };

    try {
        const response = await fetch(`/api/products/${pid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) throw new Error('Update failed');
        loadProducts(); // Refresh list
    } catch (err) {
        alert('Error updating product');
        console.error(err);
    }
}