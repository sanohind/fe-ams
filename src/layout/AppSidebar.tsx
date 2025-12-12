import { useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router";

// Assume these icons are imported from an icon library
import {
  CalenderIcon,
  DocsIcon,
  HorizontaLDots,
  ListIcon,
  PieChartIcon,
  TableIcon,
  UserCircleIcon,
  BoxIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { BoltIcon, TrendingUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  requiredRoles?: string[];
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const mainPageItems: NavItem[] =[
  {
    icon: <PieChartIcon />,
    name: "Dashboard",
    path: "/",
    requiredRoles: ['admin', 'superadmin', 'operator'],
  },
  {
    icon: <UserCircleIcon />,
    name: "Supplier Contact",
    path: "/supplier-contacts",
    requiredRoles: ['admin', 'superadmin', 'operator'],
  },
  {
    icon: <TableIcon />,
    name: "Arrival Check",
    path: "/arrival-check",
    requiredRoles: ['operator', 'superadmin'],
  },
  {
    icon: <CalenderIcon />,
    name: "Arrival Schedule",
    path: "/arrival-schedule",
    requiredRoles: ['admin', 'operator', 'superadmin'],
  },
  {
    icon: <ListIcon />,
    name: "Checksheet",
    path: "/checksheet",
    requiredRoles: ['operator', 'superadmin'],
  },
  {
    icon: <DocsIcon />,
    name: "Level Stock",
    path: "/level-stock",
    requiredRoles: ['admin', 'superadmin'],
  },
  {
    icon: <BoltIcon />,
    name: "Arrival Manage",
    path: "/arrival-manage",
    requiredRoles: ['admin', 'superadmin'],
  },
  {
    icon: <BoxIcon />,
    name: "Item Scan",
    path: "/item-scan",
    requiredRoles: ['operator', 'superadmin'],
  },
  {
    icon: <TrendingUp size={20} />,
    name: "Delivery Performance",
    path: "/delivery-performance",
    requiredRoles: ['admin', 'superadmin'],
  },
]

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { hasRole } = useAuth();

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  // Filter menu items based on user role
  const filteredMenuItems = useMemo(() => {
    return mainPageItems.filter((item) => {
      // If no requiredRoles specified, show to everyone
      if (!item.requiredRoles || item.requiredRoles.length === 0) {
        return true;
      }
      // Check if user has any of the required roles
      return hasRole(item.requiredRoles);
    });
  }, [hasRole]);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <div className="flex items-center">
                <img
                  className="dark:hidden"
                  src="/images/logo/Logo-sanoh-2.png"
                  alt="Logo"
                  width={150}
                  height={40}
                />
                <img
                  className="hidden dark:block"
                  src="/images/logo/Logo-sanoh-2-white.png"
                  alt="Logo"
                  width={150}
                  height={40}
                />
              </div>
            </>
          ) : (
            <> 
              <img
              className="dark:hidden"
                src="/images/logo/SANOH-LITE-01.png"
                alt="Logo"
                width={30}
                height={30}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/SANOH-LITE-02.png"
                alt="Logo"
                width={30}
                height={30}
              />
            </>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              <ul className="flex flex-col gap-4">
                {filteredMenuItems.map((item) => (
                  <li key={item.name}>
                    {item.path ? (
                      <Link
                        to={item.path}
                        className={`menu-item group ${
                          isActive(item.path) ? "menu-item-active" : "menu-item-inactive"
                        }`}
                      >
                        <span
                          className={`menu-item-icon-size ${
                            isActive(item.path)
                              ? "menu-item-icon-active"
                              : "menu-item-icon-inactive"
                          }`}
                        >
                          {item.icon}
                        </span>
                        {(isExpanded || isHovered || isMobileOpen) && (
                          <span className="menu-item-text">{item.name}</span>
                        )}
                      </Link>
                    ) : (
                      <div className="menu-item group menu-item-inactive">
                        <span className="menu-item-icon-size menu-item-icon-inactive">
                          {item.icon}
                        </span>
                        {(isExpanded || isHovered || isMobileOpen) && (
                          <span className="menu-item-text">{item.name}</span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;