import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || "missing_client_id",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "missing_client_secret",
      callbackURL: "/api/auth/github/callback",
      scope: ["user:email"]
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Fetch email if not provided directly in profile
        let email = null;
        if (profile.emails && profile.emails.length > 0) {
          email = profile.emails[0].value;
        }

        if (!email) {
          return done(new Error("GitHub account must have an email associated with it to login."), null);
        }

        const githubId = profile.id;
        const username = profile.username || profile.displayName || "GitHub User";

        // Logic 1: If user exists with this githubId -> login
        let user = await User.findOne({ githubId });
        if (user) {
          return done(null, user);
        }

        // Logic 2: If user exists with the same email -> link GitHub account
        user = await User.findOne({ email });
        if (user) {
          user.githubId = githubId;
          await user.save();
          return done(null, user);
        }

        // Logic 3: Else -> create new user
        user = await User.create({
          name: username,
          email,
          githubId,
          emailVerified: true // Trust GitHub email verification
        });

        return done(null, user);

      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;
