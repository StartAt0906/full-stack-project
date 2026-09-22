package com.ecommerce.project.service;

import com.ecommerce.project.exceptions.APIException;
import com.ecommerce.project.exceptions.ResourceNotFoundException;
import com.ecommerce.project.model.Cart;
import com.ecommerce.project.model.CartItem;
import com.ecommerce.project.model.Product;
import com.ecommerce.project.payload.CartDTO;
import com.ecommerce.project.payload.CartItemDTO;
import com.ecommerce.project.payload.ProductDTO;
import com.ecommerce.project.repositories.CartItemRepository;
import com.ecommerce.project.repositories.CartRepository;
import com.ecommerce.project.repositories.ProductRepository;
import com.ecommerce.project.util.AuthUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

@Service
public class CartServiceImpl implements CartService {
    @Autowired
    CartRepository cartRepository;

    @Autowired
    ProductRepository productRepository;

    @Autowired
    CartItemRepository cartItemRepository;

    @Autowired
    ModelMapper modelMapper;

    @Autowired
    AuthUtil authUtil;

    @PersistenceContext
    private EntityManager entityManager;


    @Override
    @Transactional
    public CartDTO addProductToCart(Long productId, Integer quantity) {
        // 1. 获取或创建购物车
        Cart cart = createCart();

        // 2. 检索商品详情
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", productId));

        // 3. 业务校验（库存及重复性校验）
        CartItem cartItem = cartItemRepository.findCartItemByProductIdAndCartId(
                cart.getCartId(),
                productId
        );

        if(cartItem != null) {
            throw new APIException("Product " + product.getProductName() + " already exists");
        }

        if(product.getQuantity() == 0) {
            throw new APIException("Product " + product.getProductName() + " is not available");
        }

        if(product.getQuantity() < quantity) {
            throw new APIException("Please make an order of the " + product.getProductName() + " less than or equal to the quantity " + product.getQuantity() + ".");
        }

        // 4. 创建并填充购物车明细项（CartItem已支持BigDecimal）
        CartItem newCartItem = new CartItem();
        newCartItem.setProduct(product);
        newCartItem.setCart(cart);
        newCartItem.setQuantity(quantity);
        newCartItem.setDiscount(product.getDiscount());
        newCartItem.setProductPrice(product.getSpecialPrice());

        // 保存购物车明细
        cartItemRepository.save(newCartItem);

        // A. 安全获取购物车当前总价（防止首笔订单为 null 的空指针保护）
        BigDecimal currentCartTotal = cart.getTotalPrice() != null ? cart.getTotalPrice() : BigDecimal.ZERO;

        // B. 将新增购买的数量（int）安全转换为 BigDecimal
        BigDecimal itemQuantity = BigDecimal.valueOf(quantity);

        // C. 计算这笔新增商品的总价 = 产品的折后价 × 购买数量
        BigDecimal addedProductTotal = product.getSpecialPrice().multiply(itemQuantity);

        // D. 累加计算购物车新总价 = 购物车原总价 + 这一件新增商品的总价
        BigDecimal newCartTotal = currentCartTotal.add(addedProductTotal);

        // E. 代码运行层面防呆：强制四舍五入保留 2 位小数，死死锁紧精度边界
        newCartTotal = newCartTotal.setScale(2, java.math.RoundingMode.HALF_UP);

        // F. 将清洗完美的全新总价塞回购物车主体
        cart.setTotalPrice(newCartTotal);

        // 5. 持久化更新后的购物车状态
        cartRepository.save(cart);

        // 6. 拼装并返回更新后的 DTO 数据
        CartDTO cartDTO = modelMapper.map(cart, CartDTO.class);
        List<CartItem> cartItems = cart.getCartItems();
        Stream<ProductDTO> productStream = cartItems.stream()
                .map(item -> {
                    ProductDTO map = modelMapper.map(item.getProduct(), ProductDTO.class);
                    map.setQuantity(item.getQuantity());
                    return map;
                });

        cartDTO.setProducts(productStream.toList());
        return cartDTO;
    }


    @Override
    public List<CartDTO> getAllCarts() {
        List<Cart> carts = cartRepository.findAll();
        if (carts.isEmpty()) {
            throw new APIException("No Cart Exists");
        }

        List<CartDTO> cartDTOs = carts.stream().map(cart -> {
                    CartDTO cartDTO = modelMapper.map(cart, CartDTO.class);
                    List<ProductDTO> products = cart.getCartItems().stream().map(cartItem -> {
                        ProductDTO productDTO = modelMapper.map(cartItem.getProduct(), ProductDTO.class);
                        productDTO.setQuantity(cartItem.getQuantity());
                        return productDTO;
                    }).toList();
                    cartDTO.setProducts(products);
                    return cartDTO;
                }).toList();
        return cartDTOs;
    }

    @Override
    public CartDTO getCart(String emailId, Long cartId) {
        Cart cart = cartRepository.findCartByEmailAndCartId(emailId, cartId);
        if(cart == null) {
            throw new ResourceNotFoundException("Cart", "cartId", cartId);
        }
        CartDTO cartDTO = modelMapper.map(cart, CartDTO.class);
        cart.getCartItems().forEach(c -> c.getProduct().setQuantity(c.getQuantity()));
        List<ProductDTO> products = cart.getCartItems().stream()
                .map(p -> modelMapper.map(p.getProduct(), ProductDTO.class))
                .toList();
        cartDTO.setProducts(products);
        return cartDTO;
    }


    @Transactional
    @Override
    public CartDTO updateProductQuantityInCart(Long productId, Integer quantity) {
        String emailId = authUtil.loggedInEmail();
        Cart userCart = cartRepository.findCartByEmail(emailId);
        Long cartId = userCart.getCartId();
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "cartId", cartId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", productId));

        if(product.getQuantity() == 0) {
            throw new APIException("Product " + product.getProductName() + " is not available");
        }
        if(product.getQuantity() < quantity) {
            throw new APIException("Please make an order of the " + product.getProductName() + " less than or equal to the quantity " + product.getQuantity() + ".");
        }

        CartItem cartItem = cartItemRepository.findCartItemByProductIdAndCartId(cartId, productId);
        if(cartItem == null) {
            throw new APIException("Product " + product.getProductName() + " is not available");
        }

        int newQuantity = cartItem.getQuantity() + quantity;
        if(newQuantity < 0) {
            throw new APIException("The result quantity cannot be negative!");
        }

        // 🔥【核心重构点 1】：如果数量减到 0
        if(newQuantity == 0) {
            // 1. 调用删除方法，该方法会自动扣减总价、删除明细并 save(cart)
            deleteProductFromCart(cartId, productId);
            entityManager.clear();
            Cart updatedCart = cartRepository.findById(cartId)
                    .orElseThrow(() -> new ResourceNotFoundException("Cart", "cartId", cartId));

            // 3. 构建并返回
            CartDTO cartDTO = modelMapper.map(updatedCart, CartDTO.class);
            // 如果整个购物车都空了，直接给空列表；如果还有其他商品，转为 DTO 列表
            List<ProductDTO> products = updatedCart.getCartItems().stream()
                    .map(item -> {
                        ProductDTO prd = modelMapper.map(item.getProduct(), ProductDTO.class);
                        prd.setQuantity(item.getQuantity());
                        return prd;
                    }).toList();

            cartDTO.setProducts(products);
            return cartDTO;
        }

        cartItem.setProductPrice(product.getSpecialPrice());
        cartItem.setQuantity(newQuantity);
        cartItem.setDiscount(product.getDiscount());

        BigDecimal currentCartTotal = cart.getTotalPrice() != null ? cart.getTotalPrice() : BigDecimal.ZERO;
        BigDecimal quantityDelta = BigDecimal.valueOf(quantity);
        BigDecimal priceChange = cartItem.getProductPrice().multiply(quantityDelta);
        BigDecimal newCartTotal = currentCartTotal.add(priceChange);
        newCartTotal = newCartTotal.setScale(2, java.math.RoundingMode.HALF_UP);

        cart.setTotalPrice(newCartTotal);

        // 强制同步保存
        cartRepository.saveAndFlush(cart);

        // 拼装并返回更新后的 DTO 数据
        CartDTO cartDTO = modelMapper.map(cart, CartDTO.class);
        List<CartItem> cartItems = cart.getCartItems();

        // 过滤掉那些可能在并发下数量异常的条目，只流化真实存在的商品
        Stream<ProductDTO> productStream = cartItems.stream()
                .filter(item -> item.getQuantity() > 0)
                .map(item -> {
                    ProductDTO prd = modelMapper.map(item.getProduct(), ProductDTO.class);
                    prd.setQuantity(item.getQuantity());
                    return prd;
                });

        cartDTO.setProducts(productStream.toList());
        return cartDTO;
    }

    @Transactional
@Override
public String deleteProductFromCart(Long cartId, Long productId) {
    Cart cart = cartRepository.findById(cartId)
            .orElseThrow(() -> new ResourceNotFoundException("Cart", "cartId", cartId));
    CartItem cartItemToDelete = cart.getCartItems().stream()
            .filter(item -> item.getProduct().getProductId().equals(productId))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", productId));

    BigDecimal currentCartTotal = cart.getTotalPrice() != null ? cart.getTotalPrice() : BigDecimal.ZERO;
    BigDecimal itemQuantity = BigDecimal.valueOf(cartItemToDelete.getQuantity());

    // 计算被删除商品的总价 = 单价 × 数量
    BigDecimal removedProductTotal = cartItemToDelete.getProductPrice().multiply(itemQuantity);

    // 购物车新总价 = 原总价 - 被删除商品总价
    BigDecimal newCartTotal = currentCartTotal.subtract(removedProductTotal);

        if (cart.getCartItems().size() <= 1 || newCartTotal.compareTo(BigDecimal.ZERO) <= 0) {
            newCartTotal = BigDecimal.ZERO;
        } else {
            newCartTotal = newCartTotal.setScale(2, java.math.RoundingMode.HALF_UP);
        }
    cart.setTotalPrice(newCartTotal);

    cart.removeCartItem(cartItemToDelete);
    cartItemToDelete.setCart(null);

        if (!entityManager.contains(cartItemToDelete)) {
            cartItemToDelete = entityManager.merge(cartItemToDelete);
        }
        entityManager.remove(cartItemToDelete);
        cartRepository.saveAndFlush(cart);
    return "Product " + cartItemToDelete.getProduct().getProductName() + " has been deleted";
}

    @Override
    @Transactional
    public void updateProductInCarts(Long cartId, Long productId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "cartId", cartId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", productId));
        CartItem cartItem = cartItemRepository.findCartItemByProductIdAndCartId(cartId, productId);
        if(cartItem == null) {
            throw new APIException("Product " + product.getProductName() + " is not available");
        }


        BigDecimal currentCartTotal = cart.getTotalPrice() != null ? cart.getTotalPrice() : BigDecimal.ZERO;
        BigDecimal itemQuantity = BigDecimal.valueOf(cartItem.getQuantity());

        // Step 1: 减去当前条目的旧小计 (旧单价 × 数量)
        BigDecimal oldItemTotal = cartItem.getProductPrice().multiply(itemQuantity);
        BigDecimal cartPriceWithoutItem = currentCartTotal.subtract(oldItemTotal);

        // Step 2: 更新条目为商品最新的折后特价
        cartItem.setProductPrice(product.getSpecialPrice());

        // Step 3: 加上该条目的新小计 (新单价 × 数量)
        BigDecimal newItemTotal = cartItem.getProductPrice().multiply(itemQuantity);
        BigDecimal newCartTotal = cartPriceWithoutItem.add(newItemTotal);

        // 强制收敛标度
        newCartTotal = newCartTotal.setScale(2, java.math.RoundingMode.HALF_UP);
        cart.setTotalPrice(newCartTotal);

        cartItemRepository.save(cartItem);
    }

    @Transactional
    @Override
    public String createOrUpdateWithItems(List<CartItemDTO> cartItems) {
        // Get user's email
        String emailId = authUtil.loggedInEmail();

        // Check if an existing cart is available or create a new one
        Cart existingCart = cartRepository.findCartByEmail(emailId);
        if (existingCart == null) {
            existingCart = new Cart();
            existingCart.setTotalPrice(BigDecimal.ZERO); // 🟢 初始化为精确的 BigDecimal.ZERO
            existingCart.setUser(authUtil.loggedInUser());
            existingCart = cartRepository.save(existingCart);
        } else {
            // Clear all current items in the existing cart
            cartItemRepository.deleteAllByCartId(existingCart.getCartId());
        }

        // 🟢 初始化总价累加器
        BigDecimal totalPrice = BigDecimal.ZERO;

        // Process each item in the request to add to the cart
        for (CartItemDTO cartItemDTO : cartItems) {
            Long productId = cartItemDTO.getProductId();
            Integer quantity = cartItemDTO.getQuantity();

            // Find the product by ID
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "productId", productId));


            BigDecimal itemQuantity = BigDecimal.valueOf(quantity);
            BigDecimal itemTotal = product.getSpecialPrice().multiply(itemQuantity);
            totalPrice = totalPrice.add(itemTotal);

            // Create and save cart item
            CartItem cartItem = new CartItem();
            cartItem.setProduct(product);
            cartItem.setCart(existingCart);
            cartItem.setQuantity(quantity);
            cartItem.setProductPrice(product.getSpecialPrice());
            cartItem.setDiscount(product.getDiscount());
            cartItemRepository.save(cartItem);
        }


        totalPrice = totalPrice.setScale(2, java.math.RoundingMode.HALF_UP);
        existingCart.setTotalPrice(totalPrice);

        cartRepository.save(existingCart);
        return "Cart created/updated with new items successfully.";
    }

    private Cart createCart() {
        Cart userCart = cartRepository.findCartByEmail(authUtil.loggedInEmail());
        if(userCart != null) {
            return userCart;
        }
        Cart cart = new Cart();
        cart.setTotalPrice(BigDecimal.ZERO); // 🟢 初始化为精确的 BigDecimal.ZERO
        cart.setUser(authUtil.loggedInUser());
        return cartRepository.save(cart);
    }

}
