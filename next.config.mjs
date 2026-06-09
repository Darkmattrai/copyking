/** @type {import('next').NextConfig} */
const nextConfig = {
  // The ICP serializer reads these assets from disk at request time via
  // readFileSync(process.cwd()/...). On Vercel's serverless runtime they are
  // NOT on the lambda filesystem unless explicitly traced in — without this,
  // the brain image and ICP stylesheet silently vanish from generated maps in
  // production (the readFileSync throws and is swallowed by a catch).
  outputFileTracingIncludes: {
    "/api/icp/serialize": ["./public/brain.png", "./lib/icp/icp.css"],
  },
};

export default nextConfig;
