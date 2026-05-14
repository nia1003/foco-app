/**
 * LoginScreen — redirects to index (WelcomeScreen has sign-in).
 */
import { Redirect } from 'expo-router';

export default function LoginScreen() {
  return <Redirect href="/(auth)" />;
}
