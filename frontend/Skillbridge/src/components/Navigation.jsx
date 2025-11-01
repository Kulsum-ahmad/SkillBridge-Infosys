import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import skillBridgeLogo from "figma:asset/cd12bfb4f77c3986715b08d851b34fa45144098e.png";

export function Navigation({ onOpenModal }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("sb_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      // If the user object exists, push them to the protected dashboard area.
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Listener to update state when login/logout occurs
  useEffect(() => {
    const handler = () => {
      try {
        const raw = localStorage.getItem("sb_user");
        setUser(raw ? JSON.parse(raw) : null);
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("sb_auth_change", handler);
    return () => window.removeEventListener("sb_auth_change", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sb_user");
    window.dispatchEvent(new CustomEvent("sb_auth_change"));
  };

  // --- Public Links Definition ---
  const PublicLinks = (
    <>
      {["Home", "About", "How It Works", "Features", "Contact"].map((item) => (
        <a
          key={item}
          href={item === "Home" ? "/" : `#${item.toLowerCase().replace(/\s+/g, "")}`}
          className="text-black no-underline font-medium transition-all duration-300 relative hover:-translate-y-0.5 after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-black after:transition-all after:duration-300 hover:after:w-full"
        >
          {item}
        </a>
      ))}
    </>
  );

  return (
    <nav className="fixed top-0 w-full px-[5%] py-4 bg-white/10 backdrop-blur-md z-[1000] transition-all duration-300">
      <div className="flex justify-between items-center max-w-6xl mx-auto">
        <a href="/" className="flex items-center text-black no-underline">
          <div className="h-14 w-14 rounded-full bg-white backdrop-blur-sm border-2 border-white/50 overflow-hidden mr-3 shadow-lg p-1">
            <img
              src={skillBridgeLogo}
              alt="SkillBridge Logo"
              className="h-full w-full object-contain rounded-full"
            />
          </div>
          <p className="text-black text-3xl font-bold">SkillBridge</p>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <div className="flex gap-8">{PublicLinks}</div>

          <div className="flex gap-4">
            {user ? (
              <>
                <a
                  href="/dashboard"
                  className="px-6 py-2 rounded-full bg-purple-600 text-white border-2 border-purple-500 transition-all duration-300 hover:-translate-y-0.5 hover:bg-purple-700 hover:border-purple-600 no-underline flex items-center"
                >
                  Dashboard
                </a>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 border-2 border-gray-300 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-300 hover:border-gray-400 cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onOpenModal("login")}
                  className="px-6 py-2 rounded-full bg-gray-800 text-white border-2 border-gray-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-700 hover:border-gray-600 cursor-pointer"
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
