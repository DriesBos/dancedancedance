import BlokError from '@/components/BlokError/BlokError';
import PageTransition from '@/components/PageTransition';

export default function NotFound() {
  return (
    <PageTransition>
      <BlokError />
    </PageTransition>
  );
}
