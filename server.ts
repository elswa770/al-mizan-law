import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import path from "path";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Paymob Authentication Step 1
  const authenticatePaymob = async () => {
    try {
      const response = await axios.post("https://accept.paymob.com/api/auth/tokens", {
        api_key: process.env.PAYMOB_API_KEY,
      });
      return response.data.token;
    } catch (error) {
      console.error("Paymob auth error:", error);
      throw error;
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 1. Checkout Route (Creates order and returns iframe URL)
  app.post("/api/paymob/checkout", async (req, res) => {
    try {
      const { amount, firmId, planId, billingData } = req.body;

      if (!process.env.PAYMOB_API_KEY || !process.env.PAYMOB_INTEGRATION_ID || !process.env.PAYMOB_IFRAME_ID) {
        return res.status(500).json({ error: "Paymob credentials not configured" });
      }

      // Step 1: Authentication
      const authToken = await authenticatePaymob();

      // Step 2: Order Registration
      const orderResponse = await axios.post("https://accept.paymob.com/api/ecommerce/orders", {
        auth_token: authToken,
        delivery_needed: "false",
        amount_cents: amount * 100, // Amount in cents
        currency: "EGP",
        merchant_order_id: `FIRM_${firmId}_PLAN_${planId}_${Date.now()}`,
        items: [],
      });
      const orderId = orderResponse.data.id;

      // Step 3: Payment Key Generation
      const paymentKeyResponse = await axios.post("https://accept.paymob.com/api/acceptance/payment_keys", {
        auth_token: authToken,
        amount_cents: amount * 100,
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: "NA",
          email: billingData.email || "test@example.com",
          floor: "NA",
          first_name: billingData.firstName || "Firm",
          street: "NA",
          building: "NA",
          phone_number: billingData.phone || "+201000000000",
          shipping_method: "NA",
          postal_code: "NA",
          city: "Cairo",
          country: "EG",
          last_name: billingData.lastName || "Admin",
          state: "NA",
        },
        currency: "EGP",
        integration_id: process.env.PAYMOB_INTEGRATION_ID,
      });
      const paymentToken = paymentKeyResponse.data.token;

      // Construct Iframe URL
      const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;

      res.json({ iframeUrl });
    } catch (error: any) {
      console.error("Checkout error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to initialize payment" });
    }
  });

  // 2. Webhook Route (Receives payment status from Paymob)
  app.post("/api/paymob/webhook", async (req, res) => {
    try {
      // In a real app, verify HMAC signature here using process.env.PAYMOB_HMAC
      const { obj } = req.body;
      
      if (obj && obj.success === true) {
        const merchantOrderId = obj.order.merchant_order_id;
        // Format: FIRM_{firmId}_PLAN_{planId}_{timestamp}
        const parts = merchantOrderId.split('_');
        const firmId = parts[1];
        const planId = parts[3];

        console.log(`Payment successful for firm ${firmId}, plan ${planId}`);
        // Here you would typically update the firm's subscription status in Firestore
        // However, since we are in the backend and Firebase Admin SDK is not set up,
        // we rely on the client-side callback for the prototype, or you can set up Admin SDK.
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).send("Error");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
