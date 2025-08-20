import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function useNotifications() {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const newSocket = io(API_BASE, {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('Conectado ao servidor de notificações');
      newSocket.emit('join-admin');
    });

    newSocket.on('novo-pedido', (data) => {
      const notification = {
        id: Date.now(),
        type: 'novo-pedido',
        title: 'Novo Pedido!',
        message: data.message,
        timestamp: data.timestamp,
        pedido: data.pedido,
        read: false
      };
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Mostrar notificação do navegador
      if (Notification.permission === 'granted') {
        new Notification('Novo Pedido - Marmitex', {
          body: data.message,
          icon: '/favicon.ico'
        });
      }
    });

    newSocket.on('status-atualizado', (data) => {
      const notification = {
        id: Date.now(),
        type: 'status-atualizado',
        title: 'Status Atualizado',
        message: data.message,
        timestamp: data.timestamp,
        pedido: data.pedido,
        read: false
      };
      
      setNotifications(prev => [notification, ...prev]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    socket,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
}