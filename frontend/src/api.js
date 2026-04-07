import axios from 'axios';

const API_URL = 'https://forum-project-4jzk.onrender.com/api';

const API = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Перехватчик для обработки ошибок
API.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.error('Ресурс не найден');
    } else if (error.response?.status === 500) {
      console.error('Ошибка сервера');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Превышено время ожидания ответа');
    } else if (!error.response) {
      console.error('Сервер недоступен. Убедитесь, что backend запущен на порту 5000');
    }
    
    return Promise.reject(error);
  }
);

// API методы для тем
export const getTopics = () => API.get('/topics');
export const getTopic = (id) => API.get(`/topics/${id}`);
export const createTopic = (data) => API.post('/topics', data);
export const deleteTopic = (id) => API.delete(`/topics/${id}`);

// API методы для сообщений
export const createMessage = (data) => API.post('/messages', data);
export const deleteMessage = (id) => API.delete(`/messages/${id}`);

// Поиск тем
export const searchTopics = (query) => API.get(`/topics/search?q=${encodeURIComponent(query)}`);
// Регистрация
export const register = (userData) => API.post('/users/register', userData);
// Вход
export const login = (userData) => API.post('/users/login', userData);

// Получить профиль пользователя
export const getUserProfile = (userId) => API.get(`/users/profile/${userId}`);
// Обновить профиль пользователя
export const updateUserProfile = (data) => API.put('/users/profile', data);

// Проверка здоровья сервера
export const checkHealth = () => API.get('/health');