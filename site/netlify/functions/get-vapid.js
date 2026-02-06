// Return public VAPID key for client subscription
exports.handler = async function() {
  const key = process.env.VAPID_PUBLIC_KEY || '';
  return { statusCode: 200, body: JSON.stringify({ publicKey: key }) };
};
