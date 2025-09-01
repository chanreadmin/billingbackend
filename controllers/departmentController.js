import Department from '../models/departmentModel.js';

// Create a new department
export const createDepartment = async (req, res) => {
  const { name, description } = req.body;
console.log(req.body)
  try {
    const department = new Department({ name, description });
    await department.save();
    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all departments
export const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single department by ID
export const getDepartmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const department = await Department.findById(id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.status(200).json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a department
export const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );
    if (!updatedDepartment) return res.status(404).json({ message: 'Department not found' });
    res.status(200).json(updatedDepartment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a department
export const deleteDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedDepartment = await Department.findByIdAndDelete(id);
    if (!deletedDepartment) return res.status(404).json({ message: 'Department not found' });
    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
