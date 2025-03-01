export const gradient1 = "bg-linear-to-r from-cyan-500 to-blue-500";
export const gradient2 = "bg-linear-to-t from-sky-500 to-indigo-500";
export const gradient3 = "bg-linear-to-bl from-violet-500 to-fuchsia-500";
export const gradient4 = "bg-linear-65 from-purple-500 to-pink-500";
export const gradient5 = "bg-linear-65 from-rose-500 to-red-500";
export const gradient6 = "bg-linear-65 from-orange-500 to-amber-500";
export const gradient7 = "bg-linear-65 from-yellow-500 to-lime-500";
export const gradient8 = "bg-linear-65 from-green-500 to-emerald-500";

export const randomGradient = () => {
  return [
    gradient1,
    gradient2,
    gradient3,
    gradient4,
    gradient5,
    gradient6,
    gradient7,
    gradient8,
  ][Math.floor(Math.random() * 8)];
};
