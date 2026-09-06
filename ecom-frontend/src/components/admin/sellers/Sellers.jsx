import { MdAddShoppingCart } from "react-icons/md"
import { sellerTableColumn } from '../../helper/tableColumn';
import { DataGrid } from '@mui/x-data-grid';
import Loader from '../../shared/Loader';
import { FaBoxOpen } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { useState } from "react";
import Modal from '../../shared/Modal';
import AddSellerForm from './AddSellerForm';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useSellerFilter } from "../../../hooks/useSellerFilter";

export const Sellers = () => {
  const {sellers, pagination} = useSelector((state) => state.admin);
 
  const tableRecords = sellers?.map((item) => {
    return {
      id: item.userId,
      username: item.username,
      email:item.email,
    };
  });
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = new URLSearchParams(searchParams);
  const pathname = useLocation().pathname;

  useSellerFilter();

  const emptySeller = !sellers || sellers?.length === 0;
   const { isLoading, errorMessage } = useSelector((state) => state.errors);
    const [currentPage, setCurrentPage] = useState(
       pagination?.pageNumber + 1 || 1
     );
     const [openAddModal, setOpenAddModal] = useState(false);
    
  const handlePaginationChange = (paginationModel) => {
    const page = paginationModel.page + 1;
    setCurrentPage(page);
    params.set("page", page.toString());
    navigate(`${pathname}?${params.toString()}`)
  };

  return (
    <div>
      <div className='pt-6 pb-10 flex justify-end'>
                  <button
                    onClick={() => setOpenAddModal(true)}
                    className='bg-customBlue hover:bg-blue-800 text-white font-semibold py-2 px-4 flex items-center gap-2 rounded-md shadow-md transition-colors hover:text-slate-300 duration-300'>
                    <MdAddShoppingCart className='text-xl'/>
                    Add Seller
                  </button>
      </div>

      {!emptySeller && (
          <h1 className='text-slate-800 text-3xl text-center font-bold pb-6 uppercase'>All Sellers</h1>
        )}
        {isLoading ? (
                    <Loader />
                ) : (
                  <>
                  {emptySeller ? (
                    <div className='flex flex-col items-center justify-center text-gray-600 py-10'>
                      <FaBoxOpen size={50} className='mb-3'/>
                      <h2 className='text-2xl font-semibold'>
                          No sellers created yet
                      </h2>
                    </div>
                  ) : (
                    <div >
                         <DataGrid
                            rows={tableRecords}
                            columns={sellerTableColumn()}
                            paginationMode='server'
                            rowCount={pagination?.totalElements || 0}
                            
                                paginationModel={{
                                pageSize: pagination?.pageSize || 0,
                                page: currentPage - 1,
                                }
                            }
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
            open={openAddModal}
            setOpen={setOpenAddModal}
            title={"Add Seller"}>
            <AddSellerForm 
              setOpen={setOpenAddModal}
             />
        </Modal>

    
    </div>
  )
}
