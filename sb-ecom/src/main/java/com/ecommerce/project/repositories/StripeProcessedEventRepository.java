package com.ecommerce.project.repositories;

import com.ecommerce.project.model.StripeProcessedEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StripeProcessedEventRepository extends JpaRepository<StripeProcessedEvent, Long> {
    boolean existsByEventId(String eventId);
}
