import User from '../models/userModel.js';
import Department from '../models/departmentModel.js'


export const createUser = async (req, res) => {
  const { name, email, password, role, departmentId, specialization, consultationCharges, contactNumber } = req.body;
console.log(req.body);
  try {
    // If the user is a doctor, check if the department exists
    let department;
    if (role === 'Doctor') {
      department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }
    }

    const newUser = new User({
      name,
      email,
      password, 
      role,
      contactNumber,
      department: role === 'Doctor' ? department._id : null,
      specialization: role === 'Doctor' ? specialization : null,
      consultationCharges: role === 'Doctor' ? consultationCharges : null,
    });

   const savedUser = await newUser.save();
 
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch all users (including role filtering for doctors)
export const getAllUsers = async (req, res) => {
  const { role } = req.query; // Optional query to filter by role

  try {
    const query = role ? { role } : {};
    const users = await User.find(query).populate('department', 'name'); // Populate department details if present
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch a single user by ID
export const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).populate('department', 'name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a user (including doctors)
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, department, specialization, consultationCharges, contactNumber } = req.body;

  try {
 

    // First check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare update data
    const updateData = {
      name,
      email,
      contactNumber
    };

    // Handle doctor-specific fields
    if (existingUser.role === 'Doctor') {
      // Verify department if provided
      if (department) {
        const departmentDoc = await Department.findById(department);
        if (!departmentDoc) {
          return res.status(404).json({ message: 'Department not found' });
        }
        updateData.department = departmentDoc._id;
      }

      // Only update these fields if they're provided
      if (specialization) updateData.specialization = specialization;
      if (consultationCharges) updateData.consultationCharges = consultationCharges;
    }



    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { 
        new: true, // Return updated document
        runValidators: true // Run model validations
      }
    ).populate('department', 'name');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Failed to update user' });
    }

 
    res.status(200).json(updatedUser);

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ 
      message: 'Error updating user',
      error: error.message 
    });
  }
};

// Delete a user
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const getDoctorsByDepartment = async (req, res) => {
  const { departmentId } = req.params;
  try {
    const doctors = await User.find({ role: 'Doctor', department: departmentId });
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctors by department', error });
  }
};

// Get Doctor by ID
export const getDoctorById = async (req, res) => {
  const { id } = req.params;
  try {
    const doctor = await User.findById(id);
    if (!doctor || doctor.role !== 'Doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctor', error });
  }
};


export const getDoctors = async (req, res) => {
 
  try {
    const doctors = await User.find({ role: 'Doctor'});
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctors by department', error });
  }
};


// export const getDoctors = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const doctor = await User.findById(id);
//     if (!doctor || doctor.role !== 'Doctor') {
//       return res.status(404).json({ message: 'Doctor not found' });
//     }
//     res.status(200).json(doctor);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching doctor', error });
//   }
// };

// Doctor search
export const searchDoctor = async (req, res) => {
  try {
    const { query, department, specialization } = req.query;
    console.log(req.query);
    
    if (!query && !department && !specialization) {
      return res.status(400).json({ 
        message: 'At least one search parameter is required' 
      });
    }

    // Build search criteria
    const searchCriteria = {
      role: 'Doctor', // Ensure only doctors are returned
      isActive: true  // Only return active doctors
    };

    if (query) {
      searchCriteria.$or = [
        { name: { $regex: query, $options: 'i' } },
        { contactNumber: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ];
    }

    if (department) {
      searchCriteria.department = department;
    }

    if (specialization) {
      searchCriteria.specialization = { 
        $regex: specialization, 
        $options: 'i' 
      };
    }

    const doctors = await User.find(searchCriteria)
      .populate('department', 'name')
      .select('-password')  // Exclude sensitive data
      .limit(10)
      .sort({ name: 1 });  // Sort results alphabetically

    res.status(200).json({
      count: doctors.length,
      doctors
    });
  } catch (error) {
    console.error('Search doctor error:', error);
    res.status(500).json({ 
      message: 'Error searching doctors',
      error: error.message 
    });
  }
}