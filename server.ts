import express from "express";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import crypto from "crypto";
import { getApps, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc } from "firebase/firestore";

// Load environment variables
dotenv.config();

// Memory store for active server-verified admin sessions (highly secure, generated on startup)
export const activeAdminSessions = new Set<string>();

// Token Verification Helpers for Admin Security
async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    // 1. Check if it's a valid local server-verified session token first (zero configuration fallback)
    if (activeAdminSessions.has(token)) {
      return true;
    }
    
    // If it's a custom session token but not in active sessions, it's invalid
    if (token.startsWith("l3d_sess_")) {
      console.warn("[Server Auth] Invalid or expired custom session token.");
      return false;
    }

    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      console.warn("[Server Auth] firebase-applet-config.json not found.");
      return false;
    }
    const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const apiKey = configData.apiKey;
    if (!apiKey) {
      console.warn("[Server Auth] Firebase apiKey not found in config.");
      return false;
    }

    // Call Firebase Auth REST API to verify ID token
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ idToken: token })
    });

    if (!response.ok) {
      if (response.status === 400) {
        return false;
      }
      const errorText = await response.text();
      console.error(`[Server Auth] Token validation failed (Status: ${response.status}):`, errorText);
      console.error(`[Server Auth] Token being validated (length ${token.length}): ${token.substring(0, 20)}...`);
      return false;
    }

    const data = await response.json();
    const user = data.users?.[0];
    if (!user) return false;

    const email = user.email;
    const emailVerified = user.emailVerified;

    console.log(`[Server Auth] Authenticated user email: ${email} (verified: ${emailVerified})`);
    
    // Check that email is EXACTLY the owner's email
    return email === "lescreateurs3d@gmail.com";
  } catch (err) {
    console.error("[Server Auth] Exception verifying token:", err);
    return false;
  }
}

async function verifyAdminRequest(req: express.Request): Promise<boolean> {
  const authHeader = req.headers["authorization"] || req.headers["x-admin-token"];
  if (!authHeader) {
    console.warn("[Server Auth] Access rejected: Missing authorization header.");
    return false;
  }

  let token = "";
  if (typeof authHeader === "string") {
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }
  }

  if (!token) {
    console.warn("[Server Auth] Access rejected: Empty token.");
    return false;
  }

  return await verifyAdminToken(token);
}

async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const isAuthorized = await verifyAdminRequest(req);
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        error: "Accès refusé. Cette action nécessite d'être connecté avec le compte propriétaire (lescreateurs3d@gmail.com)." 
      });
    }
    next();
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: "Erreur de validation de l'autorisation serveur : " + err.message 
    });
  }
}

// Initialize server-side Firestore connection
let firestoreDb: any = null;
let adminDb: any = null;

function getAdminFirestoreDb() {
  if (adminDb) return adminDb;
  try {
    if (getApps().length === 0) {
      initializeAdminApp();
    }
    adminDb = getAdminFirestore();
    console.log("[Server Admin] Successfully initialized firebase-admin firestore.");
    return adminDb;
  } catch (err: any) {
    console.warn("[Server Admin] Could not initialize firebase-admin (likely running locally without ADC):", err.message);
  }
  return null;
}

function cleanForFirestoreServer(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestoreServer(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = cleanForFirestoreServer(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

function getFirestoreDb() {
  if (firestoreDb) return firestoreDb;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const firebaseApp = initializeApp(configData, "server-app");
      firestoreDb = getFirestore(firebaseApp, configData.firestoreDatabaseId);
      console.log("[Server] Connected to Firestore database ID:", configData.firestoreDatabaseId);
      return firestoreDb;
    } else {
      console.warn("[Server] firebase-applet-config.json not found.");
    }
  } catch (err) {
    console.error("[Server] Error initializing Firestore:", err);
  }
  return null;
}

async function getSkoolCourseIdFromFirestore(courseId: string): Promise<string | null> {
  try {
    const db = getFirestoreDb();
    if (!db) return null;
    const docRef = doc(db, "courses", courseId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(`[Server] Found course "${courseId}" in Firestore. skoolCourseId is "${data.skoolCourseId}"`);
      return data.skoolCourseId || null;
    } else {
      console.warn(`[Server] Course document "${courseId}" does not exist in Firestore.`);
    }
  } catch (err) {
    console.error(`[Server] Error getting course "${courseId}" from Firestore:`, err);
  }
  return null;
}

async function logStripeSaleToFirestore(email: string, courseId: string, session: Stripe.Checkout.Session) {
  try {
    const db = getFirestoreDb();
    if (!db) return;

    let courseTitle = courseId || "Formation Générique";
    const courses = getCoursesFromServer();
    const course = courses.find((c: any) => c.id === courseId);
    if (course) {
      courseTitle = course.title || course.name || courseTitle;
    } else {
      // Fetch from Firestore directly
      try {
        const courseDocRef = doc(db, "courses", courseId);
        const courseSnap = await getDoc(courseDocRef);
        if (courseSnap.exists()) {
          courseTitle = courseSnap.data().title || courseSnap.data().name || courseTitle;
        }
      } catch (e) {
        console.error("[Server] Error getting course name from Firestore:", e);
      }
    }

    await addDoc(collection(db, "analytics_events"), {
      type: "action",
      page: "stripe_webhook",
      action: "buy_course_success",
      details: courseTitle,
      email: email,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency?.toUpperCase() || "EUR",
      visitorId: "stripe_webhook_" + (session.id || "unknown"),
      device: "desktop",
      referrer: "stripe",
      timestamp: new Date()
    });
    console.log(`[Server] Webhook logged successful sale in Firestore for "${courseTitle}" (${email})`);
  } catch (err) {
    console.error("[Server] Error logging sale to Firestore:", err);
  }
}

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

      // If this session has a subscription, check if it's an installment plan and auto-limit it
      if (session.subscription) {
        try {
          const stripe = getStripe();
          const subId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subId);
          const priceId = subscription.items.data[0]?.price?.id;
          if (priceId) {
            const price = await stripe.prices.retrieve(priceId);
            if (price.metadata && price.metadata.type === "installments") {
              const installmentsCount = parseInt(price.metadata.installmentsCount || "3", 10);
              console.log(`[Webhook] Detected installment subscription ${subId}. Restricting to ${installmentsCount} cycles.`);
              
              const schedule = await stripe.subscriptionSchedules.create({
                from_subscription: subId,
              });

              const phases = schedule.phases.map((phase) => ({
                items: phase.items.map(item => ({
                  price: typeof item.price === "string" ? item.price : item.price.id,
                  quantity: item.quantity,
                })),
                iterations: installmentsCount,
                start_date: phase.start_date,
              }));

              await stripe.subscriptionSchedules.update(schedule.id, {
                end_behavior: "cancel",
                phases: phases,
              });
              console.log(`[Webhook] Successfully restricted subscription schedule ${schedule.id} to ${installmentsCount} iterations with auto-cancel.`);
            }
          }
        } catch (subErr: any) {
          console.error("[Webhook Error] Failed to configure installments schedule:", subErr.message);
        }
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

      // Log the purchase event asynchronously to Firestore for Analytics/Admin
      logStripeSaleToFirestore(email, courseId || "", session).catch(err => {
        console.error("[Webhook] Failed to log sale to Firestore asynchronously:", err);
      });

      if (!courseId) {
        console.warn("[Webhook] Could not map purchase to any known course ID.");
        return res.json({ received: true, error: "Course ID not found in metadata" });
      }

      // Find the mapped Skool course ID
      let skoolCourseId = await getSkoolCourseIdFromFirestore(courseId);

      if (!skoolCourseId) {
        console.log(`[Webhook] Falling back to courses.json lookup for courseId "${courseId}"`);
        const courses = getCoursesFromServer();
        const course = courses.find((c: any) => c.id === courseId);
        skoolCourseId = course?.skoolCourseId;
      }

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
app.post("/api/upload-video", requireAdmin, upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

app.use(express.json());

// Admin Login Route: Verifies passcode and returns a secure local session token
app.post("/api/admin/login-password", (req, res) => {
  try {
    const { password } = req.body;
    // Default password is 'admin3d' or can be configured via ADMIN_PASSWORD environment variable
    const adminPassword = process.env.ADMIN_PASSWORD || "admin3d";

    if (password === adminPassword) {
      // Generate a cryptographically secure token
      const sessionToken = "l3d_sess_" + crypto.randomBytes(24).toString("hex");
      activeAdminSessions.add(sessionToken);
      console.log("[Server Auth] Admin logged in with passcode, session created.");
      return res.json({ success: true, token: sessionToken });
    } else {
      return res.status(401).json({ success: false, error: "Mot de passe incorrect. Veuillez réessayer." });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Erreur serveur : " + err.message });
  }
});

// Admin Logout Route: Invalidates the local session token
app.post("/api/admin/logout", (req, res) => {
  try {
    const authHeader = req.headers["authorization"] || req.headers["x-admin-token"];
    if (authHeader && typeof authHeader === "string") {
      const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
      if (activeAdminSessions.has(token)) {
        activeAdminSessions.delete(token);
        console.log("[Server Auth] Admin session invalidated.");
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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

app.post("/api/courses", requireAdmin, async (req, res) => {
  try {
    const courses = req.body;
    if (Array.isArray(courses)) {
      saveCoursesToServer(courses);
      
      // Also write directly to Firestore using firebase-admin SDK if available!
      try {
        const db = getAdminFirestoreDb();
        if (db) {
          console.log("[Server Admin] Syncing courses to Firestore...");
          const snapshot = await db.collection("courses").get();
          const existingIds = snapshot.docs.map((d: any) => d.id);
          const incomingIds = courses.map((c: any) => c.id);
          
          // Delete courses that are not in the incoming list
          for (const docId of existingIds) {
            if (!incomingIds.includes(docId)) {
              await db.collection("courses").doc(docId).delete();
              console.log(`[Server Admin] Deleted course "${docId}" from Firestore.`);
            }
          }
          
          // Save or update incoming courses
          for (const course of courses) {
            const cleaned = cleanForFirestoreServer(course);
            await db.collection("courses").doc(course.id).set(cleaned, { merge: true });
          }
          console.log("[Server Admin] Successfully synced courses to Firestore.");
        }
      } catch (adminErr: any) {
        console.error("[Server Admin] Error syncing to Firestore via admin SDK:", adminErr.message);
      }

      return res.json({ success: true, count: courses.length });
    }
    res.status(400).json({ error: "Le corps de la requête doit être un tableau de cours." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Stripe Sales: Fetch real paid checkout sessions directly from Stripe
app.get("/api/admin/stripe-sales", requireAdmin, async (req, res) => {
  try {
    const stripe = getStripe();
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
    });

    const sales = sessions.data
      .filter((session) => session.payment_status === "paid")
      .map((session) => {
        const email = session.customer_details?.email || session.customer_email || "Inconnu";
        const amount = session.amount_total ? session.amount_total / 100 : 0;
        const currency = session.currency?.toUpperCase() || "EUR";
        const date = new Date(session.created * 1000).toISOString();
        
        // Determine course name
        let courseName = session.metadata?.courseId || "Formation";
        const courses = getCoursesFromServer();
        const mappedCourse = courses.find((c: any) => c.id === courseName || c.skoolCourseId === courseName);
        if (mappedCourse) {
          courseName = mappedCourse.title;
        }

        return {
          id: session.id,
          email,
          amount,
          currency,
          date,
          courseName,
        };
      });

    res.json({ success: true, sales });
  } catch (error: any) {
    console.error("[Stripe Sales API] Error fetching sessions:", error.message);
    res.json({ success: false, error: error.message, sales: [] });
  }
});

// 2. Sync Course with Stripe: Automatically creates Product, Price & Payment Links
app.post("/api/stripe/sync-course", requireAdmin, async (req, res) => {
  try {
    const { id, title, slogan, price, originalPrice, installmentsEnabled, installmentsCount, installmentsPrice, installmentsPromoPrice } = req.body;
    
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

    const count = Number(installmentsCount || 3);
    const monthlyPrice = installmentsPrice ? Number(installmentsPrice) : (Number(price) / count);
    const productName = installmentsEnabled ? `${title} (Paiement en ${count} fois)` : title;
    const productDescription = installmentsEnabled 
      ? `Paiement en ${count} mensualités` 
      : (slogan || undefined);

    if (foundProduct) {
      // Update existing product to keep it in sync
      stripeProduct = await stripe.products.update(foundProduct.id, {
        name: productName,
        description: productDescription,
      });
      console.log(`Found existing Stripe product: ${stripeProduct.id}`);
    } else {
      // Create new product
      stripeProduct = await stripe.products.create({
        name: productName,
        description: productDescription,
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

    // Step E: Create Installments Price & Payment Link if installments are enabled
    let stripeInstallmentsLinkUrl = "";
    let stripeInstallmentsPromoLinkUrl = "";
    if (installmentsEnabled) {
      const count = Number(installmentsCount || 3);
      
      // Standard Installments
      const monthlyPrice = installmentsPrice ? Number(installmentsPrice) : (Number(baseAmount / 100) / count);
      const monthlyAmount = Math.round(monthlyPrice * 100);

      const installmentsPriceObj = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: monthlyAmount,
        currency: "eur",
        recurring: { interval: "month", interval_count: 1 },
        metadata: { type: "installments", courseId: id, installmentsCount: String(count) }
      });

      const installmentsPaymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: installmentsPriceObj.id, quantity: 1 }],
        allow_promotion_codes: true,
        metadata: { courseId: id, type: "installments", installmentsCount: String(count) }
      });
      stripeInstallmentsLinkUrl = installmentsPaymentLink.url;

      // Promo Installments
      if (installmentsPromoPrice) {
        const monthlyPromoAmount = Math.round(Number(installmentsPromoPrice) * 100);
        const installmentsPromoPriceObj = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: monthlyPromoAmount,
          currency: "eur",
          recurring: { interval: "month", interval_count: 1 },
          metadata: { type: "installments_promo", courseId: id, installmentsCount: String(count) }
        });

        const installmentsPromoPaymentLink = await stripe.paymentLinks.create({
          line_items: [{ price: installmentsPromoPriceObj.id, quantity: 1 }],
          allow_promotion_codes: true,
          metadata: { courseId: id, type: "installments_promo", installmentsCount: String(count) }
        });
        stripeInstallmentsPromoLinkUrl = installmentsPromoPaymentLink.url;
      }
    }

    res.json({
      success: true,
      stripeStandardLink: standardPaymentLink.url,
      stripePromoLink: promoPaymentLinkUrl || standardPaymentLink.url,
      stripeInstallmentsLink: stripeInstallmentsLinkUrl,
      stripeInstallmentsPromoLink: stripeInstallmentsPromoLinkUrl || stripeInstallmentsLinkUrl,
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
app.post("/api/stripe/sync-promo", requireAdmin, async (req, res) => {
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
