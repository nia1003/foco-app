/**
 * FarmScreen — redirects to sanctuary (my space).
 * The design file uses "Farm" as the habitat scene for My Space.
 */
import { Redirect } from 'expo-router';

export default function FarmScreen() {
  return <Redirect href="/(app)/sanctuary" />;
}
