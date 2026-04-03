const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  author: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  text: {
    type: String,
    trim: true,
    maxlength: 5000,
    default: ''  // текст теперь необязательный
  },
  image: {
    type: String,  // base64 строка изображения
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Валидация: хотя бы текст или изображение должны быть
messageSchema.pre('save', function(next) {
  if (!this.text && !this.image) {
    next(new Error('Сообщение должно содержать текст или изображение'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Message', messageSchema);