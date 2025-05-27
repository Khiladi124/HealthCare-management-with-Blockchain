import Router from 'express';
import {
    registerDoctor,
    loginDoctor,
    getDoctorProfile,
    addReportToPatient,
    getAppointments,
    updateAppointmentStatus
} from '../controllers/doctor.controller.js';
import  Doctor  from '../models/doctor.model.js';
import { verifyDoctorJWT } from '../middlewares/auth.middleware.js';
const doctorRouter = Router();

doctorRouter.route('/register').post(registerDoctor);
doctorRouter.route('/login').post(loginDoctor);
doctorRouter.route('/:doctorId/addReport').post(verifyDoctorJWT, addReportToPatient); 
doctorRouter.route('/profile/:doctorId').get(verifyDoctorJWT, getDoctorProfile);
doctorRouter.route('/:doctorId/appointments').get(verifyDoctorJWT, getAppointments);
doctorRouter.route('/:doctorId/appointments/:appointmentId').put(verifyDoctorJWT, updateAppointmentStatus);
export default doctorRouter;
