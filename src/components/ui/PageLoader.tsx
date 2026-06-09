export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-eagle-black">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-eagle-red animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2.5 h-2.5 rounded-full bg-eagle-red animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2.5 h-2.5 rounded-full bg-eagle-red animate-bounce" />
      </div>
    </div>
  );
}
