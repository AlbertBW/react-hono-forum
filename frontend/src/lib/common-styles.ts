export const banner1 = "bg-linear-to-r from-cyan-500 to-blue-500";
export const banner2 = "bg-linear-to-t from-sky-500 to-indigo-500";
export const banner3 = "bg-linear-to-bl from-violet-500 to-fuchsia-500";
export const banner4 = "bg-linear-65 from-purple-500 to-pink-500";

export const banner5 = "bg-linear-65 from-rose-500 to-red-500";
export const banner6 = "bg-linear-65 from-orange-500 to-amber-500";
export const banner7 = "bg-linear-65 from-yellow-500 to-lime-500";
export const banner8 = "bg-linear-65 from-green-500 to-emerald-500";

export const randomBanner = () => {
  return [
    banner1,
    banner2,
    banner3,
    banner4,
    banner5,
    banner6,
    banner7,
    banner8,
  ][Math.floor(Math.random() * 8)];
};
