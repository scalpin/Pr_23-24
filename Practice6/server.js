const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const productsFilePath = path.join(__dirname, 'products.json');

// Чтение товаров из файла
function readProductsFromFile() {
    const data = fs.readFileSync(productsFilePath, 'utf8');
    return JSON.parse(data);
}

// Запись товаров в файл
function writeProductsToFile(products) {
    return new Promise((resolve, reject) => {
        fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), 'utf8', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Получение всех товаров
app.get('/products', async (req, res) => {
    try {
        const products = await readProductsFromFile();
        res.json(products);
    } catch (error) {
        console.error("Ошибка при получении товаров:", error);
        res.status(500).json({ error: 'Ошибка при получении товаров' });
    }
});

// Добавление нового товара
app.post('/products', async (req, res) => {
    const { name, price, category, description } = req.body;

    if (!name || !price || !category || !description) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const newProduct = {
        id: Date.now().toString(),
        name,
        price,
        category,
        description
    };

    try {
        const products = await readProductsFromFile();
        products.push(newProduct);
        await writeProductsToFile(products);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Ошибка при добавлении товара:', error);
        res.status(500).json({ error: 'Ошибка при добавлении товара' });
    }
});

// Получение одного товара по ID
app.get('/products/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        const products = await readProductsFromFile();
        const product = products.find(p => p.id === productId);

        if (!product) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении товара' });
    }
});

// Изменение товара
app.put('/products/:id', async (req, res) => {
    const productId = req.params.id;
    const { name, price, category, description } = req.body;

    if (!name || !price || !category || !description) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    try {
        const products = await readProductsFromFile();
        const index = products.findIndex(p => p.id === productId);

        if (index === -1) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        products[index] = { ...products[index], name, price, category, description };
        await writeProductsToFile(products);

        res.json(products[index]);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при обновлении товара' });
    }
});

// Удаление товара
app.delete('/products/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        let products = await readProductsFromFile();
        const newProducts = products.filter(p => p.id !== productId);

        if (products.length === newProducts.length) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        await writeProductsToFile(newProducts);
        res.status(200).json({ message: 'Товар удален' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении товара' });
    }
});


// GraphQL схема
const schema = buildSchema(`
    type Product {
        id: ID!
        name: String
        price: Float
        description: String
    }

    type Query {
        products: [Product]
    }
`);

// Резолверы
const root = {
    products: () => {
        const products = readProductsFromFile();
        return products.map(({ id, name, price, description }) => ({
            id,
            name,
            price,
            description
        }));
    }
};

// GraphQL endpoint
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true // Включаем интерфейс GraphiQL для тестирования
}));

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
