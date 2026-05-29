package com.aifdphub.service;

import com.aifdphub.model.Notification;
import com.aifdphub.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Notification createNotification(String title, String message, String type, String role, Long userId) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRole(role);
        notification.setUserId(userId);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotificationsForUser(Long userId, String role) {
        return notificationRepository.findForUser(userId, role);
    }

    public Notification markAsRead(Long id) {
        Optional<Notification> opt = notificationRepository.findById(id);
        if (opt.isPresent()) {
            Notification n = opt.get();
            n.setIsRead(true);
            return notificationRepository.save(n);
        }
        return null;
    }

    public void markAllAsRead(Long userId, String role) {
        List<Notification> unread = notificationRepository.findForUserAndStatus(userId, role, false);
        for (Notification n : unread) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(unread);
    }
}
