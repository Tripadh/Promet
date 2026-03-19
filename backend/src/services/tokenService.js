import jwt from "jsonwebtoken";

export const generateAuthToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
