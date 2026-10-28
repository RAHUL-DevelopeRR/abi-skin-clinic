import { BRANCHES, CLINIC, DOCTOR, FAQS, SITE_URL, branchAddress, branchMapLink, displayTime } from '../data/clinic.js';

/**
 * /llms.txt (https://llmstxt.org): a plain summary of the clinic for AI assistants and answer
 * engines, which mostly read pages without running JavaScript. Written by scripts/prerender.js.
 */
export function buildLlmsTxt() {
  const branches = BRANCHES.map((branch) => {
    const hours = branch.hours.map((period) => `${displayTime(period.opens)}–${displayTime(period.closes)}`).join(' and ');
    return `- ${branch.name}: ${branchAddress(branch)}. Phone ${branch.phone}. Monday to Saturday ${hours}; closed ${branch.closedOn}. [Google Maps](${branchMapLink(branch)})`;
  });
  const faqs = FAQS.map((faq) => `### ${faq.question}\n\n${faq.answer.replace(/\n/g, '\n\n').replace(/ \n/g, '\n')}`);
  return [
    `# ${CLINIC.name}`,
    '',
    `> Dermatology, hair and laser clinic led by ${DOCTOR.name} (${DOCTOR.credentials[0]}, DD), ${DOCTOR.alumniOf} alumnus, with two branches in Karur district, Tamil Nadu, India. Appointments can be requested online.`,
    '',
    '## Branches',
    '',
    ...branches,
    `- Email: ${CLINIC.email}`,
    '',
    '## Links',
    '',
    `- [Clinic website](${SITE_URL}/): treatments, the doctor, branch timings, patient reviews and FAQ`,
    `- [Book an appointment](${SITE_URL}/#book): live slots from the clinic calendar`,
    `- [Privacy notice](${SITE_URL}/privacy.html)`,
    '',
    '## Frequently asked questions',
    '',
    ...faqs.flatMap((faq) => [faq, '']),
  ].join('\n');
}
