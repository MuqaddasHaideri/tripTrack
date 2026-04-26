import joi from "joi";


export const signupValidation = (req, res, next) => {
  const schema = joi.object({
    name: joi.string().min(3).max(100).required(),
    email: joi.string().email().required(),
    password: joi.string().min(5).max(100).required(),
    role: joi.string().valid('passenger', 'driver', 'admin').required(),
    phone: joi.string().optional(),
    
    //  Conditional Validation
    cnic: joi.string().when('role', { 
        is: 'driver', 
        then: joi.required().messages({'any.required': 'CNIC is required for drivers'}), 
        otherwise: joi.optional() 
    }),
    driverLicense: joi.string().when('role', { 
        is: 'driver', 
        then: joi.required().messages({'any.required': 'Driver License image is required'}), 
        otherwise: joi.optional() 
    })
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details.message });
  }

  next();
};

// loginValidation 
export const loginValidation = (req, res, next) => {
  const schema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(5).max(100).required(),
   //role: joi.string().valid('passenger', 'driver', 'admin').required()
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};