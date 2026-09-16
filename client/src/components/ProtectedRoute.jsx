import { useAuth } from '@clerk/react'
import Loader from './Loader'
import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = () => {

    const { isLoaded, isSignedIn } = useAuth()

    if(!isLoaded){
        return <Loader text="Authenticating..."/>
    }

    if(!isSignedIn){
        return <Navigate to="/login" replace />
    }
    return (
        <Outlet />
    )
}

export default ProtectedRoute