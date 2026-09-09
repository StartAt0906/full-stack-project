package com.ecommerce.project.repositories;

import com.ecommerce.project.model.Category;
import com.ecommerce.project.model.Product;
import com.ecommerce.project.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    Page<Product> findByCategoryOrderByPriceAsc(Category category, Pageable pageDetails);


    Page<Product> findByProductNameLikeIgnoreCase(String keyword, Pageable pageDetails);

    Product findByProductName(String productName);

    Page<Product> findByUser(User user, Pageable pageDetails);

    @Modifying
    @Query("UPDATE Product p SET p.quantity = p.quantity - :buyQty WHERE p.productId = :productId AND p.quantity >= :buyQty")
    int decreaseStockWithLock(@Param("productId") Long productId, @Param("buyQty") Integer buyQty);
}
