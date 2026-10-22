const http = require('http');
const fs = require('fs');
const path = require('path');
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = require('./node_modules/nodemailer');
}

// Load environment variables from .env file if available
const ENV_PATH = path.join(__dirname, '.env');
if (fs.existsSync(ENV_PATH)) {
  try {
    const envLines = fs.readFileSync(ENV_PATH, 'utf8').split('\n');
    envLines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k && v.length) process.env[k.trim()] = v.join('=').trim();
      }
    });
  } catch (e) {
    console.warn("Notice loading .env:", e.message);
  }
}

const PORT = parseInt(process.env.PORT, 10) || 5050;
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'remigold049@gmail.com';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function getEmailTransporter() {
  const user = process.env.SMTP_USER || 'badmusdaniel0508@gmail.com';
  const pass = process.env.SMTP_PASS || 'educsevpysrjmcuw';
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    family: 4,
    tls: { rejectUnauthorized: false },
    auth: { user, pass }
  });
}

function formatNaira(num) {
  const val = parseFloat(num) || 0;
  return '₦' + val.toLocaleString('en-NG');
}

// Generate the Exact Rich HTML Order Notification Email (Matching Picture 1 with Brand Logo)
function generateOrderHtml(orderData, hasLogo) {
  const itemsRows = (orderData.items || []).map((it, idx) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b;">
        <strong>${idx + 1}. ${it.title}</strong>
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: center; color: #475569;">
        x${it.quantity}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: right; font-weight: 700; color: #18422e;">
        ${formatNaira(it.price * it.quantity)}
      </td>
    </tr>
  `).join('');

  const deliveryText = typeof orderData.deliveryFee === 'string'
    ? orderData.deliveryFee
    : (orderData.deliveryFee ? formatNaira(orderData.deliveryFee) : 'Paid by Receiver on Delivery (Pay to Rider)');

  const paymentText = orderData.paymentMethod || 'Direct Bank Transfer (Opay: 9013255068)';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
      <!-- Brand Header with Circular Logo Image & Gold Border -->
      <div style="background: linear-gradient(135deg, #102e20 0%, #18422e 100%); padding: 26px 20px; text-align: center; color: #ffffff;">
        ${hasLogo ? `<img src="cid:storeLogo" alt="Remi Luxe Beauty Logo" style="width: 82px; height: 82px; border-radius: 50%; object-fit: cover; border: 3px solid #d4af37; box-shadow: 0 4px 12px rgba(0,0,0,0.25); display: block; margin: 0 auto 10px;">` : ''}
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.02em; color: #ffffff;">Remi Luxe Beauty</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">Official Store Order Notification</p>
      </div>

      <div style="padding: 24px;">
        <!-- Order Reference Box -->
        <div style="background: #f8fafc; border-left: 4px solid #18422e; padding: 14px 16px; border-radius: 6px; margin-bottom: 20px;">
          <div style="font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 700;">Order Reference</div>
          <div style="font-size: 20px; font-weight: 800; color: #18422e; font-family: monospace;">${orderData.orderRef}</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Placed on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>

        <!-- Customer Delivery Information -->
        <h3 style="font-size: 14px; color: #18422e; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px;">
          Customer Delivery Information
        </h3>
        <table style="width: 100%; font-size: 14px; margin-bottom: 22px; line-height: 1.6;">
          <tr>
            <td style="color: #64748b; width: 140px; vertical-align: top;"><strong>Customer Name:</strong></td>
            <td style="color: #1e293b; font-weight: 700;">${orderData.name || 'Customer'}</td>
          </tr>
          <tr>
            <td style="color: #64748b; vertical-align: top;"><strong>Phone / WhatsApp:</strong></td>
            <td style="color: #1e293b; font-weight: 700;">
              <a href="tel:${orderData.phone || ''}" style="color: #18422e; text-decoration: none;">${orderData.phone || 'Not provided'}</a>
            </td>
          </tr>
          <tr>
            <td style="color: #64748b; vertical-align: top;"><strong>Email:</strong></td>
            <td style="color: #1e293b;">${orderData.email || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="color: #64748b; vertical-align: top;"><strong>Delivery Address:</strong></td>
            <td style="color: #1e293b;">${orderData.address || 'Not provided'}, ${orderData.state || 'Lagos'} State, Nigeria</td>
          </tr>
          ${orderData.notes && orderData.notes !== 'None' ? `
          <tr>
            <td style="color: #64748b; vertical-align: top;"><strong>Special Notes:</strong></td>
            <td style="color: #b45309; font-style: italic;">${orderData.notes}</td>
          </tr>
          ` : ''}
        </table>

        <!-- Ordered Items Table -->
        <h3 style="font-size: 14px; color: #18422e; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px;">
          Items Ordered
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase;">Product</th>
              <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #475569; text-transform: uppercase;">Qty</th>
              <th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #475569; text-transform: uppercase;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Total Calculation Box -->
        <div style="background: #f8fafc; padding: 14px 18px; border-radius: 8px; margin-bottom: 22px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 4px;">
            <span>Subtotal:</span>
            <span>${formatNaira(orderData.subtotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 4px;">
            <span>Delivery:</span>
            <span>${deliveryText}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 17px; font-weight: 800; color: #18422e; border-top: 1.5px dashed #cbd5e1; padding-top: 8px; margin-top: 6px;">
            <span>Total Amount Due:</span>
            <span style="color: #15803d;">${formatNaira(orderData.total)}</span>
          </div>
        </div>

        <!-- Payment Info & Verification Notice -->
        <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
          <div style="font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 4px;">
            Payment Method: ${paymentText}
          </div>
          <div style="font-size: 12px; color: #15803d; line-height: 1.5;">
            <strong>Action Required:</strong> Check your instant Opay alert to verify credit of <strong>${formatNaira(orderData.total)}</strong> to <strong>Emokpae Remilekun Shukurat (9013255068)</strong> before dispatching package.
          </div>
        </div>

        <div style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 14px;">
          Remi Luxe Beauty • Luxury Botanical Skincare & Formulations • Lagos, Nigeria
        </div>
      </div>
    </div>
  `;
}

// Generate the Exact Rich HTML Confirmation Email Sent Directly to the Customer / Buyer
function generateCustomerConfirmationHtml(orderData, status, hasLogo) {
  const isDispatched = status === 'Dispatched / In Transit';
  const isDelivered = status === 'Delivered';

  let badgeText = "🟢 PAYMENT CONFIRMED & VERIFIED";
  let badgeColor = "#15803d";
  let badgeBg = "#f0fdf4";
  let badgeBorder = "#86efac";
  let statusHeading = "Payment Verified & Confirmed";
  let statusMessage = `Hello <strong>${orderData.name || 'Valued Customer'}</strong>,<br><br>Thank you for choosing <strong>Remi Luxe Beauty</strong>! We are pleased to confirm that your payment of <strong>${formatNaira(orderData.total)}</strong> for Order <strong>${orderData.orderRef}</strong> has been successfully verified.<br><br>Your order has officially been released to our formulation & fulfillment team. Your luxury skincare package is now being carefully prepared and packaged for delivery.`;

  if (isDispatched) {
    badgeText = "🔵 DISPATCHED & IN TRANSIT";
    badgeColor = "#1d4ed8";
    badgeBg = "#eff6ff";
    badgeBorder = "#93c5fd";
    statusHeading = "Package Handed Over to Dispatch Rider";
    statusMessage = `Hello <strong>${orderData.name || 'Valued Customer'}</strong>,<br><br>Exciting news! Your Remi Luxe Beauty order <strong>${orderData.orderRef}</strong> has been packaged and handed over to our delivery dispatch courier. Your package is currently on its way to your delivery destination.`;
  } else if (isDelivered) {
    badgeText = "🟣 DELIVERED & COMPLETED";
    badgeColor = "#7e22ce";
    badgeBg = "#faf5ff";
    badgeBorder = "#d8b4fe";
    statusHeading = "Order Delivered Successfully";
    statusMessage = `Hello <strong>${orderData.name || 'Valued Customer'}</strong>,<br><br>Your Remi Luxe Beauty order <strong>${orderData.orderRef}</strong> has been marked as delivered! We hope you love your new botanical skincare formulations. If you need any advice on your daily skincare routine, reach out to our concierge anytime.`;
  }

  const itemsRows = (orderData.items || []).map((it, idx) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b;">
        <strong>${idx + 1}. ${it.title}</strong>
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: center; color: #475569;">
        x${it.quantity}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: right; font-weight: 700; color: #18422e;">
        ${formatNaira(it.price * it.quantity)}
      </td>
    </tr>
  `).join('');

  const deliveryText = orderData.deliveryFee === 0
    ? '<span style="color: #15803d; font-weight: 700;">FREE</span>'
    : formatNaira(orderData.deliveryFee);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
      <!-- Brand Header with Logo & Gold Accent -->
      <div style="background: linear-gradient(135deg, #102e20 0%, #18422e 100%); padding: 28px 20px; text-align: center; color: #ffffff;">
        ${hasLogo ? `<img src="cid:storeLogo" alt="Remi Luxe Beauty Logo" style="width: 82px; height: 82px; border-radius: 50%; object-fit: cover; border: 3px solid #d4af37; box-shadow: 0 4px 12px rgba(0,0,0,0.25); display: block; margin: 0 auto 10px;">` : ''}
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.02em; color: #ffffff;">Remi Luxe Beauty</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">Official Customer Order Update</p>
      </div>

      <div style="padding: 26px 24px;">
        <!-- Status Notification Box -->
        <div style="background: ${badgeBg}; border: 1.5px solid ${badgeBorder}; border-radius: 10px; padding: 14px 18px; margin-bottom: 22px; text-align: center;">
          <div style="font-size: 12px; font-weight: 800; color: ${badgeColor}; letter-spacing: 0.05em; text-transform: uppercase;">
            ${badgeText}
          </div>
          <div style="font-size: 18px; font-weight: 800; color: #1e293b; margin-top: 4px;">
            ${statusHeading}
          </div>
        </div>

        <!-- Greeting & Notification Message -->
        <div style="font-size: 14.5px; line-height: 1.65; color: #334155; margin-bottom: 24px; background: #f8fafc; padding: 16px 18px; border-radius: 8px; border-left: 4px solid #18422e;">
          ${statusMessage}
        </div>

        <!-- Order Reference Box -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 22px;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td>
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Order Reference</div>
                <div style="font-size: 18px; font-weight: 800; color: #18422e; font-family: monospace;">${orderData.orderRef}</div>
              </td>
              <td style="text-align: right;">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Total Amount Paid</div>
                <div style="font-size: 18px; font-weight: 800; color: #15803d;">${formatNaira(orderData.total)}</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Next Steps: Preparation & Delivery -->
        <div style="background: #fdfaf6; border-left: 4px solid #C89B3C; padding: 14px 16px; border-radius: 6px; margin-bottom: 22px;">
          <div style="font-size: 13px; font-weight: 800; color: #78350f; text-transform: uppercase; margin-bottom: 4px;">
            📦 Delivery Release & Dispatch Timeline
          </div>
          <div style="font-size: 13px; color: #92400e; line-height: 1.55;">
            • <strong>Packaging:</strong> Formulations are safely packed in protective luxury boxes.<br>
            • <strong>Dispatch:</strong> Assigned to our courier riders for timely delivery.<br>
            • <strong>Rider Arrival:</strong> The rider will call / WhatsApp you before arriving at your doorstep.
          </div>
        </div>

        <!-- Delivery Destination -->
        <h3 style="font-size: 13px; color: #18422e; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px;">
          Delivery Destination
        </h3>
        <table style="width: 100%; font-size: 14px; margin-bottom: 22px; line-height: 1.6;">
          <tr>
            <td style="color: #64748b; width: 140px; vertical-align: top;"><strong>Recipient Name:</strong></td>
            <td style="color: #1e293b; font-weight: 700;">${orderData.name || 'Customer'}</td>
          </tr>
          <tr>
            <td style="color: #64748b; vertical-align: top;"><strong>Phone / WhatsApp:</strong></td>
            <td style="color: #1e293b;">${orderData.phone || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="color: #64748b; vertical-align: top;"><strong>Delivery Address:</strong></td>
            <td style="color: #1e293b; font-weight: 600;">${orderData.address || 'Not provided'}, ${orderData.state || 'Lagos'} State, Nigeria</td>
          </tr>
          ${orderData.notes && orderData.notes !== 'None' ? `
          <tr>
            <td style="color: #64748b; vertical-align: top;"><strong>Customer Notes:</strong></td>
            <td style="color: #b45309; font-style: italic;">${orderData.notes}</td>
          </tr>
          ` : ''}
        </table>

        <!-- Formulations Ordered Table -->
        <h3 style="font-size: 13px; color: #18422e; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px;">
          Formulations in this Package
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase;">Product</th>
              <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #475569; text-transform: uppercase;">Qty</th>
              <th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #475569; text-transform: uppercase;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Delivery & Pricing Summary Box -->
        <div style="background: #f8fafc; padding: 14px 18px; border-radius: 8px; margin-bottom: 22px;">
          <table style="width: 100%; font-size: 13px; color: #64748b; line-height: 1.8;">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right;">${formatNaira(orderData.subtotal)}</td>
            </tr>
            <tr>
              <td>Delivery / Shipping:</td>
              <td style="text-align: right; color: #b45309; font-weight: 600;">Paid on Delivery (By Receiver)</td>
            </tr>
            <tr style="font-size: 16px; font-weight: 800; color: #18422e; border-top: 1.5px dashed #cbd5e1; padding-top: 8px;">
              <td style="padding-top: 8px;">Total Verified & Paid:</td>
              <td style="text-align: right; color: #15803d; padding-top: 8px;">${formatNaira(orderData.total)}</td>
            </tr>
          </table>
        </div>

        <!-- WhatsApp Concierge Support Banner -->
        <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 10px; padding: 16px; text-align: center; margin-bottom: 20px;">
          <div style="font-size: 14px; font-weight: 700; color: #166534; margin-bottom: 4px;">
            Have Questions About Your Delivery?
          </div>
          <p style="font-size: 12.5px; color: #15803d; margin: 0 0 12px 0;">
            Our skincare concierge is on standby to assist you with order delivery updates, tracking, and skincare advice.
          </p>
          <a href="https://wa.me/2349013255068?text=${encodeURIComponent(`Hello Remi Luxe Beauty, I am inquiring about my confirmed order ${orderData.orderRef}`)}" style="display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 20px; border-radius: 30px; box-shadow: 0 2px 8px rgba(37,211,102,0.3);">
            💬 Chat with Store Concierge on WhatsApp
          </a>
        </div>

        <div style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 14px;">
          Remi Luxe Beauty • Luxury Botanical Skincare & Formulations • Lagos, Nigeria<br>
          Thank you for choosing radiant, nourished skin.
        </div>
      </div>
    </div>
  `;
}

// Dispatches Customer Confirmation / Status Email via Nodemailer
async function sendCustomerConfirmationEmail(orderData, status) {
  if (!orderData || !orderData.email || !orderData.email.includes('@') || orderData.email === 'Not provided') {
    console.log(`ℹ️ [CUSTOMER EMAIL SKIPPED] No customer email provided for order ${orderData?.orderRef}`);
    return { sent: false, reason: 'No customer email address on file' };
  }

  const logoPath = path.join(__dirname, 'images', 'logo-image.jpeg');
  const hasLogo = fs.existsSync(logoPath);
  const emailAttachments = hasLogo ? [{
    filename: 'remi-luxe-beauty-logo.jpeg',
    path: logoPath,
    cid: 'storeLogo'
  }] : [];

  const htmlBody = generateCustomerConfirmationHtml(orderData, status, hasLogo);

  let subject = `🎉 Payment Confirmed: Your Remi Luxe Beauty Order (${orderData.orderRef}) is Being Prepared!`;
  if (status === 'Dispatched / In Transit') {
    subject = `🚚 Order Dispatched: Your Remi Luxe Beauty Package (${orderData.orderRef}) is On Its Way!`;
  } else if (status === 'Delivered') {
    subject = `✨ Order Delivered: Thank You for Choosing Remi Luxe Beauty (${orderData.orderRef})!`;
  }

  console.log(`\n📧 [SENDING CUSTOMER EMAIL] Status: "${status}" | Ref: ${orderData.orderRef} -> ${orderData.email}`);
  const transporter = getEmailTransporter();
  const info = await transporter.sendMail({
    from: `"Remi Luxe Beauty" <${process.env.SMTP_USER || 'badmusdaniel0508@gmail.com'}>`,
    to: orderData.email,
    subject: subject,
    html: htmlBody,
    attachments: emailAttachments
  });

  console.log(`✅ [CUSTOMER EMAIL DELIVERED] Ref: ${orderData.orderRef} to ${orderData.email} (MessageId: ${info.messageId})`);
  return { sent: true, messageId: info.messageId, recipient: orderData.email };
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoint: Send Rich Order Email with Brand Logo (Picture 1 format)
  if (req.method === 'POST' && req.url === '/api/send-order-email') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const orderData = JSON.parse(body);
        const recipient = orderData.businessEmail || DEFAULT_ADMIN_EMAIL;
        console.log(`\n📧 [SENDING ORDER EMAIL] Ref: ${orderData.orderRef} to ${recipient}`);

        const logoPath = path.join(__dirname, 'images', 'logo-image.jpeg');
        const hasLogo = fs.existsSync(logoPath);

        const emailAttachments = hasLogo ? [{
          filename: 'remi-luxe-beauty-logo.jpeg',
          path: logoPath,
          cid: 'storeLogo'
        }] : [];

        const htmlBody = generateOrderHtml(orderData, hasLogo);
        const subject = `New Order: ${orderData.name || 'Customer'} (${orderData.orderRef}) - Remi Luxe Beauty`;

        const transporter = getEmailTransporter();
        const info = await transporter.sendMail({
          from: `"Remi Luxe Beauty Store" <${process.env.SMTP_USER || 'badmusdaniel0508@gmail.com'}>`,
          to: recipient,
          subject: subject,
          html: htmlBody,
          attachments: emailAttachments
        });

        console.log(`✅ [ORDER EMAIL DELIVERED] MessageId: ${info.messageId}`);

        // Also record to orders.json with deduplication by orderRef
        const ordersFile = path.join(__dirname, 'orders.json');
        let orders = [];
        if (fs.existsSync(ordersFile)) {
          try { orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8')); } catch(e) {}
        }
        const existingIdx = orders.findIndex(o => o.orderRef === orderData.orderRef);
        const orderEntry = { 
          ...orderData, 
          status: (existingIdx !== -1 && orders[existingIdx].status) ? orders[existingIdx].status : (orderData.status || 'Pending Verification'),
          receivedAt: (existingIdx !== -1 && orders[existingIdx].receivedAt) ? orders[existingIdx].receivedAt : new Date().toISOString() 
        };
        if (existingIdx !== -1) {
          orders[existingIdx] = orderEntry;
        } else {
          orders.unshift(orderEntry);
        }
        fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', messageId: info.messageId }));
      } catch (err) {
        console.error('❌ [ORDER EMAIL ERROR]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', error: err.message }));
      }
    });
    return;
  }

  // API Endpoint: Get All Customer Orders (for Admin Tracking Dashboard)
  if (req.method === 'GET' && req.url === '/api/orders') {
    const ordersFile = path.join(__dirname, 'orders.json');
    let orders = [];
    if (fs.existsSync(ordersFile)) {
      try { orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8')); } catch(e) {}
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(orders));
    return;
  }

  // API Endpoint: Update Order Tracking Status (Automatically dispatches customer confirmation email on Payment Confirmed)
  if (req.method === 'POST' && req.url === '/api/update-order-status') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { orderRef, status, customMessage } = JSON.parse(body);
        const ordersFile = path.join(__dirname, 'orders.json');
        let orders = [];
        if (fs.existsSync(ordersFile)) {
          try { orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8')); } catch(e) {}
        }
        const idx = orders.findIndex(o => o.orderRef === orderRef);
        if (idx !== -1) {
          const oldStatus = orders[idx].status;
          orders[idx].status = status;
          orders[idx].updatedAt = new Date().toISOString();
          fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), 'utf8');
          console.log(`📌 [ORDER STATUS UPDATED] Ref: ${orderRef} (${oldStatus} -> ${status})`);

          // Automatically send Customer Confirmation Email when status transitions to Payment Confirmed or Dispatched
          let customerEmailResult = { sent: false };
          if (status === 'Payment Confirmed' || status === 'Dispatched / In Transit' || status === 'Delivered') {
            try {
              customerEmailResult = await sendCustomerConfirmationEmail(orders[idx], status);
            } catch (mailErr) {
              console.error(`❌ [CUSTOMER EMAIL ERROR]:`, mailErr.message);
              customerEmailResult = { sent: false, error: mailErr.message };
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'success',
            order: orders[idx],
            customerEmail: customerEmailResult
          }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', message: 'Order reference not found' }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', error: err.message }));
      }
    });
    return;
  }

  // API Endpoint: Explicitly Send Customer Confirmation Email (for manual triggers or custom resends)
  if (req.method === 'POST' && req.url === '/api/send-customer-status-email') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { orderRef, status } = payload;

        let orderData = payload.orderData;
        if (!orderData) {
          const ordersFile = path.join(__dirname, 'orders.json');
          let orders = [];
          if (fs.existsSync(ordersFile)) {
            try { orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8')); } catch(e) {}
          }
          orderData = orders.find(o => o.orderRef === orderRef);
        }

        if (!orderData) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', message: 'Order not found' }));
          return;
        }

        const emailResult = await sendCustomerConfirmationEmail(
          orderData,
          status || orderData.status || 'Payment Confirmed'
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', ...emailResult }));
      } catch (err) {
        console.error('❌ [SEND CUSTOMER STATUS EMAIL ERROR]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', error: err.message }));
      }
    });
    return;
  }

  // API Endpoint: Delete Order Record
  if (req.method === 'POST' && req.url === '/api/delete-order') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { orderRef } = JSON.parse(body);
        const ordersFile = path.join(__dirname, 'orders.json');
        let orders = [];
        if (fs.existsSync(ordersFile)) {
          try { orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8')); } catch(e) {}
        }
        orders = orders.filter(o => o.orderRef !== orderRef);
        fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), 'utf8');
        console.log(`🗑️ [ORDER REMOVED] Ref: ${orderRef}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', message: 'Order removed successfully' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', error: err.message }));
      }
    });
    return;
  }

  // API Endpoint: Order Logging (Fallback)
  if (req.method === 'POST' && req.url === '/api/log-order') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const order = JSON.parse(body);
        console.log(`\n🛍️ [NEW ORDER LOGGED] Ref: ${order.orderRef} | Total: ${order.total} | Customer: ${order.name}`);
        
        const ordersFile = path.join(__dirname, 'orders.json');
        let orders = [];
        if (fs.existsSync(ordersFile)) {
          try { orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8')); } catch(e) {}
        }
        const existingIdx = orders.findIndex(o => o.orderRef === order.orderRef);
        const orderEntry = { 
          ...order, 
          status: (existingIdx !== -1 && orders[existingIdx].status) ? orders[existingIdx].status : (order.status || 'Pending Verification'),
          receivedAt: (existingIdx !== -1 && orders[existingIdx].receivedAt) ? orders[existingIdx].receivedAt : new Date().toISOString() 
        };
        if (existingIdx !== -1) {
          orders[existingIdx] = orderEntry;
        } else {
          orders.unshift(orderEntry);
        }
        fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', message: 'Order recorded successfully' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', error: err.message }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      const headers = { 'Content-Type': contentType };
      if (['.jpg', '.jpeg', '.png', '.svg', '.webp'].includes(ext)) {
        // High-performance image caching: 30 days immutable browser cache
        headers['Cache-Control'] = 'public, max-age=2592000, immutable';
      } else if (['.css', '.js'].includes(ext)) {
        // Assets caching: 1 day with stale-while-revalidate
        headers['Cache-Control'] = 'public, max-age=86400, stale-while-revalidate=604800';
      } else if (ext === '.html') {
        headers['Cache-Control'] = 'no-cache';
      }
      res.writeHead(200, headers);
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Remi Luxe Beauty Server running at http://localhost:${PORT}/`);
  console.log(`Connected Admin Email: ${DEFAULT_ADMIN_EMAIL}`);
});
