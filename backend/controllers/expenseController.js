const Expense = require("../models/Expense");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Get all expenses
// @route   GET /api/v1/expenses
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
  try {
    const { category, type } = req.query;

    // Build query filter for logged-in user
    const filter = { user: req.user._id };

    // Add optional category filter
    if (category) {
      filter.category = category;
    }

    // Add optional type filter
    if (type) {
      const validTypes = ['income', 'expense'];
      if (!validTypes.includes(type)) {
        res.status(400);
        throw new Error("Type must be either 'income' or 'expense'");
      }
      filter.type = type;
    }

    // Fetch expenses with filters, sorted by newest first
    const expenses = await Expense.find(filter).sort({ date: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500);
    throw new Error("Error fetching expenses");
  }
});

// @desc    Get expense by ID
// @route   GET /api/v1/expenses/:id
// @access  Private
const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense || expense.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error("Expense not found");
  }

  res.status(200).json(expense);
});

// @desc    Create new expense
// @route   POST /api/v1/expenses
// @access  Private
const createExpense = asyncHandler(async (req, res) => {
  try {
    const {
      amount,
      category,
      description,
      date,
      type,
      notes
    } = req.body;

    // Validate required fields
    if (!amount || !category || !type || !date) {
      res.status(400);
      throw new Error("Please provide amount, category, type, and date");
    }

    // Validate amount is a positive number
    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400);
      throw new Error("Amount must be a positive number");
    }

    // Validate type enum
    const validTypes = ['income', 'expense'];
    if (!validTypes.includes(type)) {
      res.status(400);
      throw new Error("Type must be either 'income' or 'expense'");
    }

    // Validate date format
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400);
      throw new Error("Please provide a valid date");
    }

    // Trim string fields
    const trimmedCategory = category.trim();
    const trimmedDescription = description ? description.trim() : "";
    const trimmedNotes = notes ? notes.trim() : "";

    const expense = await Expense.create({
      user: req.user._id,
      amount,
      category: trimmedCategory,
      description: trimmedDescription,
      date: parsedDate,
      type,
      notes: trimmedNotes
    });

    res.status(201).json(expense);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400);
      throw new Error("Duplicate expense entry");
    }
    throw error;
  }
});

// @desc    Update expense
// @route   PUT /api/v1/expenses/:id
// @access  Private
const updateExpense = asyncHandler(async (req, res) => {
  try {
    const {
      amount,
      category,
      description,
      date,
      type,
      notes
    } = req.body;

    // Validate expense exists and belongs to logged-in user
    const expense = await Expense.findById(req.params.id);

    if (!expense || expense.user.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error("Expense not found or you don't have permission to update it");
    }

    // Build update object with only provided fields (partial updates)
    const updateData = {};

    // Validate and add amount if provided
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        res.status(400);
        throw new Error("Amount must be a positive number");
      }
      updateData.amount = amount;
    }

    // Validate and add type if provided
    if (type !== undefined) {
      const validTypes = ['income', 'expense'];
      if (!validTypes.includes(type)) {
        res.status(400);
        throw new Error("Type must be either 'income' or 'expense'");
      }
      updateData.type = type;
    }

    // Validate and add date if provided
    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        res.status(400);
        throw new Error("Please provide a valid date");
      }
      updateData.date = parsedDate;
    }

    // Trim and add string fields if provided
    if (category !== undefined) {
      updateData.category = category.trim();
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (notes !== undefined) {
      updateData.notes = notes.trim();
    }

    // Update expense with validated data
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedExpense);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400);
      throw new Error("Duplicate expense entry");
    }
    throw error;
  }
});

// @desc    Delete expense
// @route   DELETE /api/v1/expenses/:id
// @access  Private
const deleteExpense = asyncHandler(async (req, res) => {
  try {
    // Validate expense exists and belongs to logged-in user
    const expense = await Expense.findById(req.params.id);

    if (!expense || expense.user.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error("Expense not found or you don't have permission to delete it");
    }

    await expense.deleteOne();

    res.status(200).json({ 
      success: true,
      message: "Expense deleted successfully",
      id: req.params.id
    });
  } catch (error) {
    res.status(500);
    throw new Error("Error deleting expense");
  }
});

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
};