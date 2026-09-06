import { MdAddShoppingCart } from "react-icons/md"
import { adminCategoryTableColumn } from '../../helper/tableColumn';
import { DataGrid } from '@mui/x-data-grid';
import Loader from '../../shared/Loader';
import { FaBoxOpen } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { useState } from "react";
import Modal from '../../shared/Modal';
import DeleteModal from '../../shared/DeleteModal';
import AddCategoryForm from './AddCategoryForm';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useDashboardCategoryFilter } from "../../../hooks/useCategoryFilter";
import { deleteCategory } from "../../../store/actions";
import toast from "react-hot-toast";

export const Category = () => {
  //const categories = [ { "categoryId": 1, "categoryName": "LapTop" }, { "categoryId": 2, "categoryName": "Electronics" } ];
  //const pagination = {"pageNumber": 0, "pageSize": 2, "totalElements": 5, "totalPages": 3, "lastPage": false};

  const {categories, pagination} = useSelector((state) => state.categories);
 
  const tableRecords = categories?.map((item) => {
    return {
      id: item.categoryId,
      categoryName: item.categoryName,
    };
  });
const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = new URLSearchParams(searchParams);
  const pathname = useLocation().pathname;

  useDashboardCategoryFilter();

  const emptyCategory = !categories || categories?.length === 0;
  //const emptyCategory = true;
   const { isLoading, errorMessage } = useSelector((state) => state.errors);
    const [currentPage, setCurrentPage] = useState(
       pagination?.pageNumber + 1 || 1
     );
  //  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  
     const [loader, setLoader] = useState(false);
     const [openAddModal, setOpenAddModal] = useState(false);
     const [openUpdateModal, setOpenUpdateModal] = useState(false);
     const [openDeleteModal, setOpenDeleteModal] = useState(false);
     const [selectedCategory, setSelectedCategory] = useState('');


  const handleEdit = (category) => {
    setSelectedCategory(category);
    setOpenUpdateModal(true);
  };

  const handleDelete = (category) => {
    setSelectedCategory(category);
    setOpenDeleteModal(true);
  };

  const onDeleteHandler =  () => {
    const queryString = searchParams.toString();
    console.log(queryString);
       dispatch(deleteCategory(setLoader, selectedCategory?.id, toast, setOpenDeleteModal, queryString));
      
        // dispatch(dashboardCategoriesAction(queryString));

  };
 

  
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
                    Add Category
                  </button>
      </div>

      {!emptyCategory && (
          <h1 className='text-slate-800 text-3xl text-center font-bold pb-6 uppercase'>All Categoris</h1>
        )}
        {isLoading ? (
                    <Loader />
                ) : (
                  <>
                  {emptyCategory ? (
                    <div className='flex flex-col items-center justify-center text-gray-600 py-10'>
                      <FaBoxOpen size={50} className='mb-3'/>
                      <h2 className='text-2xl font-semibold'>
                          No categories created yet
                      </h2>
                    </div>
                  ) : (
                    <div >
                         <DataGrid
                            
                            rows={tableRecords}
                            columns={adminCategoryTableColumn(
                              handleEdit,
                              handleDelete,
                          )}
                            paginationMode='server'
                            rowCount={pagination?.totalElements || 0}
                            
                                paginationModel={{
                                pageSize: pagination?.pageSize || 0,
                                page: currentPage - 1,
                                }
                            }
                            
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
            title={openUpdateModal ? 'Update Category' : "Add Category"}>
            <AddCategoryForm 
              setOpen={openUpdateModal ? setOpenUpdateModal : setOpenAddModal}
              category={selectedCategory}
              update={openUpdateModal}/>
        </Modal>

        <DeleteModal
                  open={openDeleteModal}
                  setOpen={setOpenDeleteModal}
                  loader={loader}
                  title="Delete Category"
                  onDeleteHandler={onDeleteHandler} 
                />
    </div>
  )
}
