import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

export interface IUser extends Document {
    googleId?: string;
    name?: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    profilePicture: string; // New field
    progress: {
        css: number;
        html: number;
        javaScript: number;
        react: number;
        nodejs: number;
        overall: number;
    };
    createJWT(): string;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
    googleId: {
        type: String, // Store Google's user ID
        unique: true,
        sparse: true, // Allows null for non-Google users
    },
    name: {
        type: String,
     //   required: [true, 'Please provide a name'],
     //   minlength: 3,
     //   maxlength: 50,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide a valid email',
        ],
        unique: true,
    },
    password: {
        type: String,
      //  required: [true, 'Please provide a password'],
      //  minlength: 6,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    profilePicture: {
        type: String,
        default: function () {
            // Assign a random profile picture from public folder
            const images = ["1.png", "2.png", "3.png", "4.png"];
            return `/${images[Math.floor(Math.random() * images.length)]}`;
        }
    },
    progress: {
        css: { type: Number, default: 0 }, // Progress in percentage
        html: { type: Number, default: 0 },
        javaScript: { type: Number, default: 0 },
        react: { type: Number, default: 0 },
        nodejs: { type: Number, default: 0 },
        overall: { type: Number, default: 0 }
    }
});

// Hash password before saving
UserSchema.pre<IUser>('save', async function () {
    if (!this.isModified('password') || !this.password) return; // Skip if password is not modified or undefined
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Generate JWT
UserSchema.methods.createJWT = function (): string {
    const jwtSecret: Secret = process.env.JWT_SECRET as string;
    const jwtLifetime = process.env.JWT_LIFETIME as SignOptions["expiresIn"] || "30d";

    if (!jwtSecret) {
        throw new Error("JWT_SECRET is not defined in environment variables.");
    }

    return jwt.sign(
        { userId: this._id, name: this.name, role: this.role },
        jwtSecret,
        { expiresIn: jwtLifetime }
    );
};

// Compare hashed password
UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
