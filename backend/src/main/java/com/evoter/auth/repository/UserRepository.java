package com.evoter.auth.repository;

import com.evoter.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // Returns all voters who have not yet been approved by an admin
    List<User> findByIsVerifiedFalse();
}
