import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { useLanguage } from '../context/LanguageContext';

const NotificationBell = () => {
    const { token, isAuthenticated } = useStore();
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        if (!isAuthenticated) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('/api/notifications', config);
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, token]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put('/api/notifications/read', {}, config);
            fetchNotifications();
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (!isAuthenticated) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-white hover:bg-white/10 rounded-full transition"
            >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-primary-700">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">{t('notifications')}</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-xs text-primary-600 font-bold hover:underline">
                                {t('markAllRead')}
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-sm">
                                {t('noNotifications')}
                            </div>
                        ) : (
                            <div className="divide-y">
                                {notifications.map((notif) => (
                                    <div key={notif._id} className={`p-4 hover:bg-gray-50 transition ${notif.isRead ? 'opacity-60' : 'bg-primary-50/30'}`}>
                                        <div className="flex gap-3 items-start">
                                            <div className="text-xl mt-0.5">
                                                {notif.type === 'appointment' && '📅'}
                                                {notif.type === 'prescription' && '💊'}
                                                {notif.type === 'general' && '🔔'}
                                            </div>
                                            <div>
                                                <p className={`text-sm ${notif.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                                                    {notif.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(notif.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
