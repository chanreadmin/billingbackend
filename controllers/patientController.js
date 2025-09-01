import Patient from '../models/patientModel.js';
import Counter from '../models/counterModel.js';

const getNextPatientId = async () => {
  const initialId = 3333000000000001;
  const counter = await Counter.findOneAndUpdate(
    { id: 'patientId' },
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );

  const nextId = initialId + counter.sequenceValue;
  return nextId;
};

export const createPatient = async (req, res) => {
  console.log(req.body);
  try {
    const existingPatient = await Patient.findOne({
      phoneNumber: req.body.phoneNumber,
    });

    if (existingPatient) {
      return res.status(409).json({ message: 'User with this email and mobile number already exists' });
    }

    let patientId;

    // Check if Patient ID is manually provided
    if (req.body.patientId && req.body.patientId.trim() !== '') {
      // Validate that the provided Patient ID doesn't already exist
      const existingPatientWithId = await Patient.findOne({ 
        patientId: req.body.patientId.trim() 
      });
      
      if (existingPatientWithId) {
        return res.status(409).json({ 
          message: 'Patient ID already exists. Please choose a different Patient ID.',
          field: 'patientId'
        });
      }
      
      // Use the provided Patient ID
      patientId = req.body.patientId.trim();
    } else {
      // Auto-generate Patient ID using existing logic
      if (req.body.registeredPatient === true) {
        const counter = await Counter.findOneAndUpdate(
          { id: 'registeredPatientId' },
          { $inc: { sequenceValue: 1 } },
          { new: true, upsert: true }
        );
        // Generate the patientId with prefix and padded number
        patientId = `UNHSR${String(counter.sequenceValue).padStart(6, '0')}`;
      } else {
        patientId = await getNextPatientId();
      }
    }

    const newPatient = new Patient({
      ...req.body,
      patientId,
    });

    const savedPatient = await newPatient.save();
    res.status(201).json(savedPatient);
  } catch (error) {
    console.error('Error creating patient:', error);
    
    // Handle duplicate key error for patientId
    if (error.code === 11000 && error.keyPattern?.patientId) {
      return res.status(409).json({ 
        message: 'Patient ID already exists. Please choose a different Patient ID.',
        field: 'patientId'
      });
    }
    
    res.status(500).json({ message: 'Failed to create patient', error: error.message });
  }
};


// Get all patients
export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find();
    return res.status(200).json(patients);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Get patient by ID
export const getPatientById = async (req, res) => {
  const { patientId } = req.params;

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.status(200).json({ patient });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Update patient
// In patientController.js

// export const updatePatient = async (req, res) => {
//   const { patientId } = req.params;
  
//   try {
    

//     // Check if patient exists
//     const patient = await Patient.findById(patientId);
//     if (!patient) {

//       return res.status(404).json({ 
//         message: 'Patient not found',
//         requestedId: patientId 
//       });
//     }

//     // Fields that shouldn't be updated
//     const protectedFields = ['patientId', 'registrationDate', 'registeredPatient'];
//     const updateData = { ...req.body };
    
//     // Remove protected fields from update data
//     protectedFields.forEach(field => {
//       delete updateData[field];
//     });



//     // Update patient with the modified data
//     const updatedPatient = await Patient.findByIdAndUpdate(
//       patientId,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     );

  
//     if (!updatedPatient) {
//       return res.status(404).json({ message: 'Failed to update patient' });
//     }

//     return res.status(200).json({ 
//       message: 'Patient updated successfully', 
//       patient: updatedPatient 
//     });
    
//   } catch (error) {
//     console.error('Error updating patient:', error);
//     return res.status(500).json({ 
//       message: 'Failed to update patient', 
//       error: error.message,
//       stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// };

export const updatePatient = async (req, res) => {
  const { patientId } = req.params;
  
  try {
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ 
        message: 'Patient not found',
        requestedId: patientId 
      });
    }

    // If patientId is being updated, check for uniqueness
    if (req.body.patientId && req.body.patientId !== patient.patientId) {
      const existingPatientWithId = await Patient.findOne({ 
        patientId: req.body.patientId,
        _id: { $ne: patientId } // Exclude current patient
      });
      
      if (existingPatientWithId) {
        return res.status(409).json({ 
          message: 'Patient ID already exists. Please choose a different Patient ID.',
          field: 'patientId'
        });
      }
    }

    // Fields that shouldn't be updated (removed patientId from protected fields)
    const protectedFields = ['registrationDate', 'registeredPatient'];
    const updateData = { ...req.body };
    
    // Remove protected fields from update data
    protectedFields.forEach(field => {
      delete updateData[field];
    });

    // Update patient with the modified data
    const updatedPatient = await Patient.findByIdAndUpdate(
      patientId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ message: 'Failed to update patient' });
    }

    return res.status(200).json({ 
      message: 'Patient updated successfully', 
      patient: updatedPatient 
    });
    
  } catch (error) {
    console.error('Error updating patient:', error);
    
    // Handle duplicate key error for patientId
    if (error.code === 11000 && error.keyPattern?.patientId) {
      return res.status(409).json({ 
        message: 'Patient ID already exists. Please choose a different Patient ID.',
        field: 'patientId'
      });
    }
    
    return res.status(500).json({ 
      message: 'Failed to update patient', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete patient
export const deletePatient = async (req, res) => {
  const { patientId } = req.params;
  console.log(patientId)
  try {
    const patient = await Patient.findByIdAndDelete(patientId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    await patient.remove();
    return res.status(200).json({ message: 'Patient deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};



// Updated searchPatients function for patientController.js
export const searchPatients = async (req, res) => {
  try {
    const { query } = req.query;
    console.log("Received search query:", query);
    
    if (!query || query.trim() === '') {
      console.log("No query provided or empty query");
      return res.json([]);
    }

    const searchTerm = query.trim();
    console.log("Searching for patients with term:", searchTerm);

    const patients = await Patient.find({
      $or: [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { patientId: { $regex: searchTerm, $options: 'i' } },
        { mobileNumber: { $regex: searchTerm, $options: 'i' } },
        { phoneNumber: { $regex: searchTerm, $options: 'i' } }, // Added phoneNumber
        { emailId: { $regex: searchTerm, $options: 'i' } }, // Added email search
        { 
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: searchTerm,
              options: "i"
            }
          }
        } // Search full name
      ],
    }).limit(20); // Increased limit slightly

    console.log(`Found ${patients.length} patients`);
    res.json(patients);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ 
      message: 'Server error during search', 
      error: error.message 
    });
  }
};