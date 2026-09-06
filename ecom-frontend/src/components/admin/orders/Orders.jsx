import React from 'react'
import { FaShoppingCart } from 'react-icons/fa';
import { OrderTable } from './OrderTable';
import { useSelector } from 'react-redux';
import useOrderFilter from '../../../hooks/useOrderFilter';

export const Orders = () => {
    //const adminOrders = [ { "orderId": 1, "email": "user1@example.com", "orderItems": [ { "orderItemId": 1, "product": { "productId": 1, "productName": "Gaming Laptop GX", "description": "High-performence gaming laptop with a 4K display and powful GPU", "image": "dummy_600x400_000000_c5ef8d.png", "quantity": 29, "price": 1200.0, "discount": 20.0, "specialPrice": 960.0 }, "quantity": 1, "discount": 20.0, "orderedProductPrice": 960.0 } ], "orderDate": "2025-10-24", "payment": { "paymentId": 1, "paymentMethod": "CARD", "pgPaymentId": "pi_1FHEhK2eZvKYlo2CcK4UJNdW", "pgStatus": "succeeded", "pgResponseMessage": "Payment successful", "pgName": "Stripe " }, "totalAmount": 960.0, "orderStatus": "Order Accepted!", "addressId": 1 } ];
    //const pagination = {"pageNumber": 0, "pageSize": 50, "totalElements": 1, "totalPages": 1, "lastPage": true};
    
    const {adminOrder,  pagination} = useSelector((state) => state.order);
   
    useOrderFilter();

    
    const emptyOrder = !adminOrder || adminOrder?.length === 0;

  return (
    <div className='pb-6 pt-20'>
        {emptyOrder ? (
            <div className='flex flex-col items-center justify-center text-gray-600 py-10'>
                <FaShoppingCart size={50} className='mb-3' />
                <h2 className='text-2xl font-semibold'>No Orders Placed Yet</h2>
            </div>
        ) : (
           <OrderTable 
                       adminOrders={adminOrder} 
                        
                       pagination={pagination}/>
        )}
    </div>
  )
}
