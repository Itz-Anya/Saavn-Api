// Placeholder — replaced by `npm run build:api` during Vercel build.
module.exports = (req, res) => {
  res.statusCode = 503;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ success: false, message: 'Build artifact missing' }));
};
