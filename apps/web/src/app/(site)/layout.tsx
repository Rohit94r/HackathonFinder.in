import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

/** Site chrome for every page except the landing page. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
