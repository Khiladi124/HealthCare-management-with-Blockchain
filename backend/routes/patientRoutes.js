import Router from "express";
import {
    registerPatient,
    loginPatient,
    getPatientProfile,
    getPatientReports,
    getPatientReportById,
    getPatientAppointments,
    askAppointment,
    deleteAppointment,
} from "../controllers/patient.controller.js";


import {verifyPatientJWT} from "../middlewares/auth.middleware.js";

const patientRouter = Router();

patientRouter.route("/register").post(registerPatient);
patientRouter.route("/login").post(loginPatient);
patientRouter.route("/profile/:patientId").get(verifyPatientJWT, getPatientProfile);
patientRouter.route("/:patientId/reports/").get(verifyPatientJWT, getPatientReports);
patientRouter.route("/:patientId/reports/:reportId").get(verifyPatientJWT, getPatientReportById);
patientRouter.route("/:patientId/appointments").get(verifyPatientJWT, getPatientAppointments);
patientRouter.route("/:patientId/appointments").post(verifyPatientJWT, askAppointment);
patientRouter.route("/:patientId/appointments/:appointmentId").delete(verifyPatientJWT, deleteAppointment);


export default patientRouter;