const nodemailer = require("nodemailer");

async function sendEmail({ to, subject, text }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Gmail address
      pass: process.env.EMAIL_PASS  // App Password
    }
  });

  const mailOptions = {
    from: `"AI-Powered App Support" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Email failed:", error);
    throw new Error("Email failed to send");
  }
}

module.exports = sendEmail;