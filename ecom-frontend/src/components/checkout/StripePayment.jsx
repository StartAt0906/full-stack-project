import { useEffect } from 'react'
import { Alert, AlertTitle } from '@mui/material'
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Skeleton from '../shared/Skeleton'
import PaymentForm from './PaymentForm';
import { useSelector, useDispatch } from 'react-redux';
import { createStripePaymentSecret } from '../../store/actions';

console.log("PK Key:", import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const StripePayment = () => {
  const { clientSecret } = useSelector((state) => state.auth);
  const { totalPrice } = useSelector((state) => state.carts);
  const { isLoading, errorMessage } = useSelector((state) => state.errors);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!clientSecret) {
      dispatch(createStripePaymentSecret(totalPrice));
    }  
  }, [clientSecret]);

    if (isLoading) {
      return (
        <div className='max-w-lg mx-auto'>
          <Skeleton />
        </div>
      )
    }
  return (
    <>
      {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret}}>
            <PaymentForm clientSecret={clientSecret} totalPrice={totalPrice}/>
          </Elements>
      )}
    </>
  )
}

export default StripePayment;