package com.delivery.backend.service;

import com.delivery.backend.dto.AuthResponse;
import com.delivery.backend.dto.LoginRequest;
import com.delivery.backend.dto.RegisterRequest;
import com.delivery.backend.exception.BadRequestException;
import com.delivery.backend.model.User;
import com.delivery.backend.repository.UserRepository;
import com.delivery.backend.security.JwtService;
import com.delivery.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Já existe um usuário cadastrado com este e-mail");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        userRepository.save(user);

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (BadCredentialsException ex) {
            throw new BadRequestException("E-mail ou senha inválidos");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("E-mail ou senha inválidos"));

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }
}
