import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//send emails
export const sendVerificationEmail = async (
  email: string,
  firstName: string,
  verificationToken: string
) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify/${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Email Verification",
    html: `
        <h1>Hello ${firstName}!</h1>
        <p>Thank you for registering.</p>
        <p>To verify your email, please click the link below:</p>
        <a href="${verificationUrl}" style="padding: 10px 20px: background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
        Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not request this verification, please ignore this email.</p>
        <p>Thank you,</p>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  firstName: string,
  resetToken: string
) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Password",
    title: "Reset Password",
    html: `
        <h1>Hello ${firstName}!</h1>
        <p>You have requested to reset your password.</p>
        <p>To reset your password, please click the link below:</p>
        <a href="${resetUrl}" style="padding: 10px 20px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px;">
        Reset Password</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <p>Your password will not be changed until you access the link above and create a new password.</p>
        <p>Thank you,</p>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

export const sendWelcomeEmail = async (email: string, firstName: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Welcome to our platform",
    html: `
    <h1>Welcome to our platform ${firstName}!</h1>
    <p>Thank you for registering.</p>
    <p>We are glad to have you on board.</p>
    <p>Please feel free to contact us if you have any questions.</p>
    <p>Thank you!</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Failed to send welcome email");
  }
};

export const sendEmailChangeConfirmation = async (
  oldEmail: string,
  newEmail: string,
  firstName: string,
  token: string
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: [oldEmail, newEmail],
    subject: "Email Address Change Confirmation",
    html: `<h1>Hello ${firstName}!</h1>
      <p>You have requested to change your email address.</p>
      <p><strong>Old Email:</strong> ${oldEmail}</p>
      <p><strong>New Email:</strong> ${newEmail}</p>
      <p>Please verify your new email address by clicking the link below:</p>
      <a href="${process.env.CLIENT_URL}/verify-email-change?token=${token}" 
         style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
        Verify New Email
      </a>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not request this change, please contact support immediately.</p>
      <p>Thank you,</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      `Email change confirmation sent to ${oldEmail} and ${newEmail}`
    );
  } catch (error) {
    console.error("Error sending email change confirmation:", error);
    throw new Error("Failed to send email change confirmation");
  }
};
