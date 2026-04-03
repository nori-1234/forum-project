import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTopics, createTopic, deleteTopic, searchTopics } from '../api';
import './TopicList.css';

function TopicList({ user, onAuthRequired }) {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        firstMessage: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        loadTopics();
    }, []);

    const loadTopics = async () => {
        setLoading(true);
        try {
            const response = await getTopics();
            setTopics(response.data);
            setError('');
        } catch (err) {
            console.error('Ошибка загрузки тем:', err);
            setError('Не удалось загрузить темы');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            await loadTopics();
            setSearching(false);
            return;
        }
        
        setSearching(true);
        try {
            const response = await searchTopics(query);
            setTopics(response.data);
        } catch (err) {
            console.error('Ошибка поиска:', err);
            setError('Ошибка при поиске');
        } finally {
            setSearching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Если пользователь авторизован, подставляем его имя
        const author = user ? user.username : formData.author.trim();
        
        if (!formData.title.trim() || !author || !formData.firstMessage.trim()) {
            setError('Заполните все поля');
            return;
        }
        
        try {
            await createTopic({
                title: formData.title,
                author: author,
                firstMessage: formData.firstMessage
            });
            setFormData({ title: '', author: '', firstMessage: '' });
            setShowForm(false);
            await loadTopics();
            if (searchQuery) {
                handleSearch(searchQuery);
            }
        } catch (err) {
            console.error('Ошибка создания темы:', err);
            setError(err.response?.data?.message || 'Ошибка при создании темы');
        }
    };

    const handleDelete = async (id, title) => {
        if (window.confirm(`Удалить тему "${title}" и все сообщения в ней?`)) {
            try {
                await deleteTopic(id);
                await loadTopics();
                if (searchQuery) {
                    handleSearch(searchQuery);
                }
            } catch (err) {
                console.error('Ошибка удаления:', err);
                setError('Не удалось удалить тему');
            }
        }
    };

    if (loading) return <div className="loading">Загрузка тем</div>;

    return (
        <div className="topic-list">
            <div className="topic-list-header">
                <h2> Все обсуждения</h2>
                <div className="header-actions">
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="🔍 Поиск по темам или авторам..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {searching && <span className="search-spinner">⏳</span>}
                    </div>
                    {user && (
                    <button 
                        className="btn btn-primary" 
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? '✖ Отмена' : '+ Создать тему'}
                    </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="error-message">
                    ⚠️ {error}
                    <button onClick={() => setError('')} className="error-close">✖</button>
                </div>
            )}

            {!user && topics.length > 0 && (
                <div className="info-message">
                💡 <strong>Режим чтения</strong> — вы можете просматривать темы и отвечать на сообщения, 
                    но для создания новых тем и загрузки изображений 
                    <button onClick={onAuthRequired} className="info-link"> войдите или зарегистрируйтесь</button>.
                </div>
            )}

            {showForm && (
                <form className="create-topic-form" onSubmit={handleSubmit}>
                    <h3>Создание новой темы</h3>
                    {!user && (
                        <div className="form-group">
                            <label>Ваше имя *</label>
                            <input
                                type="text"
                                placeholder="Как вас называть?"
                                value={formData.author}
                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                maxLength={50}
                            />
                            <small>Совет: <button type="button" onClick={onAuthRequired} className="auth-hint">Войдите или зарегистрируйтесь</button>, чтобы использовать своё имя</small>
                        </div>
                    )}
                    
                    {user && (
                        <div className="form-group">
                            <label>Автор</label>
                            <input type="text" value={user.username} disabled className="disabled-input" />
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label>Название темы *</label>
                        <input
                            type="text"
                            placeholder="Например: Как начать изучать JavaScript?"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            maxLength={200}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Первое сообщение *</label>
                        <textarea
                            placeholder="Напишите, с чего хотите начать обсуждение..."
                            value={formData.firstMessage}
                            onChange={(e) => setFormData({ ...formData, firstMessage: e.target.value })}
                            maxLength={5000}
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary">✅ Создать тему</button>
                </form>
            )}

            {searchQuery && (
                <div className="search-info">
                    🔍 Результаты поиска по запросу: "{searchQuery}" ({topics.length} тем)
                    <button onClick={() => handleSearch('')} className="clear-search">✖ Очистить</button>
                </div>
            )}

            {topics.length === 0 && !loading && (
                <div className="empty-state">
                    {searchQuery ? (
                        <>
                            <p>🔍 По запросу "{searchQuery}" ничего не найдено</p>
                            <p>Попробуйте изменить поисковый запрос</p>
                        </>
                    ) : (
                        <>
                            <p>📭 Пока нет ни одной темы</p>
                            <p>Нажмите «Создать тему», чтобы начать обсуждение!</p>
                        </>
                    )}
                </div>
            )}

            <div className="topics-grid">
                {topics.map((topic) => (
                    <div key={topic._id} className="topic-card">
                        <Link to={`/topic/${topic._id}`} className="topic-link">
                            <h3 className="topic-title">{topic.title}</h3>
                            <div className="topic-meta">
                                <span>👤 {topic.author}</span>
                                <span>📅 {new Date(topic.createdAt).toLocaleDateString('ru-RU')}</span>
                                <span>💬 {topic.messageCount || 0} сообщ.</span>
                            </div>
                        </Link>
                        <button
                            className="delete-topic-btn"
                            onClick={() => handleDelete(topic._id, topic.title)}
                            title="Удалить тему"
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TopicList;