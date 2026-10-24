import { redirect } from 'next/navigation';

/** Old address for the listings table. */
export default function Page() {
  redirect('/admin/hackathons');
}
