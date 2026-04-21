import user_models from "../models/user_models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const signupController = async (req, res) => {
  try {
    const { name, email, password, role, phone, cnic, driverLicense } = req.body;

    const userExists = await user_models.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User Already Exists", success: false });
    }

    const encodedName = encodeURIComponent(name);
    const avatar = `https://avatar.iran.liara.run/username?username=${encodedName}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    const isUserVerified = role === 'passenger' ? true : false;

    const newUser = new user_models({
      name,
      email,
      password: hashedPassword,
      profilePic: avatar,
      role,
      phone: phone || "",
      cnic: cnic || "",
      driverLicense: driverLicense || "",
      isVerified: isUserVerified
    });

    await newUser.save();

    res.status(201).json({
      message: role === 'driver' ? "Application submitted! Waiting for Admin approval." : "User created successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isVerified: newUser.isVerified
      },
      success: true,
    });
  } catch (error) {
    console.log("Error in signup controller:", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};
export const loginController = async (req, res) => {
  try {
  
    const { email, password, role } = req.body;


    const userExists = await user_models.findOne({ email });

    if (!userExists) {
      return res.status(403).json({
        message: "Auth failed! Email or password is wrong",
        success: false,
      });
    }


    if (userExists.role !== role) {
      return res.status(403).json({
        message: `Access Denied! You are registered as a ${userExists.role}, not a ${role}.`,
        success: false,
      });
    }

   const isPasswordEqual = await bcrypt.compare(password, userExists.password);

    if (!isPasswordEqual) {
      return res.status(403).json({ message: "Auth failed! Email or password is wrong", success: false });
    }

    if (userExists.role === 'driver' && userExists.isVerified === false) {
      return res.status(403).json({ 
        message: "Your account is still pending admin approval. Please wait.", 
        success: false 
      });
    }

    const jwt_token = jwt.sign(
      {
        email: userExists.email,
        _id: userExists._id,
        role: userExists.role 
      },
      process.env.JWT_KEY,
      { expiresIn: "24hr" }
    );

    res.status(200).json({
      message: "Login successful",
      success: true,
      jwt_token,
      name: userExists.name,
      email,
      _id: userExists._id,
      role: userExists.role, 
      profilePic: userExists.profilePic
    });
  } catch (error) {
    console.log("Error in login controller : ", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};