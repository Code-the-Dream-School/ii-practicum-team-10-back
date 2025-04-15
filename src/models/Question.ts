import mongoose, { Schema, Document } from 'mongoose';

export interface ITest {
    input: string;
    expectedOutput: string;
}

export interface IQuestion extends Document {
    topic: string;
    type: string;
    codeSnippet?: string;
    questionText: string;
    answers: string[];
    questionSuggestedAnswers?: string[]; 
    tests?: ITest[];
}

const QuestionSchema = new Schema<IQuestion>({
    topic: {
        type: String,
        enum: ['CSS', 'HTML', 'JavaScript', 'React', 'NodeJS'],
        required: [true, 'Please provide a topic'],
    },
    type: {
        type: String,
        enum: ['flashcard', 'quiz', 'codingChallenge'],
        required: [true, 'Please provide a type'],
    },
    codeSnippet: {
        type: String,
        default: null,
    },
    questionText: {
        type: String,
        required: [true, 'Please provide a question text'],
    },
    answers: {
        type: [String],
        required: [true, 'Please provide at least one answer'],
    },
    questionSuggestedAnswers: {
        type: [String],
        required: [
            function (this: IQuestion) {
                return this.type === 'quiz';
            },
            'Please provide suggested answers for quiz questions',
        ],
        validate: {
            validator: function (this: IQuestion, value: string[]) {
                return this.type !== 'quiz' || (Array.isArray(value) && value.length >= 2);
            },
            message: 'Quiz questions must have at least 2 suggested answers',
        },
    },
    tests: {
        type: [
            {
                input: { type: String, required: true },
                expectedOutput: { type: String, required: true },
            },
        ],
        required: [
            function (this: IQuestion) {
                return this.type === 'codingChallenge';
            },
            'Please provide test cases for coding challenges',
        ],
        validate: {
            validator: function (this: IQuestion, value: ITest[]) {
                return this.type !== 'codingChallenge' || (Array.isArray(value) && value.length >= 1);
            },
            message: 'Coding challenges must have at least 1 test case',
        },
    },
});

export default mongoose.model<IQuestion>('Question', QuestionSchema);
