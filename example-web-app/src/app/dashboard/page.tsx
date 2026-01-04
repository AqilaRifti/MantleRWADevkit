import { redirect } from 'next/navigation';

export default function Dashboard() {
  // Redirect to overview page - wallet auth is handled by ProtectedRoute in layout
  redirect('/dashboard/overview');
}
