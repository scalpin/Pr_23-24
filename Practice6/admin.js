document.addEventListener('DOMContentLoaded', loadProducts);

function loadProducts() {
    fetch('http://localhost:3000/products')
        .then(response => response.json())
        .then(data => {
            displayProducts(data);
        })
        .catch(error => console.error('Ошибка загрузки товаров:', error));
}

function displayProducts(products) {
    const productsContainer = document.getElementById('productsContainer');
    productsContainer.innerHTML = '';

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');

        productCard.innerHTML = `
            <h3>${product.name}</h3>
            <p>Цена: ${product.price} ₽</p>
            <p>Категория: ${product.category}</p>
            <p>Описание: ${product.description}</p>
            <button onclick="showEditForm('${product.id}')">Редактировать</button>
            <button onclick="deleteProduct('${product.id}')">Удалить</button>
        `;

        productsContainer.appendChild(productCard);
    });
}

function showEditForm(id) {
    fetch(`http://localhost:3000/products/${id}`)
        .then(response => response.json())
        .then(product => {
            const productName = prompt("Новое название товара:", product.name);
            const productPrice = prompt("Новая цена товара:", product.price);
            const productCategory = prompt("Новая категория товара:", product.category);
            const productDescription = prompt("Новое описание товара:", product.description);

            const updatedProduct = {
                name: productName,
                price: parseInt(productPrice),
                category: productCategory,
                description: productDescription
            };

            fetch(`http://localhost:3000/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProduct)
            })
                .then(response => response.json())
                .then(() => {
                    alert('Товар обновлен');
                    loadProducts();
                })
                .catch(error => console.error('Ошибка обновления товара:', error));
        })
        .catch(error => console.error('Ошибка загрузки товара для редактирования:', error));
}

function deleteProduct(id) {
    if (!confirm('Вы уверены, что хотите удалить товар?')) {
        return;
    }
    fetch(`http://localhost:3000/products/${id}`, { method: 'DELETE' })
        .then(() => {
            alert('Товар удален');
            loadProducts();
        })
        .catch(error => console.error('Ошибка удаления товара:', error));
}

// Функция для добавления нового товара
document.getElementById('addNewProductButton').addEventListener('click', function() {
    document.getElementById('addProductFormContainer').style.display = 'block';
});

document.getElementById('cancelAddProduct').addEventListener('click', function() {
    document.getElementById('addProductFormContainer').style.display = 'none';
});

document.getElementById('addProductForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('productName').value;
    const price = document.getElementById('productPrice').value;
    const category = document.getElementById('productCategory').value;
    const description = document.getElementById('productDescription').value; // Получаем описание

    const newProduct = {
        name: name,
        price: parseInt(price),
        category: category,
        description: description // Добавляем описание товара
    };

    fetch('http://localhost:3000/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProduct)
    })
    .then(response => response.json())
    .then(() => {
        alert('Товар добавлен');
        document.getElementById('addProductFormContainer').style.display = 'none';
        loadProducts(); // Перезагружаем товары
    })
    .catch(error => console.error('Ошибка добавления товара:', error));
});

document.getElementById('addProductForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('productName').value;
    const price = document.getElementById('productPrice').value;
    const category = document.getElementById('productCategory').value;
    const description = document.getElementById('productDescription').value;

    const newProduct = { name, price: parseInt(price), category, description };

    fetch('http://localhost:3000/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
    })
        .then(response => response.json())
        .then(() => {
            loadProducts();
        })
        .catch(error => console.error('Ошибка добавления товара:', error));
});

/*
adminSocket.onmessage = (event) => {
    const chat = document.getElementById('admin-chat');

    if (event.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
            const message = document.createElement('div');
            message.textContent = reader.result;
            chat.appendChild(message);
            chat.scrollTop = chat.scrollHeight;
        };
        reader.readAsText(event.data);
    } else {
        const message = document.createElement('div');
        message.textContent = event.data;
        chat.appendChild(message);
        chat.scrollTop = chat.scrollHeight;
    }
};
*/
