package com.computershop.service.interfaces;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

public interface FileStorageService {
    String store(MultipartFile file) throws IOException;

    List<String> storeAll(MultipartFile[] files) throws IOException;

    Path getStorageLocation();
}
