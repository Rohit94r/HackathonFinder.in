import { notFound, redirect } from 'next/navigation';

/** Old address for one listing. */
export default function Page({ params }: { params: { id: string } }) {
  if (!/^[a-f0-9]{24}$/i.test(params.id)) notFound();
  redirect(`/admin/hackathons/${params.id}`);
}
