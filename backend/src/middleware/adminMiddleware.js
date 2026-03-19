const getAdminEmails = () => {
  const values = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL, "vtripadh@gmail.com"]
    .filter(Boolean)
    .flatMap((entry) => entry.split(","))
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(values)];
};

const adminOnly = (req, res, next) => {
  const adminEmails = getAdminEmails();

  const email = req.user?.email?.toLowerCase();

  if (!email || !adminEmails.includes(email)) {
    return res.status(403).json({
      message: "Admin access required"
    });
  }

  next();
};

export default adminOnly;