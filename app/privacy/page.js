export const metadata = {
  title: 'Privacy Policy - NEUPC',
  description: 'Privacy Policy for NEUPC members',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-bold text-gray-900">Privacy Policy</h1>
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <p className="mt-6 text-gray-700">
          Privacy Policy content will be added here.
        </p>
      </div>
    </div>
  );
}
