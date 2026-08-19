// ============================================================
// Smart Konstruksi — Contact Form API (Public)
// ============================================================

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendContactEmail, type ContactFormData } from "@/lib/email";

// Rate limiting: in-memory store (MVP, not production-grade)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 3; // 3 requests per window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// Validation schema
const contactFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  projectType: z.enum([
    "General Construction",
    "Renovation & Remodeling",
    "Engineering & Consultation",
    "Project Management",
    "Fit-Out & Interior Works",
    "Maintenance & Aftercare",
    "Other",
  ]),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// POST /api/contact — Submit contact form
export async function POST(request: Request) {
  try {
    // Get client IP (for rate limiting)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return Response.json(
        {
          success: false,
          message: "Too many requests. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = contactFormSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues.map((i) => i.message).join(", ");
      return Response.json(
        {
          success: false,
          message: errors,
        },
        { status: 400 }
      );
    }

    const data: ContactFormData = validation.data;

    // Fetch company email from CompanyProfile
    const profile = await prisma.companyProfile.findFirst();

    if (!profile?.email) {
      return Response.json(
        {
          success: false,
          message: "Company email not configured. Please contact administrator.",
        },
        { status: 500 }
      );
    }

    // Send email
    const result = await sendContactEmail(data, profile.email);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          message: result.error || "Failed to send email. Please try again.",
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Thank you. We will contact you soon.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return Response.json(
      {
        success: false,
        message: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}
