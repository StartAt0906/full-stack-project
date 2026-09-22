import './App.css'
import Products from './components/products/Products';
import Home from './components/home/Home';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/shared/Navbar';
import About from './components/About';
import Contact from './components/Contact';
import { Toaster } from 'react-hot-toast';
import React from 'react';
import Cart from './components/cart/Cart';
import LogIn from './components/auth/Login';
import PrivateRoute from './components/PrivateRoute';
import Register from './components/auth/Register';
import Checkout from './components/checkout/Checkout';
import PaymentConfirmation from './components/checkout/PaymentConfirmation';
import AdminLayout from './components/admin/AdminLayout';
import { Dashboard } from './components/admin/dashboard/Dashboard';
import { AdminProducts } from './components/admin/products/AdminProducts';
import { Sellers } from './components/admin/sellers/Sellers';
import { Category } from './components/admin/categories/Category';
import { Orders } from './components/admin/orders/Orders';
import AiChatBot from './components/AiChatBot';
import ProductDetails from './components/ProductDetails';
function App() {
 
  return (
    <React.Fragment>
    <Router>
      <Navbar />
      <Routes>
        <Route path='/' element={ <Home />}/>
        <Route path='/products' element={ <Products />}/>
        <Route path='/products/:id' element={ <ProductDetails /> }/>
        <Route path='/about' element={ <About />}/>
        <Route path='/contact' element={ <Contact />}/>
        <Route path='/cart' element={ <Cart />}/>
        
        

        <Route path='/' element={<PrivateRoute  />}>
            <Route path='/checkout' element={ <Checkout />}/>
            <Route path='/order-confirm' element={ <PaymentConfirmation />}/>
        </Route>
        
        <Route path='/' element={<PrivateRoute publicPage />}>
          <Route path='/login' element={ <LogIn />}/>
          <Route path='/register' element={ <Register />}/>
        </Route>

         <Route path='/' element={<PrivateRoute adminOnly/>}> 
          <Route path='/admin' element={ <AdminLayout />}>
            <Route path='' element={<Dashboard />} />
            <Route path='orders' element={<Orders />} />
            <Route path='products' element={<AdminProducts />} />
            <Route path='sellers' element={<Sellers />} />
            <Route path='categories' element={<Category />} />
          </Route>
        </Route>
      </Routes>
      <AiChatBot />
    </Router>
    
    <Toaster position='bottom-center'/>
    </React.Fragment>
  );
}

export default App
