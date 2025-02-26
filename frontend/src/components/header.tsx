import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header>
      <NavBar />
    </header>
  );
}

function NavBar() {
  return (
    <div className="flex justify-around items-center p-2">
      <div>
        <Link to="/">
          <h1 className="text-2xl font-bold font-mono">react-hono-forum</h1>
        </Link>
      </div>
      <div className="p-2 flex gap-2">
        <Link to="/posts" className="[&.active]:font-bold">
          Posts
        </Link>
        <Link to="/create-post" className="[&.active]:font-bold">
          Create Post
        </Link>
        <Link to="/sign-in" className="[&.active]:font-bold">
          Sign In
        </Link>
        <Link to="/sign-out" className="[&.active]:font-bold">
          Sign Out
        </Link>
        <Link to="/profile" className="[&.active]:font-bold">
          Profile
        </Link>
      </div>
    </div>
  );
}
