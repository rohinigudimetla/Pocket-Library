package com.pocketlibrary.server.repository;

import com.pocketlibrary.server.model.Request;
import com.pocketlibrary.server.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {

    Page<Request> findByRequestedBy(User requestedBy, Pageable pageable);

    @Query("SELECT r FROM Request r JOIN FETCH r.requestedBy WHERE r.status = :status")
    Page<Request> findByStatusWithRequester(@Param("status") String status, Pageable pageable);
}
