package com.pocketlibrary.server.repository;

import com.pocketlibrary.server.model.User;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class UserRepository {

    private final List<User> users = new ArrayList<>();

    public UserRepository(){
        users.add(new User("r@p", "r", "READER"));
        users.add(new User("a@p", "a", "ADMIN"));
    }

    public Optional<User> findByUsername(String username){
        return users.stream().filter(u->u.getUsername().equals(username)).findFirst();
    }


}
