import mongoose from "mongoose";
import Doctor from '../models/doctor.model.js';
import Patient from '../models/patient.model.js';
import Report from '../models/report.model.js';
import Appointment from '../models/appointment.model.js';
import Notification from '../models/notification.model.js'
import {ApiError} from '../utils/apiError.js';
import {ApiResponse} from '../utils/apiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import { stat } from "fs";


const generateAccessAndRefreshToken = async (_id) => {
    try{
        
        const doctor = await Doctor.findById(_id);
        
        const accessToken = await doctor.generateAccessToken();
        const refreshToken =await doctor.generateRefreshToken();
       
        if(!accessToken || !refreshToken) {
            throw new ApiError(500, "Failed to generate tokens");
        }
        await doctor.save({ validateBeforeSave: false }); 
        return {accessToken, refreshToken};
    }catch (error) {
        throw new ApiError(500, "Error generating tokens: " + error.message);
    }
    
};
export const registerDoctor = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
    const {name, email, password, specialization, walletAddress} = req.body;

    if (!name || !email || !password || !specialization||!walletAddress) {
        throw new ApiError(400, "All fields are required");
    }

    const existingDoctor = await Doctor.findOne({email});
    if (existingDoctor) {
        throw new ApiError(400, "Doctor already exists");
    }
    const existingWalletAddress = await Doctor.findOne({walletAddress});
    if (existingWalletAddress) {
        throw new ApiError(400, "Wallet address already registered");
    }
    const doctor = await Doctor.create([{walletAddress, name, email, password, specialization }], {session});
    if (!doctor) {
        throw new ApiError(500, "Failed to create doctor");
    }
    await session.commitTransaction();
    session.endSession();
    const createdDoctor = await Doctor.findById(doctor[0]._id).select("-password -refreshToken");
     console.log("Created Doctor:", createdDoctor);
    res.status(201).json(new ApiResponse(200, createdDoctor,"Doctor registered successfully"));
   
} catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(500, "Error registering doctor: " + error.message);
    }
});

export const loginDoctor = asyncHandler(async (req, res) => {
    try{
        const {email, password} = req.body;
        console.log("Login request received for email:", email);
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const doctor = await Doctor.findOne({email});
    // console.log("Doctor found:", doctor);
    if (!doctor || !(await doctor.comparePassword(password))) {
        throw new ApiError(401, "Invalid email or password");
    }
    // console.log("Doctor authenticated successfully:", doctor._id);
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(doctor._id);
    // console.log("Access Token:", accessToken);
    if(!accessToken || !refreshToken) {
        throw new ApiError(500, "Failed to generate tokens");
    }
    
    doctor.refreshToken = refreshToken;
    await doctor.save();
    const doctorData = await Doctor.findById(doctor._id).select("-password");
    res.status(200).json(new ApiResponse(200, {doctorData, accessToken, refreshToken},"Login successful"));
    }catch (error) {
        return new ApiError(500, "Error logging in doctor: " + error.message);
    }
    
});

export const getDoctorProfile = asyncHandler(async (req, res) => {
    try{
    const {doctorId} = req.params;
    console.log("Fetching doctor profile for ID:", doctorId);
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        throw new ApiError(400, "Invalid doctor ID");
    }

    const doctor = await Doctor.findById(doctorId).select("-password -refreshToken");
    if (!doctor) {
        throw new ApiError(404, "Doctor not found");
    }
    res.status(200).json(new ApiResponse("Doctor profile retrieved successfully", doctor));
}catch (error) {
        return res.status(500).json(new ApiError(500, "Error fetching doctor profile: " + error.message));
    }
}
);

export const addReportToPatient = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {doctorId} = req.params;
        const {patientId, ipfsHash, reportName, reportType} = req.body;
        console.log("Adding report for Doctor ID:", doctorId, "Patient ID:", patientId);
        if (!doctorId || !patientId || !ipfsHash || !reportName || !reportType) {
            throw new ApiError(400, "All fields are required");
        }
        console.log(ipfsHash, reportName, reportType);
        if (!mongoose.Types.ObjectId.isValid(doctorId) || !mongoose.Types.ObjectId.isValid(patientId)) {
            throw new ApiError(400, "Invalid doctor or patient ID");
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            throw new ApiError(404, "Doctor not found");
        }

        const patient = await Patient.findById(patientId);
        if (!patient) {
            throw new ApiError(404, "Patient not found");
        }

        const report = await Report.create([{doctorId: doctor._id, patientId: patient._id, ipfsHash:ipfsHash, reportName: reportName, reportType: reportType }], {session});
        if (!report) {
            throw new ApiError(500, "Failed to create report");
        }
        
        patient.reports.push(report._id);
       
        const notification=await Notification.create({
            message:`you have report from ${doctor.name} for ${reportType}`,
            type:'report',
            
        });
        patient.notifications.push(notification._id);
        await patient.save({session});

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(new ApiResponse(201, report,"Report added successfully"));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(500, "Error adding report to patient: " + error.message);
    }
});

export const getAppointments = asyncHandler(async (req, res) => {
    try {
        const {doctorId} = req.params;
        console.log("Fetching appointments for Doctor ID:", doctorId);
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            throw new ApiError(400, "Invalid doctor ID");
        }
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            throw new ApiError(404, "Doctor not found");
        }
        const appointments = await doctor.appointments;
        if (!appointments ) {
            return res.status(404).json(new ApiError(404, "Error"));
        }
        if ( appointments.length === 0) {
            return res.status(200).json(new ApiError(200, "No appointments found for this doctor"));
        }
       const sortedAppointments = appointments.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)); 

        res.status(200).json(new ApiResponse(200, sortedAppointments,"Appointments retrieved successfully"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Error fetching appointments: " + error.message));
    }
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {doctorId, appointmentId} = req.params;
        const {status,appointmentTime} = req.body;
        console.log("Updating appointment status for Doctor ID:", doctorId, "Appointment ID:", appointmentId);
        if (!doctorId || !appointmentId || !status) {
            throw new ApiError(400, "Doctor ID, Appointment ID and status are required");
        }
        if (!mongoose.Types.ObjectId.isValid(doctorId) || !mongoose.Types.ObjectId.isValid(appointmentId)) {
            throw new ApiError(400, "Invalid doctor or appointment ID");
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            throw new ApiError(404, "Doctor not found");
        }
        if(status !== 'pending' &&!appointmentTime) {
            throw new ApiError(400, "Appointment time is required for confirmed or cancelled status");
        }
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            throw new ApiError(404, "Appointment not found");
        }

        appointment.status = status;
        if(appointmentTime) {
            appointment.appointmentTime = appointmentTime;
        }
        const patient = await Patient.findById(appointment.patientId);
        if (!patient) {
            throw new ApiError(404, "Patient not found");
        }
        const notification = await Notification.create({
            message:"Your appointment status has been updated to " + status,
            type: 'appointment',
        });
        patient.notifications.push(notification._id);
        await patient.save({session});
        await appointment.save({session});

        await session.commitTransaction();
        session.endSession();

        res.status(200).json(new ApiResponse(200, appointment,"Appointment status updated successfully"));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(500, "Error updating appointment status: " + error.message);
    }
});

