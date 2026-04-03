import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTopic, createMessage, deleteMessage } from '../api';
import './TopicDetail.css';

function TopicDetail({ user, onAuthRequired }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ 
    author: '', 
    text: '',
    image: null,
    imagePreview: null
  });
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadTopic();
  }, [id]);

  const loadTopic = async () => {
    setLoading(true);
    try {
      const response = await getTopic(id);
      setTopic(response.data.topic);
      setMessages(response.data.messages);
      setError('');
    } catch (err) {
      console.error('Ошибка загрузки темы:', err);
      setError('Тема не найдена или произошла ошибка');
      setTimeout(() => navigate('/'), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Обработка выбора файла
  const handleImageSelect = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // Проверка типа файла
  if (!file.type.startsWith('image/')) {
    setError('Можно загружать только изображения');
    return;
  }
  
  // Проверка размера (максимум 1MB для надежности)
  if (file.size > 1 * 1024 * 1024) {
    setError('Изображение не должно превышать 1MB (для Base64)');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = () => {
    // Убеждаемся, что строка начинается с data:image
    const result = reader.result;
    if (result && result.startsWith('data:image')) {
      setFormData(prev => ({
        ...prev,
        image: result,
        imagePreview: result
      }));
    } else {
      setError('Ошибка обработки изображения');
    }
  };
  reader.onerror = () => {
    setError('Ошибка чтения файла');
  };
  reader.readAsDataURL(file);
};

  // Удаление выбранного изображения
  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null,
      imagePreview: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // Определяем автора
    const author = user ? user.username : formData.author.trim();
    
    if (!author) {
        setError('Введите ваше имя');
        return;
    }
    
    // Проверяем если пользователь не авторизован, нельзя отправлять изображения
    if (!user && formData.image) {
        setError('Гости не могут отправлять изображения. Зарегистрируйтесь или войдите.');
        return;
    }
    
    // Проверяем есть ли хоть что-то (текст или изображение для авторизованных)
    const hasText = formData.text.trim().length > 0;
    const hasImage = user && formData.image;
    
    if (!hasText && !hasImage) {
        setError('Введите текст сообщения');
        return;
    }
    
    setSending(true);
    setError('');
    
    try {
        await createMessage({
            topicId: id,
            author: author,
            text: formData.text.trim(),
            image: user ? formData.image : null
        });
        setFormData({ 
            author: '', 
            text: '', 
            image: null, 
            imagePreview: null 
        });
        loadTopic();
    } catch (err) {
        console.error('Ошибка отправки:', err);
        setError(err.response?.data?.message || 'Не удалось отправить сообщение');
    } finally {
        setSending(false);
    }
};

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Удалить это сообщение?')) {
      try {
        await deleteMessage(messageId);
        loadTopic();
      } catch (err) {
        console.error('Ошибка удаления:', err);
        setError('Не удалось удалить сообщение');
      }
    }
  };

  if (loading) return <div className="loading">Загрузка обсуждения</div>;
  if (!topic && !loading) return <div className="loading">Тема не найдена</div>;

  return (
    <div className="topic-detail">
      <button className="back-btn" onClick={() => navigate('/')}>
        ← Назад к списку тем
      </button>

      <div className="topic-header">
        <h1>{topic.title}</h1>
        <div className="topic-info">
          <span>👤 Автор: {topic.author}</span>
          <span>📅 Создано: {new Date(topic.createdAt).toLocaleString('ru-RU')}</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={() => setError('')} className="error-close">✖</button>
        </div>
      )}
      <div className="messages-section">
        <h3>💬 Сообщения ({messages.length})</h3>
        
        <div className="messages-list">
          {messages.length === 0 ? (
            <div className="empty-messages">
              <p>Пока нет сообщений</p>
              <p>Будьте первым, кто начнет обсуждение!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className="message-item">
                <div className="message-header">
                  <span className="message-author"> {msg.author}</span>
                  <span className="message-date">
                    {new Date(msg.createdAt).toLocaleString('ru-RU')}
                  </span>
                  <button
                    className="delete-message-btn"
                    onClick={() => handleDeleteMessage(msg._id)}
                    title="Удалить сообщение"
                  >
                    🗑️
                  </button>
                </div>
                {msg.text && (
                  <div className="message-text">{msg.text}</div>
                )}
                {msg.image && (
                  <div className="message-image">
                    <img 
                      src={msg.image} 
                      alt="Вложение"
                      onClick={() => window.open(msg.image, '_blank')}
                      style={{ cursor: 'pointer', maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <form className="message-form" onSubmit={handleSendMessage}>
    <h3>📢 Написать сообщение</h3>
    
    {/* Если пользователь НЕ авторизован — показываем поле для имени */}
    {!user && (
        <div className="form-group">
            <label>Ваше имя *</label>
            <input
                type="text"
                placeholder="Как вас назвать?"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                maxLength={50}
                disabled={sending}
                required
            />
        </div>
    )}
    
    {/* Если пользователь авторизован — показываем его имя (нередактируемое) */}
    {user && (
        <div className="form-group">
            <label>Автор</label>
            <input type="text" value={user.username} disabled className="disabled-input" />
        </div>
    )}
    
    <div className="form-group">
        <label>Текст сообщения *</label>
        <textarea
            placeholder="Напишите ваше сообщение..."
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            maxLength={5000}
            disabled={sending}
        />
    </div>
    
    {/* ===== БЛОК ЗАГРУЗКИ ИЗОБРАЖЕНИЙ — ТОЛЬКО ДЛЯ АВТОРИЗОВАННЫХ ===== */}
    {user && (
        <>
            <div className="form-group">
                <label>📷 Изображение</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    ref={fileInputRef}
                    disabled={sending}
                    className="file-input"
                />
                <small className="form-hint">Максимум 2MB. Поддерживаются: JPG, PNG, GIF</small>
            </div>
            
            {formData.imagePreview && (
                <div className="image-preview">
                    <div className="image-preview-container">
                        <img src={formData.imagePreview} alt="Предпросмотр" />
                        <button 
                            type="button" 
                            className="remove-image-btn"
                            onClick={removeImage}
                        >
                            ✖ Удалить
                        </button>
                    </div>
                </div>
            )}
        </>
    )}
    {/* ===== КОНЕЦ БЛОКА ДЛЯ АВТОРИЗОВАННЫХ ===== */}
    
    {/* Для гостей показываем предупреждение о невозможности загрузки изображений */}
    {!user && (
        <div className="info-hint">
            ⚠️ <strong>Только текст</strong> — для загрузки изображений 
            <button onClick={() => onAuthRequired?.()} className="info-link"> войдите или зарегистрируйтесь</button>.
        </div>
    )}
    
    <button type="submit" className="btn btn-primary" disabled={sending}>
        {sending ? 'Отправка...' : '📤 Отправить'}
    </button>
</form>
    </div>
  );
}

export default TopicDetail;