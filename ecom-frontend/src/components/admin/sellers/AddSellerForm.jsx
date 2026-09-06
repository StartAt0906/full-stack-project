import { useState } from 'react'
import { useForm } from 'react-hook-form'
import  InputField  from '../../shared/InputField'
import { Button} from '@mui/material'
import Spinners from '../../shared/Spinners'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { addNewSeller } from '../../../store/actions'
import { useNavigate } from 'react-router-dom'
const AddSellerForm = ({ setOpen }) => {
   const {
          register,
          handleSubmit,
          reset,
          formState: { errors }
      } = useForm({mode: "onTouched"});
    const dispatch = useDispatch();
    const [loader, setLoader] = useState(false);
    const saveSellerHandler = (data) => {
        const sendData = {
        ...data,
        role: ["seller"]
    };
    
    dispatch(addNewSeller(sendData, toast, reset, setLoader, setOpen));
      };

  return (
   <div className='py-5 relative h-full'>
            <form className='space-y-4'
                onSubmit={handleSubmit(saveSellerHandler)}>
                <div className='flex md:flex-row flex-col gap-4 w-full'>
                    <InputField 
                        label="User Name"
                        required
                        id="username"
                        type="text"
                        message="This field is required"
                        register={register}
                        placeholder="Enter your username"
                        errors={errors}
                        />
                </div>
                <div className='flex md:flex-row flex-col gap-4 w-full'>

                        <InputField 
                        label="Email"
                        required
                        id="email"
                        type="text"
                        message="This field is required"
                        register={register}
                        placeholder="Enter your email"
                        errors={errors}
                        />
                </div>

                <div className='flex md:flex-row flex-col gap-4 w-full'>
                        <InputField 
                        label="Password"
                        required
                        id="password"
                        type="text"
                        message="This field is required"
                        register={register}
                        placeholder="Enter your password"
                        errors={errors}
                        />
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

export default AddSellerForm;
