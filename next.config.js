/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {serverActions: {bodySizeLimit: "12mb"}},
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
