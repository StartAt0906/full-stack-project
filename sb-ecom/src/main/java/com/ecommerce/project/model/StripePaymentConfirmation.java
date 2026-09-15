package com.ecommerce.project.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(
        name = "stripe_payment_confirmations",
        uniqueConstraints = @UniqueConstraint(name = "uk_stripe_payment_intent_id", columnNames = "payment_intent_id")
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StripePaymentConfirmation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_intent_id", nullable = false, length = 255)
    private String paymentIntentId;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "confirmed_at", nullable = false)
    private Instant confirmedAt;

    public StripePaymentConfirmation(String paymentIntentId, String status) {
        this.paymentIntentId = paymentIntentId;
        this.status = status;
        this.confirmedAt = Instant.now();
    }
}
