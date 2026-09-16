package com.ecommerce.project.service;

import com.ecommerce.project.config.AppConstants;
import com.ecommerce.project.exceptions.APIException;
import com.ecommerce.project.exceptions.ResourceNotFoundException;
import com.ecommerce.project.model.*;
import com.ecommerce.project.payload.OrderDTO;
import com.ecommerce.project.payload.OrderItemDTO;
import com.ecommerce.project.payload.OrderResponse;
import com.ecommerce.project.repositories.*;
import com.ecommerce.project.util.AuthUtil;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {
    @Autowired
    CartRepository cartRepository;

    @Autowired
    AddressRepository addressRepository;

    @Autowired
    PaymentRepository paymentRepository;

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    OrderItemRepository orderItemRepository;

    @Autowired
    ProductRepository productRepository;

    @Autowired
    private CartService cartService;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    AuthUtil authUtil;

    @Autowired
    StripeIdempotencyService stripeIdempotencyService;


@Transactional
@Override
public OrderDTO placeOrder(String emailId, Long addressId, String paymentMethod, String pgName, String pgPaymentId, String pgStatus, String pgResponseMessage) {

    // 1. 获取用户购物车与校验
    Cart cart = cartRepository.findCartByEmail(emailId);
    if (cart == null) {
        throw new ResourceNotFoundException("Cart", "email", emailId);
    }

    Address address = addressRepository.findById(addressId)
            .orElseThrow(() -> new ResourceNotFoundException("Address", "addressId", addressId));

    // 2. 组装订单实体
    Order order = new Order();
    order.setEmail(emailId);
    order.setOrderDate(LocalDateTime.now());


    // A. 将购物车的总价安全转换为 BigDecimal
    BigDecimal totalAmount = cart.getTotalPrice();
    if (totalAmount == null) {
        totalAmount = BigDecimal.ZERO;
    }
    // B. 强制进行内存代码层面的四舍五入，完美收敛并锁死保留两位小数
    totalAmount = totalAmount.setScale(2, java.math.RoundingMode.HALF_UP);

    // C. 将清洗完美的零缺陷总额安全塞给订单
    order.setTotalAmount(totalAmount);
    order.setOrderStatus(AppConstants.ORDER_STATUS_ACCEPTED);
    order.setAddress(address);

    // 3. 处理并保存支付信息
    Payment payment = new Payment(paymentMethod, pgPaymentId, pgStatus, pgResponseMessage, pgName);
    payment.setOrder(order);
    payment = paymentRepository.save(payment);
    order.setPayment(payment);

    // 4. 持久化订单主体
    Order savedOrder = orderRepository.save(order);
        applyStripeWebhookConfirmationIfPresent(savedOrder, pgPaymentId);

    // 5. 将购物车项转换为订单明细
    List<CartItem> cartItems = cart.getCartItems();
    if(cartItems.isEmpty()){
        throw new APIException("Cart is empty");
    }

    List<OrderItem> orderItems = new ArrayList<>();
    for(CartItem cartItem : cartItems){
        OrderItem orderItem = new OrderItem();
        orderItem.setProduct(cartItem.getProduct());
        orderItem.setQuantity(cartItem.getQuantity());
        orderItem.setDiscount(cartItem.getDiscount());
        orderItem.setOrderedProductPrice(cartItem.getProductPrice());
        orderItem.setOrder(savedOrder);
        orderItems.add(orderItem);
    }

    orderItemRepository.saveAll(orderItems);


    // 6. 【核心重构】利用 MySQL 行级锁与状态限制防超卖，并进行批量事务控制
for (CartItem item : cart.getCartItems()) {
    int buyQuantity = item.getQuantity();
    Long productId = item.getProduct().getProductId();

    //核心原子扣减：利用数据库排他锁，扣减成功返回 1，失败返回 0
    int rowsAffected = productRepository.decreaseStockWithLock(productId, buyQuantity);

    if (rowsAffected == 0) {
        //抛出异常触发 @Transactional 全盘回滚，确保订单不创建、购物车不被清空
        throw new APIException("商品 [" + item.getProduct().getProductName() + "] 库存不足，抢购失败！");
    }

    // 清空购物车项
    cartService.deleteProductFromCart(cart.getCartId(), productId);
}

    // 7. 组装并返回 DTO 摘要
    OrderDTO orderDTO = modelMapper.map(savedOrder, OrderDTO.class);
    orderItems.forEach(item ->
            orderDTO.getOrderItems().add(
                    modelMapper.map(item, OrderItemDTO.class)));
    orderDTO.setAddressId(addressId);

    return orderDTO;
}

    @Override
    public OrderResponse getAllOrders(Integer pageNumber, Integer pageSize, String sortBy, String sortOrder) {
        Sort sortByAndOrder = sortOrder.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
       Pageable pageDetails = PageRequest.of(pageNumber, pageSize, sortByAndOrder);
       Page<Order> pageOrders = orderRepository.findAll(pageDetails);
       List<Order> orders = pageOrders.getContent();
       List<OrderDTO> orderDTOS = orders.stream()
               .map(order -> modelMapper.map(order, OrderDTO.class))
               .toList();
       OrderResponse orderResponse = new OrderResponse();
       orderResponse.setContent(orderDTOS);
       orderResponse.setPageNumber(pageOrders.getNumber());
       orderResponse.setPageSize(pageOrders.getSize());
       orderResponse.setTotalElements(pageOrders.getTotalElements());
       orderResponse.setTotalPages(pageOrders.getTotalPages());
       orderResponse.setLastPage(pageOrders.isLast());
       return orderResponse;
    }

    @Override
    public OrderDTO updateOrder(long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderId", orderId));
        order.setOrderStatus(status);
        orderRepository.save(order);
        return modelMapper.map(order, OrderDTO.class);
    }



    public OrderResponse getAllSellerOrders(Integer pageNumber, Integer pageSize, String sortBy, String sortOrder) {
        Sort sortByAndOrder = sortOrder.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageDetails = PageRequest.of(pageNumber, pageSize, sortByAndOrder);

        User seller = authUtil.loggedInUser();

        Page<Order> pageOrders = orderRepository.findAllBySellerId(seller.getUserId(), pageDetails);

        List<OrderDTO> orderDTOS = pageOrders.getContent().stream()
                .map(order -> modelMapper.map(order, OrderDTO.class))
                .toList();
        OrderResponse orderResponse = new OrderResponse();
        orderResponse.setContent(orderDTOS);
        orderResponse.setPageNumber(pageOrders.getNumber());
        orderResponse.setPageSize(pageOrders.getSize());
        orderResponse.setTotalElements(pageOrders.getTotalElements());
        orderResponse.setTotalPages(pageOrders.getTotalPages());
        orderResponse.setLastPage(pageOrders.isLast());
        return orderResponse;
    }

    @Override
    @Transactional
    public void confirmStripePayment(String paymentIntentId) {
        if (paymentIntentId == null || paymentIntentId.isBlank()) {
            return;
        }
        try {
            stripeIdempotencyService.recordSucceededPaymentIntent(paymentIntentId);
        } catch (DataIntegrityViolationException ignored) {
            // unique payment_intent_id: another webhook already recorded success
        }
        orderRepository.findByPayment_PgPaymentId(paymentIntentId)
                .ifPresent(this::markOrderPaid);
    }

    @Override
    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId).orElse(null);
    }

    private void applyStripeWebhookConfirmationIfPresent(Order order, String pgPaymentId) {
        if (pgPaymentId == null || pgPaymentId.isBlank()) {
            return;
        }
        if (stripeIdempotencyService.isPaymentIntentAlreadySucceeded(pgPaymentId)) {
            markOrderPaid(order);
        }
    }

    private void markOrderPaid(Order order) {
        if (AppConstants.ORDER_STATUS_PAID.equals(order.getOrderStatus())) {
            return;
        }
        order.setOrderStatus(AppConstants.ORDER_STATUS_PAID);
        Payment payment = order.getPayment();
        if (payment != null) {
            payment.setPgStatus(AppConstants.STRIPE_PAYMENT_SUCCEEDED);
            payment.setPgResponseMessage("Confirmed by Stripe webhook");
            paymentRepository.save(payment);
        }
        orderRepository.save(order);
    }
}
