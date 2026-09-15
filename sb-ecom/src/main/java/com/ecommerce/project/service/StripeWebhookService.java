package com.ecommerce.project.service;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class StripeWebhookService {
    private static final Logger logger = LoggerFactory.getLogger(StripeWebhookService.class);

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @Autowired
    private StripeIdempotencyService stripeIdempotencyService;

    @Autowired
    private OrderService orderService;

    public Event constructEvent(String payload, String stripeSignature) throws SignatureVerificationException {
        return Webhook.constructEvent(payload, stripeSignature, webhookSecret);
    }

    public void handleEvent(Event event) {
        if (event == null || event.getId() == null) {
            return;
        }
        if (stripeIdempotencyService.alreadyProcessedEvent(event.getId())) {
            logger.info("Skipping already processed Stripe event {}", event.getId());
            return;
        }

        switch (event.getType()) {
            case "payment_intent.succeeded" -> handlePaymentIntentSucceeded(event);
            case "checkout.session.completed" -> handleCheckoutSessionCompleted(event);
            default -> logger.debug("Ignored Stripe event type {}", event.getType());
        }

        try {
            stripeIdempotencyService.markEventProcessed(event.getId(), event.getType());
        } catch (DataIntegrityViolationException duplicate) {
            logger.info("Stripe event {} already marked processed", event.getId());
        }
    }

    private void handlePaymentIntentSucceeded(Event event) {
        extractStripeObject(event)
                .filter(PaymentIntent.class::isInstance)
                .map(PaymentIntent.class::cast)
                .map(PaymentIntent::getId)
                .ifPresentOrElse(
                        this::confirmPaid,
                        () -> logger.warn("payment_intent.succeeded missing PaymentIntent for event {}", event.getId())
                );
    }

    private void handleCheckoutSessionCompleted(Event event) {
        extractStripeObject(event)
                .filter(Session.class::isInstance)
                .map(Session.class::cast)
                .map(Session::getPaymentIntent)
                .ifPresentOrElse(
                        this::confirmPaid,
                        () -> logger.warn("checkout.session.completed missing payment_intent for event {}", event.getId())
                );
    }

    private void confirmPaid(String paymentIntentId) {
        try {
            stripeIdempotencyService.recordSucceededPaymentIntent(paymentIntentId);
        } catch (DataIntegrityViolationException duplicate) {
            logger.info("Stripe payment intent {} already confirmed", paymentIntentId);
        }
        orderService.confirmStripePayment(paymentIntentId);
    }

    private Optional<StripeObject> extractStripeObject(Event event) {
        return event.getDataObjectDeserializer().getObject();
    }
}
