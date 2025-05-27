import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import  Patient  from '../models/patient.model.js';
import Doctor from '../models/doctor.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';
dotenv.config();

const verifyPatientJWT = asyncHandler(async (req, res, next) => {
    console.log("Verifying Patient JWT...");
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", ""); // Separating token from header
     console.log("Token received:", token);
    if (!token) {
        throw new ApiError(401, "Unauthorized request");
    }

    
    const decodedToken = ( () => {
        try {
            return  jwt.verify(token, process.env.ACCESSJWT_SECRET);
        } catch (error) {
            
            throw new ApiError(401, "Invalid or expired token");
        }
    })();
   
    
    const patient = await Patient.findById(decodedToken?._id).select(
        "-password -refreshToken"
    ).catch(() => {
        throw new ApiError(500, "Something Went Wrong. Please Retry!");
    });
    
    if (!patient) {
        throw new ApiError(401, "Invalid access token");
    }

    req.user = patient; 
    next(); // Move to next (Like logout, delete user, etc.)

});

const verifyDoctorJWT = asyncHandler(async (req, res, next) => {
    console.log("Verifying Doctor JWT...");
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", ""); // Separating token from header

    console.log("Token received:", token);
    if (!token) {
        throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = ( () => {
        try {
            return jwt.verify(token, process.env.ACCESSJWT_SECRET);
        } catch (error) {
            throw new ApiError(401, "Invalid or expired token");
        }
    })();

    const doctor = await Doctor.findById(decodedToken?._id).select(
        "-password -refreshToken"
    ).catch(() => {
        throw new ApiError(500, "Something Went Wrong. Please Retry!");
    });
    console.log("Doctor found:", doctor);
    if (!doctor) {
        throw new ApiError(401, "Invalid access token");
    }

    req.user = doctor; 
    next(); // Move to next (Like logout, delete user, etc.)
});

export { verifyPatientJWT , verifyDoctorJWT };