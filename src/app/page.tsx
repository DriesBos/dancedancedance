import { fetchData } from '@/helpers/fetchData';
import ProjectList from '../components/ProjectList';

export default async function Home() {
  const { data } = await fetchData();

  return (
    <>
      <ProjectList />
    </>
  );
}
