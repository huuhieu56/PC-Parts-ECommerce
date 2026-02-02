package com.computershop.service.impl;

import com.computershop.service.interfaces.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private final Path storageLocation;
    private final String storageDir;

    public FileStorageServiceImpl(@Value("${app.file-storage.location:images}") String storageDir) throws IOException {
        this.storageDir = storageDir;
        this.storageLocation = Paths.get(storageDir).toAbsolutePath().normalize();
        if (!Files.exists(this.storageLocation)) {
            Files.createDirectories(this.storageLocation);
        }
    }

    @Override
    public String store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) return null;
        String original = StringUtils.cleanPath(file.getOriginalFilename());
        String ext = "";
        int i = original.lastIndexOf('.');
        if (i >= 0) ext = original.substring(i);
        String filename = UUID.randomUUID() + ext;
        Path target = storageLocation.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        return storageDir + "/" + filename;
    }

    @Override
    public List<String> storeAll(MultipartFile[] files) throws IOException {
        List<String> stored = new ArrayList<>();
        if (files == null) return stored;
        for (MultipartFile f : files) {
            String p = store(f);
            if (p != null) stored.add(p);
        }
        return stored;
    }

    @Override
    public Path getStorageLocation() {
        return storageLocation;
    }
}
