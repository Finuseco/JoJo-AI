/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    'genkit',
    '@genkit-ai/ai',
    '@genkit-ai/core',
    '@genkit-ai/dotprompt',
    '@genkit-ai/google-genai',
    '@genkit-ai/googleai'
  ],
};

module.exports = nextConfig;
