
const initialState = {
    products: [],
    pagination: {},
    currentProduct: null
};

export const productReducer = (state = initialState, action) => {
    switch(action.type) {
        case "FETCH_PRODUCTS":
            return {
                ...state,
                products: action.payload,
                pagination: {
                    //...state.pagination,
                    pageNumber: action.pageNumber,
                    pageSize: action.pageSize,
                    totalElements: action.totalElements,
                    totalPages: action.totalPages,
                    lastPage: action.lastPage,
                },
            };
        case "GET_PRODUCT_DETAIL_SUCCESS":
            return {
                ...state, // 💡 保护好大列表和分页缓存不被洗白
                currentProduct: action.payload // 🚀 把异步捞回来的跑鞋 DTO 数据稳稳装进格子里
            };
            
        default:
            return state;
    }
};

