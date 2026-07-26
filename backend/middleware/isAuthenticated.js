import jwt from "jsonwebtoken";

export const isAuthenticated = (req, res, next) => {
  try {
     // Retrieve the Authorization header
    const authHeader = req.headers.authorization;
     // Ensuring a valid Bearer token is provided
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    //Extracting the JWT from the Authorization header
    const token = authHeader.split(" ")[1];
    // Verify the token using the application's secret key
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    // Store authenticated user information
    req.userId = decoded._id; 
    req.user = decoded; 

    next();
  } catch (error) {
    console.error("Error in isAuthenticated:", error);
     // Handle expired JWT separately
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
     // Handle invalid or malformed JWT
    return res.status(401).json({ message: "Invalid token" });
  }
};