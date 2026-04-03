const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Topic = require('../models/Topic');

// POST /api/messages - создать сообщение (с поддержкой изображений)
router.post('/', async (req, res) => {
  try {
    const { topicId, author, text, image } = req.body;
    
    // Валидация
    if (!topicId || !author) {
      return res.status(400).json({ message: 'Тема и автор обязательны' });
    }
    
    if (author.length < 2) {
      return res.status(400).json({ message: 'Имя должно быть не менее 2 символов' });
    }
    
    // Проверяем, есть ли хоть что-то (текст или изображение)
    if ((!text || text.trim() === '') && !image) {
      return res.status(400).json({ message: 'Введите текст или добавьте изображение' });
    }
    
    // Проверяем, существует ли тема
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Тема не найдена' });
    }
    
    const message = new Message({ 
      topicId, 
      author, 
      text: text || '', 
      image: image || null 
    });
    await message.save();
    
    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Ошибка создания сообщения:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// DELETE /api/messages/:id - удалить сообщение
router.delete('/:id', async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Сообщение не найдено' });
    }
    res.json({ success: true, message: 'Сообщение удалено' });
  } catch (error) {
    console.error('Ошибка удаления сообщения:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;