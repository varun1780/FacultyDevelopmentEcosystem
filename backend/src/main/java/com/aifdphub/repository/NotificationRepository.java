package com.aifdphub.repository;

import com.aifdphub.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE n.userId = :userId OR (n.role = :role AND n.userId IS NULL) ORDER BY n.createdAt DESC")
    List<Notification> findForUser(@Param("userId") Long userId, @Param("role") String role);

    @Query("SELECT n FROM Notification n WHERE (n.userId = :userId OR (n.role = :role AND n.userId IS NULL)) AND n.isRead = :isRead ORDER BY n.createdAt DESC")
    List<Notification> findForUserAndStatus(@Param("userId") Long userId, @Param("role") String role, @Param("isRead") Boolean isRead);

    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Notification n WHERE n.message LIKE %:keyword%")
    void deleteByMessageContaining(@Param("keyword") String keyword);
}
