const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const topicRoutes = require('./routes/topics');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: 'forum-project-x14d-pnd18410a-nori-1234s-projects.vercel.app',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Логирование запросов (для отладки)
app.use((req, res, next) => {
    console.log(req.method + ' ' + req.url);
    next();
});

// Подключение к MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/forum';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
        console.log('📁 Database: ' + MONGODB_URI);
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('💡 Убедитесь, что MongoDB запущена');
        process.exit(1);
    });

// Маршруты API
app.use('/api/topics', topicRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// Тестовый маршрут для проверки статуса сервера
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Сервер работает',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Корневой маршрут
app.get('/', (req, res) => {
    res.json({ message: 'Forum API is running', endpoints: ['/api/topics', '/api/messages', '/api/health'] });
});

// Обработка 404 - маршрут не найден
app.use((req, res) => {
    res.status(404).json({ message: 'Маршрут не найден' });
});

// Обработка ошибок (включая слишком большие запросы)
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err.message);
    
    // Ошибка "слишком большой запрос"
    if (err.type === 'entity.too.large' || (err.message && err.message.includes('large'))) {
        return res.status(413).json({
            message: 'Изображение слишком большое. Максимальный размер 10MB.'
        });
    }
    
    // Остальные ошибки
    res.status(500).json({
        message: 'Внутренняя ошибка сервера',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log('🚀 Server running on port ' + PORT);
    console.log('📡 API доступен по адресу: http://localhost:' + PORT + '/api/topics');
    console.log('🔍 Проверка здоровья: http://localhost:' + PORT + '/api/health');
});