import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { type } from 'os';

const doctorSchema = new Schema({
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
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    specialization: {
        type: String,
        required: true,
    },
    hospitalName: {
        type: String,
       
    },
    phone: {
        type: String,
        
    },
    address: {
        type: String,
      
    },
    experience: {
        type: String,
       
    },
    qualification: {
        type: String,
       
    },
    fees: {
        type: Number,
       
    },
    gender: {
        type: String,
        
    },
    image: {
        type: String,
        
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    notifications: {
       type: [{
         type:mongoose.Schema.Types.ObjectId,
         ref: 'Notification'
         }],
        default: [],
    },
    appointments:{
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }],
        default: [],
    }
});

// Middleware to limit notifications array size
doctorSchema.pre('save', function(next) {
    if (this.notifications && this.notifications.length > 100) {
        this.notifications = this.notifications.slice(-100);
    }
    next();
});
// Hash the password before saving
doctorSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
// Method to compare passwords
doctorSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
doctorSchema.methods.generateAccessToken = async function () {
    return await jwt.sign(
        { _id: this._id, walletAddress: this.walletAddress, email: this.email },
        process.env.ACCESSJWT_SECRET,
        { expiresIn: '30d' }
    );
};

doctorSchema.methods.generateRefreshToken = async function () {
 return await jwt.sign(
        { _id: this._id, },
        process.env.REFRESHJWT_SECRET,
        { expiresIn: '30d' }
    );
};
// Method to generate a JWT token

const Doctor= mongoose.model('Doctor', doctorSchema);
export default Doctor;