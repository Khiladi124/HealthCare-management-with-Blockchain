import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Report from './report.model.js';
import  Appointment from './appointment.model.js';
import { type } from 'os';

const  patientSchema = new Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        
    },
    address: {
        type: String,
        
    },
    age: {
        type: Number,
        
    },
    gender: {
        type: String,
       
    },
   bloodGroup: {
        type: String,
        
    },
    image: {
        type: String,
        
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    reports: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
    }],
    appointments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
    }],
    refreshToken:{
        type: String,
        default: null,
    },
    notifications: {
          type: [{
            _id:{type:mongoose.Schema.Types.ObjectId, ref: 'Notification'},
            message: { type: String, required: true },
            }],
           default: [],
       },
    
});


    
patientSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});
patientSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

patientSchema.methods.generateAccessToken = async function () {
    return await  jwt.sign(
        { 
            _id: this._id ,
            email:this.email,
            walletAddress: this.walletAddress,

        },
        process.env.ACCESSJWT_SECRET,
        {
        expiresIn: '7d',
    });

}

patientSchema.methods.generateRefreshToken = async function () {
    return await jwt.sign(
        {
            _id: this._id,
           
        },
        process.env.REFRESHJWT_SECRET,
        {
            expiresIn: '30d',
        }
    );
    
};

const Patient= mongoose.model('Patient', patientSchema);
export default Patient;