import { useState } from "react";
import { Copy, Check } from "lucide-react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import * as Icons from "../../icons";

// Icon data from public/images/icons
const publicIcons = [
  { name: "file-image-dark", path: "/images/icons/file-image-dark.svg" },
  { name: "file-image", path: "/images/icons/file-image.svg" },
  { name: "file-pdf-dark", path: "/images/icons/file-pdf-dark.svg" },
  { name: "file-pdf", path: "/images/icons/file-pdf.svg" },
  { name: "file-video-dark", path: "/images/icons/file-video-dark.svg" },
  { name: "file-video", path: "/images/icons/file-video.svg" },
];

// Icon data from src/icons - imported as React components
const srcIconsData = [
  { name: "alert-hexa", component: Icons.AlertHexaIcon },
  { name: "alert", component: Icons.AlertIcon },
  { name: "angle-down", component: Icons.AngleDownIcon },
  { name: "angle-up", component: Icons.AngleUpIcon },
  { name: "arrow-down", component: Icons.ArrowDownIcon },
  { name: "arrow-right", component: Icons.ArrowRightIcon },
  { name: "arrow-up", component: Icons.ArrowUpIcon },
  { name: "audio", component: Icons.AudioIcon },
  { name: "bolt", component: Icons.BoltIcon },
  { name: "box-cube", component: Icons.BoxCubeIcon },
  { name: "box-line", component: Icons.BoxIconLine },
  { name: "box", component: Icons.BoxIcon },
  { name: "chat", component: Icons.ChatIcon },
  { name: "check-circle", component: Icons.CheckCircleIcon },
  { name: "check-line", component: Icons.CheckLineIcon },
  { name: "chevron-down", component: Icons.ChevronDownIcon },
  { name: "chevron-left", component: Icons.ChevronLeftIcon },
  { name: "chevron-up", component: Icons.ChevronUpIcon },
  { name: "close-line", component: Icons.CloseLineIcon },
  { name: "close", component: Icons.CloseIcon },
  { name: "copy", component: Icons.CopyIcon },
  { name: "docs", component: Icons.DocsIcon },
  { name: "dollar-line", component: Icons.DollarLineIcon },
  { name: "download", component: Icons.DownloadIcon },
  { name: "envelope", component: Icons.EnvelopeIcon },
  { name: "eye-close", component: Icons.EyeCloseIcon },
  { name: "eye", component: Icons.EyeIcon },
  { name: "file", component: Icons.FileIcon },
  { name: "folder", component: Icons.FolderIcon },
  { name: "grid", component: Icons.GridIcon },
  { name: "group", component: Icons.GroupIcon },
  { name: "horizontal-dots", component: Icons.HorizontaLDots },
  { name: "info-error", component: Icons.ErrorIcon },
  { name: "info-hexa", component: Icons.ErrorHexaIcon },
  { name: "info", component: Icons.InfoIcon },
  { name: "list", component: Icons.ListIcon },
  { name: "lock", component: Icons.LockIcon },
  { name: "mail-line", component: Icons.MailIcon },
  { name: "moredot", component: Icons.MoreDotIcon },
  { name: "page", component: Icons.PageIcon },
  { name: "paper-plane", component: Icons.PaperPlaneIcon },
  { name: "pencil", component: Icons.PencilIcon },
  { name: "pie-chart", component: Icons.PieChartIcon },
  { name: "plug-in", component: Icons.PlugInIcon },
  { name: "plus", component: Icons.PlusIcon },
  { name: "shooting-star", component: Icons.ShootingStarIcon },
  { name: "table", component: Icons.TableIcon },
  { name: "task-icon", component: Icons.TaskIcon },
  { name: "time", component: Icons.TimeIcon },
  { name: "trash", component: Icons.TrashBinIcon },
  { name: "truck-arrival", component: Icons.TruckArrivalIcon },
  { name: "user-circle", component: Icons.UserCircleIcon },
  { name: "user-line", component: Icons.UserIcon },
  { name: "video", component: Icons.VideoIcon },
];

interface CopiedState {
  [key: string]: boolean;
}

export default function IconGalery() {
  const [copiedPublic, setCopiedPublic] = useState<CopiedState>({});
  const [copiedSrc, setCopiedSrc] = useState<CopiedState>({});
  const [searchTerm, setSearchTerm] = useState("");

  const copyToClipboard = (text: string, iconName: string, type: "public" | "src") => {
    navigator.clipboard.writeText(text);
    if (type === "public") {
      setCopiedPublic({ ...copiedPublic, [iconName]: true });
      setTimeout(() => {
        setCopiedPublic({ ...copiedPublic, [iconName]: false });
      }, 2000);
    } else {
      setCopiedSrc({ ...copiedSrc, [iconName]: true });
      setTimeout(() => {
        setCopiedSrc({ ...copiedSrc, [iconName]: false });
      }, 2000);
    }
  };

  const filteredPublicIcons = publicIcons.filter((icon) =>
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSrcIcons = srcIconsData.filter((icon) =>
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <PageMeta
        title="Icon Gallery | SPHERE by SANOH Indonesia"
        description="This is React.js Icon Gallery page for SPHERE by SANOH Indonesia"
      />
      <PageBreadcrumb pageTitle="Icon Gallery" />

      <div className="space-y-5 sm:space-y-6">
        {/* Search Bar */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4">
          <div className="relative">
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none left-4 top-1/2 dark:text-gray-400">
              <svg
                className="fill-current"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                  fill=""
                />
              </svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search icons..."
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>
        </div>

        {/* Source Icons Section - Moved to top */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Source Icons (Adaptive)
              </h2>
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">Recommended</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Icons from <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">/src/icons</code> - React Components dengan dark mode support
            </p>
          </div>

          {filteredSrcIcons.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No icons found
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredSrcIcons.map((iconData) => {
                const IconComponent = iconData.component;
                return (
                  <div
                    key={iconData.name}
                    className="group relative flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="w-16 h-16 flex items-center justify-center mb-3 text-gray-700 dark:text-gray-300">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <p className="text-xs text-center text-gray-700 dark:text-gray-300 font-medium mb-2 break-all">
                      {iconData.name}
                    </p>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `import { ${iconData.name.split('-').map((word, i) => i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word.charAt(0).toUpperCase() + word.slice(1)).join('')}Icon } from "../../icons";`,
                          iconData.name,
                          "src"
                        )
                      }
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded transition-colors"
                    >
                      {copiedSrc[iconData.name] ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Import
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Public Icons Section */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Public Icons (Non-Adaptive)
              </h2>
              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">Fixed Color</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Icons from <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">/public/images/icons</code> - Static images dengan warna hardcoded
            </p>
          </div>

          {filteredPublicIcons.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No icons found
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredPublicIcons.map((icon) => (
                <div
                  key={icon.name}
                  className="group relative flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-lg transition-all duration-200"
                >
                  <div className="w-16 h-16 flex items-center justify-center mb-3">
                    <img
                      src={icon.path}
                      alt={icon.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-center text-gray-700 dark:text-gray-300 font-medium mb-2 break-all">
                    {icon.name}
                  </p>
                  <button
                    onClick={() => copyToClipboard(icon.path, icon.name, "public")}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded transition-colors"
                  >
                    {copiedPublic[icon.name] ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy Path
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Summary */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Public Icons</p>
                <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                  {filteredPublicIcons.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-brand-600 dark:text-brand-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Source Icons</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {filteredSrcIcons.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
