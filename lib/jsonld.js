// schema.org structured data for CivicWatch. Keep claims identical to the
// visible copy on /pro and the landing page (no scoring or coverage claims
// beyond what those pages say). Pricing: Free + Pro $9.99/mo (monthly only).
const SITE = 'https://www.civicwatch.app'

export const ORGANIZATION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: 'CivicWatch',
  url: SITE,
  logo: `${SITE}/icon-512.png`,
  description:
    'CivicWatch collects the stock trades members of Congress disclose under the STOCK Act and shows them next to their votes and wealth filings.',
}

export const WEBSITE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  name: 'CivicWatch',
  url: SITE,
  publisher: { '@id': `${SITE}/#organization` },
}

export const SOFTWARE_APPLICATION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': `${SITE}/#app`,
  name: 'CivicWatch',
  url: SITE,
  applicationCategory: 'GovernmentApplication',
  operatingSystem: 'Web',
  description:
    'Congressional accountability tracker: STOCK Act trade disclosures, voting records and wealth filings for every member of Congress, with a free committee conflict score and tier on each profile.',
  publisher: { '@id': `${SITE}/#organization` },
  offers: [
    {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'USD',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '9.99',
      priceCurrency: 'USD',
      url: `${SITE}/pro`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '9.99',
        priceCurrency: 'USD',
        billingDuration: 1,
        unitCode: 'MON',
      },
    },
  ],
}

// Build FAQPage JSON-LD from the same {q, a} array the page renders, so the
// markup can never drift from the visible FAQ.
export function faqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}
