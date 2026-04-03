const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const Message = require('../models/Message');

// GET /api/topics - получить все темы
router.get('/', async (req, res) => {
  try {
    const topics = await Topic.find()
      .sort({ createdAt: -1 })
      .lean();
    
    // Получаем количество сообщений для каждой темы
    const topicsWithCount = await Promise.all(
      topics.map(async (topic) => {
        const messageCount = await Message.countDocuments({ topicId: topic._id });
        return { ...topic, messageCount };
      })
    );
    
    res.json(topicsWithCount);
  } catch (error) {
    console.error('Ошибка получения тем:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// GET /api/topics/search?q=текст - поиск тем
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim() === '') {
            return res.json([]);
        }
        
        const searchTerm = q.trim();
        
        // Поиск по названию темы и автору
        const topics = await Topic.find({
            $or: [
                { title: { $regex: searchTerm, $options: 'i' } },
                { author: { $regex: searchTerm, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 });
        
        // Добавляем количество сообщений
        const topicsWithCount = await Promise.all(
            topics.map(async (topic) => {
                const messageCount = await Message.countDocuments({ topicId: topic._id });
                return { ...topic.toObject(), messageCount };
            })
        );
        
        res.json(topicsWithCount);
    } catch (error) {
        console.error('Ошибка поиска:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// GET /api/topics/:id - получить одну тему с сообщениями
router.get('/:id', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Тема не найдена' });
    }
    
    const messages = await Message.find({ topicId: topic._id })
      .sort({ createdAt: 1 });
    
    res.json({ topic, messages });
  } catch (error) {
    console.error('Ошибка получения темы:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// POST /api/topics - создать новую тему
router.post('/', async (req, res) => {
  try {
    const { title, author, firstMessage } = req.body;
    
    // Валидация
    if (!title || !author || !firstMessage) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }
    
    if (title.length < 3) {
      return res.status(400).json({ message: 'Название должно быть не менее 3 символов' });
    }
    
    if (author.length < 2) {
      return res.status(400).json({ message: 'Имя должно быть не менее 2 символов' });
    }
    
    if (firstMessage.length < 1) {
      return res.status(400).json({ message: 'Сообщение не может быть пустым' });
    }
    
    // Создаем тему
    const topic = new Topic({ title, author });
    await topic.save();
    
    // Создаем первое сообщение
    const message = new Message({
      topicId: topic._id,
      author,
      text: firstMessage
    });
    await message.save();
    
    res.status(201).json({ 
      success: true,
      topic, 
      message 
    });
  } catch (error) {
    console.error('Ошибка создания темы:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// DELETE /api/topics/:id - удалить тему и все сообщения
router.delete('/:id', async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Тема не найдена' });
    }
    
    // Удаляем все сообщения темы
    await Message.deleteMany({ topicId: req.params.id });
    
    res.json({ success: true, message: 'Тема удалена' });
  } catch (error) {
    console.error('Ошибка удаления темы:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;