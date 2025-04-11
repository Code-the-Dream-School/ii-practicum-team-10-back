import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSubmission extends Document {
    userId: mongoose.Types.ObjectId;
    questionId: mongoose.Types.ObjectId;
    topic: string;
    type: string;
    status: 'done' | 'not done';
    createdAt: Date;
}

const UserSubmissionSchema = new Schema<IUserSubmission>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    questionId: {
        type: Schema.Types.ObjectId,
        ref: 'Question',
        required: true,
    },
    topic: {
        type: String,
        enum: ['CSS', 'HTML', 'JavaScript', 'React', 'NodeJS'],
        required: true,
    },
    type: {
        type: String,
        enum: ['flashcard', 'quiz', 'codingChallenge'],
        required: true,
    },
    status: {
        type: String,
        enum: ['done', 'not done'],
        default: 'not done',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model<IUserSubmission>('UserSubmission', UserSubmissionSchema);
