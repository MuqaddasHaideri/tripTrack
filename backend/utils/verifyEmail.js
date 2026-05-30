
import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (userEmail, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports like 587
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Verify your TripTrack Account',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2>Welcome to TripTrack!</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #2d5a4c; font-size: 40px; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to", userEmail);
  } catch (error) {
    console.log("Error sending email:", error);
  }
};