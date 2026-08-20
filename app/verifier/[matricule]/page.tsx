import type { Metadata } from 'next'
import { CertificateVerification } from '@/components/clyde/public/certificate-verification'
import { PageShell } from '@/components/clyde/pages/page-shell'

export const metadata: Metadata = {
  title: 'Vérifier un certificat — CLYDE',
  description: 'Registre de vérification des certificats délivrés par l’Usine CLYDE.',
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ matricule: string }>
}) {
  const { matricule } = await params

  return (
    <PageShell>
      <CertificateVerification matricule={matricule} />
    </PageShell>
  )
}
