package com.aifdphub.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UploadController {

    private static final String UPLOAD_DIR = "uploads/videos/";

    @PostMapping("/upload/video")
    public ResponseEntity<?> uploadVideo(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty", "success", false));
        }

        try {
            // Create uploads directory if it doesn't exist
            File directory = new File(UPLOAD_DIR);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // Generate a unique file name
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            String newFileName = UUID.randomUUID().toString() + fileExtension;
            Path path = Paths.get(UPLOAD_DIR + newFileName);

            // Copy file to target location
            Files.copy(file.getInputStream(), path);

            // Construct the access URL
            String videoUrl = "http://localhost:8080/uploads/videos/" + newFileName;
            String uploadedFilePath = UPLOAD_DIR + newFileName;

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("videoUrl", videoUrl);
            response.put("uploadedFilePath", uploadedFilePath);

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to upload file: " + e.getMessage(), "success", false));
        }
    }
}
