'use client';

import { FormEvent, useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TextPlugin } from 'gsap/TextPlugin';
import styles from './Newsletter.module.sass';

gsap.registerPlugin(useGSAP, TextPlugin);

interface NewsletterProps {
  className?: string;
}

export default function Newsletter({ className }: NewsletterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [buttonText, setButtonText] = useState('Newsletter');
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonTextRef = useRef<HTMLSpanElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Playful scramble animation with random characters
  useGSAP(
    () => {
      if (buttonTextRef.current) {
        const targetText = buttonText;
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const iterations = 8; // Number of scramble iterations per character

        let iteration = 0;
        const interval = setInterval(() => {
          if (buttonTextRef.current) {
            buttonTextRef.current.textContent = targetText
              .split('')
              .map((char, index) => {
                if (char === ' ') return ' ';
                if (index < (iteration / iterations) * targetText.length) {
                  return targetText[index];
                }
                return chars[Math.floor(Math.random() * chars.length)];
              })
              .join('');
          }

          iteration++;

          if (iteration > targetText.length * iterations) {
            clearInterval(interval);
            if (buttonTextRef.current) {
              buttonTextRef.current.textContent = targetText;
            }
          }
        }, 30); // Speed of scramble (30ms per frame)

        return () => clearInterval(interval);
      }
    },
    { dependencies: [buttonText] }
  );

  // Playful scramble animation for message text
  useGSAP(
    () => {
      if (messageRef.current && message) {
        const targetText = message;
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const iterations = 8;

        let iteration = 0;
        const interval = setInterval(() => {
          if (messageRef.current) {
            messageRef.current.textContent = targetText
              .split('')
              .map((char, index) => {
                if (char === ' ' || char === '!' || char === '.') return char;
                if (index < (iteration / iterations) * targetText.length) {
                  return targetText[index];
                }
                return chars[Math.floor(Math.random() * chars.length)];
              })
              .join('');
          }

          iteration++;

          if (iteration > targetText.length * iterations) {
            clearInterval(interval);
            if (messageRef.current) {
              messageRef.current.textContent = targetText;
            }
          }
        }, 30);

        return () => clearInterval(interval);
      }
    },
    { dependencies: [message] }
  );

  // Update button text based on state
  useEffect(() => {
    if (!isActive && !isLoading) {
      setButtonText('Newsletter');
    } else if (isLoading) {
      setButtonText('Submitting..');
    } else {
      setButtonText('Submit');
    }
  }, [isActive, isLoading]);

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
      body: JSON.stringify({ email }),
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

  return (
    <div
      className={`${styles.newsletter} ${className || ''}`}
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
