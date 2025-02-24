import PrivateRoute from '@/components/PrivateRoute';

export default function InterventionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PrivateRoute>{children}</PrivateRoute>;
} 