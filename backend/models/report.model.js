import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import Patient from './patient.model.js';
import  Doctor  from './doctor.model.js';

const reportSchema = new Schema({
    reportName: {
        type: String,
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    reportType: {
        type: String,
        required: true,
        enum: ['blood', 'urine', 'x-ray', 'ct-scan', 'mri', 'ultrasound', 'other']
    },
    reportDate: {
        type: Date,
        default: Date.now
    },
    ipfsHash: {
        type: String,
        required: true
    },  

});

const Report= mongoose.model('Report', reportSchema);
export default Report;
export { reportSchema };