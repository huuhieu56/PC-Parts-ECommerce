package com.computershop.service.interfaces;

import com.computershop.dto.request.LoginRequest;
import com.computershop.dto.request.ProfileUpdateRequest;
import com.computershop.dto.request.RegisterRequest;
import com.computershop.dto.request.UserRequest;
import com.computershop.dto.response.AuthResponse;
import com.computershop.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {

    UserResponse createUser(UserRequest request);

    UserResponse updateUser(Long id, UserRequest request);

    UserResponse getUserById(Long id);

    UserResponse getUserByUsername(String username);

    Page<UserResponse> getAllUsers(Pageable pageable, String search);


    List<UserResponse> getUsersByRole(String role);

    void deleteUser(Long id);


    UserResponse getCurrentUserProfile(String username);

    UserResponse updateCurrentUserProfile(String username, ProfileUpdateRequest request);

    UserResponse authenticate(String username, String password);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    AuthResponse login(LoginRequest request);

    AuthResponse register(RegisterRequest request);

    void changePassword(Long userId, String oldPassword, String newPassword);
}
