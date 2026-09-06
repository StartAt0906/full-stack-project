const initialState = {
    analytics: {},
    sellers: [],
    pagination: {},
}

export const adminReducer = (state = initialState, action) => {
    switch(action.type) {
        case "FETCH_ANALYTICS":
            return {
                ...state,
                analytics: action.payload,
            };
        case "GET_SELLERS":
            return {
                ...state,
                sellers: action.payload,
                pagination: {
                    ...state.pagination,
                    pageNumber: action.pageNumber,
                    pageSize: action.pageSize,
                    totalElements: action.totalElements,
                    totalPages: action.totalPages,
                    lastPage: action.lastPage,
                },
            };
        default:
            return state;
    }
}




                