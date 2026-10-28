/**
 * Clinic facts shown on the website and published as structured data (src/seo/structuredData.js).
 * Keep names, addresses, phone numbers and hours identical to both Google Business Profiles:
 * search engines compare them, and a mismatch weakens the local listing.
 */
export const SITE_URL = 'https://abiskinandhaircare.in';

export const CLINIC = {
  name: "Dr. Srinivasan's Abi Skin & Hair Clinic",
  alternateNames: ['Abi Skin & Hair Clinic', 'Abi Skin and Hair Clinic', "Dr. Srinivasan's Abi Skin & Hair Care Clinic"],
  email: 'abiskinandhairclinic@gmail.com',
  slogan: 'Mind Your Skin',
};

export const DOCTOR = {
  name: 'Dr. G. Srinivasan',
  alternateName: 'Dr. Srinivasan G.',
  jobTitle: 'Chief Dermatologist & Trichologist',
  credentials: ['MBBS', 'DD (Diploma in Dermatology)'],
  alumniOf: 'Madras Medical College',
};

const MONDAY_TO_SATURDAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const BRANCHES = [
  {
    id: 'karur',
    name: 'Karur Clinic (Main Branch)',
    streetAddress: '10 West, North Madavalagam Road, Behind Easwaran Kovil, Madavilagam',
    locality: 'Karur',
    postalCode: '639001',
    phone: '+91 75981 26430',
    altPhone: '+91 94437 66998',
    hours: [
      { label: 'Monday - Saturday (Morning)', days: MONDAY_TO_SATURDAY, opens: '09:00', closes: '13:00' },
      { label: 'Monday - Saturday (Evening)', days: MONDAY_TO_SATURDAY, opens: '16:00', closes: '20:30' },
    ],
    closedOn: 'Sunday',
    // The pin of the Google Maps listing below (from its place URL), not a guess.
    geo: { latitude: 10.9611889, longitude: 78.0777973 },
    googleCid: '15656561799087123579',
    embedLink: 'https://maps.google.com/maps?q=Abi%20Skin%20and%20Hair%20Clinic,%20Madavilagam,%20Karur&t=&z=16&ie=UTF8&iwloc=&output=embed',
    tag: 'Dermatologist available in morning & evening',
  },
  {
    id: 'velayuthampalayam',
    name: 'Velayuthampalayam Clinic',
    streetAddress: 'Valluvar Nagar, South 1st Street, Velayuthampalayam Bypass, Near Pugali Mandapam, Behind Pillaiyar Kovil (Raja Ganapathy)',
    locality: 'Velayuthampalayam',
    postalCode: '639117',
    phone: '+91 94437 66998',
    altPhone: '+91 75981 26430',
    hours: [
      { label: 'Monday - Saturday (Evening)', days: MONDAY_TO_SATURDAY, opens: '17:30', closes: '20:30' },
    ],
    closedOn: 'Sunday',
    geo: { latitude: 11.0697385, longitude: 78.0079719 },
    googleCid: '2613778443127105123',
    embedLink: 'https://maps.google.com/maps?q=Abi%20Skin%20and%20Hair%20Clinic,%20Velayuthampalayam%20Bypass&t=&z=16&ie=UTF8&iwloc=&output=embed',
    tag: 'Convenient evening consultations',
  },
];

export function branchAddress(branch) {
  return `${branch.streetAddress}, ${branch.locality} - ${branch.postalCode}`;
}

export function branchMapLink(branch) {
  return `https://www.google.com/maps?cid=${branch.googleCid}`;
}

/** "16:00" -> "4:00 PM", as the timings are written on the signboards. */
export function displayTime(value) {
  const [hour, minute] = value.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function branchHours(branch) {
  return branch.hours.map((period) => `${displayTime(period.opens)} - ${displayTime(period.closes)}`).join(' and ');
}

const [KARUR, VELAYUTHAMPALAYAM] = BRANCHES;

/** Shown in the FAQ section and published as FAQPage markup, so the two always match. */
export const FAQS = [
  {
    question: "Who is the chief doctor at Dr. Srinivasan's Abi Skin & Hair Clinic?",
    answer: "The chief dermatologist and trichologist is Dr. G. Srinivasan, MBBS, D.D. (Dermatology). He is an alumnus of the prestigious Madras Medical College and has over 16 years of clinical experience specializing in advanced clinical dermatology, trichology, hair restoration, and aesthetic lasers.",
  },
  {
    question: 'What are the timings and schedules of the Karur and Velayuthampalayam branches?',
    answer: `We serve patients at two branches: \n• Karur Branch: Open Monday to Saturday (${branchHours(KARUR)}). Located behind Easwaran Kovil, Madavilagam.\n• Velayuthampalayam Branch: Open Monday to Saturday (${branchHours(VELAYUTHAMPALAYAM)}). Located near Pugali Mandapam on the Bypass.\nBoth branches are closed on Sundays.`,
  },
  {
    question: 'Where are the clinics located?',
    answer: `• Karur (main branch): ${branchAddress(KARUR)}.\n• Velayuthampalayam: ${branchAddress(VELAYUTHAMPALAYAM)}.`,
  },
  {
    question: 'Which skin and hair conditions are treated at the clinic?',
    answer: 'Acne, acne scars and pigmentation; psoriasis and eczema; vitiligo; urticaria (hives) and lichen planus; fungal skin infections and nail diseases; warts, including liquid nitrogen cryotherapy; and hair loss and alopecia. Laser and IPL procedures such as unwanted hair removal, pigmentation and acne scar lasers, and facial wart and tattoo removal are offered when suitable after consultation.',
  },
  {
    question: 'What treatments are available for active hair fall and thinning?',
    answer: 'We evaluate hair loss and alopecia to identify likely causes, then create an appropriate medical treatment and follow-up plan for each patient.',
  },
  {
    question: 'Do I need a prior appointment to consult the doctor?',
    answer: `Yes, we highly recommend scheduling a consultation using our online appointment portal or by calling/messaging us on ${KARUR.phone} or ${VELAYUTHAMPALAYAM.phone}. Booking in advance secures your consultation slot and minimizes wait times at both our branches.`,
  },
  {
    question: 'Are the aesthetic laser treatments safe?',
    answer: "Laser and IPL procedures are performed under Dr. G. Srinivasan's supervision after a suitability assessment. Benefits, risks, alternatives and aftercare are explained before treatment.",
  },
];
