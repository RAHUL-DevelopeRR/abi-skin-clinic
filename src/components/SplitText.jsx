import { motion } from 'framer-motion';

export default function SplitText({
  text = "",
  className = "",
  delay = 0,
  duration = 0.5,
  stagger = 0.03,
}) {
  // Letters are grouped by word so a narrow screen wraps between words, not inside one.
  const words = text.split(/(\s+)/).filter(Boolean);

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 150,
        duration: duration,
      },
    },
    hidden: {
      opacity: 0,
      y: 24,
    },
  };

  return (
    <motion.span
      className={`inline-block ${className}`}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {words.map((word, wordIndex) => (/^\s+$/.test(word) ? <span key={wordIndex} style={{ whiteSpace: 'pre-wrap' }}>{word}</span> : (
        <span key={wordIndex} className="inline-block whitespace-nowrap">
          {Array.from(word).map((letter, index) => (
            <motion.span
              variants={child}
              key={index}
              className="inline-block select-none"
              style={{ display: 'inline-block', whiteSpace: 'pre' }}
            >
              {letter}
            </motion.span>
          ))}
        </span>
      )))}
    </motion.span>
  );
}
