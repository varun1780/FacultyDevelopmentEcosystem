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

    private static final String VIDEO_UPLOAD_DIR = "uploads/videos/";
    private static final String PDF_UPLOAD_DIR = "uploads/pdfs/";

    @PostMapping("/upload/video")
    public ResponseEntity<?> uploadVideo(@RequestParam("file") MultipartFile file) {
        return handleUpload(file, VIDEO_UPLOAD_DIR, "videoUrl");
    }

    @PostMapping("/upload/pdf")
    public ResponseEntity<?> uploadPdf(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty", "success", false));
        }

        // Validate file type
        String contentType = file.getContentType();
        String originalName = file.getOriginalFilename();
        if (contentType == null || (!contentType.equals("application/pdf")
                && !contentType.equals("application/vnd.ms-powerpoint")
                && !contentType.equals("application/vnd.openxmlformats-officedocument.presentationml.presentation")
                && !contentType.startsWith("application/"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only PDF and presentation files are allowed", "success", false));
        }

        return handleUpload(file, PDF_UPLOAD_DIR, "fileUrl");
    }

    private ResponseEntity<?> handleUpload(MultipartFile file, String uploadDir, String urlKey) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty", "success", false));
        }

        try {
            // Create uploads directory if it doesn't exist
            File directory = new File(uploadDir);
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
            Path path = Paths.get(uploadDir + newFileName);

            // Copy file to target location
            Files.copy(file.getInputStream(), path);

            // Construct the access URL
            String fileUrl = "http://localhost:8080/" + uploadDir + newFileName;

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put(urlKey, fileUrl);
            response.put("fileName", originalFileName);
            response.put("uploadedFilePath", uploadDir + newFileName);

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to upload file: " + e.getMessage(), "success", false));
        }
    }
}
