import { useState } from 'react';
import './AuthModal.css';

function AuthModal({ isOpen, onClose, onLogin, onRegister }) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                if (!formData.email || !formData.password) {
                    setError('Заполните все поля');
                    setLoading(false);
                    return;
                }
                await onLogin(formData.email, formData.password);
            } else {
                if (!formData.username || !formData.email || !formData.password) {
                    setError('Заполните все поля');
                    setLoading(false);
                    return;
                }
                if (formData.password.length < 6) {
                    setError('Пароль должен быть не менее 6 символов');
                    setLoading(false);
                    return;
                }
                await onRegister(formData.username, formData.email, formData.password);
            }
            setFormData({ username: '', email: '', password: '' });
            onClose();
        } catch (err) {
            setError(err.message || 'Ошибка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="auth-close" onClick={onClose}>✖</button>
                
                <div className="auth-tabs">
                    <button 
                        className={`auth-tab ${isLogin ? 'active' : ''}`}
                        onClick={() => { setIsLogin(true); setError(''); }}
                    >
                        Вход
                    </button>
                    <button 
                        className={`auth-tab ${!isLogin ? 'active' : ''}`}
                        onClick={() => { setIsLogin(false); setError(''); }}
                    >
                        Регистрация
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <div className="form-group">
                            <label>Имя пользователя</label>
                            <input
                                type="text"
                                placeholder="Введите имя"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                disabled={loading}
                            />
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="example@mail.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Пароль</label>
                        <input
                            type="password"
                            placeholder="••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            disabled={loading}
                        />
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
                    </button>
                </form>

                <div className="auth-footer">
                    {isLogin ? (
                        <p>Нет аккаунта? <button onClick={() => setIsLogin(false)}>Зарегистрируйтесь</button></p>
                    ) : (
                        <p>Уже есть аккаунт? <button onClick={() => setIsLogin(true)}>Войдите</button></p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuthModal;