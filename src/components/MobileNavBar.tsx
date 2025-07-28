'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  ClipboardIcon,
  PlusCircleIcon,
  BellIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

export default function MobileNavBar() {
  const pathname = usePathname()

  return (
    <nav
      //The below hides the nav bar on desktop. Uncomment and comment the next line when pushing to mobile
      //className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-md sm:hidden"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-md"
      role="navigation"
      aria-label="Main mobile navigation"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className="flex justify-between items-center px-4 py-2 text-gray-500 relative">
        {/* Home */}
        <Link
          href="/dashboard"
          aria-current={pathname === '/dashboard' ? 'page' : undefined}
          aria-label="Home"
          className={`flex flex-col items-center text-xs transition transform duration-150 ${
            pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-500'
          } hover:text-blue-600 active:scale-95`}
        >
          <HomeIcon className="h-6 w-6" />
          Home
        </Link>

        {/* Logs */}
        <Link
          href="/logs"
          aria-current={pathname === '/logs' ? 'page' : undefined}
          aria-label="Logs"
          className={`flex flex-col items-center text-xs transition transform duration-150 ${
            pathname === '/logs' ? 'text-blue-600' : 'text-gray-500'
          } hover:text-blue-600 active:scale-95`}
        >
          <ClipboardIcon className="h-6 w-6" />
          Logs
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          aria-current={pathname === '/profile' ? 'page' : undefined}
          aria-label="Profile"
          className={`flex flex-col items-center text-xs transition transform duration-150 ${
            pathname === '/profile' ? 'text-blue-600' : 'text-gray-500'
          } hover:text-blue-600 active:scale-95`}
        >
          <UserIcon className="h-6 w-6" />
          Profile
        </Link>
      </div>
    </nav>
  )
}

//These are reserved for future features beyond MVP. Will add these back eventually
    // {/* Center "+" Button */}
    // <Link
    //     href="/add"
    //     aria-label="Add Log"
    //     className="absolute bg-blue-500 text-white rounded-full p-4 shadow-lg hover:bg-blue-600 active:scale-90 transition transform duration-150"
    //     style={{
    //     bottom: 'calc(env(safe-area-inset-bottom, 1.5rem))',
    //     left: '50%',
    //     transform: 'translateX(-50%)',
    //     zIndex: 10,
    //     }}
    // >
    //     <PlusCircleIcon className="h-8 w-8" />
    // </Link>

    // {/* Notifications */}
    // <Link
    //     href="/notifications"
    //     aria-current={pathname === '/notifications' ? 'page' : undefined}
    //     aria-label="Notifications"
    //     className={`flex flex-col items-center text-xs transition transform duration-150 ${
    //     pathname === '/notifications' ? 'text-blue-600' : 'text-gray-500'
    //     } hover:text-blue-600 active:scale-85`}
    // >
    //     <BellIcon className="h-6 w-6" />
    //     Alerts
    // </Link>