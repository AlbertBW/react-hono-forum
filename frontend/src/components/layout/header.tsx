import { Link } from "@tanstack/react-router";
import HeaderProfile from "./header-profile";
import { SidebarTrigger } from "../ui/sidebar";

export default function Header() {
  return (
    <>
      <header className="border-b border-foreground/20 fixed top-0 bg-background h-13 z-10">
        <NavBar />
      </header>

      <div className="h-13" />
    </>
  );
}

function NavBar() {
  return (
    <div className="flex justify-between items-center w-screen px-4 h-13">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Link to="/">
          <h1 className="text-base sm:text-2xl font-bold font-mono">RHForum</h1>
        </Link>
      </div>
      <div className="p-2 flex justify-center items-center gap-2">
        <HeaderProfile />
      </div>
    </div>
  );
}
