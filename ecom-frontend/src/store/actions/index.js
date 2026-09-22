import { data } from "react-router-dom";
import api from "../../api/api";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { useDashboardCategoryFilter } from "../../hooks/useCategoryFilter";

export const fetchProducts = (queryString) => async (dispatch) => {
    try {
        dispatch({ type: "IS_FETCHING" });
        const { data } = await api.get(`/public/products?&${queryString}`);
        dispatch({
            type: "FETCH_PRODUCTS",
            payload: data.content,
            pageNumber: data.pageSize,
            pageSize: data.pageSize,
            totalElements: data.totalElements,
            totalPages: data.totalPages,
            lastPage: data.lastPage,
        });
        dispatch({ type: "IS_SUCCESS" });
    } catch (error) {
        console.log(error);
        dispatch({
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "Failed to fetch products",
        });
    }
};

export const fetchCategories = () => async (dispatch) => {
    try {
        dispatch({ type: "CATEGORY_LOADER" });
        const { data } = await api.get(`/public/categories`);
        dispatch({
            type: "FETCH_CATEGORIES",
            payload: data.content,
            pageNumber: data.pageNumber,
            pageSize: data.pageSize,
            totalElements: data.totalElements,
            totalPages: data.totalPages,
            lastPage: data.lastPage,
        });
        dispatch({ type: "IS_ERROR" });
    } catch (error) {
        console.log(error);
        dispatch({
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "Failed to fetch categories",
        });
    }
};


export const addToCart = (data, qty = 1, toast) => 
    (dispatch, getState) => {

      const productsState = getState().products;
        const products = productsState ? productsState.products : [];
        
        // 在大列表中检索商品
        const getProduct = products && Array.isArray(products) 
            ? products.find((item) => item.productId === data.productId)
            : null;

        // 🚀 核心自愈逻辑：
        // 如果 getProduct 存在，说明走的是列表页，用大列表的库存校验；
        // 如果 getProduct 是 undefined（说明是从AI悬浮球空降进来的），直接用我们从详情页打包传过来的真实库存 data.quantity 进行校验！
        const realStock = getProduct ? getProduct.quantity : (data.quantity || 0);

        // 1. 前端初步校验库存（使用完美缝合后的 realStock，100% 绝不爆红！）
        const isQuantityExist = realStock >= qty;


        if (isQuantityExist) {
            const url = `/carts/products/${data.productId}/quantity/${qty}`;
            api.post(url)
                .then((response) => {
                    // 2. 后端成功写入 MySQL 数据库后，前端再同步更新 Redux 和本地缓存
                    dispatch({ type: "ADD_CART", payload: { ...data, quantity: qty } });
                    toast.success(`${data?.productName} 成功加入购物车！`);
                    localStorage.setItem("cartItems", JSON.stringify(getState().carts.cart));
                    
                    console.log("后端返回的最全新购物车数据：", response.data);
                })
                .catch((error) => {
                    // 3. 拦截后端抛出的自定义错误信息
                    const errorMsg = error.response?.data?.message || "加入购物车失败，请重试";
                    toast.error(errorMsg);
                });

        } else {
            toast.error("商品库存不足 (Out of stock)");
        }   
};


export const removeFromCart = (data, toast) => (dispatch, getState) => {
    // 假设你的 api 配置了基础路径，这里调用你在 Controller 新加的 DELETE 接口
    // 如果你的后端不需要显式传 cartId，请把接口调整为 `/carts/products/${data.productId}`
    const url = `/carts/products/${data.productId}`; 
    
    api.delete(url)
        .then((response) => {
            // 数据库删除成功后，再清理前端内存和本地缓存
            dispatch({ type: "REMOVE_CART", payload: data });
            toast.success(`${data.productName} 成功从购物车移除`);
            localStorage.setItem("cartItems", JSON.stringify(getState().carts.cart));
        })
        .catch((error) => {
            const errorMsg = error.response?.data?.message || "删除商品失败，请重试";
            toast.error(errorMsg);
        });
};

// 2. 🔥 彻底修复【数量增加】：点击 + 号时，同步通知后端数据库
export const increseCartQuantity = 
    (data, toast, currentQuantity, setCurrentQuantity) =>
    (dispatch, getState) => {
        const { products } = getState().products;
        const getProduct = products.find((item) => item.productId === data.productId);
        const isQuantityExist = getProduct?.quantity >= currentQuantity + 1;

        if (isQuantityExist) {
            const newQuantity = currentQuantity + 1;
            
            // 🚀 发送 PUT 请求，通知后端数据库数量 +1（传入增量 1）
            api.put(`/carts/products/${data.productId}/quantity/1`)
                .then(() => {
                    setCurrentQuantity(newQuantity);
                    dispatch({
                        type: "ADD_CART",
                        payload: { ...data, quantity: newQuantity },
                    });
                    localStorage.setItem("cartItems", JSON.stringify(getState().carts.cart));
                })
                .catch((error) => {
                    toast.error(error.response?.data?.message || "修改数量失败");
                });
        } else {
            toast.error("商品数量已达库存上限");
        }
    };

// 3. 🔥 彻底修复【数量减少】：点击 - 号时，同步通知后端数据库
export const decreaseCartQuantity = 
    (data, newQuantity, currentQuantity, setCurrentQuantity, toast) => 
    (dispatch, getState) => {
        
        // 🚀 发送 PUT 请求，通知后端数据库数量 -1（传入增量 -1）
        api.put(`/carts/products/${data.productId}/quantity/-1`)
            .then((response) => {
                // 如果减到 0，后端在你的重构下会触发删除并返回更新后的购物车 DTO
                setCurrentQuantity(newQuantity);
                
                if (newQuantity === 0) {
                    // 如果减到 0 了，前端同步触发 REMOVE_CART
                    dispatch({ type: "REMOVE_CART", payload: data });
                    toast.success(`${data.productName} 已从购物车移除`);
                } else {
                    dispatch({
                        type: "ADD_CART",
                        payload: { ...data, quantity: newQuantity },
                    });
                }
                localStorage.setItem("cartItems", JSON.stringify(getState().carts.cart));
                console.log("数量扣减后，最新购物车数据：", response.data);
            })
            .catch((error) => {
                toast.error(error.response?.data?.message || "扣减数量失败");
            });
    };
export const authenticateSignInUser 
    = (sendData, toast, reset, navigate, setLoader) => async (dispatch) => {
        try {
            setLoader(true);
            const { data } = await api.post("/auth/signin", sendData);
            dispatch({ type: "LOGIN_USER", payload: data});
            localStorage.setItem("auth", JSON.stringify(data));
            reset();
            toast.success("Login Success");
            navigate("/");
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.message || "Internal Server Error");
        } finally {
            setLoader(false);
        }
};

export const registerNewUser 
    = (sendData, toast, reset, navigate, setLoader) => async () => {
        try {
            setLoader(true);
            const { data } = await api.post("/auth/signup", sendData);
            reset();
            toast.success(data?.message || "User Registered Successfully");
            navigate("/login");
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.message || error?.response?.data?.password || "Internal Server Error");
        } finally {
            setLoader(false);
        }
};

export const logOutUser = (navigate) => (dispatch) => {
    dispatch({ type:"LOG_OUT"});
    localStorage.removeItem("auth");
    navigate("/login");
};

export const addUpdateUserAddress = 
    (sendData, toast, addressId, setOpenAddressModal) => async (dispatch, getState) => {    
    //const { user } = getState().auth;
    dispatch({ type:"BUTTON_LOADER"});
    try {   
            if(addressId) {
                const { data } = await api.put(`/addresses/${addressId}`, sendData);
            } else {
                
                const { data } = await api.post("/address", sendData);
            }   
            dispatch(getUserAddresses());
            toast.success("Address saved Successfully");
            dispatch({ type:"IS_SUCCESS"});
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.message || "Internal Server Error");
            dispatch({type:"IS_ERROR", payload:null});
        } finally {
            setOpenAddressModal(false);
        }
};

export const getUserAddresses = () => async (dispatch, getState) => {
    try {
        dispatch({ type: "IS_FETCHING" });
        const { data } = await api.get(`/addresses`);
        dispatch({type: "USER_ADDRESS", payload: data});
        dispatch({ type: "IS_SUCCESS" });
    } catch (error) {
        console.log(error);
        dispatch({
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "Failed to fetch user's addresses",
        });
    }
};

export const selectUserCheckoutAddress = (address) =>{
    console.log(address);
    localStorage.setItem("CHECKOUT_ADDRESS", JSON.stringify(address));
    return {
        type: "SELECT_CHECKOUT_ADDRESS",
        payload: address,
    }
};

export const deleteUserAddress = 
    (toast, addressId, setOpenDeleteModal) => async (dispatch, getState) => {
        try {
            dispatch({ type: "BUTTON_LOADER"});
            await api.delete(`/addresses/${addressId}`);
            dispatch(getUserAddresses());
            dispatch(clearCheckoutAddress());
            toast.success("Address deleted successfully");
            dispatch({ type: "IS_SUCCESS "});
        } catch (error) {
             console.log(error);
             dispatch({
                type: "IS_ERROR",
                payload: error?.response?.data?.message || "Some Error Occurd",
                });
        } finally {
            setOpenDeleteModal(false);
        }
};

export const clearCheckoutAddress = () => {
        return {
            type: "REMOVE_CHECKOUT_ADDRESS",
        }
};

export const addPaymentMethod = (method) => {
        return {
            type: "ADD_PAYMENT_METHOD",
            payload: method,
        };
};

export const createUserCart = (sendCartItems) => async (dispatch, getState) => {
    try {
        dispatch({ type: "IS_FETCHING" });
        await api.post('/cart/create', sendCartItems);
        await dispatch(getUserCart());
    } catch (error) {
        console.log(error);
        dispatch({
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "Failed to create cart items",
        });
    }
};


export const getUserCart = () => async (dispatch, getState) => {
    try {
        dispatch({ type: "IS_FETCHING" });
        const { data } = await api.get('/carts/users/cart');
        dispatch({
            type: "GET_USER_CART_PRODUCTS",
            payload: data.products,
            totalPrice: data.totalPrice,
            cartId: data.cartId,
        })
        localStorage.setItem("cartItems", JSON.stringify(getState().carts.cart));
        dispatch({ type: "IS_SUCCESS"});
    } catch (error) {
        console.log(error);
        dispatch({
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "Failed to fetch cart items",
        });
    }
};


export const analyticsAction = () => async (dispatch, getState) => {
    try {
       dispatch({ type: "IS_FETCHING"});
       const { data } = await api.get('/admin/app/analytics');
       dispatch({
        type: "FETCH_ANALYTICS",
        payload: data,
       })
       dispatch({ type: "IS_SUCCESS"});
    } catch (error) {
        dispatch({
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "Failed to fetch analytics data",
        });
    }
}

export const getOrdersForDashboard = (queryString, isAdmin) => async (dispatch) => {
    try {
        dispatch({ type: "IS_FETCHING" });
        const endpoint = isAdmin ? "/admin/orders" : "/seller/orders";
        const { data } = await api.get(`${endpoint}?&${queryString}`);
       
        dispatch({
            type: "GET_ADMIN_ORDERS",
            payload: data.content,
            pageNumber: data.pageSize,
            pageSize: data.pageSize,
            totalElements: data.totalElements,
            totalPages: data.totalPages,
            lastPage: data.lastPage,
        });
        dispatch({ type: "IS_SUCCESS" });
    } catch (error) {
        console.log(error);
        dispatch({
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "Failed to fetch proorders data",
        });
    }
};

export const updateOrderStatusFromDashboard = 
(orderId, orderStatus, toast, setLoader, isAdmin) => async (dispatch, getState) => {
    try {
        setLoader(true);
        const endpoint = isAdmin ? "/admin/orders/" : "/seller/orders/";
        const { data } = await api.put(`${endpoint}${orderId}/status`, {status: orderStatus});
        toast.success(data.message || "Order Updated successfully");
        await dispatch(getOrdersForDashboard());
    } catch (error) {
        console.log(error);
        toast.error(error?.response?.data?.message || "Internal Server Error");
    } finally {
        setLoader(false);
    }
};

export const addNewProductFromDashboard = 
    (sendData, toast, reset, setLoader, setOpen, isAdmin) => async (dispatch) => {
        try {
            setLoader(true);
            const endpoint = isAdmin ? "/admin/categories/" : "/seller/categories/";
            await api.post(`${endpoint}${sendData.categoryId}/product`, sendData);
            toast.success("Product created successfully");
            reset();
            setLoader(false);
            setOpen(false);
            await dispatch(dashboardProductsAction());
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.description || "Product creation failed");
        } finally {
            setLoader(false);
        }
};

export const dashboardProductsAction = (queryString, isAdmin) => async (dispatch) => {
    try {
        dispatch({ type: "IS_FETCHING" });
        const endpoint = isAdmin ? "/admin/products" : "/seller/products";
        const { data } = await api.get(`${endpoint}?&${queryString}`);
        dispatch({
            type: "FETCH_PRODUCTS",
            payload: data.content,
            pageNumber: data.pageNumber,
            pageSize: data.pageSize,
            totalElements: data.totalElements,
            totalPages: data.totalPages,
            lastPage: data.lastPage,
        });
        dispatch({ type: "IS_SUCCESS" });
    } catch (error) {
        console.log(error);
        dispatch({
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "Failed to fetch products",
        });
    }
};

export const updateProductFromDashboard = 
    (sendData, toast, reset, setLoader, setOpen, isAdmin) => async (dispatch) => {
        try {
            setLoader(true);
            const endpoint = isAdmin ? "/admin/products/" : "/seller/products/";
            await api.put(`${endpoint}${sendData.id}`, sendData);
            toast.success("Product update successful");
            reset();
            setLoader(false);
            setOpen(false);
            await dispatch(dashboardProductsAction());
        } catch (error) {
            toast.error(error?.response?.data?.description || "Product Update False");
        }
};

export const deleteProduct = 
    (setLoader, productId, toast, setOpenDeleteModal, isAdmin) => async (dispatch) => {
        try {
            setLoader(true);
            const endpoint = isAdmin ? "/admin/products/" : "/seller/products/";
            await api.delete(`${endpoint}${productId}`);
            toast.success("Product deleted successfully");
            setLoader(false);
            setOpenDeleteModal(false);
            await dispatch(dashboardProductsAction());
        } catch (error) {
             toast.error(error?.response?.data?.message || "Some Error Occured");
        } finally {
            setLoader(false);
            setOpenDeleteModal(false);
        }
};

export const updateProductImageFromDashboard = 
    (formData, productId, toast, setLoader, setOpen, isAdmin) => async (dispatch) => {
        try {
            setLoader(true);
            const endpoint = isAdmin ? "/admin/products/" : "/seller/products/";
            await api.put(`${endpoint}${productId}/image`, formData, );
            toast.success("Image upload successful");
            setLoader(false);
            setOpen(false);
            await dispatch(dashboardProductsAction());
        } catch (error) {
            toast.error(error?.response?.data?.description || "Product Image Upload False");
        }
    };

    export const dashboardCategoriesAction = (queryString) => async (dispatch) => {
        //console.log(queryString);
    try {
        dispatch({ type: "IS_FETCHING" });
        const { data } = await api.get(`/public/categories?${queryString}`);
        //console.log(queryString);
        //console.log(data);
        dispatch({
            type: "FETCH_CATEGORIES",
            payload: data.content,
            pageNumber: data.pageNumber,
            pageSize: data.pageSize,
            totalElements: data.totalElements,
            totalPages: data.totalPages,
            lastPage: data.lastPage,
        });
        dispatch({ type: "IS_SUCCESS" });
    } catch (error) {
        console.log(error);
        dispatch({
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "Failed to fetch categories",
        });
    }
};

export const deleteCategory = 
    (setLoader, categoryId, toast, setOpenDeleteModal, queryString) => async (dispatch) => {
        try {
            console.log(queryString);
            setLoader(true);
            await api.delete(`/admin/categories/${categoryId}`);
            toast.success("Category deleted successfully");
            setLoader(false);
            setOpenDeleteModal(false);
            await dispatch(dashboardCategoriesAction(queryString));
           
        } catch (error) {
             toast.error(error?.response?.data?.message || "Some Error Occured");
        } finally {
            setLoader(false);
            setOpenDeleteModal(false);
        }
};

export const addNewCategoryFromDashboard = 
    (sendData, toast, reset, setLoader, setOpen) => async (dispatch) => {
        try {
            setLoader(true);
            await api.post(`/public/categories`, sendData);
            toast.success("Category created successfully");
            reset();
            setLoader(false);
            setOpen(false);
            await dispatch(dashboardCategoriesAction());
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.description || "Category creation failed");
        } finally {
            setLoader(false);
        }
};

export const updateCategoryFromDashboard = 
    (sendData, toast, reset, setLoader, setOpen) => async (dispatch) => {
        try {
            setLoader(true);
            await api.put(`/public/categories/${sendData.id}`, sendData);
            toast.success("Category update successful");
            reset();
            setLoader(false);
            setOpen(false);
            await dispatch(dashboardCategoriesAction());
        } catch (error) {
            toast.error(error?.response?.data?.description || "Category Update False");
        }
};

export const fetchAllSellers = (queryString) => async (dispatch) => {
    try {
        dispatch({ type: "IS_FETCHING" });
        const { data } = await api.get(`/auth/sellers?${queryString}`); 
        dispatch(
            {   type: "GET_SELLERS",
                payload: data.content,
                pageNumber: data.pageNumber,
                pageSize: data.pageSize,
                totalElements: data.totalElements,
                totalPages: data.totalPages,
                lastPage: data.lastPage,
            });
        dispatch({ type: "IS_SUCCESS" });
    } catch (error) {
        dispatch({
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "Failed to fetch sellers",
        });
    }
};

export const addNewSeller 
    = (sendData, toast, reset, setLoader, setOpen) => async (dispatch) => {
        try {
            setLoader(true);
            const { data } = await api.post("/auth/signup", sendData);
            reset();
            toast.success(data?.message || "User Registered Successfully");
            setLoader(false);
            setOpen(false);
            dispatch(fetchAllSellers());
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.message || error?.response?.data?.password || "Internal Server Error");
        } finally {
            setLoader(false);
        }
};

export const createStripePaymentSecret 
    = (totalPrice) => async (dispatch, getState) => {
        try {
            dispatch({ type: "IS_FETCHING"});
            const { data } = await api.post("/order/stripe-client-secret", {
                "amount":Number(totalPrice) * 100,
                "currency": "usd"
            });
            console.log(totalPrice);
            dispatch({ type: "CLIENT_SECRET", payload: data});
            //localStorage.setItem("client-secret", JSON.stringify(data));
            dispatch({ type: "IS_SUCCESS" });
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.message || "Failed to create client secret");
        }
};

export const stripePaymentConfirmation
    = (sendData, setErrorMessage, setLoading, toast) => async (dispatch, getState) => {
        try {
            const  response  = await api.post("order/users/payments/online", sendData);
            console.log(response);
            if (response.data) {
                console.log("IN IF");
                localStorage.removeItem("CHECKOUT_ADDRESS");
                localStorage.removeItem("cartItem");
                localStorage.removeItem("client-secret");
                dispatch({ type: "REMOVE_CLIET_SECRET_ADDRESS"});
                dispatch({ type: "CLEAR_CART"});
                toast.success("Order Accepted");
            } else {
                setErrorMessage("Payment Failed, please try again.");
            }
        } catch (error) {
            setErrorMessage("Payment Failed, please try again.");
        }
    };




export const getProductDetailAction = 
    (setLoader, productId, toast) => async (dispatch) => {
        try {
            setLoader(true);
            
            const response = await api.get(`/public/products/${productId}`);
            
            dispatch({
                type: "GET_PRODUCT_DETAIL_SUCCESS",
                payload: response.data
            });
            
        } catch (error) {
            console.error("向后端拉取商品详情失败Action报错:", error);
            toast.error(error?.response?.data?.message || "拉取商品数据失败，商城开小差了");
        } finally {
            setLoader(false);
        }
};





export default fetchAllSellers;
   