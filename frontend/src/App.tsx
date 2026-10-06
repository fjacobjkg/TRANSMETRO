import { AuthProvider } from "./hooks/AuthContext";
import { AppRoutes } from "./routes/AppRoutes";
import "./styles/app.css";
export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
