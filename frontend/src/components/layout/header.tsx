import { Link } from "@tanstack/react-router";
import HeaderProfile from "./header-profile";
import { SidebarTrigger } from "../ui/sidebar";

export default function Header() {
  return (
    <header className="border-b border-foreground/20 sticky top-0 bg-background z-10">
      <NavBar />
    </header>
  );
}

function NavBar() {
  return (
    <div className="flex justify-between items-center w-screen px-2">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Link to="/">
          <h1 className="text-base sm:text-2xl font-bold font-mono">RHForum</h1>
        </Link>
      </div>
      <div className="p-2 flex justify-center items-center gap-2">
        <Link to="/posts" className="[&.active]:font-bold min-w-16 text-center">
          Posts
        </Link>
        <Link
          to="/create-post"
          className="[&.active]:font-bold min-w-24 text-center"
        >
          Create Post
        </Link>
        <HeaderProfile />
      </div>
    </div>
  );
}
