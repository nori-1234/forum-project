import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TopicList from './components/TopicList';
import TopicDetail from './components/TopicDetail';
import AuthModal from './components/AuthModal';
import Profile from './components/Profile';
import { checkHealth, register, login } from './api';
import './App.css';

function App() {
    const [serverStatus, setServerStatus] = useState('checking');
    const [user, setUser] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                await checkHealth();
                setServerStatus('online');
            } catch {
                setServerStatus('offline');
            }
            
            const savedUser = localStorage.getItem('forum_user');
            if (savedUser) {
                try {
                    const userData = JSON.parse(savedUser);
                    setUser(userData);
                } catch (error) {
                    console.error('Ошибка загрузки пользователя:', error);
                    localStorage.removeItem('forum_user');
                }
            }
            
            setIsLoading(false);
        };
        
        initializeApp();
    }, []);

    const handleRegister = async (username, email, password) => {
        const response = await register({ username, email, password });
        if (response.data.success) {
            const userData = response.data.user;
            setUser(userData);
            localStorage.setItem('forum_user', JSON.stringify(userData));
        }
        return response.data;
    };

    const handleLogin = async (email, password) => {
        const response = await login({ email, password });
        if (response.data.success) {
            const userData = response.data.user;
            setUser(userData);
            localStorage.setItem('forum_user', JSON.stringify(userData));
        }
        return response.data;
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('forum_user');
    };

    if (isLoading) {
        return <div className="loading">Загрузка приложения...</div>;
    }

    return (
        <BrowserRouter>
            <div className="app">
                <header className="header">
                    <div className="container header-content">
                        <Link to="/" className="logo">
                             Дискуссионная платформа
                        </Link>
                        
                        <div className="header-right">
                            {serverStatus === 'offline' && (
                                <div className="server-warning">⚠️ Сервер не доступен</div>
                            )}
                            
                            {user ? (
                                <div className="user-menu">
                                    <Link to="/profile" className="user-name-link">
                                        <span className="user-name">👤 {user.username}</span>
                                    </Link>
                                    <button onClick={handleLogout} className="logout-btn">Выйти</button>
                                </div>
                            ) : (
                                <button onClick={() => setShowAuthModal(true)} className="auth-btn">
                                     Войти / Регистрация
                                </button>
                            )}
                        </div>
                    </div>
                </header>
                
                <main className="main">
                    <div className="container">
                        <Routes>
                            <Route path="/" element={
                                <TopicList 
                                    user={user} 
                                    onAuthRequired={() => setShowAuthModal(true)}
                                />
                            } />
                            <Route path="/topic/:id" element={
                                <TopicDetail 
                                    user={user} 
                                    onAuthRequired={() => setShowAuthModal(true)} 
                                />
                            } />
                            <Route path="/profile" element={
                                <Profile user={user} onUserUpdate={setUser} />
                            } />
                        </Routes>
                    </div>
                </main>
                
                <footer className="footer">
                    <div className="container">
                        <p>Курсовой проект: Веб-платформа для обсуждений | MERN Stack | 2026</p>
                        {user && <p className="guest-mode">Вы вошли как {user.username}</p>}
                        {!user && (
                            <p className="guest-mode">
                                Гостевой режим | <button onClick={() => setShowAuthModal(true)} className="login-link">Войдите</button> для сохранения имени
                            </p>
                        )}
                    </div>
                </footer>
            </div>
            
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onLogin={handleLogin}
                onRegister={handleRegister}
            />
        </BrowserRouter>
    );
}

export default App;