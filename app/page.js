import LandingNav from "@/components/landing/navbar";
import LandingMotion from "@/components/landing/landing-motion";
import Hero from "@/components/landing/hero";
import { About, Services, HowItWorks, Platform } from "@/components/landing/sections";
import { ContactCta, FinalCta, Footer } from "@/components/landing/contact";
import { prisma } from "@/lib/prisma";
import "@/components/landing/landing.css";

export const revalidate = 60;

const PROFILE_FALLBACK = {
  companyName: "PT Kita Satu Intersolusi",
  tagline: "Integrated construction with digital project control.",
  address: null,
  phone: "+62 21 0000 0000",
  email: "info@ksi.co.id",
  website: null,
  logoUrl: null,
};

async function getCompanyProfile() {
  try {
    const profile = await prisma.companyProfile.findUnique({
      where: { id: "company" },
    });
    return { ...PROFILE_FALLBACK, ...(profile ?? {}) };
  } catch {
    return PROFILE_FALLBACK;
  }
}

export const metadata = {
  title: "PT Kita Satu Intersolusi — Construction Under Control",
  description:
    "Integrated construction services powered by Smart Konstruksi to manage budgets, progress, materials, finance, and project reporting in one system.",
};

export default async function LandingPage() {
  const profile = await getCompanyProfile();

  return (
    <div className="ks-page">
      <LandingMotion />
      <LandingNav />
      <main>
        <Hero />
        <About />
        <Services />
        <HowItWorks />
        <Platform />
        <ContactCta profile={profile} />
        <FinalCta />
      </main>
      <Footer profile={profile} />
    </div>
  );
}
