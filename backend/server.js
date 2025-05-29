const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const fs = require('fs');
const cors = require('cors');
const https = require('https');
const WebSocket = require('ws');
const path = require('path');

const app = express();

// Настройка HTTPS
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, '..', 'certs', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '..', 'certs', 'cert.pem')),
};

// Сервер HTTPS + WebSocket
const server = https.createServer(sslOptions, app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const productsFilePath = './products.json';

app.use(cors());
app.use(express.json());

// Раздаём файлы: admin.html, admin.js, adminstyle.css
app.use(express.static(__dirname));

// Отдаём admin.html при заходе на /
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// WebSocket
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('Новое подключение');
    clients.add(ws);

    ws.on('message', (message) => {
        console.log(`Сообщение: ${message}`);
        for (const client of clients) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        }
    });

    ws.on('close', () => {
        console.log('Клиент отключился');
        clients.delete(ws);
    });
});

// Чтение/запись товаров
function readProductsFromFile() {
    const data = fs.readFileSync(productsFilePath, 'utf8');
    return JSON.parse(data);
}

function writeProductsToFile(products) {
    return new Promise((resolve, reject) => {
        fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), 'utf8', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// REST API
app.get('/products', async (req, res) => {
    try {
        const products = await readProductsFromFile();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении товаров' });
    }
});

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
        res.status(500).json({ error: 'Ошибка при добавлении товара' });
    }
});

app.get('/products/:id', async (req, res) => {
    try {
        const products = await readProductsFromFile();
        const product = products.find(p => p.id === req.params.id);
        if (!product) return res.status(404).json({ error: 'Товар не найден' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении товара' });
    }
});

app.put('/products/:id', async (req, res) => {
    const { name, price, category, description } = req.body;
    if (!name || !price || !category || !description) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    try {
        const products = await readProductsFromFile();
        const index = products.findIndex(p => p.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Товар не найден' });

        products[index] = { ...products[index], name, price, category, description };
        await writeProductsToFile(products);
        res.json(products[index]);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при обновлении товара' });
    }
});

app.delete('/products/:id', async (req, res) => {
    try {
        const products = await readProductsFromFile();
        const newProducts = products.filter(p => p.id !== req.params.id);
        if (products.length === newProducts.length) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        await writeProductsToFile(newProducts);
        res.status(200).json({ message: 'Товар удален' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении товара' });
    }
});

// GraphQL
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

const root = {
    products: () => readProductsFromFile()
};

app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
}));

// Запуск HTTPS-сервера
server.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTPS сервер запущен на https://localhost:${PORT}`);
});
