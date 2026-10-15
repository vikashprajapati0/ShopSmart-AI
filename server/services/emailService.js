import nodemailer from 'nodemailer';

const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
      port: Number(process.env.EMAIL_PORT) || 2525,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return null;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const from = process.env.EMAIL_FROM || 'ShopSmart AI <noreply@shopsmart.ai>';

    if (!transporter || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.log(`[Email Simulation] To: ${to} | Subject: ${subject}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ''),
      html
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Error]: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const sendOrderConfirmationEmail = async (order, customerEmail) => {
  const itemsHtml = order.items
    .map(
      item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.name} x ${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
    </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #4f46e5; margin-top: 0;">Order Confirmed!</h2>
      <p>Thank you for shopping with <strong>ShopSmart AI</strong>.</p>
      <p><strong>Order Number:</strong> ${order.orderNumber}</p>
      <p><strong>Delivery Address:</strong><br/>
      ${order.shippingAddress.fullName}<br/>
      ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Grand Total:</td>
            <td style="padding: 8px; text-align: right; font-weight: bold; color: #4f46e5;">₹${order.total.toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>
      <p style="margin-top: 25px; font-size: 14px; color: #64748b;">You can track your order status live in your Customer Dashboard.</p>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Order Confirmation #${order.orderNumber} - ShopSmart AI`,
    html
  });
};

export const sendPasswordResetEmail = async (email, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #4f46e5;">Password Reset Request</h2>
      <p>You requested a password reset for your ShopSmart AI account.</p>
      <p>Click the button below to reset your password. This link is valid for 1 hour:</p>
      <div style="margin: 25px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="font-size: 14px; color: #64748b;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset Request - ShopSmart AI',
    html
  });
};

export default {
  sendEmail,
  sendOrderConfirmationEmail,
  sendPasswordResetEmail
};
