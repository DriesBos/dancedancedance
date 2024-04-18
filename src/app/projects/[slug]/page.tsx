export default function ProjectPage({ params }: { params: any }) {
  return (
    <main>
      <h1>Project {params.slug}</h1>
    </main>
  );
}
