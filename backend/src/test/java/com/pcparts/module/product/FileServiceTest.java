package com.pcparts.module.product;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.module.product.service.FileService;
import io.minio.MinioClient;
import io.minio.RemoveObjectArgs;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @Mock
    private MinioClient minioClient;

    private FileService fileService;

    @BeforeEach
    void setUp() {
        fileService = new FileService(minioClient);
        ReflectionTestUtils.setField(fileService, "bucket", "pcparts");
        ReflectionTestUtils.setField(fileService, "publicUrl", "http://localhost:9000");
    }

    @Test
    @DisplayName("Delete file strict — removes MinIO object from public URL")
    void deleteFileOrThrow_removesObject() throws Exception {
        fileService.deleteFileOrThrow("http://localhost:9000/pcparts/avatars/avatar.webp");

        ArgumentCaptor<RemoveObjectArgs> argsCaptor = ArgumentCaptor.forClass(RemoveObjectArgs.class);
        verify(minioClient).removeObject(argsCaptor.capture());
        assertThat(argsCaptor.getValue().bucket()).isEqualTo("pcparts");
        assertThat(argsCaptor.getValue().object()).isEqualTo("avatars/avatar.webp");
    }

    @Test
    @DisplayName("Delete file strict — raises business exception when MinIO delete fails")
    void deleteFileOrThrow_raisesBusinessExceptionWhenDeleteFails() throws Exception {
        doThrow(new RuntimeException("MinIO unavailable"))
                .when(minioClient).removeObject(any(RemoveObjectArgs.class));

        assertThatThrownBy(() -> fileService.deleteFileOrThrow("http://localhost:9000/pcparts/avatars/avatar.webp"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("MinIO unavailable");
    }

    @Test
    @DisplayName("Delete file best-effort — keeps legacy behavior by swallowing cleanup failures")
    void deleteFile_swallowsCleanupFailure() throws Exception {
        doThrow(new RuntimeException("MinIO unavailable"))
                .when(minioClient).removeObject(any(RemoveObjectArgs.class));

        assertThatCode(() -> fileService.deleteFile("http://localhost:9000/pcparts/avatars/avatar.webp"))
                .doesNotThrowAnyException();
    }
}
