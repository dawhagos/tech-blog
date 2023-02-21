import { useState } from 'react'
import { Routes } from 'react-router-dom'
import './App.css'
import Header from './Header'
import Post from './Post'

function App() {

  return (
    <Routes>
      <Route index element ={
        <main>
          <Header />
          <Post />
          <Post />
        </main>
      } />
    </Routes>
  );
}

export default App
