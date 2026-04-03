const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');
const Topic = require('../models/Topic');

// POST /api/users/register - регистрация
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Все поля обязательны' });
        }
        
        if (username.length < 3) {
            return res.status(400).json({ message: 'Имя пользователя должно быть не менее 3 символов' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ message: 'Пароль должен быть не менее 6 символов' });
        }
        
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь с таким email или именем уже существует' });
        }
        
        const user = new User({ username, email, password });
        await user.save();
        
        res.status(201).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                bio: user.bio,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// POST /api/users/login - вход
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email и пароль обязательны' });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }
        
        // Обновляем время последней активности
        user.lastActive = new Date();
        await user.save();
        
        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                bio: user.bio,
                createdAt: user.createdAt,
                lastActive: user.lastActive
            }
        });
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// GET /api/users/profile/:id - получить профиль пользователя
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        // Получаем статистику
        const topicsCount = await Topic.countDocuments({ author: user.username });
        const messagesCount = await Message.countDocuments({ author: user.username });
        
        res.json({
            user,
            stats: {
                topicsCount,
                messagesCount
            }
        });
    } catch (error) {
        console.error('Ошибка получения профиля:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// PUT /api/users/profile - обновить профиль
router.put('/profile', async (req, res) => {
    try {
        const { userId, username, bio, avatar } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: 'ID пользователя обязателен' });
        }
        
        const updateData = {};
        if (username) updateData.username = username;
        if (bio !== undefined) updateData.bio = bio;
        if (avatar !== undefined) updateData.avatar = avatar;
        updateData.lastActive = new Date();
        
        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;