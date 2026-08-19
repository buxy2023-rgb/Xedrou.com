import { Outlet } from 'react-router-dom';

// XEDRUO public-access mode: application routes are available without login.
// Authentication can still be added later for specific sensitive operations.
export default function ProtectedRoute() {
  return <Outlet />;
}
