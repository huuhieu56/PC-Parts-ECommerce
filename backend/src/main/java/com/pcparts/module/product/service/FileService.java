package com.pcparts.module.product.service;

import com.pcparts.common.exception.BusinessException;
import io.minio.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.util.UUID;

/**
 * Service for file upload/delete via MinIO.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

    @Value("${minio.endpoint}")
    private String endpoint;

    /**
     * Initialize MinIO bucket with public read policy on startup.
     */
    @PostConstruct
    public void init() {
        try {
            ensureBucketExists();
            applyPublicReadPolicy();
            log.info("MinIO initialized successfully with public read access for bucket '{}'", bucket);
        } catch (Exception e) {
            log.error("Failed to initialize MinIO: {}", e.getMessage());
        }
    }

    /**
     * Uploads a file to MinIO and returns the public URL.
     *
     * @param file the file to upload
     * @param folder subfolder (e.g. "products", "brands")
     * @return public URL of the uploaded file
     */
    public String uploadFile(MultipartFile file, String folder) {
        try {
            ensureBucketExists();

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            String objectName = folder + "/" + UUID.randomUUID() + extension;

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            return endpoint + "/" + bucket + "/" + objectName;
        } catch (Exception e) {
            log.error("Failed to upload file: {}", e.getMessage());
            throw new BusinessException("Upload file thất bại: " + e.getMessage());
        }
    }

    /**
     * Deletes a file from MinIO.
     *
     * @param fileUrl the full URL of the file
     */
    public void deleteFile(String fileUrl) {
        try {
            String objectName = fileUrl.replace(endpoint + "/" + bucket + "/", "");
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            log.warn("Failed to delete file: {}", e.getMessage());
        }
    }

    /**
     * Ensures the bucket exists, creates it if not.
     */
    private void ensureBucketExists() throws Exception {
        boolean found = minioClient.bucketExists(
                BucketExistsArgs.builder().bucket(bucket).build()
        );
        if (!found) {
            minioClient.makeBucket(
                    MakeBucketArgs.builder().bucket(bucket).build()
            );
            log.info("MinIO bucket '{}' created", bucket);
        }
    }

    /**
     * Applies public read policy to the bucket.
     * Allows anonymous users to read (download) files, but not upload or delete.
     */
    private void applyPublicReadPolicy() throws Exception {
        String policy = String.format(
            "{\"Version\":\"2012-10-17\"," +
            "\"Statement\":[{" +
            "\"Effect\":\"Allow\"," +
            "\"Principal\":{\"AWS\":[\"*\"]}," +
            "\"Action\":[\"s3:GetObject\"]," +
            "\"Resource\":[\"arn:aws:s3:::%s/*\"]" +
            "}]}",
            bucket
        );

        minioClient.setBucketPolicy(
            SetBucketPolicyArgs.builder()
                .bucket(bucket)
                .config(policy)
                .build()
        );

        log.info("Applied public read policy to bucket '{}'", bucket);
    }
}
