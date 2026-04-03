import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../api';
import './Profile.css';

function Profile({ user, onUserUpdate }) {
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ topicsCount: 0, messagesCount: 0 });
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        username: '',
        bio: ''
    });
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        loadProfile();
    }, [user, navigate]);

    const loadProfile = async () => {
        try {
            const response = await getUserProfile(user.id);
            setProfile(response.data.user);
            setStats(response.data.stats);
            setEditForm({
                username: response.data.user.username,
                bio: response.data.user.bio || ''
            });
            setAvatarPreview(response.data.user.avatar);
        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
            setError('Не удалось загрузить профиль');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            setError('Можно загружать только изображения');
            return;
        }
        
        if (file.size > 2 * 1024 * 1024) {
            setError('Изображение не должно превышать 2MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result);
            setAvatarFile(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const removeAvatar = () => {
        setAvatarPreview(null);
        setAvatarFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        setError('');
        setSuccess('');
        setSaving(true);
        
        if (editForm.username.length < 3) {
            setError('Имя пользователя должно быть не менее 3 символов');
            setSaving(false);
            return;
        }
        
        try {
            const response = await updateUserProfile({
                userId: user.id,
                username: editForm.username,
                bio: editForm.bio,
                avatar: avatarFile
            });
            
            if (response.data.success) {
                setSuccess('Профиль успешно обновлён!');
                setProfile(response.data.user);
                setEditing(false);
                // Обновляем данные пользователя в App
                if (onUserUpdate) {
                    onUserUpdate(response.data.user);
                }
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            console.error('Ошибка обновления:', error);
            setError(error.response?.data?.message || 'Ошибка при обновлении профиля');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Неизвестно';
        return new Date(date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) return <div className="loading">Загрузка профиля...</div>;
    if (!profile) return <div className="loading">Профиль не найден</div>;

    return (
        <div className="profile-container">
            <button className="back-btn" onClick={() => navigate('/')}>
                ← Назад к форуму
            </button>

            <div className="profile-card">
                <div className="profile-header">
                    <div className="avatar-section">
                        <div className="avatar-large">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Аватар" />
                            ) : (
                                <div className="avatar-placeholder-large">
                                    {profile.username?.[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                        </div>
                        {editing && (
                            <div className="avatar-actions">
                                <button 
                                    className="avatar-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    📷 Загрузить
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleAvatarSelect}
                                    style={{ display: 'none' }}
                                />
                                {avatarPreview && (
                                    <button 
                                        className="avatar-btn remove"
                                        onClick={removeAvatar}
                                    >
                                        🗑️ Удалить
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="profile-info-header">
                        {editing ? (
                            <div className="edit-username">
                                <input
                                    type="text"
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    maxLength={30}
                                    placeholder="Имя пользователя"
                                />
                            </div>
                        ) : (
                            <h1>{profile.username}</h1>
                        )}
                        <div className="profile-meta">
                            <span>📧 {profile.email}</span>
                            <span>📅 Регистрация: {formatDate(profile.createdAt)}</span>
                            <span>🟢 Последний визит: {formatDate(profile.lastActive)}</span>
                        </div>
                    </div>
                </div>

                <div className="profile-stats">
                    <div className="stat-card">
                        <div className="stat-value">{stats.topicsCount}</div>
                        <div className="stat-label">Создано тем</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.messagesCount}</div>
                        <div className="stat-label">Написано сообщений</div>
                    </div>
                </div>

                <div className="profile-bio">
                    <h3> О себе</h3>
                    {editing ? (
                        <textarea
                            value={editForm.bio}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            placeholder="Расскажите немного о себе..."
                            maxLength={500}
                            rows={4}
                        />
                    ) : (
                        <p>{profile.bio || 'Пользователь пока ничего не рассказал о себе.'}</p>
                    )}
                </div>

                {error && <div className="profile-error">{error}</div>}
                {success && <div className="profile-success">{success}</div>}

                <div className="profile-actions">
                    {editing ? (
                        <>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Сохранение...' : ' Сохранить изменения'}
                            </button>
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => {
                                    setEditing(false);
                                    setEditForm({
                                        username: profile.username,
                                        bio: profile.bio || ''
                                    });
                                    setAvatarPreview(profile.avatar);
                                    setAvatarFile(null);
                                    setError('');
                                }}
                            >
                                Отмена
                            </button>
                        </>
                    ) : (
                        <button 
                            className="btn btn-primary" 
                            onClick={() => setEditing(true)}
                        >
                             Редактировать профиль
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;