'use client';

import { useEffect, useLayoutEffect } from 'react';
import { useStore } from '@/store/store';
import { useShallow } from 'zustand/react/shallow';
import { detectInitialLocale, persistLocale } from '@/lib/locale';

const LocaleInitializer = () => {
  const { locale, setLocale } = useStore(
    useShallow((state) => ({
      locale: state.locale,
      setLocale: state.setLocale,
    })),
  );

  useLayoutEffect(() => {
    const detected = detectInitialLocale();
    setLocale(detected);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  return null;
};

export default LocaleInitializer;
