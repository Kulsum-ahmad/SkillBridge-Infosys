import React from 'react'
import { Link } from 'react-router-dom'

const Button = () => {
  return (
    <Link to="/" className='text-decoration-none text-2xl font-extrabold text-black absolute top-4 left-4 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border-2 border-white/50 shadow-lg hover:-translate-y-0.5 transition-all duration-300'>
      &larr;
    </Link>
  )
}

export default Button
