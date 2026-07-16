// import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY);

// export const sendVerificationEmail = async (userEmail, otp) => {
//   try {
//     const { data, error } = await resend.emails.send({
//       from: "onboarding@resend.dev", // use your verified domain once you have one
//       to: userEmail,
//       subject: "Verify your TripTrack Account",
//       html: `
//         <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
//           <h2>Welcome to TripTrack!</h2>
//           <p>Your verification code is:</p>
//           <h1 style="color: #2d5a4c; font-size: 40px; letter-spacing: 5px;">${otp}</h1>
//           <p>This code will expire in 10 minutes.</p>
//         </div>
//       `,
//     });

//     if (error) {
//       console.log("Error sending email:", error);
//       return { success: false, error };
//     }

//     console.log("Email sent successfully to", userEmail);
//     return { success: true, data };
//   } catch (error) {
//     console.log("Error sending email:", error);
//     return { success: false, error };
//   }
// };