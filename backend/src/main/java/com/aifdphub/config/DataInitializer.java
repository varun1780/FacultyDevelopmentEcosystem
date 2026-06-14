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
import com.aifdphub.model.College;
import com.aifdphub.model.FdpProgram;
import com.aifdphub.repository.CollegeRepository;
import com.aifdphub.repository.FdpRepository;

/**
 * Seeds initial admin account for first-time setup.
 * Only creates the bootstrap admin when the database is completely empty.
 * All other users (admin or faculty) should register through the UI.
 */
@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    CommandLineRunner initData(UserRepository userRepository, NotificationRepository notificationRepository, PasswordEncoder encoder, CollegeRepository collegeRepository, FdpRepository fdpRepository) {
        return args -> {
            log.info("✅ DataInitializer: No demo data seeded. System is running in fully dynamic production mode.");
        };
    }
}
