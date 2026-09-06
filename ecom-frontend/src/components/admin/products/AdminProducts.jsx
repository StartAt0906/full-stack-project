import React, { useState } from 'react'
import { MdAddShoppingCart } from "react-icons/md"
import { useSelector, useDispatch } from 'react-redux';
import Loader from '../../shared/Loader';
import { FaBoxOpen } from 'react-icons/fa';
import { adminProductTableColumn } from '../../helper/tableColumn';
import { DataGrid } from '@mui/x-data-grid';
import { useDashboardProductFilter } from '../../../hooks/useProductFilter';
import Modal from '../../shared/Modal';
import { AddProductForm } from './AddProductForm';
import DeleteModal from '../../shared/DeleteModal';
import { deleteProduct } from '../../../store/actions';
import {toast} from 'react-hot-toast';
import { ImageUploadForm } from './ImageUploadForm';
import ProductViewModal from '../../shared/ProductViewModal';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

export const AdminProducts = () => {
  //const products = [{ "productId": 3, "productName": "iPad Pro 16", "description": "High-performence gaming ipad with a 4K display and powful GPU", "image": "http://localhost:8080/images/7ce70110-a691-41f3-95b4-a62eb1c7bf1a.png", "quantity": 30, "price": 1800.0, "discount": 43.0, "specialPrice": 1026.0 }, { "productId": 2, "productName": "iPhone 16 Pro Max", "description": "High-performance phone with a 4K display and powerful camera", "image": "http://localhost:8080/images/dummy_600x400_000000_c5ef8d.png", "quantity": 20, "price": 1400.0, "discount": 23.0, "specialPrice": 1078.0 },];
  //const pagination = {"pageNumber": 0, "pageSize": 50, "totalElements": 1, "totalPages": 1, "lastPage": true};
  
  const { products, pagination} = useSelector((state) => state.products);
  const emptyProduct = !products || products?.length === 0;
  const [currentPage, setCurrentPage] = useState(
    pagination?.pageNumber + 1 || 1
  );

  useDashboardProductFilter();

   const [ loader, setLoader] = useState(false);
  const [ openUpdateModal, setOpenUpdateModal ] = useState(false);
  const [ openAddModal, setOpenAddModal ] = useState(false);
  const [ openDeleteModal, setOpenDeleteModal ] = useState(false);
  const [ openProductViewModal, setOpenProductViewModal ] = useState(false);
  const [ openImageUploadModal, setOpenImageUploadModal] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
      const params = new URLSearchParams(searchParams);
      const pathname = useLocation().pathname;

  //const emptyProduct = true;
  const { isLoading, errorMessage } = useSelector((state) => state.errors);
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user && user?.roles?.includes("ROLE_ADMIN");

  const [selectedProduct, setSelectedProduct] = useState('');
  const tableRecords = products?.map((item) => {
    //console.log("Mapping item:", item.productName, "Image:", item.image); 
    return {
      
      id: item.productId,
      productName: item.productName,
      description: item.description,
      discount: item.discount,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      specialPrice: item.specialPrice,
    }
  });

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setOpenUpdateModal(true);
  };

  const handleDelete = (product) => {
    
    setSelectedProduct(product);
    setOpenDeleteModal(true);
    //console.log(`handleDelete ${product.productName}`);
    
  };

  const handleImageUpload = (product) => {
      setSelectedProduct(product);
      setOpenImageUploadModal(true);
  };

  const handleProductView = (product) => {
    setSelectedProduct(product);
    setOpenProductViewModal(true);
  };

  const handlePaginationChange = (paginationModel) => {
    const page = paginationModel.page + 1;
    setCurrentPage(page);
    params.set("page", page.toString());
    navigate(`${pathname}?${params}`)
  };

  const onDeleteHandler = () => {
    //console.log(`onDeleteHandler ${selectedProduct}`);
    dispatch(deleteProduct(setLoader,selectedProduct?.id, toast, setOpenDeleteModal, isAdmin));
  };

  return (
    <div>
        <div className='pt-6 pb-10 flex justify-end'>
            <button
              onClick={() => setOpenAddModal(true)}
              className='bg-customBlue hover:bg-blue-800 text-white font-semibold py-2 px-4 flex items-center gap-2 rounded-md shadow-md transition-colors hover:text-slate-300 duration-300'>
              <MdAddShoppingCart className='text-xl'/>
              Add Product
            </button>
        </div>

        {!emptyProduct && (
          <h1 className='text-slate-800 text-3xl text-center font-bold pb-6 uppercase'>All Products</h1>
        )}
        {isLoading ? (
            <Loader />
        ) : (
          <>
          {emptyProduct ? (
            <div className='flex flex-col items-center justify-center text-gray-600 py-10'>
              <FaBoxOpen size={50} className='mb-3'/>
              <h2 className='text-2xl font-semibold'>
                  No products created yet
              </h2>
              
            </div>
          ) : (
            <div className='max-w-full'>
                 <DataGrid
                    className='w-full'
                    rows={tableRecords}
                    columns={adminProductTableColumn(
                      handleEdit,
                      handleDelete,
                      handleImageUpload,
                      handleProductView,
                  )}
                    paginationMode='server'
                    rowCount={pagination?.totalElements || 0}
                    initialState={{
                    pagination: {
                        paginationModel: {
                        pageSize: pagination?.pageSize || 0,
                        page: currentPage - 1,
                        },
                    },
                    }}
                    sx={{ '& .MuiDataGrid-columnSeparator': { display: 'none' } }}
                    onPaginationModelChange={handlePaginationChange}
                    disableRowSelectionOnClick
                    disableColumnResize
                    pageSizeOptions={[pagination?.pageSize || 10]}
                    pagination
                    paginationOptions={{
                    showFirstButton: true,
                    showLastButton: true,
                    hideNextButton: currentPage === pagination?.totalPages,
                    }}
                    
                    />
            </div>
          )}
          </>
        )}


        <Modal
          open={openUpdateModal || openAddModal}
          setOpen={openUpdateModal ? setOpenUpdateModal : setOpenAddModal}
          title={openUpdateModal ? 'Update Product' : "Add Product"}>
              <AddProductForm 
                setOpen={openUpdateModal ? setOpenUpdateModal : setOpenAddModal}
                product={selectedProduct}
                update={openUpdateModal}/>
        </Modal>

        <Modal
          open={openImageUploadModal}
          setOpen={setOpenImageUploadModal}
          title={"Add Product Image"}>
                <ImageUploadForm
                setOpen={setOpenImageUploadModal}
                product={selectedProduct}
                />
        </Modal>

        <DeleteModal
          open={openDeleteModal}
          setOpen={setOpenDeleteModal}
          loader={loader}
          title="Delete Product"
          onDeleteHandler={onDeleteHandler} 
        />

        <ProductViewModal 
          open={openProductViewModal}
          setOpen={setOpenProductViewModal}
          product={selectedProduct}
          isAvailable={true}
          />
    </div>

  )
}
