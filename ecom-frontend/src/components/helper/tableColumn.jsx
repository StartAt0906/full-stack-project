import { FaEdit, FaEye, FaImage, FaTrashAlt } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

export const adminOrderTableColumn = (handleEdit) => 
[
  { 
    sortable: false,
    disableColumnMenu: true,
    field: "id",
    headerName: "orderId",
    minWidth: 180,
    headerAlign: "center",
    editable: false,
    headerClassName: "text-black font-semibold border",
    cellClassName: "text-slate-700 font-normal border",
    renderHeader: (params) => <span className='text-center'>Order Id</span>
   },
  { 
    disableColumnMenu: true,
    field: "email",
    headerName: "Email",
    align: "center",
    width: 250,
    headerAlign: "center",
    editable: false,
    sortable: false,
    headerClassName: "text-black font-semibold border text-center",
    cellClassName: "text-slate-700 font-normal border text-center",
    renderHeader: (params) => <span>Email</span>
   },
   { 
    sortable: false,
    disableColumnMenu: true,
    field: "date",
    headerName: "Order Date",
    minWidth: 200,
    headerAlign: "center",
    editable: false,
    headerClassName: "text-black font-semibold border text-center",
    cellClassName: "text-slate-700 font-normal border text-center",
    renderHeader: (params) => <span>Order Date</span>
   },
   { 
    disableColumnMenu: true,
    sortable: true,
    field: "totalAmount",
    headerName: "Total Amount",
    width: 200,
    align: "center",
    headerAlign: "center",
    editable: false,
    headerClassName: "text-black font-semibold text-center border",
    cellClassName: "text-slate-700 font-normal border text-center",
    renderHeader: (params) => <span>Total Amount</span>
   },
   { 
    disableColumnMenu: true,
    sortable: false,
    field: "status",
    headerName: "Status",
    width: 200,
    align: "center",
    headerAlign: "center",
    editable: false,
    headerClassName: "text-black font-semibold text-center border",
    cellClassName: "text-slate-700 font-normal border text-center",
    renderHeader: (params) => <span>Status</span>
   },
   { 
    disableColumnMenu: true,
    sortable: false,
    field: "action",
    headerName: "Action",
    width: 250,
    align:"center",
    resizable: false,
    headerAlign: "center",
    editable: false,
    headerClassName: "text-black font-semibold text-center ",
    cellClassName: "text-slate-700 font-normal ",
    renderHeader: (params) => <span>Action</span>,
    renderCell: (params) => {
        return (
            <div className='flex justify-center items-center space-x-2 h-full pt-2'>
                <button
                    onClick={() => {handleEdit(params.row)}}
                    className='flex items-center bg-blue-500 text-white px-4 h-9 rounded-md'>
                        <FaEdit className='mr-2'/>
                        Edit
                        
                </button>
            </div>
        );
    },
   },
];


export const adminProductTableColumn = (
    handleEdit,
    handleDelete,
    handleImageUpload,
    handleProductView,
) => [
  { 
    sortable: false,
    disableColumnMenu: true,
    field: "id",
    headerName: "ID",
    minWidth: 180,
    headerAlign: "center",
    editable: false,
    headerClassName: "text-black font-semibold border",
    cellClassName: "text-slate-700 font-normal border",
    renderHeader: (params) => <span className='text-center'>Product Id</span>
   },
  { 
    disableColumnMenu: true,
    field: "productName",
    headerName: "Product Name",
    align: "center",
    width: 250,
    headerAlign: "center",
    editable: false,
    sortable: false,
    headerClassName: "text-black font-semibold border text-center",
    cellClassName: "text-slate-700 font-normal border text-center",
    renderHeader: (params) => <span>Product Name</span>
   },
   { 
    sortable: false,
    disableColumnMenu: true,
    field: "price",
    headerName: "Price",
    minWidth: 200,
    headerAlign: "center",
    align: "center",
    editable: false,
    headerClassName: "text-black font-semibold border text-center",
    cellClassName: "text-slate-700 font-normal border text-center",
    renderHeader: (params) => <span>Price</span>
   },
   { 
    disableColumnMenu: true,
    sortable: true,
    field: "quantity",
    headerName: "Quantity",
    width: 200,
    align: "center",
    headerAlign: "center",
    editable: false,
    headerClassName: "text-black font-semibold text-center border",
    cellClassName: "text-slate-700 font-normal border text-center",
    renderHeader: (params) => <span>Quantity</span>
   },
   { 
    disableColumnMenu: true,
    sortable: false,
    field: "specialPrice",
    headerName: "Special Price",
    width: 200,
    align: "center",
    headerAlign: "center",
    editable: false,
    headerClassName: "text-black font-semibold text-center border",
    cellClassName: "text-slate-700 font-normal border text-center",
    renderHeader: (params) => <span>Special Price</span>
   },
   { 
    disableColumnMenu: true,
    sortable: false,
    field: "description",
    headerName: "Description",
    width: 200,
    align: "center",
    headerAlign: "center",
    editable: false,
    headerClassName: "text-black font-semibold text-center border",
    cellClassName: "text-slate-700 font-normal border text-center",
    renderHeader: (params) => <span>Description</span>
   },
    { 
    disableColumnMenu: true,
    sortable: false,
    field: "image",
    headerName: "Image",
    width: 200,
    align: "center",
    headerAlign: "center",
    editable: false,
    headerClassName: "text-black font-semibold text-center border",
    cellClassName: "text-slate-700 font-normal border text-center",
    renderHeader: (params) => <span>Image</span>
   },
   { 
    disableColumnMenu: true,
    sortable: false,
    field: "action",
    headerName: "Action",
    width: 400,
    align:"center",
    resizable: false,
    headerAlign: "center",
    editable: false,
    headerClassName: "text-black font-semibold text-center ",
    cellClassName: "text-slate-700 font-normal ",
    renderHeader: (params) => <span>Action</span>,
    renderCell: (params) => {
        return (
            <div className='flex justify-center items-center space-x-2 h-full pt-2'>
                <button
                onClick={() => handleImageUpload(params.row)}
                className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 h-9 rounded-md">
                <FaImage className="mr-2"/>
                Image
                </button>

                <button
                    onClick={() => {handleEdit(params.row)}}
                    className='flex items-center bg-blue-500 text-white px-4 h-9 rounded-md'>
                        <FaEdit className='mr-2'/>
                        Edit  
                </button>

                <button
                    onClick={() => handleDelete(params.row)}
                    className="flex items-center bg-red-500 text-white px-4 h-9 rounded-md">
                    <FaTrashAlt className="mr-2"/>
                    Delete
                </button>

                <button
                    onClick={() => handleProductView(params.row)}
                    className="flex items-center bg-slate-800 text-white px-4 h-9 rounded-md">
                    <FaEye className="mr-2"/>
                    View
                </button>
            </div>
        );
    },
   },
];




export const adminCategoryTableColumn = (
    handleEdit,
    handleDelete,
) => [
    { 
    sortable: false,
    disableColumnMenu: true,
    field: "id",
    headerName: "CategoryID",
    minWidth: 180,
    headerAlign: "center",
    editable: false,
    headerClassName: "text-black font-semibold border",
    cellClassName: "text-slate-700 font-normal border",
    renderHeader: (params) => <span className='text-center'>Category Id</span>
   },
  { 
    disableColumnMenu: true,
    field: "categoryName",
    headerName: "Category Name",
    align: "center",
    width: 350,
    headerAlign: "center",
    editable: false,
    sortable: false,
    headerClassName: "text-black font-semibold border text-center",
    cellClassName: "text-slate-700 font-normal border text-center",
    renderHeader: (params) => <span>Category Name</span>
   },
    { 
    disableColumnMenu: true,
    sortable: false,
    field: "action",
    headerName: "Action",
    width: 200,
    align:"center",
    resizable: false,
    headerAlign: "center",
    editable: false,
    headerClassName: "text-black font-semibold text-center ",
    cellClassName: "text-slate-700 font-normal ",
    renderHeader: (params) => <span>Action</span>,
    renderCell: (params) => {
        return (
            <div className='flex justify-center items-center space-x-2 h-full pt-2'>
                <button
                    onClick={() => {handleEdit(params.row)}}
                    className='flex items-center bg-blue-500 text-white px-4 h-9 rounded-md'>
                        <FaEdit className='mr-2'/>
                        Edit  
                </button>

                <button
                    onClick={() => handleDelete(params.row)}
                    className="flex items-center bg-red-500 text-white px-4 h-9 rounded-md">
                    <FaTrashAlt className="mr-2"/>
                    Delete
                </button>   
            </div>
        );
    },
   },
];

export const sellerTableColumn = () => 
[
  { 
    sortable: false,
    disableColumnMenu: true,
    field: "id",
    align:"center",
    headerName: "sellerId",
    minWidth: 300,
    headerAlign: "center",
    editable: false,
    headerClassName: "text-black font-semibold border",
    cellClassName: "text-slate-700 font-normal border",
    renderHeader: (params) => <span className='text-center'>Seller Id</span>
   },
   { 
    sortable: false,
    disableColumnMenu: true,
    field: "username",
    headerName: "User Name",
    minWidth: 300,
    headerAlign: "center",
    editable: false,
    align:"center",
    headerClassName: "text-black font-semibold border text-center",
    cellClassName: "text-slate-700 font-normal border text-center",
    renderHeader: (params) => <span>User Name</span>
   },
  { 
    disableColumnMenu: true,
    field: "email",
    headerName: "Email",
    flex: 1, 
    align: "center",
    width: 180,
    headerAlign: "center",
    editable: false,
    sortable: false,
    headerClassName: "text-black font-semibold border text-center",
    cellClassName: "text-slate-700 font-normal border text-center",
    renderHeader: (params) => <span>Email</span>,
    renderCell: (params) => {
        return (
            <div className='flex justify-center items-center space-x-2 h-full pt-2'>
                <MdEmail size={20} /> 
                {params.value}
            </div>
        );
    },
   },
]; 



