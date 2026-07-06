import express from "express";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

let myDirname = process.cwd();

try {
  if (typeof import.meta !== "undefined" && import.meta && import.meta.url) {
    const myFilename = fileURLToPath(import.meta.url);
    myDirname = path.dirname(myFilename);
  }
} catch (e) {
  // Safe fallback to process.cwd()
}

// Local JSON Storage for Course mappings (essential for the Stripe/Skool webhook resolver)
// Check multiple fallbacks for Vercel Serverless Function compatibility
const getCoursesFilePath = (): string => {
  const candidatePaths = [
    path.join(process.cwd(), "courses.json"),
    path.join(process.cwd(), "api", "courses.json"),
    path.join(myDirname, "courses.json"),
    path.join(myDirname, "..", "courses.json"),
    path.join(myDirname, "api", "courses.json")
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      console.log(`[Server] Found courses.json at: ${p}`);
      return p;
    }
  }
  // Default fallback
  return path.join(process.cwd(), "courses.json");
};

const COURSES_FILE = getCoursesFilePath();

function getCoursesFromServer(): any[] {
  try {
    if (fs.existsSync(COURSES_FILE)) {
      const data = fs.readFileSync(COURSES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading courses.json:", err);
  }
  return [];
}

function saveCoursesToServer(courses: any[]) {
  try {
    fs.writeFileSync(COURSES_FILE, JSON.stringify(courses, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing courses.json:", err);
  }
}

// Lazy-loaded Stripe Client helper
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  const isValidPrefix = apiKey && (apiKey.startsWith("sk_") || apiKey.startsWith("rk_"));
  if (!apiKey || apiKey.trim() === "" || apiKey.startsWith("mk_") || !isValidPrefix) {
    throw new Error("Clé secrète Stripe invalide ou absente (elle doit commencer par 'sk_' ou 'rk_'). Veuillez renseigner votre vraie clé secrète ou clé restreinte dans le panneau des Secrets de l'application.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(apiKey, {
      apiVersion: "2025-01-27.acacia" as any, // Standard stable API version
    });
  }
  return stripeClient;
}

// 1. Stripe Webhook Endpoint (MUST be configured BEFORE express.json() to prevent raw body parsing issues)
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event: Stripe.Event;

    try {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (webhookSecret && sig) {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        console.log(`[Webhook] Signature verified: ${event.type}`);
      } else {
        // Fallback for development/simulation
        event = JSON.parse(req.body.toString());
        console.log(`[Webhook] Processing in signature-free test mode: ${event.type}`);
      }
    } catch (err: any) {
      console.error(`[Webhook Error] ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = (session.customer_details?.email || session.customer_email || "").trim();

      if (!email) {
        console.error("[Webhook] No customer email found in checkout session.");
        return res.status(400).send("No email found in session");
      }

      // Try to determine courseId
      let courseId = session.metadata?.courseId;

      // Check payment link metadata if available
      if (!courseId && session.payment_link) {
        try {
          const stripe = getStripe();
          const pl = await stripe.paymentLinks.retrieve(session.payment_link as string);
          courseId = pl.metadata?.courseId;
        } catch (e) {
          console.error("[Webhook] Error retrieving payment link metadata:", e);
        }
      }

      // Look up via line items if still not found
      if (!courseId) {
        try {
          const stripe = getStripe();
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          if (lineItems.data.length > 0) {
            const firstItem = lineItems.data[0];
            const priceId = firstItem.price?.id;
            if (priceId) {
              const price = await stripe.prices.retrieve(priceId);
              courseId = price.metadata?.courseId;
              if (!courseId && price.product) {
                const product = await stripe.products.retrieve(price.product as string);
                courseId = product.metadata?.courseId;
              }
            }
          }
        } catch (e) {
          console.error("[Webhook] Error retrieving line items metadata:", e);
        }
      }

      console.log(`[Webhook] Resolved purchase for email: "${email}" and courseId: "${courseId}"`);

      if (!courseId) {
        console.warn("[Webhook] Could not map purchase to any known course ID.");
        return res.json({ received: true, error: "Course ID not found in metadata" });
      }

      // Find the mapped Skool course ID in our server list
      const courses = getCoursesFromServer();
      const course = courses.find((c: any) => c.id === courseId);
      const skoolCourseId = course?.skoolCourseId;

      if (!skoolCourseId) {
        console.warn(`[Webhook] Course "${courseId}" does not have a mapped Skool Course ID. Invitation skipped.`);
        return res.json({ received: true, message: "No Skool Course ID configured for this course" });
      }

      const skoolApiKey = process.env.SKOOL_API_KEY;
      const skoolGroupId = process.env.SKOOL_GROUP_ID;

      if (!skoolApiKey || !skoolGroupId) {
        const msg = "[Webhook] SKOOL_API_KEY or SKOOL_GROUP_ID not configured. Logging invitation simulation.";
        console.log(msg);
        return res.json({
          received: true,
          message: "Simulated invitation successfully",
          simulation: {
            skoolGroup: skoolGroupId || "mock-group-id",
            targetEmail: email,
            courseUnlocked: skoolCourseId
          }
        });
      }

      // Direct Webhook Integration with Skool API!
      try {
        console.log(`[Webhook] Sending invitation to Skool API: Group: ${skoolGroupId}, Email: ${email}, Course: ${skoolCourseId}`);
        const skoolResponse = await fetch(`https://api.skool.com/v1/groups/${skoolGroupId}/invites`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${skoolApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email,
            course_ids: [skoolCourseId]
          })
        });

        const skoolData = await skoolResponse.json();
        console.log(`[Webhook] Skool API Response status ${skoolResponse.status}:`, skoolData);

        if (!skoolResponse.ok) {
          return res.status(502).json({
            error: "Skool API Error",
            status: skoolResponse.status,
            details: skoolData
          });
        }

        return res.json({ received: true, skoolInviteSent: true, details: skoolData });
      } catch (skoolErr: any) {
        console.error("[Webhook] Failed to call Skool invites API:", skoolErr);
        return res.status(500).json({ error: "Failed to call Skool API", message: skoolErr.message });
      }
    }

    res.json({ received: true });
  }
);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Upload route
app.post("/api/upload-video", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

app.use(express.json());

// 1. Config API: Check if Stripe and Skool are configured
app.get("/api/config", (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY || "";
  const isValidStripePrefix = stripeKey.startsWith("sk_") || stripeKey.startsWith("rk_");
  const stripeConfigured = stripeKey.trim() !== "" && !stripeKey.startsWith("mk_") && isValidStripePrefix;
  const skoolApiKey = process.env.SKOOL_API_KEY || "";
  const skoolConfigured = skoolApiKey.trim() !== "" && !!process.env.SKOOL_GROUP_ID;
  res.json({
    stripeConfigured,
    skoolConfigured,
    stripeMessage: stripeConfigured 
      ? "Stripe est entièrement configuré pour la synchronisation automatique."
      : "La clé secrète Stripe (STRIPE_SECRET_KEY) est invalide, absente ou est une clé factice (ex: commençant par 'mk_'). Renseignez une vraie clé secrète commençant par 'sk_' ou 'rk_' dans le panneau des Secrets de l'application.",
    skoolMessage: skoolConfigured
      ? "School (Skool) est entièrement connecté pour les invitations automatiques."
      : "La clé d'API School (SKOOL_API_KEY) ou l'identifiant de groupe (SKOOL_GROUP_ID) est absent dans le panneau des Secrets."
  });
});

// 2. Courses APIs: Retrieve and update course mappings
app.get("/api/courses", (req, res) => {
  const courses = getCoursesFromServer();
  res.json(courses);
});

app.post("/api/courses", (req, res) => {
  try {
    const courses = req.body;
    if (Array.isArray(courses)) {
      saveCoursesToServer(courses);
      return res.json({ success: true, count: courses.length });
    }
    res.status(400).json({ error: "Le corps de la requête doit être un tableau de cours." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Sync Course with Stripe: Automatically creates Product, Price & Payment Links
app.post("/api/stripe/sync-course", async (req, res) => {
  try {
    const { id, title, slogan, price, originalPrice } = req.body;
    
    if (!id || !title || !price) {
      return res.status(400).json({ error: "id, title and price are required." });
    }

    const stripe = getStripe();
    console.log(`Syncing course with Stripe: "${title}" (ID: ${id})`);

    // Step A: Find or Create Product in Stripe
    let stripeProduct: Stripe.Product;
    const existingProducts = await stripe.products.list({
      limit: 100,
      active: true,
    });
    
    // Find product by metadata courseId
    const foundProduct = existingProducts.data.find(
      p => p.metadata && p.metadata.courseId === id
    );

    if (foundProduct) {
      // Update existing product to keep it in sync
      stripeProduct = await stripe.products.update(foundProduct.id, {
        name: title,
        description: slogan || undefined,
      });
      console.log(`Found existing Stripe product: ${stripeProduct.id}`);
    } else {
      // Create new product
      stripeProduct = await stripe.products.create({
        name: title,
        description: slogan || undefined,
        metadata: {
          courseId: id,
        },
      });
      console.log(`Created new Stripe product: ${stripeProduct.id}`);
    }

    // Step B: Create Price for Standard Price (originalPrice)
    const baseAmount = Math.round(Number(originalPrice || price) * 100);
    const standardPrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: baseAmount,
      currency: "eur",
      metadata: {
        type: "standard",
        courseId: id,
      }
    });
    console.log(`Created Stripe standard price: ${standardPrice.id} (${baseAmount / 100} EUR)`);

    // Step C: Create Standard Payment Link
    const standardPaymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: standardPrice.id,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      metadata: {
        courseId: id,
        type: "standard",
      }
    });
    console.log(`Created Stripe standard payment link: ${standardPaymentLink.url}`);

    // Step D: Create Promo Price & Promo Payment Link if there's an active promo price set
    let promoPaymentLinkUrl = "";
    const promoAmount = Math.round(Number(price) * 100);
    
    if (promoAmount < baseAmount) {
      const promoPrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: promoAmount,
        currency: "eur",
        metadata: {
          type: "promo",
          courseId: id,
        }
      });
      console.log(`Created Stripe promo price: ${promoPrice.id} (${promoAmount / 100} EUR)`);

      const promoPaymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price: promoPrice.id,
            quantity: 1,
          },
        ],
        allow_promotion_codes: true,
        metadata: {
          courseId: id,
          type: "promo",
        }
      });
      promoPaymentLinkUrl = promoPaymentLink.url;
      console.log(`Created Stripe promo payment link: ${promoPaymentLink.url}`);
    }

    res.json({
      success: true,
      stripeStandardLink: standardPaymentLink.url,
      stripePromoLink: promoPaymentLinkUrl || standardPaymentLink.url,
      message: `Successfully synchronized "${title}" with Stripe! Links generated automatically.`
    });

  } catch (error: any) {
    console.error("Stripe course sync error:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred while syncing with Stripe." 
    });
  }
});

// 3. Sync Promo Code / Coupon with Stripe
app.post("/api/stripe/sync-promo", async (req, res) => {
  try {
    const { code, discountType, discountValue } = req.body;

    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ error: "code, discountType and discountValue are required." });
    }

    const stripe = getStripe();
    const codeUpper = code.trim().toUpperCase();
    console.log(`Syncing promo code with Stripe: "${codeUpper}"`);

    // Check if Promo Code / Coupon already exists
    try {
      const existingCoupon = await stripe.coupons.retrieve(codeUpper);
      if (existingCoupon) {
        console.log(`Coupon ${codeUpper} already exists on Stripe.`);
        return res.json({
          success: true,
          message: `Le code promo "${codeUpper}" existe déjà sur votre compte Stripe !`
        });
      }
    } catch (e) {
      // Coupon doesn't exist, proceed to create it
    }

    // Step A: Create Coupon in Stripe
    const couponParams: Stripe.CouponCreateParams = {
      id: codeUpper,
      duration: "forever",
      name: `${discountType === "percentage" ? `${discountValue}%` : `${discountValue} €`} de réduction`,
    };

    if (discountType === "percentage") {
      couponParams.percent_off = Number(discountValue);
    } else {
      couponParams.amount_off = Math.round(Number(discountValue) * 100);
      couponParams.currency = "eur";
    }

    const stripeCoupon = await stripe.coupons.create(couponParams);
    console.log(`Created Stripe coupon: ${stripeCoupon.id}`);

    // Step B: Create customer-facing promotion code (coupon code)
    const promotionCode = await (stripe.promotionCodes.create as any)({
      coupon: stripeCoupon.id,
      code: codeUpper,
    });
    console.log(`Created Stripe promotion code: ${promotionCode.code}`);

    res.json({
      success: true,
      message: `Code promo "${codeUpper}" créé avec succès et synchronisé sur Stripe !`
    });

  } catch (error: any) {
    console.error("Stripe promo sync error:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred while syncing promo code with Stripe." 
    });
  }
});

// Serve frontend assets & configure Dev Server
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on http://localhost:${PORT}`);
  });
};

// Only run standalone server if not on Vercel serverless environment
if (!process.env.VERCEL) {
  startServer();
}

export default app;
