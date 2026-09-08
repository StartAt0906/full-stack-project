package com.ecommerce.project.util;

import com.ecommerce.project.model.User;
import com.ecommerce.project.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

@Component
public class AuthUtil {
    @Autowired
    UserRepository userRepository;

    public String loggedInEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(()-> new UsernameNotFoundException("User not found with name " + authentication.getName()));

        return user.getEmail();
    }
//public String loggedInEmail() {
//    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//    if (authentication == null || "anonymousUser".equals(authentication.getName())) {
//        return null;
//    }
//
//
//    if (authentication.getPrincipal() instanceof UserDetailsImpl userDetails) {
//        return userDetails.getEmail();
//    }
//
//
//    return userRepository.findByUsername(authentication.getName())
//            .map(User::getEmail)
//            .orElseThrow(() -> new UsernameNotFoundException("User not found with name: " + authentication.getName()));
//}


    public User loggedInUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(()-> new UsernameNotFoundException("User not found with name " + authentication.getName()));
        return user;
    }

    public Long loggedInUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with name " + authentication.getName()));

        return user.getUserId();
    }
}
