package com.ecommerce.project.service;

import com.ecommerce.project.config.AppConstants;
import com.ecommerce.project.model.Order;
import com.ecommerce.project.model.OrderItem;
import com.ecommerce.project.repositories.OrderRepository;
import com.ecommerce.project.repositories.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

    @Component
    @EnableScheduling
    public class OrderTimeoutScheduler {

        private static final Logger log = LoggerFactory.getLogger(OrderTimeoutScheduler.class);

        @Autowired
        private OrderRepository orderRepository;

        @Autowired
        private ProductRepository productRepository;

        /**
         * 每隔 1 分钟执行一次扫描
         */
        @Scheduled(cron = "0 */1 * * * ?")
        @Transactional // 🌟 保证单个超时订单的取消与库存回滚处于同一个事务中
        public void cancelTimeoutOrders() {
            log.info("【定时任务】开始扫描超时未支付订单...");

            // 1. 计算出 30 分钟前的时间节点
            // 比如现在是 20:30，那么 threshold 就是 20:00。所有在 20:00 之前创建且未支付的订单都算超时！
            LocalDateTime threshold = LocalDateTime.now().minusMinutes(30);

            // 2. 🔍 去数据库找出状态为未支付（ACCEPTED）的订单
            List<Order> unpaidOrders = orderRepository.findByOrderStatus(AppConstants.ORDER_STATUS_ACCEPTED);

            if (unpaidOrders == null || unpaidOrders.isEmpty()) {
                return;
            }

            for (Order order : unpaidOrders) {
                try {
                    // 3. ⏳ 精准时间判定：如果订单创建时间在 30 分钟前的节点之前，说明已经超时！
                    if (order.getOrderDate().isBefore(threshold)) {
                        log.info("👉 发现超时未支付订单，ID: {}, 创建时间: {}, 开始执行自动关单与库存回滚...",
                                order.getId(), order.getOrderDate());

                        // A. 变更为已取消状态
                        order.setOrderStatus("CANCELLED");
                        orderRepository.save(order);

                        // B. 🌟 级联回滚库存（利用一对多级联关系）
                        List<OrderItem> orderItems = order.getOrderItems();
                        if (orderItems != null) {
                            for (OrderItem item : orderItems) {
                                Long productId = item.getProduct().getProductId();
                                Integer quantity = item.getQuantity();

                                // 调用 ProductRepository 中的数据库原子加库存 SQL
                                productRepository.increaseStock(productId, quantity);
                            }
                        }
                        log.info("✅ 订单 ID: {} 超时库存已安全回滚至 MySQL。", order.getId());
                    }
                } catch (Exception e) {
                    log.error("❌ 处理超时订单 {} 时发生异常: ", order.getId(), e);
                }
            }
        }
    }
