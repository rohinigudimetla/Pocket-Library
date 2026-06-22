package com.pocketlibrary.server.repository;

import com.pocketlibrary.server.model.User;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

// This tells Spring to create one instance of this class and manage it.
// Without this line, Spring does not know this class exists, and nothing
// that needs a UserRepository will be able to get one.
@Repository
public class UserRepository {

    // This is the actual storage. Just a plain list living in memory.
    // When the server restarts, everything in this list disappears.
    private final List<User> users = new ArrayList<>();

    // This block runs once, automatically, the moment Spring creates this class.
    // It puts two starting users into the list so there is something to log in with.
    public UserRepository(){
        // First user: username "r@p", password "r", role READER.
        users.add(new User("r@p", "r", "READER"));
        // Second user: username "a@p", password "a", role ADMIN.
        users.add(new User("a@p", "a", "ADMIN"));
    }

    // Looks through the list for a user whose username matches the one given.
    // Returns the user wrapped in Optional, which means the result might be empty
    // if no user with that username exists.
    public Optional<User> findByUsername(String username){
        return users.stream()                              // turn the list into something we can search through one item at a time
                .filter(u -> u.getUsername().equals(username)) // keep only the user whose username matches exactly
                .findFirst();                                // grab the first (and only) match, or nothing if there isn't one
    }

}