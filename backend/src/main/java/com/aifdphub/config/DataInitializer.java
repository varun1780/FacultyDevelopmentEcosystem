package com.aifdphub.config;

import com.aifdphub.model.User;
import com.aifdphub.repository.UserRepository;
import com.aifdphub.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Seeds initial admin account for first-time setup.
 * Only creates the bootstrap admin when the database is completely empty.
 * All other users (admin or faculty) should register through the UI.
 */
@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    CommandLineRunner initData(UserRepository userRepository, NotificationRepository notificationRepository, PasswordEncoder encoder) {
        return args -> {
            if (userRepository.count() == 0) {
                // Create bootstrap admin user for first-time setup
                User admin = new User();
                admin.setName("System Admin");
                admin.setEmail("admin@fdphub.com");
                admin.setPassword(encoder.encode("admin123"));
                admin.setRole("ADMIN");
                admin.setDepartment("Administration");
                admin.setDesignation("Platform Administrator");
                userRepository.save(admin);

                log.info("✅ Created bootstrap admin user (admin@fdphub.com)");
            } else {
                log.info("✅ Database already contains {} user(s) — skipping seed", userRepository.count());
            }
        };
    }
}
