import { Link, useLocation } from "react-router-dom";

export default function AuthLink({ to, children, ...props }) {
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <Link
      {...props}
      to={to}
      state={backgroundLocation ? { backgroundLocation } : undefined}
    >
      {children}
    </Link>
  );
}
