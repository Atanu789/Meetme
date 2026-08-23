import { redirect } from 'next/navigation';

// Keep old links working while using one unified email entry point.
export default function SignUpRedirect() {
  redirect('/sign-in');
}
