import { useAtom } from "jotai";
import { useNavigate, Outlet } from "react-router-dom";
import { userAtom } from "../state/userAtom";

const ProtectedRoute = () => {
  const navigate = useNavigate();
  const [currentUser] = useAtom(userAtom);

  if (!currentUser) {
    navigate("/login");
  }

  return <Outlet />;
};

export default ProtectedRoute;
