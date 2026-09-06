import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import  InputField  from '../../shared/InputField'
import Skeleton from '../../shared/Skeleton'
import { Button} from '@mui/material'
import { addNewProductFromDashboard, fetchCategories, updateProductFromDashboard } from '../../../store/actions'
import Spinners from '../../shared/Spinners'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { SelectTextField } from '../../shared/SelectTextField'
import ErrorPage from '../../shared/ErrorPage'
export const AddProductForm = ({ setOpen, product, update=false}) => {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm({mode: "onTouched"});

    const [selectedCategory, setSelectedCategory] = useState();
    const dispatch = useDispatch();
    const { categories } = useSelector((state) => state.categories);
    const { categoryLoader, errorMessage } = useSelector((state) => state.errors);
    const [loader, setLoader] = useState(false);
    const { user } = useSelector((state) => state.auth);
    const isAdmin = user && user?.roles?.includes("ROLE_ADMIN");
    const saveProductHandler = (data) => {
        if(!update) {

            //create new product logic
            const sendData = {
                ...data,
                categoryId: selectedCategory.categoryId,
            };
            dispatch(addNewProductFromDashboard(
                sendData, toast, reset, setLoader, setOpen, isAdmin
            ));
        } else {
            const sendData = {
                ...data,
                id: product.id,
            };
            dispatch(updateProductFromDashboard(sendData,toast,reset,setLoader, setOpen, isAdmin)); 
        }
    };

    useEffect(() => {
        if (update && product) {
            setValue("productName", product?.productName);
            setValue("price", product?.price);
            setValue("quantity", product?.quantity);
            setValue("discount", product?.discount);
            setValue("specialPrice", product?.specialPrice);
            setValue("description", product?.description);
        }
    }, [update, product]);
    
    useEffect(() => {
        if (!update) {
            dispatch(fetchCategories());
        }
    }, [dispatch, update]);
    
    useEffect(() => {
        if(!categoryLoader && categories) {
            setSelectedCategory(categories[0]);
        }
    }, [categories, categoryLoader]);

    if (categoryLoader) return <Skeleton />
    if (errorMessage) return <ErrorPage message={errorMessage} />
    return (
        <div className='py-5 relative h-full'>
            <form className='space-y-4'
                onSubmit={handleSubmit(saveProductHandler)}>
                <div className='flex md:flex-row flex-col gap-4 w-full'>
                    <InputField 
                        label="Product Name"
                        required
                        id="productName"
                        type="text"
                        message="This field is required"
                        register={register}
                        placeholder="Product Name"
                        errors={errors}
                        />

                {!update && (
                    <SelectTextField 
                        label="Select Categories"
                        select={selectedCategory}
                        setSelect={setSelectedCategory}
                        lists={categories}
                        />
                )}
                </div>

                <div className='flex md:flex-row flex-col gap-4 w-full'>
                    <InputField 
                        label="Price"
                        required
                        id="price"
                        type="number"
                        message="This field is required"
                        placeholder="Product Price"
                        register={register}
                        errors={errors}/>
                
                    <InputField 
                        label="Quantity"
                        required
                        id="quantity"
                        type="number"
                        message="This field is required"
                        placeholder="Product Quantity"
                        register={register}
                        errors={errors}/>
                </div>

                <div className='flex md:flex-row flex-col gap-4 w-full'>
                    <InputField 
                        label="Discount"
                        required
                        id="discount"
                        type="number"
                        message="This field is required"
                        placeholder="Product Discount"
                        register={register}
                        errors={errors}/>
                
                    <InputField 
                        label="SpecialPrice"
                        required
                        id="specialPrice"
                        type="number"
                        message="This field is required"
                        placeholder="Product Special Price"
                        register={register}
                        errors={errors}/>
                </div>

                <div className='flex flex-row  gap-4 w-full'>
                    <label htmlFor='desc'
                        className='font-semibold text-sm text-slate-800'>
                        Description
                    </label>

                    <textarea
                        rows={5}
                        placeholder="Add product description..."
                        className={`px-2 py-2 w-full border outline-none bg-transparent text-slate-800 rounded-md ${
                             errors["description"]?.message ? "border-red-500" : "border-slate-700"}`}
                        {...register("description", {
                            required: {value: true, message: "Description is required"},
                        })}
                    />

                    {errors["description"]?.message && (
                    <p className="text-sm font-semibold text-red-600 mt-0">
                        {errors["description"]?.message}
                    </p>
                    )}
                </div>

                <div className='flex w-full justify-between items-center absolute bottom-14 '>
                <Button disabled={loader}
                        onClick={() => setOpen(false)}
                        variant='outlined'
                        className='text-white py-10 px-4 text-sm font-medium'> 
                    Cancel
                </Button>

                <Button
                    disabled={loader}
                    type='submit'
                    variant='contained'
                    color='primary'
                    className='bg-customBlue text-white py-10 px-4 text-sm font-medium'>
                    {loader ? (
                            <div className='flex gap-2 items-center'>
                                <Spinners /> Loading...
                            </div>
                    ) : (
                        "Save"
                    )}
                </Button>
            </div>
            </form>
        </div>
  )
}
