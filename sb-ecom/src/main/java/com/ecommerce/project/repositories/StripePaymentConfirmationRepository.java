package com.ecommerce.project.repositories;

import com.ecommerce.project.model.StripePaymentConfirmation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StripePaymentConfirmationRepository extends JpaRepository<StripePaymentConfirmation, Long> {
    Optional<StripePaymentConfirmation> findByPaymentIntentId(String paymentIntentId);

    boolean existsByPaymentIntentIdAndStatus(String paymentIntentId, String status);
}
