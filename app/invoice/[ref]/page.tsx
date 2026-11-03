import type { Metadata } from 'next';
import InvoiceViewClient from './InvoiceViewClient';

interface InvoicePageProps {
  params: Promise<{ ref: string }>;
}

export async function generateMetadata({ params }: InvoicePageProps): Promise<Metadata> {
  const { ref } = await params;
  return {
    title: `Tax Invoice ${ref.toUpperCase()} | Mahastays`,
    description: `Official GST Tax Invoice and booking receipt for Mahastays reservation ${ref}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { ref } = await params;
  return <InvoiceViewClient refCode={ref} />;
}
