import TryOnPlaceholder from '@/components/try-on/TryOnPlaceholder';

export default function TryOnPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Virtual Jewelry Try-On
      </h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">
            How It Works
          </h2>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <ol className="list-decimal list-inside space-y-3 text-gray-600">
            <li>
              Browse our collection and find jewelry you like
            </li>
            <li>
              Click the "Try On" button on any product that supports virtual try-on
            </li>
            <li>
              Allow camera access when prompted
            </li>
            <li>
              See how the jewelry looks on you in real-time
            </li>
            <li>
              Take a screenshot or send an inquiry if you're interested
            </li>
          </ol>
        </div>
      </div>
      
      <TryOnPlaceholder />
    </div>
  );
}