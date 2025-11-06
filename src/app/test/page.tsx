export default function TestPage() {
  return (
    <div>
      <h1>Test Page Works</h1>
      <p>
        Env check:{' '}
        {process.env.NEXT_PUBLIC_STORYBLOK_TOKEN
          ? 'Token exists'
          : 'Token missing'}
      </p>
    </div>
  );
}
