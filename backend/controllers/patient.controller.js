import mongoose from "mongoose";
import Patient from '../models/patient.model.js';
import Report from '../models/report.model.js';
import Appointment from '../models/appointment.model.js';
import Notification from '../models/notification.model.js'
import {ApiError} from '../utils/apiError.js';
import {ApiResponse} from '../utils/apiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';

const generateAccessAndRefreshTokens = async (_id) => {
    try{
       
        const patient = await Patient.findById(_id);
        if (!patient) {
            throw new ApiError(404, "Patient not found");
        }
        const accessToken = await patient.generateAccessToken();
        const refreshToken = await patient.generateRefreshToken();
        
       
        await patient.save({validateBeforeSave: false});

        return { accessToken, refreshToken };
    }catch (error) {
        console.error("Error generating tokens:");
        throw new ApiError(500, "Error generating tokens: " + error.message);
    }
};

const getPatientProfile = asyncHandler(async (req, res) => {
    console.log("Fetching patient profile for ID:",);
    const { patientId} = req.params;
    console.log("Patient ID:", patientId);
    try{
        const patient = await Patient.findById(patientId).populate('name').populate('email').populate('walletAddress');
       if (!patient) {
        throw new ApiError(404, "Patient not found");
        }
        return  res.status(200).json(new ApiResponse(200, patient, "Patient retrieved successfully"));
    }catch (error) {
        return res.status(400).json(new ApiError(500, "Error retrieving patient: " + error.message));
    }
    
});

const  getPatientAppointments = asyncHandler(async (req, res) => {
    const {patientId} = req.params;
    console.log("Fetching appointments for patient ID:", patientId);
    try {
        
        const pateint = await Patient.findById(patientId);
        if (!pateint) {
            throw new ApiError(404, "Patient not found");
        }
        const appointments=pateint.appointments;
        if(!appointments){
            throw new ApiError(404, "No appointments found for this patient");
        }
        if ( appointments.length === 0) {
            return res.status(300).json(new ApiError(300, {}, "No appointments found for this patient"));
        }
        const appointmentsDetails = await Appointment.find({ _id: { $in: appointments } })
            .populate('doctor', 'name email')
            .populate('patient', 'name email')
            .populate('appointmentDate', 'date time')
            .populate('status');
        
        return res.status(200).json(new ApiResponse(200, appointments, "Appointments retrieved successfully"));
    } catch (error) {
        return res.status(400).json(new ApiError(500, "Error retrieving appointments: " + error.message));
    }
});

const getPatientReports = asyncHandler(async (req, res) => {
    console.log("Fetching reports for patient ID:", req.params);
    const {patientId} = req.params;
    
  
    try {
        console.log("Patient ID:", patientId);
        const patient = await Patient
            .findOne({_id:patientId});
        if (!patient) {
            console.log("Patient not found with ID:", patientId);
            throw new ApiError(404, "Patient not found");
        }
        console.log("Patient found:", patient);
        const reports = patient.reports;
        if (!reports || reports.length === 0) {
            console.log("No reports found for patient:", patientId);
                 return res.status(300).json(new ApiError(300,{}, "No reports found for this patient"));
                }
                
                console.log("Reports found:", reports);
        return res.status(200).json(new ApiResponse(200, reports, "Reports retrieved successfully"));
    } catch (error) {
        return res.status(400).json(new ApiError(500, "Error retrieving reports: " + error.message));
    }
});

const getPatientReportById = asyncHandler(async (req, res) => {
    const { patientId, reportId } = req.params;
    try {
        const patient = await Patient.findById(patientId)
            .populate('reports', 'reportType reportDate ipfsHash doctorId')
            .populate('doctorId', 'name email walletAddress');
        if (!patient) {
            throw new ApiError(404, "Patient not found");
        }
        const report = patient.reports.find(r => r._id.toString() === reportId);
        if (!report) {
            throw new ApiError(404, "Report not found");
        }
        return res.status(200).json(new ApiResponse(200, report, "Report retrieved successfully"));
    } catch (error) {
        return res.status(400).json(new ApiError(500, "Error retrieving report: " + error.message));
    }
}
);

const registerPatient = asyncHandler(async (req, res) => {
    // console.log("Registering patient with body:", req.body);
if (!mongoose.connection.readyState) {
    throw new ApiError(500, "Database connection is not established");
}
const session = await mongoose.startSession();
// console.log("Registering patient with body:");
session.startTransaction();
//    console.log("Registering patient with body:");
   try {
        const { name, email, password, walletAddress } = req.body;
        // console.log("Request body:", email, password, walletAddress);
        if (!name || !email || !password || !walletAddress) {
            throw new ApiError(400, "All fields are required");
        }
         console.log("Registering patient with email:", email);

        const existingPatient = await Patient.findOne({ "email":email });
        if (existingPatient) {
            throw new ApiError(400, "Patient already exists with this email");
        }
        console.log("existingPatient:");
        const existingWallet = await Patient.findOne({ walletAddress });
        if (existingWallet) {
            throw new ApiError(400, "Patient already exists with this wallet address");
        }
        console.log("walletAddress:", walletAddress);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ApiError(400, "Invalid email format");
        }
        console.log("email:", email);
        
        const patient = await Patient.create(
        [
         {
            walletAddress,
            name,
            email,
            password,
            
          }
       ],
       { session }
    );
        console.log("Patient created:",patient);
        await session.commitTransaction();
        session.endSession();
        const createdPatient = await Patient.findById(patient[0]._id).select("-password -refreshToken");
        console.log("Created patient:", createdPatient._id);
        if (!createdPatient) {
            throw new ApiError(500, "Error creating patient");
        }
        console.log("Patient registered successfully:", createdPatient);
        return res.status(201).json(new ApiResponse(201, createdPatient, "Patient registered successfully"));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json(new ApiError(500, "Error registering patient: " + error.message));
    }
});

const loginPatient = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log("Logging in patient with email:", req.body);
        if (!email || !password) {
            throw new ApiError(400, "Email and password are required");
        }
         console.log("Checking patient with email:", email);
         email.trim();

        const trimmedEmail = email ? email.trim() : null;
        if (!trimmedEmail) {
            throw new ApiError(400, "Invalid email provided");
        }
        const patient = await Patient.findOne({ email: trimmedEmail });
        console.log("Patient found:", patient);
        console.log("Found patient:", patient);
        if (!patient) {
            throw new ApiError(404, "Patient not found");
        }

        const isMatch = await patient.matchPassword(password);
        if (!isMatch) {
            throw new ApiError(401, "Invalid credentials");
        }
        console.log("Patient credentials matched successfully");
        const tokens  = await generateAccessAndRefreshTokens(patient._id);
        const { accessToken, refreshToken } = tokens;
          console.log("Generated accessToken and refreshToken for patient:", accessToken, refreshToken);
        const options = {
            // HttpOnly: Indicates if the cookie is accessible only through the HTTP protocol and not through client-side scripts.
            httpOnly: true,
            // Secure: Indicates if the cookie should only be transmitted over secure HTTPS connections.
            secure: false, // TODO: Change to true in production
            maxAge: 24 * 60 * 60 * 1000, //cookie will expire after 1 day
        };
        // const loggedInPatient = patient.toObject();
        // delete loggedInPatient.password; // Remove password from response
        // delete loggedInPatient.refreshToken; // Remove refreshToken from response
            
        return res
            .status(200)
            .cookie("accessToken", accessToken, options) // Set cookie in client browser
            .cookie("refreshToken", refreshToken, options) // Set cookie in client browser
            .json(
                new ApiResponse(
                  200, 
                  { 
                      patient : patient,
                      accessToken,
                      refreshToken,
                },
                 "Patient logged in successfully"
                )
            );               
        } catch (error) {
        return res.status(500).json(new ApiError(500, "Error logging in: " + error.message));
        }
});

const askAppointment = asyncHandler(async (req, res) => {
    const {patientId} = req.params;
    const {  doctorId, appointmentDate, patientMobile } = req.body;
    try {
        console.log("Request body:", req.body);
        if (!patientId || !doctorId || !appointmentDate || !patientMobile) {
            throw new ApiError(400, "All fields are required");
        }
        if (!mongoose.Types.ObjectId.isValid(patientId) || !mongoose.Types.ObjectId.isValid(doctorId)) {
            throw new ApiError(400, "Invalid patient or doctor ID");
        }
        const appointment = await Appointment.create({
            patientId: patientId,
            doctorId: doctorId,
            appointmentDate: new Date(appointmentDate),
            patientMobile: patientMobile,
            status: 'Pending'
        });
        const doctor = await Patient.findById(doctorId);
        if (!doctor) {
            throw new ApiError(404, "Doctor not found");
        }
        doctor.appointments.push(appointment._id);
       
        const notification =await Notification.create({
            message:`${patientMobile} have asked for appointment on ${appointmentDate}`,
            type:'appointment'
        });
        
        doctor.notifications.push(notification._id);
        await notification.save();

        await doctor.save();
        console.log("Appointment created:", appointment);
        return res.status(201).json(new ApiResponse(201, appointment, "Appointment requested successfully"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Error requesting appointment: " + error.message));
    }
}
);

const deleteAppointment = asyncHandler(async (req, res) => {
    const { appointmentId, patientId } = req.params;
    try {
        console.log("Deleting appointment with ID:", appointmentId);
        if (!appointmentId) {
            throw new ApiError(400, "Appointment ID is required");
        }
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            throw new ApiError(404, "Appointment not found");
        }
        const patient = await Patient.findById(patientId);
        if (!patient) {
            throw new ApiError(404, "Patient not found");
        }
        if(patient._id.toString() !== appointment.patientId.toString()) {
            throw new ApiError(403, "You are not authorized to delete this appointment");
        }
        const doctor =await doctor.findById(appointment.doctorId);
        if (!doctor) {
            throw new ApiError(404, "Doctor not found");
        }
        doctor.appointments = doctor.appointments.filter(app => app.toString() !== appointmentId);
        await doctor.save();
        patient.appointments = patient.appointments.filter(app => app.toString() !== appointmentId);
        await patient.save();
        await Appointment.findByIdAndDelete(appointmentId);
        console.log("Appointment deleted:", appointment);
        console.log("Appointment deleted successfully:", appointment);
        return res.status(200).json(new ApiResponse(200, {}, "Appointment deleted successfully"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Error deleting appointment: " + error.message));
    }
}
);


export {
    registerPatient,
    loginPatient,
    getPatientProfile,
    getPatientReports,
    getPatientReportById,
    getPatientAppointments,
    askAppointment,
    deleteAppointment,
};


