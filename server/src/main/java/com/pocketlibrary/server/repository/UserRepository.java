package com.pocketlibrary.server.repository;

import com.pocketlibrary.server.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// This interface has no method bodies at all. Spring Data JPA reads
// the method names and generates the actual implementation at runtime,
// translating them into real SQL against the real database.
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Spring Data JPA parses this method name itself: "findBy" + "Username"
    // becomes "SELECT * FROM users WHERE username = ?" automatically.
    // No query is written by hand anywhere.
    Optional<User> findByUsername(String username);
}