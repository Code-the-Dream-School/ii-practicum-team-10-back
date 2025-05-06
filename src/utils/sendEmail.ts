import nodemailer from 'nodemailer';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Use your email provider (e.g., SendGrid, Gmail)
        auth: {
            user: process.env.EMAIL_USER, // e.g., your Gmail address
            pass: process.env.EMAIL_PASS, // e.g., Gmail App Password
        },
    });

    await transporter.sendMail({
        from: `"BeReady App" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
};

export default sendEmail;
