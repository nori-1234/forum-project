const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 200
  },
  author: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Виртуальное поле для подсчета сообщений
topicSchema.virtual('messageCount', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'topicId',
  count: true
});

module.exports = mongoose.model('Topic', topicSchema);