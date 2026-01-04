import { redirect } from 'next/navigation';

export default async function Page() {
  // Redirect to the property landing page
  redirect('/property');
}
