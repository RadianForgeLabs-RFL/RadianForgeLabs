export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <img
      src="/favicon.png"
      alt="RadianForgeLabs"
      className={`${className} rounded-xl object-cover`}
    />
  );
}
