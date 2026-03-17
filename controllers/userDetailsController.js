// import User from "../models/User.js";
// import UserDetails from "../models/UserDetails.js";

// // 🔹 Save / Update user details
// export const saveUserDetails = async (req, res) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const { firstName, lastName, email, phoneNumber, address } = req.body;


//     // 🔹 Validate
//     if (!phoneNumber) {
//       return res.status(400).json({ success: false, message: "Phone number is required" });
//     }
//     if (!address || typeof address !== "object") {
//       return res.status(400).json({ success: false, message: "Address must be an object" });
//     }

   

//     // 🔹 Update User (basic info)
//     const name = [firstName, lastName].filter(Boolean).join(" ");
//     await User.findByIdAndUpdate(userId, { name, email, phoneNumber });

//     // 🔹 Update or create UserDetails (profile info)
//     const details = await UserDetails.findOneAndUpdate(
//       { userId },
//       { address },
//       { upsert: true, new: true, setDefaultsOnInsert: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "User details saved successfully",
//       details,
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to save user details",
//       error: err.message,
//     });
//   }
// };

// // 🔹 Get logged-in user's full details
// export const getUserDetails = async (req, res) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     // Fetch from User collection
//     const user = await User.findById(userId).select("name email phoneNumber isAdmin");
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     // Fetch from UserDetails collection
//     const details = await UserDetails.findOne({ userId }).populate("orderIds");

//     res.status(200).json({
//       success: true,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         phoneNumber: user.phoneNumber,
//         isAdmin: user.isAdmin,
//       },
//       details: details || null,
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch user details",
//       error: err.message,
//     });
//   }
// };




import User from "../models/User.js";
import UserDetails from "../models/UserDetails.js";


export const saveUserDetails = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { firstName, lastName, email, phoneNumber, address } = req.body;

    // 🔹 Basic validation
    if (!firstName) {
      return res.status(400).json({
        success: false,
        message: "First name is required",
      });
    }

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    if (!address || typeof address !== "object") {
      return res.status(400).json({
        success: false,
        message: "Address must be an object",
      });
    }

    // 🔹 Address type validation
    if (!["domestic", "international"].includes(address.type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address type",
      });
    }

    // 🔹 Conditional validation
    if (address.type === "domestic") {
      if (!address.houseNumber || !address.city || !address.state || !address.pinCode) {
        return res.status(400).json({
          success: false,
          message: "Missing required domestic address fields",
        });
      }
    }

    if (address.type === "international") {
      if (!address.apartmentSuite || !address.cityInternational || !address.countryInternational) {
        return res.status(400).json({
          success: false,
          message: "Missing required international address fields",
        });
      }
    }

    // 🔹 Format name
    const name = [firstName, lastName].filter(Boolean).join(" ");

    // 🔹 Update User (basic info)
    await User.findByIdAndUpdate(
      userId,
      {
        name,
        email,
        phoneNumber,
      },
      { new: true }
    );

    // 🔹 Update or create UserDetails
    const details = await UserDetails.findOneAndUpdate(
      { userId },
      {
        userId,
        firstName,
        lastName,
        address,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "User details saved successfully",
      details,
    });
  } catch (err) {
    console.error("Save user details error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to save user details",
      error: err.message,
    });
  }
};



export const getUserDetails = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 🔹 Fetch user
    const user = await User.findById(userId).select(
      "name email phoneNumber isAdmin"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔹 Fetch details
    const detailsDoc = await UserDetails.findOne({ userId }).populate("orderIds");

    // 🔹 Split name safely
    const [firstName = "", ...lastParts] = (user.name || "").split(" ");
    const lastName = lastParts.join(" ");

    // 🔹 Normalize address (VERY IMPORTANT)
    const address = detailsDoc?.address || {
      type: "domestic",
      houseNumber: "",
      streetArea: "",
      landmark: "",
      city: "",
      state: "",
      pinCode: "",
      country: "India",

      apartmentSuite: "",
      streetName: "",
      cityInternational: "",
      stateProvince: "",
      postalZipCode: "",
      countryInternational: "",

      billingDifferent: false,
      billingAddress: "",
      gstNumber: "",
    };

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        firstName,
        lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
      },
      details: {
        firstName: detailsDoc?.firstName || firstName,
        lastName: detailsDoc?.lastName || lastName,
        address,
        orderIds: detailsDoc?.orderIds || [],
      },
    });
  } catch (err) {
    console.error("Get user details error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user details",
      error: err.message,
    });
  }
};

