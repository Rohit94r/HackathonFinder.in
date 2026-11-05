import { notFound, redirect } from 'next/navigation';

/** Old address for one listing. */
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!/^[a-f0-9]{24}$/i.test(params.id)) notFound();
  redirect(`/admin/hackathons/${params.id}`);
}
