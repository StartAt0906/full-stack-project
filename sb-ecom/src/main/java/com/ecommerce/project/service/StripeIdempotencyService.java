package com.ecommerce.project.service;

import com.ecommerce.project.config.AppConstants;
import com.ecommerce.project.model.StripePaymentConfirmation;
import com.ecommerce.project.model.StripeProcessedEvent;
import com.ecommerce.project.repositories.StripePaymentConfirmationRepository;
import com.ecommerce.project.repositories.StripeProcessedEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StripeIdempotencyService {

    @Autowired
    private StripeProcessedEventRepository stripeProcessedEventRepository;

    @Autowired
    private StripePaymentConfirmationRepository stripePaymentConfirmationRepository;

    public boolean alreadyProcessedEvent(String eventId) {
        return stripeProcessedEventRepository.existsByEventId(eventId);
    }

    public boolean isPaymentIntentAlreadySucceeded(String paymentIntentId) {
        return stripePaymentConfirmationRepository.existsByPaymentIntentIdAndStatus(
                paymentIntentId, AppConstants.STRIPE_PAYMENT_SUCCEEDED);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markEventProcessed(String eventId, String eventType) {
        if (stripeProcessedEventRepository.existsByEventId(eventId)) {
            return;
        }
        stripeProcessedEventRepository.saveAndFlush(new StripeProcessedEvent(eventId, eventType));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSucceededPaymentIntent(String paymentIntentId) {
        stripePaymentConfirmationRepository.findByPaymentIntentId(paymentIntentId)
                .ifPresentOrElse(existing -> {
                    if (!AppConstants.STRIPE_PAYMENT_SUCCEEDED.equals(existing.getStatus())) {
                        existing.setStatus(AppConstants.STRIPE_PAYMENT_SUCCEEDED);
                        existing.setConfirmedAt(java.time.Instant.now());
                        stripePaymentConfirmationRepository.saveAndFlush(existing);
                    }
                }, () -> stripePaymentConfirmationRepository.saveAndFlush(
                        new StripePaymentConfirmation(paymentIntentId, AppConstants.STRIPE_PAYMENT_SUCCEEDED)));
    }
}
