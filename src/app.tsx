import React from 'react';

import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Footer from './components/footer';
import Navbar from './components/navbar';
import Home from './pages/home';
import RootProvider from './providers/root';

function App() {
  return (
    <BrowserRouter>
      <RootProvider>
        <Navbar />
        <main className='flex-1'>
          <Routes>
            <Route path='/' element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </RootProvider>
    </BrowserRouter>
  );
}

export default App;
