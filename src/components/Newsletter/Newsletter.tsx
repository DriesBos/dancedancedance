'use client';

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from 'react';
import { useGSAP } from '@/lib/gsap';
import { vibrate } from '@/lib/vibration';
import { useStore } from '@/store/store';
import { t } from '@/lib/locale';
import styles from './Newsletter.module.sass';

interface NewsletterProps {
  className?: string;
}

const SCRAMBLE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const SCRAMBLE_ITERATIONS_PER_CHARACTER = 8;
const SCRAMBLE_FRAME_MS = 30;

const shouldPreserveScrambleCharacter = (char: string) =>
  char === ' ' || char === '!' || char === '.';

const useTextScramble = (
  textRef: RefObject<HTMLElement | null>,
  targetText: string,
) => {
  useGSAP(
    () => {
      const element = textRef.current;
      if (!element || !targetText) return;

      if (!/^[\x00-\x7F]*$/.test(targetText)) {
        element.textContent = targetText;
        return;
      }

      let iteration = 0;
      const interval = window.setInterval(() => {
        const currentElement = textRef.current;
        if (!currentElement) return;

        currentElement.textContent = targetText
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
          .join('');

        iteration += 1;

        if (iteration > targetText.length * SCRAMBLE_ITERATIONS_PER_CHARACTER) {
          window.clearInterval(interval);
          currentElement.textContent = targetText;
        }
      }, SCRAMBLE_FRAME_MS);

      return () => window.clearInterval(interval);
    },
    { dependencies: [targetText] },
  );
};

export default function Newsletter({ className }: NewsletterProps) {
  const locale = useStore((state) => state.locale);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [buttonText, setButtonText] = useState(() => t('newsletter.label', locale));
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonTextRef = useRef<HTMLSpanElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useTextScramble(buttonTextRef, buttonText);
  useTextScramble(messageRef, message);

  // Update button text based on state
  useEffect(() => {
    if (!isActive && !isLoading) {
      setButtonText(t('newsletter.label', locale));
    } else if (isLoading) {
      setButtonText(t('newsletter.submitting', locale));
    } else {
      setButtonText(t('newsletter.submit', locale));
    }
  }, [isActive, isLoading, locale]);

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
        setMessage('');
        setIsActive(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  // Reset to initial state if active and no message for 5 seconds
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

    setIsLoading(true);
    setMessage('');
    setIsActive(false);
    setInputValue('');

    const formData = new FormData(form);
    const email = formData.get('email');

    const response = await fetch('/api/newsletter/subscribe', {
      body: JSON.stringify({
        email,
        company: formData.get('company'),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    const json = await response.json();
    const { data, error } = json;

    if (error) {
      setIsLoading(false);
      setMessage(error);
      form.reset();
      setInputValue('');
      setIsActive(false);
      return;
    }

    vibrate();
    setMessage('thank you!');
    setIsLoading(false);
    // Reset form and input value
    form.reset();
    setInputValue('');
    setIsActive(false);
    return data;
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
        showCursorMessage ? t('cursor.mail', locale) : undefined
      }
      data-active={isActive}
    >
      <form
        ref={formRef}
        id="newsletter-form"
        onSubmit={subscribeUser}
        className={styles.form}
      >
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
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
        <p ref={messageRef} className={styles.message}>
          {message}
        </p>
      ) : (
        <button
          onClick={handleButtonClick}
          type={isActive ? 'submit' : 'button'}
          form={isActive ? 'newsletter-form' : undefined}
          className={styles.button}
          disabled={isLoading}
        >
          <span ref={buttonTextRef}>{buttonText}</span>
        </button>
      )}
    </div>
  );
}
