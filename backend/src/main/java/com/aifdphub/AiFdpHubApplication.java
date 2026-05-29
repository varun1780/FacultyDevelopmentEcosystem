package com.aifdphub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AiFdpHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiFdpHubApplication.class, args);
        System.out.println("\n" +
            "╔══════════════════════════════════════════════╗\n" +
            "║     AI FDP Hub Backend - v1.0.0              ║\n" +
            "║     Running on http://localhost:8080          ║\n" +
            "║     H2 Console: http://localhost:8080/h2-console ║\n" +
            "╚══════════════════════════════════════════════╝\n");
    }
}
