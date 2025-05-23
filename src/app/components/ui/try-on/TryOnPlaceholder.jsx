export default function TryOnPlaceholder() {
  return (
    <div className="bg-gray-50 p-8 rounded-lg text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Virtual Try-On Coming Soon
      </h2>
      <p className="text-gray-600 mb-6">
        In the next phase, this will be where customers can use their webcam
        to try on jewelry virtually. We&apos;ll implement this using MediaPipe
        for face landmark detection.
      </p>
      <div className="w-full max-w-lg mx-auto h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            Camera access will appear here
          </p>
          <p className="mt-1 text-xs text-gray-500">
            (Coming in Phase 2)
          </p>
        </div>
      </div>
    </div>
  );
}