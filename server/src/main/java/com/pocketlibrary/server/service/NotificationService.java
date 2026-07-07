package com.pocketlibrary.server.service;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NotificationService implements MessageListener {
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String body = message.toString();
        String[] parts = body.split(":");
        String username = parts[0];
        String bookTitle = parts[1];
        SseEmitter emitter = emitters.get(username);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().data("Your request for " + bookTitle + " was accepted."));
            } catch (Exception e) {
                emitters.remove(username);
            }
        }
    }

    public SseEmitter register(String username) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.put(username, emitter);
        emitter.onCompletion(() -> emitters.remove(username));
        emitter.onTimeout(() -> emitters.remove(username));
        return emitter;
    }

    public SseEmitter getEmitter(String username) {
        return emitters.get(username);
    }
}
