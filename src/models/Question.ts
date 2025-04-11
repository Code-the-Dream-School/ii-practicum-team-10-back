import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
    topic: 'CSS' | 'HTML' | 'JavaScript' | 'React' | 'NodeJS';
    type: 'flashcard' | 'quiz' | 'codingChallenge';
    codeSnippet?: string;
    questionText: string;
    answers: string[];
}

const QuestionSchema = new Schema<IQuestion>({
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
    codeSnippet: {
        type: String,
        default: null,
    },
    questionText: {
        type: String,
        required: [true, 'Please provide the question text'],
    },
    answers: {
        type: [String],
        required: [true, 'Please provide at least one answer'],
    },
});

export default mongoose.model<IQuestion>('Question', QuestionSchema);
