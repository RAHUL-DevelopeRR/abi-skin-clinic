import { BRANCHES, CLINIC, DOCTOR, FAQS, SITE_URL, branchMapLink } from '../data/clinic.js';

/** Must match <title> and the meta description in index.html (checked by tests/seo.test.js). */
export const PAGE_TITLE = 'Dermatologist in Karur & Velayuthampalayam | Abi Skin & Hair Clinic';
export const PAGE_DESCRIPTION = 'Dr. G. Srinivasan (MBBS, DD): skin, hair & laser clinic in Karur & Velayuthampalayam for acne, hair loss, psoriasis, vitiligo & laser hair removal. Book online.';

const id = (name) => `${SITE_URL}/#${name}`;
const ref = (name) => ({ '@id': id(name) });

const DERMATOLOGY = 'https://schema.org/Dermatology';

// Conditions and procedures listed in the Treatments section of the page.
const CONDITIONS = [
  'Acne', 'Acne scars', 'Pigmentation', 'Psoriasis', 'Eczema', 'Vitiligo', 'Urticaria', 'Lichen planus',
  'Fungal skin infections', 'Nail diseases', 'Warts', 'Hair loss', 'Alopecia',
];
const PROCEDURES = [
  { type: 'MedicalProcedure', name: 'Laser and IPL unwanted hair removal' },
  { type: 'MedicalProcedure', name: 'Pigmentation and acne scar laser treatment' },
  { type: 'MedicalProcedure', name: 'Laser removal of facial warts and tattoos' },
  { type: 'MedicalTherapy', name: 'Liquid nitrogen cryotherapy for warts' },
  { type: 'MedicalTherapy', name: 'Acne, pigmentation and acne scar treatment' },
  { type: 'MedicalTherapy', name: 'Psoriasis and eczema treatment' },
  { type: 'MedicalTherapy', name: 'Vitiligo treatment' },
  { type: 'MedicalTherapy', name: 'Urticaria and lichen planus treatment' },
  { type: 'MedicalTherapy', name: 'Fungal infection and nail disease treatment' },
  { type: 'MedicalTherapy', name: 'Hair loss and alopecia treatment' },
];

// Real photos of each branch, at stable URLs in public/.
const BRANCH_IMAGES = {
  karur: `${SITE_URL}/karur-clinic.jpg`,
  velayuthampalayam: `${SITE_URL}/clinic_preview.jpg`,
};

/** "+91 75981 26430" -> "+917598126430" */
const e164 = (phone) => phone.replace(/[^\d+]/g, '');

function branchEntity(branch) {
  return {
    '@type': ['MedicalClinic', 'Dermatology'],
    '@id': id(branch.id),
    name: `${CLINIC.name}, ${branch.locality}`,
    alternateName: branch.name,
    url: `${SITE_URL}/`,
    image: BRANCH_IMAGES[branch.id],
    logo: ref('logo'),
    telephone: e164(branch.phone),
    email: CLINIC.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: branch.streetAddress,
      addressLocality: branch.locality,
      addressRegion: 'Tamil Nadu',
      postalCode: branch.postalCode,
      addressCountry: 'IN',
    },
    geo: { '@type': 'GeoCoordinates', latitude: branch.geo.latitude, longitude: branch.geo.longitude },
    hasMap: branchMapLink(branch),
    sameAs: [branchMapLink(branch)],
    openingHoursSpecification: branch.hours.map((period) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: period.days,
      opens: period.opens,
      closes: period.closes,
    })),
    areaServed: { '@type': 'Place', name: `${branch.locality}, Karur district, Tamil Nadu` },
    medicalSpecialty: DERMATOLOGY,
    isAcceptingNewPatients: true,
    currenciesAccepted: 'INR',
    parentOrganization: ref('organization'),
    employee: ref('doctor'),
  };
}

/** The JSON-LD graph published in the page head by scripts/prerender.js. */
export function buildStructuredData() {
  const [mainBranch] = BRANCHES;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': id('website'),
        url: `${SITE_URL}/`,
        name: CLINIC.name,
        alternateName: CLINIC.alternateNames,
        inLanguage: 'en-IN',
        publisher: ref('organization'),
      },
      {
        // FAQPage too: the questions below are the ones in the page's FAQ section.
        '@type': ['MedicalWebPage', 'FAQPage'],
        '@id': id('webpage'),
        url: `${SITE_URL}/`,
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        inLanguage: 'en-IN',
        isPartOf: ref('website'),
        about: ref('organization'),
        specialty: DERMATOLOGY,
        primaryImageOfPage: { '@type': 'ImageObject', url: BRANCH_IMAGES.karur, width: 1024, height: 472 },
        mainEntity: FAQS.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
      {
        '@type': 'ImageObject',
        '@id': id('logo'),
        url: `${SITE_URL}/logo.png`,
        contentUrl: `${SITE_URL}/logo.png`,
        width: 512,
        height: 512,
        caption: CLINIC.name,
      },
      {
        '@type': 'MedicalOrganization',
        '@id': id('organization'),
        name: CLINIC.name,
        alternateName: CLINIC.alternateNames,
        url: `${SITE_URL}/`,
        logo: ref('logo'),
        image: Object.values(BRANCH_IMAGES),
        slogan: CLINIC.slogan,
        email: CLINIC.email,
        telephone: e164(mainBranch.phone),
        contactPoint: BRANCHES.map((branch) => ({
          '@type': 'ContactPoint',
          contactType: 'appointments',
          name: branch.name,
          telephone: e164(branch.phone),
          email: CLINIC.email,
          areaServed: 'IN',
        })),
        address: branchEntity(mainBranch).address,
        medicalSpecialty: DERMATOLOGY,
        isAcceptingNewPatients: true,
        knowsAbout: ['Dermatology', 'Trichology', ...CONDITIONS, 'Laser treatment', 'IPL treatment'],
        areaServed: { '@type': 'AdministrativeArea', name: 'Karur district, Tamil Nadu' },
        subOrganization: BRANCHES.map((branch) => ref(branch.id)),
        employee: ref('doctor'),
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Skin, hair and laser treatments',
          itemListElement: PROCEDURES.map((procedure) => ({
            '@type': 'Offer',
            itemOffered: { '@type': procedure.type, name: procedure.name },
          })),
        },
      },
      ...BRANCHES.map(branchEntity),
      {
        '@type': 'Person',
        '@id': id('doctor'),
        name: DOCTOR.name,
        alternateName: DOCTOR.alternateName,
        honorificPrefix: 'Dr.',
        gender: 'https://schema.org/Male',
        jobTitle: DOCTOR.jobTitle,
        hasOccupation: { '@type': 'Occupation', name: 'Dermatologist' },
        hasCredential: DOCTOR.credentials.map((name) => ({
          '@type': 'EducationalOccupationalCredential',
          credentialCategory: name === 'MBBS' ? 'degree' : 'diploma',
          name,
        })),
        alumniOf: { '@type': 'CollegeOrUniversity', name: DOCTOR.alumniOf },
        image: `${SITE_URL}/dr-g-srinivasan.jpg`,
        url: `${SITE_URL}/#about`,
        worksFor: [ref('organization'), ...BRANCHES.map((branch) => ref(branch.id))],
        knowsAbout: ['Dermatology', 'Trichology', 'Laser treatment', 'IPL treatment', ...CONDITIONS],
      },
    ],
  };
}
