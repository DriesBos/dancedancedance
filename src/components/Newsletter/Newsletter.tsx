'use client';

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useGSAP } from '@/lib/gsap';
import { vibrate } from '@/lib/vibration';
import ColorBurstText from '@/components/ColorBurstTypography/ColorBurstText';
import styles from './Newsletter.module.sass';

interface NewsletterProps {
  className?: string;
}

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

const SCRAMBLE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const SCRAMBLE_ITERATIONS_PER_CHARACTER = 8;
const SCRAMBLE_FRAME_MS = 30;
const NETLIFY_FORM_NAME = 'newsletter';

const encodeFormData = (formData: FormData) => {
  const searchParams = new URLSearchParams();

  formData.forEach((value, key) => {
    if (typeof value === 'string') {
      searchParams.append(key, value);
    }
  });

  return searchParams.toString();
};

const shouldPreserveScrambleCharacter = (char: string) =>
  char === ' ' || char === '!' || char === '.';

const useTextScramble = (targetText: string) => {
  const [displayText, setDisplayText] = useState(targetText);

  useGSAP(
    () => {
      if (!targetText) {
        setDisplayText('');
        return;
      }

      if (!/^[\x00-\x7F]*$/.test(targetText)) {
        setDisplayText(targetText);
        return;
      }

      let iteration = 0;
      const interval = window.setInterval(() => {
        setDisplayText(
          targetText
            .split('')
            .map((char, index) => {
              if (shouldPreserveScrambleCharacter(char)) return char;
              if (
                index <
                (iteration / SCRAMBLE_ITERATIONS_PER_CHARACTER) * targetText.length
              ) {
                return targetText[index];
              }
              return SCRAMBLE_CHARS[
                Math.floor(Math.random() * SCRAMBLE_CHARS.length)
              ];
            })
            .join(''),
        );

        iteration += 1;

        if (iteration > targetText.length * SCRAMBLE_ITERATIONS_PER_CHARACTER) {
          window.clearInterval(interval);
          setDisplayText(targetText);
        }
      }, SCRAMBLE_FRAME_MS);

      return () => window.clearInterval(interval);
    },
    { dependencies: [targetText] },
  );

  return displayText;
};

const ScrambledColorBurstText = ({ text }: { text: string }) => {
  const displayText = useTextScramble(text);

  return (
    <ColorBurstText accessibleText={text}>{displayText}</ColorBurstText>
  );
};

export default function Newsletter({ className }: NewsletterProps) {
  const [submissionStatus, setSubmissionStatus] =
    useState<SubmissionStatus>('idle');
  const [isActive, setIsActive] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isLoading = submissionStatus === 'submitting';
  const message = submissionStatus === 'success'
    ? 'Thank you!'
    : submissionStatus === 'error'
      ? 'Oops! Try again'
      : '';
  const buttonText = isLoading
    ? 'Submitting...'
    : isActive
      ? 'Submit'
      : 'Newsletter';

  // Focus input when active becomes true
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  // Reset to initial state after 5 seconds when message appears
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setSubmissionStatus('idle');
        setIsActive(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  // Reset to initial state if active and empty for 10 seconds
  useEffect(() => {
    if (isActive && !inputValue && !message) {
      const timer = setTimeout(() => {
        setIsActive(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isActive, inputValue, message]);

  const subscribeUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;

    setSubmissionStatus('submitting');

    const formData = new FormData(form);

    try {
      const response = await fetch('/__forms.html', {
        body: encodeFormData(formData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
      });

      if (!response.ok) {
        setSubmissionStatus('error');
        return;
      }

      vibrate();
      setSubmissionStatus('success');
      form.reset();
      setInputValue('');
      setIsActive(false);
    } catch {
      setSubmissionStatus('error');
    }
  };

  const handleButtonClick = () => {
    if (!isActive) {
      setIsActive(true);
    }
  };

  const showCursorMessage = !isActive && !inputValue;

  return (
    <div
      className={`${styles.newsletter} ${className || ''} ${showCursorMessage ? 'cursorMessage' : ''}`}
      data-cursor-message={
        showCursorMessage ? 'infrequent but spirited mail' : undefined
      }
      data-active={isActive}
    >
      <form
        ref={formRef}
        id="newsletter-form"
        name={NETLIFY_FORM_NAME}
        method="POST"
        data-netlify="true"
        data-netlify-honeypot="company"
        onSubmit={subscribeUser}
        className={styles.form}
      >
        <input type="hidden" name="form-name" value={NETLIFY_FORM_NAME} />
        <div className={styles.inputWrapper}>
          <label className="visuallyHidden" htmlFor="newsletter-email">
            Email address
          </label>
          <input
            ref={inputRef}
            id="newsletter-email"
            name="email"
            type="email"
            placeholder="Enter your email"
            className={styles.input}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            required
            disabled={isLoading}
            data-active={isActive}
          />
          <span
            className={styles.placeholder}
            data-active={isActive}
            data-empty={!inputValue}
            aria-hidden="true"
          >
            <ColorBurstText>Enter your email</ColorBurstText>
          </span>
        </div>
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ display: 'none' }}
        />
      </form>
      {message ? (
        <p className={styles.message} role="status" aria-live="polite">
          <ScrambledColorBurstText text={message} />
        </p>
      ) : (
        <button
          onClick={handleButtonClick}
          type={isActive ? 'submit' : 'button'}
          form={isActive ? 'newsletter-form' : undefined}
          className={styles.button}
          disabled={isLoading}
        >
          <ScrambledColorBurstText text={buttonText} />
        </button>
      )}
    </div>
  );
}
