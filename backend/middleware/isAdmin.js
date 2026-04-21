//if admin only then get privileges else not.
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); 
  } else {
    return res.status(403).json({ 
      success: false, 
      message: "Access Denied: You do not have Admin privileges." 
    });
  }
};